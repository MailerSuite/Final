"""
PROXY ENFORCEMENT MIDDLEWARE
Ensures all SMTP/IMAP operations use proxies and prevents IP leaks
"""

import asyncio
import logging
from typing import Any, Callable
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.database import get_db
from models.base import ProxyServer
from services.proxy_service import ProxyService

logger = logging.getLogger(__name__)


class ProxyEnforcementMiddleware:
    """Middleware that enforces mandatory proxy usage for all SMTP/IMAP operations"""
    
    def __init__(self, app):
        self.app = app
        self.proxy_required_paths = [
            # Core email services
            "/api/v1/smtp/",
            "/api/v1/imap/",
            "/api/v1/mailing/",
            "/api/v1/campaigns/",
            "/api/v1/bulk-mail/",
            "/api/v1/email/",
            
            # Email checking and validation services
            "/api/v1/smtp-checker/",
            "/api/v1/imap-checker/",
            "/api/v1/email-check/",
            "/api/v1/bulk-checker/",
            "/api/v1/check-monitor/",
            "/api/v1/inbox-check/",
            "/api/v1/domain-checker/",
            "/api/v1/domain-checker/",
            
            # Email testing and validation
            "/api/v1/deliverability/",
            "/api/v1/validation/",
            "/api/v1/test/",
            "/api/v1/verify/",
            
            # SMTP/IMAP management and testing
            "/api/v1/system-smtp/",
            "/api/v1/imap-manager/",
            "/api/v1/smtp-metrics/",
            "/api/v1/imap-test/",
            "/api/v1/smtp-test/",
            
            # Bulk operations
            "/api/v1/bulk-upload/",
            "/api/v1/bulk-import/",
            "/api/v1/bulk-export/",
            
            # Email composition and sending
            "/api/v1/compose/",
            "/api/v1/send/",
            "/api/v1/queue/",
            
            # Email monitoring and analytics
            "/api/v1/monitoring/",
            "/api/v1/analytics/",
            "/api/v1/metrics/",
            "/api/v1/status/",
            
            # Security and validation
            "/api/v1/security/",
            "/api/v1/blacklist/",
            "/api/v1/spf/",
            "/api/v1/dkim/",
            
            # WebSocket endpoints for real-time operations
            "/api/v1/ws/smtp/",
            "/api/v1/ws/imap/",
            "/api/v1/ws/email/",
            "/api/v1/ws/check/",
        ]
        self.proxy_test_paths = [
            "/api/v1/proxies/test",
            "/api/v1/proxies/validate",
            "/api/v1/proxies/health",
        ]
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Check if this is a proxy-required endpoint
            if self._requires_proxy(request.url.path):
                try:
                    # Validate proxy availability before allowing the request
                    await self._validate_proxy_availability(request)
                except HTTPException as e:
                    # Return error response for proxy-required endpoints
                    response = JSONResponse(
                        status_code=e.status_code,
                        content={"detail": e.detail, "error_code": "PROXY_REQUIRED"}
                    )
                    await response(scope, receive, send)
                    return
                except Exception as e:
                    logger.error(f"Proxy validation error: {e}")
                    response = JSONResponse(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        content={"detail": "Proxy service unavailable", "error_code": "PROXY_UNAVAILABLE"}
                    )
                    await response(scope, receive, send)
                    return
        
        await self.app(scope, receive, send)
    
    def _requires_proxy(self, path: str) -> bool:
        """Check if the endpoint requires proxy usage"""
        if not settings.PROXY_ENFORCEMENT_STRICT:
            return False
        
        # Check for exact path matches first
        if path in self.proxy_required_paths:
            return True
        
        # Check for path prefixes
        for required_path in self.proxy_required_paths:
            if path.startswith(required_path):
                return True
        
        # Additional pattern matching for email-related operations
        email_patterns = [
            "/check/", "/test/", "/validate/", "/verify/",
            "/smtp", "/imap", "/email", "/mail", "/bulk",
            "/deliverability", "/validation", "/monitoring"
        ]
        
        for pattern in email_patterns:
            if pattern in path.lower():
                return True
        
        return False
    
    async def _validate_proxy_availability(self, request: Request) -> None:
        """Validate that working proxies are available for the session"""
        try:
            # Extract session_id from path or query parameters
            session_id = self._extract_session_id(request)
            if not session_id:
                # For endpoints that don't have session_id, check if they're email-related
                if self._is_email_operation(request.url.path):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Session ID required for email operations. Proxy usage is mandatory for all email-related services."
                    )
                else:
                    # Non-email endpoint, allow to proceed
                    return
            
            # Get database session
            db = get_db()
            async for db_session in db:
                try:
                    proxy_service = ProxyService(db_session)
                    
                    # Check if working proxies exist for this session
                    working_proxies = await proxy_service.get_working_proxies(
                        session_id, force_check=False
                    )
                    
                    if not working_proxies:
                        # If strict enforcement is enabled, require at least one working proxy
                        if settings.PROXY_FALLBACK_DISABLED:
                            raise HTTPException(
                                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail=f"No working proxies available for session {session_id}. Proxy usage is mandatory for all email operations including SMTP checking, IMAP checking, email validation, and deliverability testing."
                            )
                        else:
                            logger.warning(f"Session {session_id} has no working proxies but fallback is allowed")
                    
                    # Validate proxy health if health checks are enabled
                    if settings.PROXY_HEALTH_CHECK_INTERVAL > 0:
                        await self._validate_proxy_health(proxy_service, working_proxies)
                        
                finally:
                    await db_session.close()
                    
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Proxy validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Proxy validation service unavailable. All email operations require working proxies."
            )
    
    def _is_email_operation(self, path: str) -> bool:
        """Check if the path represents an email-related operation"""
        email_keywords = [
            'smtp', 'imap', 'email', 'mail', 'bulk', 'check', 'test',
            'validate', 'verify', 'deliverability', 'validation',
            'monitoring', 'analytics', 'metrics', 'status'
        ]
        
        path_lower = path.lower()
        return any(keyword in path_lower for keyword in email_keywords)
    
    def _extract_session_id(self, request: Request) -> str | None:
        """Extract session ID from request path or query parameters with enhanced pattern matching"""
        # Try to extract from path parameters with various patterns
        path_parts = request.url.path.split('/')
        
        # Pattern 1: /api/v1/sessions/{session_id}/...
        for i, part in enumerate(path_parts):
            if part == 'sessions' and i + 1 < len(path_parts):
                return path_parts[i + 1]
        
        # Pattern 2: /api/v1/{service}/{session_id}/...
        service_patterns = [
            'smtp', 'imap', 'mailing', 'campaigns', 'bulk-mail', 'email',
            'smtp-checker', 'imap-checker', 'email-check', 'bulk-checker',
            'check-monitor', 'inbox-check', 'domain-checker', 'deliverability',
            'validation', 'test', 'verify', 'system-smtp', 'imap-manager',
            'smtp-metrics', 'imap-test', 'smtp-test', 'bulk-upload',
            'bulk-import', 'bulk-export', 'compose', 'send', 'queue',
            'monitoring', 'analytics', 'metrics', 'status', 'security',
            'blacklist', 'spf', 'dkim'
        ]
        
        for i, part in enumerate(path_parts):
            if part in service_patterns and i + 1 < len(path_parts):
                potential_session_id = path_parts[i + 1]
                # Basic validation that it looks like a session ID
                if len(potential_session_id) > 10:  # Session IDs are typically long
                    return potential_session_id
        
        # Pattern 3: /api/v1/{service}/check/{session_id}/...
        for i, part in enumerate(path_parts):
            if part == 'check' and i + 1 < len(path_parts):
                potential_session_id = path_parts[i + 1]
                if len(potential_session_id) > 10:
                    return potential_session_id
        
        # Pattern 4: /api/v1/{service}/test/{session_id}/...
        for i, part in enumerate(path_parts):
            if part == 'test' and i + 1 < len(path_parts):
                potential_session_id = path_parts[i + 1]
                if len(potential_session_id) > 10:
                    return potential_session_id
        
        # Try to extract from query parameters
        session_id = request.query_params.get('session_id')
        if session_id:
            return session_id
        
        # Try other common parameter names
        for param_name in ['session', 'user_id', 'account_id', 'campaign_id']:
            param_value = request.query_params.get(param_name)
            if param_value and len(param_value) > 10:
                return param_value
        
        return None
    
    async def _validate_proxy_health(self, proxy_service: ProxyService, proxies: list[ProxyServer]) -> None:
        """Validate that proxies are healthy and responsive"""
        if not proxies:
            return
        
        # Test a sample of proxies to ensure they're working
        test_proxies = proxies[:min(3, len(proxies))]  # Test up to 3 proxies
        
        try:
            test_results = await asyncio.wait_for(
                proxy_service.test_multiple_proxies(
                    test_proxies, 
                    max_concurrent=len(test_proxies),
                    timeout=settings.PROXY_VALIDATION_TIMEOUT
                ),
                timeout=settings.PROXY_VALIDATION_TIMEOUT + 5
            )
            
            working_count = sum(1 for result in test_results if result.get("success", False))
            
            if working_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="All tested proxies are unresponsive. Proxy health check failed."
                )
            
            logger.info(f"Proxy health check passed: {working_count}/{len(test_proxies)} proxies working")
            
        except asyncio.TimeoutError:
            logger.error("Proxy health check timed out")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Proxy health check timed out. Please try again."
            )
        except Exception as e:
            logger.error(f"Proxy health check error: {e}")
            # Don't fail the request for health check errors, just log them
            pass


def add_proxy_enforcement_middleware(app):
    """Add proxy enforcement middleware to the FastAPI app"""
    app.add_middleware(ProxyEnforcementMiddleware)
    logger.info("🔒 Proxy enforcement middleware enabled - All SMTP/IMAP operations require working proxies")
    return app 