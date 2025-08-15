"""
PROXY HEALTH MONITORING SERVICE
Continuously monitors proxy health and ensures IP leak prevention
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.logger import get_logger
from models.base import ProxyServer
from services.proxy_service import ProxyService
from services.blacklist_service import BlacklistService

logger = get_logger(__name__)


class ProxyHealthMonitor:
    """Service that continuously monitors proxy health and security"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.proxy_service = ProxyService(db_session)
        self.blacklist_service = BlacklistService(db_session)
        self.monitoring_active = False
        self.health_check_interval = settings.PROXY_HEALTH_CHECK_INTERVAL
        self.last_health_check = {}
        self.health_metrics = {}
        
    async def start_monitoring(self):
        """Start continuous proxy health monitoring"""
        if self.monitoring_active:
            logger.info("Proxy health monitoring already active")
            return
            
        self.monitoring_active = True
        logger.info("🔒 Starting proxy health monitoring service")
        
        try:
            while self.monitoring_active:
                await self._run_health_check_cycle()
                await asyncio.sleep(self.health_check_interval)
        except Exception as e:
            logger.error(f"Proxy health monitoring error: {e}")
            self.monitoring_active = False
        finally:
            logger.info("Proxy health monitoring service stopped")
    
    async def stop_monitoring(self):
        """Stop proxy health monitoring"""
        self.monitoring_active = False
        logger.info("Stopping proxy health monitoring service")
    
    async def _run_health_check_cycle(self):
        """Run one cycle of proxy health checks"""
        try:
            # Get all active proxies
            stmt = select(ProxyServer).where(
                ProxyServer.is_active.is_(True),
                ProxyServer.status != "dead"
            )
            result = await self.db.execute(stmt)
            proxies = result.scalars().all()
            
            if not proxies:
                logger.debug("No active proxies to monitor")
                return
            
            logger.info(f"🔍 Running health check on {len(proxies)} active proxies")
            
            # Check proxies in batches to avoid overwhelming
            batch_size = 10
            for i in range(0, len(proxies), batch_size):
                batch = proxies[i:i + batch_size]
                await self._check_proxy_batch(batch)
                
                # Small delay between batches
                if i + batch_size < len(proxies):
                    await asyncio.sleep(1)
            
            # Update overall health metrics
            await self._update_health_metrics()
            
        except Exception as e:
            logger.error(f"Health check cycle error: {e}")
    
    async def _check_proxy_batch(self, proxies: List[ProxyServer]):
        """Check health of a batch of proxies"""
        try:
            # Test proxies in parallel
            test_results = await self.proxy_service.test_multiple_proxies(
                proxies, max_concurrent=len(proxies), timeout=15
            )
            
            # Process results and update proxy status
            for result in test_results:
                proxy_id = result.get("proxy_id")
                if not proxy_id:
                    continue
                    
                proxy = next((p for p in proxies if str(p.id) == proxy_id), None)
                if not proxy:
                    continue
                
                await self._process_proxy_health_result(proxy, result)
                
        except Exception as e:
            logger.error(f"Proxy batch check error: {e}")
    
    async def _process_proxy_health_result(self, proxy: ProxyServer, result: Dict[str, Any]):
        """Process individual proxy health check result"""
        try:
            if result.get("success", False):
                # Proxy is working - check for security issues
                proxy_ip = result.get("proxy_ip")
                
                # Check if proxy IP is blacklisted
                if proxy_ip and proxy_ip != proxy.host:
                    is_blacklisted = await self.blacklist_service.check_ip_blacklist(proxy_ip)
                    if is_blacklisted:
                        await self._mark_proxy_blacklisted(proxy, "IP blacklisted during health check")
                        return
                
                # Update proxy as healthy
                await self._mark_proxy_healthy(proxy, result)
                
            else:
                # Proxy failed health check
                error_msg = result.get("error", "Health check failed")
                await self._mark_proxy_unhealthy(proxy, error_msg)
                
        except Exception as e:
            logger.error(f"Error processing proxy health result: {e}")
    
    async def _mark_proxy_healthy(self, proxy: ProxyServer, result: Dict[str, Any]):
        """Mark proxy as healthy and update metrics"""
        try:
            stmt = (
                update(ProxyServer)
                .where(ProxyServer.id == proxy.id)
                .values(
                    status="valid",
                    response_time=result.get("response_time"),
                    last_checked=datetime.utcnow(),
                    error_message=None,
                    health_score=self._calculate_health_score(result)
                )
            )
            await self.db.execute(stmt)
            
            # Update cache
            self.proxy_service.proxy_cache[str(proxy.id)] = {
                "status": "valid",
                "checked_at": datetime.utcnow().timestamp()
            }
            
            logger.debug(f"✅ Proxy {proxy.host}:{proxy.port} marked as healthy")
            
        except Exception as e:
            logger.error(f"Error marking proxy healthy: {e}")
    
    async def _mark_proxy_unhealthy(self, proxy: ProxyServer, error_msg: str):
        """Mark proxy as unhealthy"""
        try:
            stmt = (
                update(ProxyServer)
                .where(ProxyServer.id == proxy.id)
                .values(
                    status="dead",
                    error_message=error_msg,
                    last_checked=datetime.utcnow(),
                    health_score=0
                )
            )
            await self.db.execute(stmt)
            
            # Update cache
            self.proxy_service.proxy_cache[str(proxy.id)] = {
                "status": "dead",
                "checked_at": datetime.utcnow().timestamp()
            }
            
            logger.warning(f"❌ Proxy {proxy.host}:{proxy.port} marked as unhealthy: {error_msg}")
            
        except Exception as e:
            logger.error(f"Error marking proxy unhealthy: {e}")
    
    async def _mark_proxy_blacklisted(self, proxy: ProxyServer, reason: str):
        """Mark proxy as blacklisted"""
        try:
            stmt = (
                update(ProxyServer)
                .where(ProxyServer.id == proxy.id)
                .values(
                    status="blacklisted",
                    is_blacklisted=True,
                    blacklist_reason=reason,
                    last_checked=datetime.utcnow(),
                    health_score=0
                )
            )
            await self.db.execute(stmt)
            
            logger.warning(f"🚫 Proxy {proxy.host}:{proxy.port} blacklisted: {reason}")
            
        except Exception as e:
            logger.error(f"Error marking proxy blacklisted: {e}")
    
    def _calculate_health_score(self, result: Dict[str, Any]) -> int:
        """Calculate health score based on test results"""
        score = 100
        
        # Reduce score for slow response times
        response_time = result.get("response_time", 0)
        if response_time > 5:
            score -= 20
        elif response_time > 2:
            score -= 10
        
        # Reduce score for security issues
        if not result.get("ip_validation", True):
            score -= 30
        
        # Ensure minimum score
        return max(score, 0)
    
    async def _update_health_metrics(self):
        """Update overall proxy health metrics"""
        try:
            # Get current proxy statistics
            stmt = select(ProxyServer).where(ProxyServer.is_active.is_(True))
            result = await self.db.execute(stmt)
            all_proxies = result.scalars().all()
            
            total_count = len(all_proxies)
            valid_count = sum(1 for p in all_proxies if p.status == "valid")
            dead_count = sum(1 for p in all_proxies if p.status == "dead")
            blacklisted_count = sum(1 for p in all_proxies if p.status == "blacklisted")
            
            # Calculate health percentage
            health_percentage = (valid_count / total_count * 100) if total_count > 0 else 0
            
            # Update metrics
            self.health_metrics = {
                "total_proxies": total_count,
                "healthy_proxies": valid_count,
                "unhealthy_proxies": dead_count,
                "blacklisted_proxies": blacklisted_count,
                "health_percentage": round(health_percentage, 2),
                "last_updated": datetime.utcnow().isoformat(),
                "monitoring_active": self.monitoring_active
            }
            
            logger.info(f"📊 Proxy health metrics updated: {health_percentage:.1f}% healthy")
            
        except Exception as e:
            logger.error(f"Error updating health metrics: {e}")
    
    async def get_health_summary(self) -> Dict[str, Any]:
        """Get current proxy health summary"""
        if not self.health_metrics:
            await self._update_health_metrics()
        
        return self.health_metrics.copy()
    
    async def force_health_check(self, session_id: Optional[str] = None):
        """Force immediate health check on all proxies or session-specific proxies"""
        try:
            if session_id:
                # Check specific session proxies
                proxies = await self.proxy_service.get_working_proxies(session_id, force_check=True)
                logger.info(f"🔍 Forced health check on {len(proxies)} proxies for session {session_id}")
            else:
                # Check all active proxies
                stmt = select(ProxyServer).where(ProxyServer.is_active.is_(True))
                result = await self.db.execute(stmt)
                proxies = result.scalars().all()
                logger.info(f"🔍 Forced health check on {len(proxies)} active proxies")
            
            if proxies:
                await self._check_proxy_batch(proxies)
                await self._update_health_metrics()
            
        except Exception as e:
            logger.error(f"Forced health check error: {e}")
    
    async def get_proxy_recommendations(self, session_id: str) -> List[str]:
        """Get recommendations for improving proxy configuration"""
        recommendations = []
        
        try:
            working_proxies = await self.proxy_service.get_working_proxies(session_id, force_check=False)
            all_proxies = await self._get_session_proxies(session_id)
            
            if not working_proxies:
                recommendations.append("Add working proxies to enable email operations")
                recommendations.append("Check proxy configuration and connectivity")
            
            if len(working_proxies) < 3 and len(all_proxies) > 0:
                recommendations.append("Consider adding more working proxies for redundancy")
            
            if not settings.PROXY_ENFORCEMENT_STRICT:
                recommendations.append("Enable strict proxy enforcement for maximum security")
            
            if not settings.PROXY_IP_LEAK_PREVENTION:
                recommendations.append("Enable IP leak prevention to protect server identity")
            
            if not settings.PROXY_FALLBACK_DISABLED:
                recommendations.append("Disable proxy fallback to prevent accidental IP leaks")
            
            # Check for proxy diversity
            proxy_types = set(p.proxy_type for p in working_proxies if p.proxy_type)
            if len(proxy_types) < 2:
                recommendations.append("Consider using different proxy types for better reliability")
            
        except Exception as e:
            logger.error(f"Error getting proxy recommendations: {e}")
            recommendations.append("Unable to analyze proxy configuration")
        
        return recommendations
    
    async def _get_session_proxies(self, session_id: str) -> List[ProxyServer]:
        """Get all proxies for a specific session"""
        try:
            stmt = select(ProxyServer).where(ProxyServer.session_id == session_id)
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error getting session proxies: {e}")
            return [] 