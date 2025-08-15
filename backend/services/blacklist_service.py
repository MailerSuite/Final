"""
COMPLETE DNSBL BLACKLIST SERVICE IMPLEMENTATION
Check IPs and domains against spam lists
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Any

try:
    import dns.asyncresolver
    import dns.resolver

    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False
    print("❌ dnspython is not installed! DNSBL checks will not work!")
from config.settings import settings
from core.logger import get_logger
from utils.check_logging import log_check_result

logger = get_logger(__name__)


class BlacklistService:
    """Service for checking IPs and domains against blacklists"""

    def __init__(self, db_session):
        self.db = db_session
        self.dnsbl_providers = settings.DNSBL_SERVERS
        self.timeout = settings.DNSBL_TIMEOUT
        self.cache = {}
        self.cache_ttl = 3600
        if not DNS_AVAILABLE:
            logger.error(
                "❌ dnspython is not installed! DNSBL checks will not work!"
            )

    async def check_ip_blacklist_detailed(
        self,
        ip_address: str,
        providers: list[str] | None | None = None,
        use_cache: bool = True,
    ) -> dict[str, Any]:
        """Check an IP address against DNSBL providers with details"""
        start_ts = time.perf_counter()
        if not DNS_AVAILABLE:
            logger.warning(
                "⚠️  DNS library unavailable, skipping DNSBL check"
            )
            result = {
                "ip": ip_address,
                "checked_at": datetime.utcnow().isoformat() + "Z",
                "results": [],
                "summary": {"blacklisted_count": 0, "total_checked": 0},
            }
            await log_check_result(
                self.db,
                check_type="blacklist_ip",
                input_params={"ip": ip_address},
                status="success",
                response=result,
                duration=time.perf_counter() - start_ts,
            )
            return result
        provider_list = providers or self.dnsbl_providers
        if use_cache and ip_address in self.cache:
            cache_data = self.cache[ip_address]
            if time.time() - cache_data["checked_at"] < self.cache_ttl:
                logger.debug(
                    f"📋 Using cache for {ip_address}: {('BLACKLISTED' if cache_data['is_blacklisted'] else 'CLEAN')}"
                )
                await log_check_result(
                    self.db,
                    check_type="blacklist_ip",
                    input_params={
                        "ip": ip_address,
                        "providers": provider_list,
                    },
                    status="success",
                    response=cache_data["result"],
                    duration=time.perf_counter() - start_ts,
                )
                return cache_data["result"]
        logger.info(
            f"🔍 Checking {ip_address} against {len(provider_list)} DNSBL providers..."
        )
        reversed_ip = ".".join(reversed(ip_address.split(".")))

        async def query(provider: str) -> dict[str, Any]:
            start = time.perf_counter()
            res = {"provider": provider}
            try:
                query_host = f"{reversed_ip}.{provider}"
                resolver = dns.asyncresolver.Resolver()
                resolver.timeout = self.timeout
                resolver.lifetime = self.timeout
                await resolver.resolve(query_host, "A")
                res["status"] = "blacklisted"
                res["message"] = "Listed"
            except dns.resolver.NXDOMAIN:
                res["status"] = "not_blacklisted"
                res["message"] = "No listing found"
            except Exception as e:
                res["status"] = "error"
                res["message"] = str(e)
            res["response_time_ms"] = int((time.perf_counter() - start) * 1000)
            res["checked_at"] = datetime.utcnow().isoformat() + "Z"
            return res

        tasks = [query(p) for p in provider_list]
        results = await asyncio.gather(*tasks)
        blacklisted_count = len(
            [r for r in results if r["status"] == "blacklisted"]
        )
        summary = {
            "blacklisted_count": blacklisted_count,
            "total_checked": len(provider_list),
        }
        await self.db.execute(
            "\n            INSERT INTO blacklist_checks (target, target_type, is_blacklisted, providers, checked_at, expires_at)\n            VALUES ($1, 'ip', $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour')\n        ",
            ip_address,
            blacklisted_count > 0,
            json.dumps(
                [
                    r["provider"]
                    for r in results
                    if r["status"] == "blacklisted"
                ]
            ),
        )
        cache_entry = {
            "is_blacklisted": blacklisted_count > 0,
            "checked_at": time.time(),
            "result": {
                "ip": ip_address,
                "checked_at": datetime.utcnow().isoformat() + "Z",
                "results": results,
                "summary": summary,
            },
        }
        self.cache[ip_address] = cache_entry
        if blacklisted_count:
            logger.error(
                f"🚫 IP {ip_address} is BLACKLISTED on {blacklisted_count} providers: {[r['provider'] for r in results if r['status'] == 'blacklisted']}"
            )
        else:
            logger.info(f"✅ IP {ip_address} is clean on all DNSBL providers")
        await log_check_result(
            self.db,
            check_type="blacklist_ip",
            input_params={"ip": ip_address, "providers": provider_list},
            status="success",
            response=cache_entry["result"],
            duration=time.perf_counter() - start_ts,
        )
        return cache_entry["result"]

    async def check_ip_blacklist(
        self, ip_address: str, use_cache: bool = True
    ) -> bool:
        """Обертка для получения только факта наличия в списке"""
        result = await self.check_ip_blacklist_detailed(
            ip_address, use_cache=use_cache
        )
        return result["summary"]["blacklisted_count"] > 0

    async def check_domain_blacklist_detailed(
        self, domain: str, providers: list[str] | None | None = None
    ) -> dict[str, Any]:
        """Check a domain against blacklists with details"""
        start_ts = time.perf_counter()
        if not DNS_AVAILABLE:
            result = {
                "domain": domain,
                "checked_at": datetime.utcnow().isoformat() + "Z",
                "results": [],
                "summary": {"blacklisted_count": 0, "total_checked": 0},
            }
            await log_check_result(
                self.db,
                check_type="blacklist_domain",
                input_params={"domain": domain},
                status="success",
                response=result,
                duration=time.perf_counter() - start_ts,
            )
            return result
        try:
            resolver = dns.asyncresolver.Resolver()
            answers = await resolver.resolve(domain, "A")
            if not answers:
                return {
                    "domain": domain,
                    "checked_at": datetime.utcnow().isoformat() + "Z",
                    "results": [],
                    "summary": {"blacklisted_count": 0, "total_checked": 0},
                }
            ip_address = str(answers[0])
            result = await self.check_ip_blacklist_detailed(
                ip_address, providers=providers
            )
            result["domain"] = domain
            await log_check_result(
                self.db,
                check_type="blacklist_domain",
                input_params={"domain": domain, "ip": ip_address},
                status="success",
                response=result,
                duration=time.perf_counter() - start_ts,
            )
            return result
        except Exception as e:
            logger.error(f"❌ Domain check error for {domain}: {e}")
            result = {
                "domain": domain,
                "checked_at": datetime.utcnow().isoformat() + "Z",
                "results": [
                    {
                        "provider": "dns",
                        "status": "error",
                        "message": "An internal error occurred while checking the domain.",
                        "response_time_ms": 0,
                        "checked_at": datetime.utcnow().isoformat() + "Z",
                    }
                ],
                "summary": {"blacklisted_count": 0, "total_checked": 0},
            }
            await log_check_result(
                self.db,
                check_type="blacklist_domain",
                input_params={"domain": domain},
                status="error",
                response=result,
                error=str(e),
                duration=time.perf_counter() - start_ts,
            )
            return result

    async def check_domain_blacklist(self, domain: str) -> bool:
        """Wrapper that returns only boolean status"""
        result = await self.check_domain_blacklist_detailed(domain)
        return result["summary"]["blacklisted_count"] > 0

    async def bulk_check_ips(
        self, ip_addresses: list[str], max_concurrent: int = 10
    ) -> dict[str, bool]:
        """Bulk IP blacklist check"""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def check_with_semaphore(ip):
            async with semaphore:
                is_blacklisted = await self.check_ip_blacklist(ip)
                return (ip, is_blacklisted)

        logger.info(f"🔍 Bulk checking {len(ip_addresses)} IP addresses...")
        tasks = [check_with_semaphore(ip) for ip in ip_addresses]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        final_results = {}
        blacklisted_count = 0
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"❌ Ошибка проверки: {result}")
                continue
            ip, is_blacklisted = result
            final_results[ip] = is_blacklisted
            if is_blacklisted:
                blacklisted_count += 1
        logger.info(
            f"📊 Bulk check result: {blacklisted_count}/{len(final_results)} IP blacklisted"
        )
        return final_results

    async def get_blacklist_stats(self) -> dict[str, Any]:
        """Blacklist checks statistics"""
        stats = await self.db.fetchrow(
            "\n            SELECT \n                COUNT(*) as total_checks,\n                COUNT(*) FILTER (WHERE is_blacklisted = true) as blacklisted_count,\n                COUNT(*) FILTER (WHERE target_type = 'ip') as ip_checks,\n                COUNT(*) FILTER (WHERE target_type = 'domain') as domain_checks,\n                COUNT(*) FILTER (WHERE checked_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as checks_24h\n            FROM blacklist_checks\n        "
        )
        return {
            "total_checks": stats["total_checks"] or 0,
            "blacklisted_count": stats["blacklisted_count"] or 0,
            "clean_count": (stats["total_checks"] or 0)
            - (stats["blacklisted_count"] or 0),
            "ip_checks": stats["ip_checks"] or 0,
            "domain_checks": stats["domain_checks"] or 0,
            "checks_24h": stats["checks_24h"] or 0,
            "blacklist_rate": round(
                (stats["blacklisted_count"] or 0)
                / max(stats["total_checks"] or 1, 1)
                * 100,
                2,
            ),
        }

    async def cleanup_old_checks(self, days: int = 7):
        """Cleanup old checks"""
        deleted = await self.db.execute(
            "\n            DELETE FROM blacklist_checks \n            WHERE checked_at < CURRENT_TIMESTAMP - INTERVAL '%s days'\n        ",
            days,
        )
        logger.info(f"🧹 Deleted {deleted} old blacklist check records")
        return deleted
