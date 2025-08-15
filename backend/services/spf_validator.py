"""
SPF (Sender Policy Framework) Validation Service
Basic SPF record checking for sender authentication
"""

import asyncio
import logging
from typing import Any

import dns.resolver

logger = logging.getLogger(__name__)


class SPFValidator:
    """Basic SPF validation service"""

    def __init__(self):
        self.timeout = 5
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes

    async def validate_sender(
        self, sender_email: str, sender_ip: str
    ) -> dict[str, Any]:
        """
        Validate sender against SPF record
        Returns basic pass/fail result
        """
        domain = sender_email.split("@")[-1]

        # Check cache first
        cache_key = f"{domain}:{sender_ip}"
        if cache_key in self.cache:
            cached_result = self.cache[cache_key]
            if (
                asyncio.get_event_loop().time() - cached_result["timestamp"]
                < self.cache_ttl
            ):
                return cached_result["result"]

        try:
            # Get SPF record
            spf_record = await self._get_spf_record(domain)
            if not spf_record:
                result = {
                    "result": "none",
                    "valid": True,  # No SPF record = neutral
                    "domain": domain,
                    "ip": sender_ip,
                    "record": None,
                    "reason": "No SPF record found",
                }
            else:
                # Basic SPF checking
                result = await self._check_spf_record(
                    spf_record, sender_ip, domain
                )

            # Cache result
            self.cache[cache_key] = {
                "result": result,
                "timestamp": asyncio.get_event_loop().time(),
            }

            logger.info(
                f"SPF validation for {sender_email} from {sender_ip}: {result['result']}"
            )
            return result

        except Exception as e:
            logger.error(f"SPF validation error for {sender_email}: {e}")
            return {
                "result": "temperror",
                "valid": True,  # Allow on error to prevent blocking
                "domain": domain,
                "ip": sender_ip,
                "error": str(e),
                "reason": "SPF check failed",
            }

    async def _get_spf_record(self, domain: str) -> str | None:
        """Get SPF record for domain"""
        try:
            txt_records = dns.resolver.resolve(domain, "TXT")
            for record in txt_records:
                record_text = record.to_text().strip('"')
                if record_text.startswith("v=spf1"):
                    return record_text
            return None
        except Exception:
            return None

    async def _check_spf_record(
        self, spf_record: str, sender_ip: str, domain: str
    ) -> dict[str, Any]:
        """Basic SPF record validation"""
        try:
            # Very basic SPF checking - just look for common patterns
            spf_parts = spf_record.split()

            for part in spf_parts:
                if part.startswith("ip4:"):
                    # Check if IP matches
                    allowed_ip = part.split(":", 1)[1]
                    if self._ip_matches(sender_ip, allowed_ip):
                        return {
                            "result": "pass",
                            "valid": True,
                            "domain": domain,
                            "ip": sender_ip,
                            "record": spf_record,
                            "matched_mechanism": part,
                        }
                elif part.startswith("include:"):
                    # Basic include checking
                    include_domain = part.split(":", 1)[1]
                    if include_domain in [
                        "_spf.google.com",
                        "_spf.outlook.com",
                        "spf.mailgun.org",
                    ]:
                        return {
                            "result": "pass",
                            "valid": True,
                            "domain": domain,
                            "ip": sender_ip,
                            "record": spf_record,
                            "matched_mechanism": part,
                        }
                elif part in ["a", "mx"]:
                    # Allow a/mx records (simplified)
                    return {
                        "result": "pass",
                        "valid": True,
                        "domain": domain,
                        "ip": sender_ip,
                        "record": spf_record,
                        "matched_mechanism": part,
                    }

            # Check final qualifier
            if "~all" in spf_record:
                return {
                    "result": "softfail",
                    "valid": True,  # Soft fail = allow but warn
                    "domain": domain,
                    "ip": sender_ip,
                    "record": spf_record,
                    "reason": "Soft fail (~all)",
                }
            elif "-all" in spf_record:
                return {
                    "result": "fail",
                    "valid": False,  # Hard fail = block
                    "domain": domain,
                    "ip": sender_ip,
                    "record": spf_record,
                    "reason": "Hard fail (-all)",
                }
            else:
                return {
                    "result": "neutral",
                    "valid": True,
                    "domain": domain,
                    "ip": sender_ip,
                    "record": spf_record,
                    "reason": "No explicit policy",
                }

        except Exception as e:
            logger.error(f"SPF record parsing error: {e}")
            return {
                "result": "temperror",
                "valid": True,
                "domain": domain,
                "ip": sender_ip,
                "error": str(e),
            }

    def _ip_matches(self, ip: str, pattern: str) -> bool:
        """Simple IP matching (basic implementation)"""
        if "/" in pattern:
            # CIDR notation - simplified check
            network_ip = pattern.split("/")[0]
            return ip.startswith(network_ip.rsplit(".", 1)[0])
        else:
            return ip == pattern

    async def bulk_validate(
        self, sender_data: list
    ) -> dict[str, dict[str, Any]]:
        """Validate multiple senders efficiently"""
        tasks = []
        for sender_email, sender_ip in sender_data:
            task = self.validate_sender(sender_email, sender_ip)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        formatted_results = {}
        for i, result in enumerate(results):
            sender_email, sender_ip = sender_data[i]
            if isinstance(result, Exception):
                formatted_results[f"{sender_email}:{sender_ip}"] = {
                    "result": "error",
                    "valid": True,
                    "error": str(result),
                }
            else:
                formatted_results[f"{sender_email}:{sender_ip}"] = result

        return formatted_results
