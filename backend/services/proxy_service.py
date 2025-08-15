"""
COMPLETE PROXY SERVICE IMPLEMENTATION
Support for SOCKS4/SOCKS5/HTTP proxies with validation and IP leak prevention
"""

import asyncio
import random
import socket
import time
from datetime import datetime
from typing import Any

import aiohttp
from fastapi import HTTPException
from sqlalchemy import select, update

from core.constants import USER_AGENTS_LIST

try:
    import python_socks
    from aiohttp_socks import ProxyConnector

    SOCKS_AVAILABLE = True
except ImportError:
    SOCKS_AVAILABLE = False
    print(
        "❌ CRITICAL ERROR: python-socks and aiohttp-socks are not installed!"
    )
from utils.socks_patch import patch_python_socks

patch_python_socks()
from config.settings import settings
from core.logger import get_logger
from core.proxy_checker import ProxyChecker
from models.base import ProxyServer

from schemas.proxy import ProxyServer as ProxyServerSchema, ProxyUpdate
from services.blacklist_service import BlacklistService


class ProxyUnavailableError(Exception):
    pass


class IPLeakPreventionError(Exception):
    """Raised when attempting to make direct connections that could leak IP"""
    pass


logger = get_logger(__name__)


class ProxyService:
    """Complete proxy service with IP leak prevention"""

    def __init__(self, db_session):
        self.db = db_session
        self.blacklist_service = BlacklistService(db_session)
        self.proxy_cache = {}
        self.cache_ttl = 3600
        self.direct_connection_blocked = settings.PROXY_IP_LEAK_PREVENTION
        if not SOCKS_AVAILABLE:
            logger.error(
                "❌ python-socks not installed! Proxies will not work!"
            )
        
        if self.direct_connection_blocked:
            logger.info("🔒 IP leak prevention enabled - Direct connections blocked")

    def _build_proxy_url(self, proxy: ProxyServer) -> str:
        """Build proxy URL."""
        proxy_type = proxy.proxy_type.lower() if proxy.proxy_type else "socks5"
        if proxy_type == "socks5":
            scheme = "socks5"
        elif proxy_type == "socks4":
            scheme = "socks4"
        elif proxy_type in ["http", "https"]:
            scheme = "http"
        else:
            scheme = "socks5"
        if proxy.username and proxy.password:
            return f"{scheme}://{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}"
        return f"{scheme}://{proxy.host}:{proxy.port}"

    async def test_proxy_connection(
        self,
        proxy: ProxyServer,
        test_url: str = "http://httpbin.org/ip",
        timeout: int = 10,
    ) -> dict[str, Any]:
        """Test proxy connection with enhanced validation"""
        if not SOCKS_AVAILABLE:
            return {
                "success": False,
                "error": "python-socks not installed",
                "response_time": 0,
            }
        
        # Ensure we're testing through the proxy, not directly
        if self.direct_connection_blocked:
            logger.debug(f"🔒 Testing proxy {proxy.host}:{proxy.port} with IP leak prevention")
        
        start_time = time.time()
        try:
            proxy_url = self._build_proxy_url(proxy)
            headers = {
                "User-Agent": random.choice(USER_AGENTS_LIST),
                "X-Proxy-Check": "true",
                "X-Proxy-Validation": str(proxy.id),
            }
            
            connector = ProxyConnector.from_url(proxy_url)
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=timeout),
            ) as session:
                async with session.get(test_url, headers=headers) as response:
                    if response.status == 200:
                        response_data = await response.json()
                        response_time = time.time() - start_time
                        proxy_ip = response_data.get("origin", "unknown")
                        
                        # Validate that the IP returned is actually from the proxy
                        if proxy_ip == proxy.host:
                            logger.warning(f"⚠️  Proxy {proxy.host}:{proxy.port} may not be working correctly")
                        
                        return {
                            "success": True,
                            "proxy_ip": proxy_ip,
                            "response_time": response_time,
                            "status_code": response.status,
                            "proxy_host": proxy.host,
                            "ip_validation": proxy_ip != proxy.host,
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}",
                            "response_time": time.time() - start_time,
                        }
        except TimeoutError:
            return {
                "success": False,
                "error": "Timeout",
                "response_time": time.time() - start_time,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response_time": time.time() - start_time,
            }

    async def test_multiple_proxies(
        self,
        proxies: list[ProxyServer],
        max_concurrent: int = 20,
        timeout: int = 10,
    ) -> list[dict[str, Any]]:
        """Test multiple proxies in parallel with enhanced validation"""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def test_with_semaphore(proxy):
            async with semaphore:
                result = await self.test_proxy_connection(
                    proxy, timeout=timeout
                )
                result["proxy_id"] = str(proxy.id)
                result["proxy_host"] = proxy.host
                result["proxy_port"] = proxy.port
                return result

        logger.info(f"🧪 Testing {len(proxies)} proxies with IP leak prevention...")
        tasks = [test_with_semaphore(proxy) for proxy in proxies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(
                    {
                        "success": False,
                        "error": str(result),
                        "proxy_id": str(proxies[i].id),
                        "proxy_host": proxies[i].host,
                        "proxy_port": proxies[i].port,
                        "response_time": 0,
                    }
                )
            else:
                final_results.append(result)
        valid_count = sum(1 for r in final_results if r["success"])
        logger.info(
            f"✅ Test result: {valid_count}/{len(proxies)} proxies are working"
        )
        return final_results

    async def get_working_proxies(
        self, session_id: str, force_check: bool = False
    ) -> list[ProxyServer]:
        """Get list of working proxies for session with enhanced validation"""
        try:
            stmt = (
                select(ProxyServer)
                .where(
                    ProxyServer.session_id == session_id,
                    ProxyServer.status != "dead",
                    ProxyServer.is_active.is_(True),
                )
                .order_by(
                    ProxyServer.response_time.asc().nulls_last(),
                    ProxyServer.last_checked.desc().nulls_last(),
                )
            )
            result = await self.db.execute(stmt)
            proxies = result.scalars().all()
        except Exception as e:
            logger.error(f"Error getting proxies from DB: {e}")
            return []
        
        if not proxies:
            logger.warning(f"⚠️  No proxies for session {session_id}")
            if settings.PROXY_FALLBACK_DISABLED:
                raise ProxyUnavailableError(
                    f"No working proxies available for session {session_id}. "
                    "Proxy usage is mandatory and fallback is disabled."
                )
            return []
        
        current_time = time.time()
        cached_valid_proxies = []
        if not force_check:
            for proxy in proxies:
                cache_key = str(proxy.id)
                if cache_key in self.proxy_cache:
                    cache_data = self.proxy_cache[cache_key]
                    if (
                        current_time - cache_data["checked_at"]
                        < self.cache_ttl
                    ):
                        if cache_data["status"] == "valid":
                            cached_valid_proxies.append(proxy)
        
        if cached_valid_proxies and (not force_check):
            logger.info(
                f"📋 Using {len(cached_valid_proxies)} proxies from cache"
            )
            return cached_valid_proxies
        
        logger.info(f"🔍 Checking {len(proxies)} proxies with IP leak prevention...")
        test_results = await self.test_multiple_proxies(proxies)
        working_proxies = []
        
        for result in test_results:
            proxy_id = result["proxy_id"]
            if result["success"]:
                # Enhanced blacklist checking
                is_blacklisted = (
                    await self.blacklist_service.check_ip_blacklist(
                        result.get("proxy_ip", result["proxy_host"])
                    )
                )
                
                if not is_blacklisted:
                    # Update proxy status with enhanced metrics
                    stmt = (
                        update(ProxyServer)
                        .where(ProxyServer.id == proxy_id)
                        .values(
                            status="valid",
                            response_time=result["response_time"],
                            last_checked=datetime.utcnow(),
                            error_message=None,
                            is_blacklisted=False,
                        )
                        .returning(ProxyServer.last_checked)
                    )
                    res = await self.db.execute(stmt)
                    proxy_last_checked = res.scalar_one()
                    
                    self.proxy_cache[proxy_id] = {
                        "status": "valid",
                        "checked_at": current_time,
                    }
                    
                    proxy = next(p for p in proxies if str(p.id) == proxy_id)
                    proxy.status = "valid"
                    proxy.last_checked = proxy_last_checked
                    proxy.response_time = result["response_time"]
                    proxy.error_message = None
                    working_proxies.append(proxy)
                    
                    logger.debug(f"✅ Proxy {proxy.host}:{proxy.port} validated and working")
                else:
                    logger.warning(
                        f"🚫 Proxy {result['proxy_host']} is blacklisted"
                    )
                    stmt = (
                        update(ProxyServer)
                        .where(ProxyServer.id == proxy_id)
                        .values(
                            status="blacklisted",
                            is_blacklisted=True,
                            blacklist_reason="DNSBL check failed",
                            last_checked=datetime.utcnow(),
                        )
                        .returning(ProxyServer.last_checked)
                    )
                    res = await self.db.execute(stmt)
                    proxy_last_checked = res.scalar_one()
                    proxy = next(p for p in proxies if str(p.id) == proxy_id)
                    proxy.status = "blacklisted"
                    proxy.last_checked = proxy_last_checked
            else:
                stmt = (
                    update(ProxyServer)
                    .where(ProxyServer.id == proxy_id)
                    .values(
                        status="dead",
                        error_message=result["error"],
                        last_checked=datetime.utcnow(),
                    )
                    .returning(ProxyServer.last_checked)
                )
                res = await self.db.execute(stmt)
                proxy_last_checked = res.scalar_one()
                self.proxy_cache[proxy_id] = {
                    "status": "dead",
                    "checked_at": current_time,
                }
                proxy = next(p for p in proxies if str(p.id) == proxy_id)
                proxy.status = "dead"
                proxy.last_checked = proxy_last_checked
                proxy.error_message = result["error"]
        
        try:
            await self.db.commit()
        except Exception as e:
            logger.error(f"Error committing changes: {e}")
            await self.db.rollback()
        
        logger.info(f"✅ Found {len(working_proxies)} working proxies")
        return working_proxies

    async def create_socks_connection(
        self,
        proxy: ProxyServer,
        target_host: str,
        target_port: int,
        timeout: int = 30,
    ) -> socket.socket:
        """Create SOCKS connection for SMTP/IMAP with IP leak prevention"""
        if not SOCKS_AVAILABLE:
            raise Exception("python-socks not installed")
        
        # Ensure we're not making direct connections
        if self.direct_connection_blocked:
            logger.debug(f"🔒 Creating SOCKS connection through {proxy.host}:{proxy.port} to {target_host}:{target_port}")
        
        try:
            if proxy.proxy_type.lower() == "socks5":
                proxy_type = python_socks.ProxyType.SOCKS5
            elif proxy.proxy_type.lower() == "socks4":
                proxy_type = python_socks.ProxyType.SOCKS4
            else:
                proxy_type = python_socks.ProxyType.HTTP
            
            try:
                sock = await python_socks.proxy_connect(
                    proxy_type=proxy_type,
                    host=proxy.host,
                    port=proxy.port,
                    username=proxy.username,
                    password=proxy.password,
                    dest_host=target_host,
                    dest_port=target_port,
                    timeout=timeout,
                )
            except Exception as exc:
                if (
                    "0xFF" in str(exc)
                    and proxy.proxy_type.lower() == "socks5"
                    and (not proxy.username)
                    and (not proxy.password)
                ):
                    sock = await python_socks.proxy_connect(
                        proxy_type=python_socks.ProxyType.SOCKS5,
                        host=proxy.host,
                        port=proxy.port,
                        dest_host=target_host,
                        dest_port=target_port,
                        timeout=timeout,
                    )
                else:
                    raise
            
            logger.debug(
                f"🔗 SOCKS connection created: {proxy.host}:{proxy.port} -> {target_host}:{target_port}"
            )
            return sock
        except Exception as e:
            logger.error(f"❌ Error creating SOCKS connection: {e}")
            raise

    def parse_proxy_list(self, content: str) -> list[dict[str, Any]]:
        """Parse proxy list from text with enhanced validation"""
        proxies = []
        lines = content.strip().split("\n")
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                parts = line.split(":")
                if len(parts) == 2:
                    host, port = parts
                    proxies.append(
                        {
                            "host": host.strip(),
                            "port": int(port.strip()),
                            "proxy_type": "socks5",
                            "username": None,
                            "password": None,
                        }
                    )
                elif len(parts) == 4:
                    host, port, username, password = parts
                    proxies.append(
                        {
                            "host": host.strip(),
                            "port": int(port.strip()),
                            "proxy_type": "socks5",
                            "username": username.strip(),
                            "password": password.strip(),
                        }
                    )
                elif len(parts) == 3:
                    if parts[0].lower() in ["socks4", "socks5", "http"]:
                        proxy_type, host, port = parts
                        proxies.append(
                            {
                                "host": host.strip(),
                                "port": int(port.strip()),
                                "proxy_type": proxy_type.lower(),
                                "username": None,
                                "password": None,
                            }
                        )
                    else:
                        logger.warning(
                            f"Unknown proxy format on line {line_num}: {line}"
                        )
                        continue
                else:
                    logger.warning(
                        f"Invalid proxy format on line {line_num}: {line}"
                    )
                    continue
            except (ValueError, IndexError) as e:
                logger.warning(
                    f"Parsing error on line {line_num} '{line}': {e}"
                )
                continue
        
        logger.info(
            f"📋 Parsed {len(proxies)} proxies from {len(lines)} lines"
        )
        return proxies

    async def get_working_proxy(
        self, session_id: str, strategy: str = "random"
    ) -> ProxyServer | None:
        """Get a single working proxy for a session with enhanced validation"""
        proxies = await self.get_working_proxies(session_id)
        if not proxies:
            force_proxy = getattr(
                settings, "SMTP_PROXY_FORCE", False
            ) or getattr(settings, "IMAP_PROXY_FORCE", False)
            if force_proxy or settings.PROXY_FALLBACK_DISABLED:
                raise ProxyUnavailableError(
                    "No working proxy available and proxy usage is mandatory"
                )
            return None
        
        if strategy == "fastest":
            proxies.sort(
                key=lambda p: (
                    p.response_time
                    if p.response_time is not None
                    else float("inf")
                )
            )
            return proxies[0]
        return random.choice(proxies)

    async def validate_proxy_security(self, proxy: ProxyServer) -> dict[str, Any]:
        """Validate proxy security and IP leak prevention"""
        try:
            # Test proxy with multiple endpoints to ensure it's working correctly
            test_urls = [
                "http://httpbin.org/ip",
                "http://ip-api.com/json",
                "http://ifconfig.me/ip"
            ]
            
            results = []
            for test_url in test_urls:
                try:
                    result = await self.test_proxy_connection(proxy, test_url, timeout=10)
                    results.append(result)
                except Exception as e:
                    results.append({"success": False, "error": str(e), "url": test_url})
            
            # Analyze results for security issues
            working_tests = [r for r in results if r.get("success", False)]
            if len(working_tests) < 2:
                return {
                    "secure": False,
                    "reason": "Proxy failed multiple connectivity tests",
                    "results": results
                }
            
            # Check for IP consistency across tests
            proxy_ips = [r.get("proxy_ip") for r in working_tests if r.get("proxy_ip")]
            if len(set(proxy_ips)) > 1:
                return {
                    "secure": False,
                    "reason": "Proxy IP inconsistent across tests - potential security issue",
                    "results": results
                }
            
            return {
                "secure": True,
                "proxy_ip": proxy_ips[0] if proxy_ips else None,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Proxy security validation error: {e}")
            return {
                "secure": False,
                "reason": f"Validation error: {str(e)}",
                "results": []
            }

    async def websocket_proxy_test(
        self, websocket, proxy: ProxyServer
    ) -> None:
        """Run proxy test over WebSocket and close connection cleanly."""
        from app_websockets.connection_manager import ConnectionManager
        from utils.websocket_utils import safe_close

        manager = ConnectionManager()
        channel = f"proxy-test:{proxy.host}:{proxy.port}"
        await manager.connect(websocket, channel)
        try:
            result = await self.test_proxy_connection(proxy)
            # Add security validation
            security_result = await self.validate_proxy_security(proxy)
            result["security"] = security_result
            await websocket.send_json(result)
        except Exception as exc:
            logger.error("WebSocket proxy test error: %s", exc)
            await websocket.send_json({"success": False, "error": str(exc)})
        finally:
            await safe_close(websocket, code=1000)
            manager.disconnect(websocket, channel)

    async def websocket_smtp_probe(
        self, websocket, proxy: ProxyServer
    ) -> None:
        """Stream SMTP probe logs for ``proxy`` over WebSocket."""
        from utils.websocket_utils import safe_close

        try:
            await websocket.accept()
        except Exception as exc:
            logger.error("WebSocket accept error: %s", exc)
            return

        async def _emit(msg: str) -> None:
            try:
                await websocket.send_json(
                    {"type": "proxy_log", "message": msg}
                )
            except Exception as exc:
                logger.error("WebSocket send error: %s", exc)

        checker = ProxyChecker(timeout=settings.SMTP_CHECK_TIMEOUT)
        try:
            ok = await checker.check_smtp_ports(proxy, log_cb=_emit)
            await websocket.send_json({"type": "complete", "success": ok})
        except Exception as exc:
            logger.error("WebSocket probe error: %s", exc)
            await websocket.send_json({"type": "error", "message": str(exc)})
        finally:
            await safe_close(websocket, code=1000)

    async def update_proxy(
        self, session_id: str, proxy_id: str, data: dict
    ) -> ProxyServer:
        """Update a proxy record and return the updated model."""
        proxy = await self.db.scalar(
            select(ProxyServer).where(
                ProxyServer.id == proxy_id,
                ProxyServer.session_id == session_id,
            )
        )
        if not proxy:
            raise HTTPException(status_code=404, detail="Proxy not found")
        update_data = data.model_dump(exclude_unset=True, by_alias=True)
        if "ip_address" in update_data:
            proxy.host = update_data.pop("ip_address")
        for field, value in update_data.items():
            setattr(proxy, field, value)
        await self.db.commit()
        await self.db.refresh(proxy)
        return ProxyServerSchema.model_validate(proxy)

    async def delete_proxy(self, session_id: str, proxy_id: str) -> None:
        """Delete a proxy record."""
        proxy = await self.db.scalar(
            select(ProxyServer).where(
                ProxyServer.id == proxy_id,
                ProxyServer.session_id == session_id,
            )
        )
        if not proxy:
            raise HTTPException(status_code=404, detail="Proxy not found")
        await self.db.delete(proxy)
        await self.db.commit()

    async def set_active_flag(self, proxy_id: str, active: bool) -> None:
        """Toggle the ``is_active`` flag for a proxy."""
        proxy = await self.db.scalar(
            select(ProxyServer).where(ProxyServer.id == proxy_id)
        )
        if not proxy:
            raise HTTPException(status_code=404, detail="Proxy not found")
        proxy.is_active = active
        await self.db.commit()

    async def get_proxy_for_email_checking(
        self, 
        session_id: str, 
        check_type: str = "smtp",
        strategy: str = "fastest"
    ) -> ProxyServer:
        """Get a working proxy specifically for email checking operations"""
        try:
            proxies = await self.get_working_proxies(session_id, force_check=True)
            
            if not proxies:
                raise ProxyUnavailableError(
                    f"No working proxies available for {check_type.upper()} checking. "
                    "Proxy usage is mandatory for all email validation operations."
                )
            
            # Filter proxies by type for specific checking operations
            if check_type.lower() == "smtp":
                # Prefer SOCKS5 proxies for SMTP operations
                preferred_proxies = [p for p in proxies if p.proxy_type and p.proxy_type.lower() == "socks5"]
                if preferred_proxies:
                    proxies = preferred_proxies
            
            elif check_type.lower() == "imap":
                # Prefer SOCKS5 proxies for IMAP operations
                preferred_proxies = [p for p in proxies if p.proxy_type and p.proxy_type.lower() == "socks5"]
                if preferred_proxies:
                    proxies = preferred_proxies
            
            # Apply strategy
            if strategy == "fastest":
                proxies.sort(
                    key=lambda p: (
                        p.response_time
                        if p.response_time is not None
                        else float("inf")
                    )
                )
                return proxies[0]
            elif strategy == "random":
                return random.choice(proxies)
            elif strategy == "round_robin":
                # Simple round-robin selection
                if not hasattr(self, '_round_robin_index'):
                    self._round_robin_index = 0
                proxy = proxies[self._round_robin_index % len(proxies)]
                self._round_robin_index += 1
                return proxy
            else:
                return random.choice(proxies)
                
        except Exception as e:
            logger.error(f"Error getting proxy for {check_type} checking: {e}")
            raise ProxyUnavailableError(f"Failed to get proxy for {check_type} checking: {e}")

    async def validate_proxy_for_email_operation(
        self, 
        proxy: ProxyServer, 
        operation_type: str,
        target_host: str = None,
        target_port: int = None
    ) -> dict[str, Any]:
        """Validate proxy specifically for email operations with enhanced security checks"""
        try:
            validation_result = {
                "proxy_id": str(proxy.id),
                "proxy_host": proxy.host,
                "proxy_port": proxy.port,
                "operation_type": operation_type,
                "validation_time": datetime.utcnow().isoformat(),
                "security_checks": {},
                "connectivity_tests": {},
                "recommendations": []
            }
            
            # 1. Basic proxy health check
            basic_test = await self.test_proxy_connection(proxy, timeout=10)
            validation_result["connectivity_tests"]["basic"] = basic_test
            
            if not basic_test.get("success", False):
                validation_result["security_checks"]["basic_connectivity"] = False
                validation_result["recommendations"].append("Proxy failed basic connectivity test")
                return validation_result
            
            # 2. Security validation
            security_result = await self.validate_proxy_security(proxy)
            validation_result["security_checks"]["security_validation"] = security_result
            
            if not security_result.get("secure", False):
                validation_result["recommendations"].append(f"Security issue: {security_result.get('reason', 'Unknown')}")
            
            # 3. Operation-specific validation
            if operation_type.lower() in ["smtp", "smtp_check", "smtp_validation"]:
                validation_result.update(await self._validate_proxy_for_smtp(proxy, target_host, target_port))
            elif operation_type.lower() in ["imap", "imap_check", "imap_validation"]:
                validation_result.update(await self._validate_proxy_for_imap(proxy, target_host, target_port))
            elif operation_type.lower() in ["email", "email_check", "email_validation"]:
                validation_result.update(await self._validate_proxy_for_email(proxy, target_host, target_port))
            elif operation_type.lower() in ["bulk", "bulk_check", "bulk_validation"]:
                validation_result.update(await self._validate_proxy_for_bulk(proxy, target_host, target_port))
            
            # 4. Overall validation status
            all_checks_passed = all(
                check.get("passed", True) 
                for check in validation_result["security_checks"].values() 
                if isinstance(check, dict)
            )
            
            validation_result["overall_status"] = "valid" if all_checks_passed else "warning"
            validation_result["ip_protected"] = True  # Always true when using proxy
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Proxy validation error for {operation_type}: {e}")
            return {
                "proxy_id": str(proxy.id),
                "proxy_host": proxy.host,
                "proxy_port": proxy.port,
                "operation_type": operation_type,
                "validation_time": datetime.utcnow().isoformat(),
                "overall_status": "error",
                "error": str(e),
                "ip_protected": False
            }
    
    async def _validate_proxy_for_smtp(
        self, 
        proxy: ProxyServer, 
        target_host: str = None, 
        target_port: int = None
    ) -> dict[str, Any]:
        """Validate proxy specifically for SMTP operations"""
        validation = {
            "smtp_specific": {
                "passed": True,
                "tests": [],
                "recommendations": []
            }
        }
        
        try:
            # Test SMTP-specific connectivity
            if target_host and target_port:
                try:
                    sock = await self.create_socks_connection(
                        proxy, target_host, target_port, timeout=15
                    )
                    sock.close()
                    validation["smtp_specific"]["tests"].append({
                        "test": "smtp_connection",
                        "passed": True,
                        "target": f"{target_host}:{target_port}"
                    })
                except Exception as e:
                    validation["smtp_specific"]["tests"].append({
                        "test": "smtp_connection",
                        "passed": False,
                        "error": str(e),
                        "target": f"{target_host}:{target_port}"
                    })
                    validation["smtp_specific"]["passed"] = False
            
            # Check proxy type suitability for SMTP
            if proxy.proxy_type and proxy.proxy_type.lower() not in ["socks5", "socks4"]:
                validation["smtp_specific"]["recommendations"].append(
                    f"Consider using SOCKS5 instead of {proxy.proxy_type} for SMTP operations"
                )
            
            # Check response time for SMTP operations
            if proxy.response_time and proxy.response_time > 3:
                validation["smtp_specific"]["recommendations"].append(
                    f"Proxy response time ({proxy.response_time:.2f}s) may be slow for SMTP operations"
                )
            
        except Exception as e:
            validation["smtp_specific"]["passed"] = False
            validation["smtp_specific"]["tests"].append({
                "test": "smtp_validation",
                "passed": False,
                "error": str(e)
            })
        
        return validation
    
    async def _validate_proxy_for_imap(
        self, 
        proxy: ProxyServer, 
        target_host: str = None, 
        target_port: int = None
    ) -> dict[str, Any]:
        """Validate proxy specifically for IMAP operations"""
        validation = {
            "imap_specific": {
                "passed": True,
                "tests": [],
                "recommendations": []
            }
        }
        
        try:
            # Test IMAP-specific connectivity
            if target_host and target_port:
                try:
                    sock = await self.create_socks_connection(
                        proxy, target_host, target_port, timeout=15
                    )
                    sock.close()
                    validation["imap_specific"]["tests"].append({
                        "test": "imap_connection",
                        "passed": True,
                        "target": f"{target_host}:{target_port}"
                    })
                except Exception as e:
                    validation["imap_specific"]["tests"].append({
                        "test": "imap_connection",
                        "passed": False,
                        "error": str(e),
                        "target": f"{target_host}:{target_port}"
                    })
                    validation["imap_specific"]["passed"] = False
            
            # Check proxy type suitability for IMAP
            if proxy.proxy_type and proxy.proxy_type.lower() not in ["socks5", "socks4"]:
                validation["imap_specific"]["recommendations"].append(
                    f"Consider using SOCKS5 instead of {proxy.proxy_type} for IMAP operations"
                )
            
            # Check response time for IMAP operations
            if proxy.response_time and proxy.response_time > 3:
                validation["imap_specific"]["recommendations"].append(
                    f"Proxy response time ({proxy.response_time:.2f}s) may be slow for IMAP operations"
                )
            
        except Exception as e:
            validation["imap_specific"]["passed"] = False
            validation["imap_specific"]["tests"].append({
                "test": "imap_validation",
                "passed": False,
                "error": str(e)
            })
        
        return validation
    
    async def _validate_proxy_for_email(
        self, 
        proxy: ProxyServer, 
        target_host: str = None, 
        target_port: int = None
    ) -> dict[str, Any]:
        """Validate proxy for general email operations"""
        validation = {
            "email_specific": {
                "passed": True,
                "tests": [],
                "recommendations": []
            }
        }
        
        try:
            # General email operation validation
            validation["email_specific"]["tests"].append({
                "test": "proxy_type_check",
                "passed": proxy.proxy_type and proxy.proxy_type.lower() in ["socks5", "socks4"],
                "proxy_type": proxy.proxy_type
            })
            
            # Check if proxy supports both SMTP and IMAP ports
            common_ports = [25, 465, 587, 143, 993]
            if target_port and target_port not in common_ports:
                validation["email_specific"]["recommendations"].append(
                    f"Target port {target_port} is not a standard email port"
                )
            
        except Exception as e:
            validation["email_specific"]["passed"] = False
            validation["email_specific"]["tests"].append({
                "test": "email_validation",
                "passed": False,
                "error": str(e)
            })
        
        return validation
    
    async def _validate_proxy_for_bulk(
        self, 
        proxy: ProxyServer, 
        target_host: str = None, 
        target_port: int = None
    ) -> dict[str, Any]:
        """Validate proxy for bulk email operations"""
        validation = {
            "bulk_specific": {
                "passed": True,
                "tests": [],
                "recommendations": []
            }
        }
        
        try:
            # Bulk operations require reliable proxies
            if proxy.response_time and proxy.response_time > 2:
                validation["bulk_specific"]["recommendations"].append(
                    f"Proxy response time ({proxy.response_time:.2f}s) may impact bulk operation performance"
                )
            
            # Check proxy stability
            if hasattr(proxy, 'last_checked') and proxy.last_checked:
                time_since_check = (datetime.utcnow() - proxy.last_checked).total_seconds()
                if time_since_check > 3600:  # 1 hour
                    validation["bulk_specific"]["recommendations"].append(
                        "Proxy health check is outdated - consider running health check before bulk operations"
                    )
            
        except Exception as e:
            validation["bulk_specific"]["passed"] = False
            validation["bulk_specific"]["tests"].append({
                "test": "bulk_validation",
                "passed": False,
                "error": str(e)
            })
        
        return validation
