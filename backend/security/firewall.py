"""
Advanced Firewall Implementation
Provides IP blocking, whitelist/blacklist management, and real-time threat protection
"""

import asyncio
import ipaddress
import json
import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path

import geoip2.database
import geoip2.errors
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class FirewallAction(Enum):
    ALLOW = "allow"
    BLOCK = "block"
    DROP = "drop"
    MONITOR = "monitor"


class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BlockReason(Enum):
    RATE_LIMIT = "rate_limit"
    BRUTE_FORCE = "brute_force"
    MALICIOUS_PATTERN = "malicious_pattern"
    GEO_RESTRICTION = "geo_restriction"
    MANUAL_BLOCK = "manual_block"
    REPUTATION = "reputation"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


@dataclass
class FirewallRule:
    rule_id: str
    name: str
    ip_range: str
    action: FirewallAction
    priority: int
    expires_at: datetime | None = None
    reason: str | None = None
    created_at: datetime = None
    created_by: str | None = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


@dataclass
class BlockedIP:
    ip_address: str
    reason: BlockReason
    blocked_at: datetime
    expires_at: datetime | None
    block_count: int
    threat_level: ThreatLevel
    details: dict[str, any]
    auto_blocked: bool = True


@dataclass
class FirewallStats:
    total_requests: int
    blocked_requests: int
    allowed_requests: int
    monitored_ips: int
    blocked_ips: int
    active_rules: int
    last_updated: datetime


class AdvancedFirewall:
    """Advanced firewall with IP blocking, geo-filtering, and threat protection"""

    def __init__(
        self,
        redis_client: redis.Redis,
        geoip_database_path: str | None = None,
        enable_iptables: bool = False,
        enable_fail2ban: bool = False,
    ):
        self.redis = redis_client
        self.enable_iptables = enable_iptables
        self.enable_fail2ban = enable_fail2ban

        # GeoIP database for location-based filtering
        self.geoip_reader = None
        if geoip_database_path and Path(geoip_database_path).exists():
            try:
                self.geoip_reader = geoip2.database.Reader(geoip_database_path)
            except Exception as e:
                logger.warning(f"Failed to load GeoIP database: {e}")

        # In-memory caches for performance
        self.blocked_ips: dict[str, BlockedIP] = {}
        self.allowed_ips: set[str] = set()
        self.firewall_rules: dict[str, FirewallRule] = {}
        self.ip_reputation_cache: dict[str, tuple[int, datetime]] = {}

        # Statistics
        self.stats = FirewallStats(
            total_requests=0,
            blocked_requests=0,
            allowed_requests=0,
            monitored_ips=0,
            blocked_ips=0,
            active_rules=0,
            last_updated=datetime.now(),
        )

        # Configuration
        self.config = {
            "default_block_duration": 3600,  # 1 hour
            "max_block_duration": 86400 * 7,  # 1 week
            "reputation_threshold": 50,  # Block IPs with reputation < 50
            "geo_block_countries": [],  # Countries to block (ISO codes)
            "geo_allow_countries": [],  # Only allow these countries (if set)
            "rate_limit_threshold": 100,  # Requests per minute
            "brute_force_threshold": 10,  # Failed attempts
            "auto_escalation": True,  # Automatically escalate repeat offenders
            "whitelist_ranges": [  # Always allow these ranges
                "127.0.0.0/8",  # Localhost
                "10.0.0.0/8",  # Private networks
                "172.16.0.0/12",
                "192.168.0.0/16",
            ],
        }

        # Background tasks
        self._cleanup_task: asyncio.Task | None = None
        self._sync_task: asyncio.Task | None = None
        self._reputation_task: asyncio.Task | None = None

    async def start_firewall(self):
        """Start firewall services and background tasks"""
        await self._load_persistent_data()
        await self._initialize_system_integration()

        # Start background tasks
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        self._sync_task = asyncio.create_task(self._sync_loop())
        self._reputation_task = asyncio.create_task(
            self._reputation_update_loop()
        )

        logger.info("🔥 Advanced firewall started")

    async def stop_firewall(self):
        """Stop firewall services"""
        # Cancel background tasks
        tasks = [self._cleanup_task, self._sync_task, self._reputation_task]
        for task in tasks:
            if task:
                task.cancel()

        # Save state
        await self._save_persistent_data()

        # Close GeoIP reader
        if self.geoip_reader:
            self.geoip_reader.close()

        logger.info("🔥 Advanced firewall stopped")

    async def check_ip(
        self, ip_address: str, request_context: dict[str, any] | None = None
    ) -> tuple[FirewallAction, str | None]:
        """Check if an IP address should be allowed, blocked, or monitored"""

        self.stats.total_requests += 1

        # Normalize IP address
        try:
            ip_obj = ipaddress.ip_address(ip_address)
            ip_str = str(ip_obj)
        except ValueError:
            logger.warning(f"Invalid IP address: {ip_address}")
            return FirewallAction.BLOCK, "Invalid IP address"

        # Check whitelist first (highest priority)
        if await self._is_whitelisted(ip_str):
            self.stats.allowed_requests += 1
            return FirewallAction.ALLOW, "Whitelisted IP"

        # Check if IP is currently blocked
        if ip_str in self.blocked_ips:
            blocked_ip = self.blocked_ips[ip_str]
            if (
                blocked_ip.expires_at
                and datetime.now() > blocked_ip.expires_at
            ):
                # Block expired, remove it
                await self._unblock_ip(ip_str, "Block expired")
            else:
                self.stats.blocked_requests += 1
                return (
                    FirewallAction.BLOCK,
                    f"Blocked: {blocked_ip.reason.value}",
                )

        # Check Redis for blocked IPs (distributed state)
        redis_blocked = await self.redis.get(f"firewall:blocked:{ip_str}")
        if redis_blocked:
            block_data = json.loads(redis_blocked)
            self.stats.blocked_requests += 1
            return (
                FirewallAction.BLOCK,
                f"Blocked: {block_data.get('reason', 'Unknown')}",
            )

        # Check firewall rules
        action, reason = await self._check_firewall_rules(ip_str)
        if action != FirewallAction.ALLOW:
            if action == FirewallAction.BLOCK:
                self.stats.blocked_requests += 1
            return action, reason

        # Geographic filtering
        geo_action, geo_reason = await self._check_geographic_restrictions(
            ip_str
        )
        if geo_action != FirewallAction.ALLOW:
            if geo_action == FirewallAction.BLOCK:
                self.stats.blocked_requests += 1
            return geo_action, geo_reason

        # IP reputation check
        reputation_action, reputation_reason = await self._check_ip_reputation(
            ip_str
        )
        if reputation_action != FirewallAction.ALLOW:
            if reputation_action == FirewallAction.BLOCK:
                self.stats.blocked_requests += 1
            return reputation_action, reputation_reason

        # Rate limiting check
        rate_action, rate_reason = await self._check_rate_limits(
            ip_str, request_context
        )
        if rate_action != FirewallAction.ALLOW:
            if rate_action == FirewallAction.BLOCK:
                self.stats.blocked_requests += 1
            return rate_action, rate_reason

        # Default allow
        self.stats.allowed_requests += 1
        return FirewallAction.ALLOW, "Passed all checks"

    async def block_ip(
        self,
        ip_address: str,
        reason: BlockReason,
        duration_seconds: int | None = None,
        threat_level: ThreatLevel = ThreatLevel.MEDIUM,
        details: dict[str, any] | None = None,
        manual: bool = False,
    ) -> bool:
        """Block an IP address"""

        try:
            ip_obj = ipaddress.ip_address(ip_address)
            ip_str = str(ip_obj)
        except ValueError:
            logger.error(f"Invalid IP address for blocking: {ip_address}")
            return False

        # Don't block whitelisted IPs
        if await self._is_whitelisted(ip_str):
            logger.warning(f"Attempted to block whitelisted IP: {ip_str}")
            return False

        # Calculate expiration
        if duration_seconds is None:
            duration_seconds = self.config["default_block_duration"]

        # Apply auto-escalation for repeat offenders
        if self.config["auto_escalation"] and ip_str in self.blocked_ips:
            previous_block = self.blocked_ips[ip_str]
            duration_seconds = min(
                duration_seconds * 2, self.config["max_block_duration"]
            )
            threat_level = (
                ThreatLevel.HIGH
                if threat_level == ThreatLevel.MEDIUM
                else ThreatLevel.CRITICAL
            )

        expires_at = datetime.now() + timedelta(seconds=duration_seconds)

        # Create blocked IP record
        blocked_ip = BlockedIP(
            ip_address=ip_str,
            reason=reason,
            blocked_at=datetime.now(),
            expires_at=expires_at,
            block_count=self.blocked_ips.get(
                ip_str,
                BlockedIP(
                    "", reason, datetime.now(), None, 0, threat_level, {}
                ),
            ).block_count
            + 1,
            threat_level=threat_level,
            details=details or {},
            auto_blocked=not manual,
        )

        # Store in memory cache
        self.blocked_ips[ip_str] = blocked_ip

        # Store in Redis for distributed access
        await self.redis.setex(
            f"firewall:blocked:{ip_str}",
            duration_seconds,
            json.dumps(asdict(blocked_ip), default=str),
        )

        # System-level blocking
        if self.enable_iptables:
            await self._block_ip_iptables(ip_str)

        if self.enable_fail2ban:
            await self._block_ip_fail2ban(ip_str)

        # Update statistics
        self.stats.blocked_ips = len(self.blocked_ips)

        logger.warning(
            f"🚫 Blocked IP {ip_str} for {reason.value} (duration: {duration_seconds}s, threat: {threat_level.value})"
        )

        return True

    async def unblock_ip(
        self, ip_address: str, reason: str = "Manual unblock"
    ) -> bool:
        """Unblock an IP address"""
        return await self._unblock_ip(ip_address, reason)

    async def _unblock_ip(self, ip_address: str, reason: str) -> bool:
        """Internal method to unblock an IP"""

        # Remove from memory cache
        if ip_address in self.blocked_ips:
            del self.blocked_ips[ip_address]

        # Remove from Redis
        await self.redis.delete(f"firewall:blocked:{ip_address}")

        # System-level unblocking
        if self.enable_iptables:
            await self._unblock_ip_iptables(ip_address)

        if self.enable_fail2ban:
            await self._unblock_ip_fail2ban(ip_address)

        # Update statistics
        self.stats.blocked_ips = len(self.blocked_ips)

        logger.info(f"✅ Unblocked IP {ip_address}: {reason}")

        return True

    async def add_firewall_rule(self, rule: FirewallRule) -> bool:
        """Add a new firewall rule"""

        # Validate IP range
        try:
            ipaddress.ip_network(rule.ip_range, strict=False)
        except ValueError:
            logger.error(f"Invalid IP range in rule: {rule.ip_range}")
            return False

        # Store rule
        self.firewall_rules[rule.rule_id] = rule

        # Persist to Redis
        await self.redis.hset(
            "firewall:rules",
            rule.rule_id,
            json.dumps(asdict(rule), default=str),
        )

        # Update statistics
        self.stats.active_rules = len(self.firewall_rules)

        logger.info(
            f"Added firewall rule: {rule.name} ({rule.ip_range} -> {rule.action.value})"
        )

        return True

    async def remove_firewall_rule(self, rule_id: str) -> bool:
        """Remove a firewall rule"""

        if rule_id in self.firewall_rules:
            rule = self.firewall_rules[rule_id]
            del self.firewall_rules[rule_id]

            # Remove from Redis
            await self.redis.hdel("firewall:rules", rule_id)

            # Update statistics
            self.stats.active_rules = len(self.firewall_rules)

            logger.info(f"Removed firewall rule: {rule.name}")
            return True

        return False

    async def whitelist_ip(self, ip_address: str) -> bool:
        """Add IP to whitelist"""

        try:
            ip_obj = ipaddress.ip_address(ip_address)
            ip_str = str(ip_obj)
        except ValueError:
            logger.error(f"Invalid IP address for whitelist: {ip_address}")
            return False

        self.allowed_ips.add(ip_str)

        # Persist to Redis
        await self.redis.sadd("firewall:whitelist", ip_str)

        # Remove from blocked list if present
        if ip_str in self.blocked_ips:
            await self._unblock_ip(ip_str, "Added to whitelist")

        logger.info(f"✅ Added IP to whitelist: {ip_str}")

        return True

    async def remove_from_whitelist(self, ip_address: str) -> bool:
        """Remove IP from whitelist"""

        if ip_address in self.allowed_ips:
            self.allowed_ips.remove(ip_address)
            await self.redis.srem("firewall:whitelist", ip_address)
            logger.info(f"Removed IP from whitelist: {ip_address}")
            return True

        return False

    async def get_firewall_status(self) -> dict[str, any]:
        """Get comprehensive firewall status"""

        self.stats.last_updated = datetime.now()

        return {
            "status": "active",
            "stats": asdict(self.stats),
            "config": self.config.copy(),
            "blocked_ips_count": len(self.blocked_ips),
            "whitelist_count": len(self.allowed_ips),
            "active_rules_count": len(self.firewall_rules),
            "system_integration": {
                "iptables_enabled": self.enable_iptables,
                "fail2ban_enabled": self.enable_fail2ban,
                "geoip_available": self.geoip_reader is not None,
            },
            "recent_blocks": [
                {
                    "ip": ip,
                    "reason": block.reason.value,
                    "threat_level": block.threat_level.value,
                    "blocked_at": block.blocked_at.isoformat(),
                    "expires_at": block.expires_at.isoformat()
                    if block.expires_at
                    else None,
                }
                for ip, block in list(self.blocked_ips.items())[-10:]
            ],
        }

    async def _is_whitelisted(self, ip_address: str) -> bool:
        """Check if IP is whitelisted"""

        # Check in-memory cache
        if ip_address in self.allowed_ips:
            return True

        # Check whitelist ranges
        try:
            ip_obj = ipaddress.ip_address(ip_address)
            for range_str in self.config["whitelist_ranges"]:
                if ip_obj in ipaddress.ip_network(range_str):
                    return True
        except ValueError:
            pass

        return False

    async def _check_firewall_rules(
        self, ip_address: str
    ) -> tuple[FirewallAction, str | None]:
        """Check IP against firewall rules"""

        # Sort rules by priority (lower number = higher priority)
        sorted_rules = sorted(
            self.firewall_rules.values(), key=lambda r: r.priority
        )

        try:
            ip_obj = ipaddress.ip_address(ip_address)

            for rule in sorted_rules:
                # Check if rule has expired
                if rule.expires_at and datetime.now() > rule.expires_at:
                    continue

                # Check if IP matches rule
                try:
                    if ip_obj in ipaddress.ip_network(rule.ip_range):
                        return rule.action, f"Rule: {rule.name}"
                except ValueError:
                    logger.warning(
                        f"Invalid IP range in rule {rule.rule_id}: {rule.ip_range}"
                    )
                    continue

        except ValueError:
            return FirewallAction.BLOCK, "Invalid IP address"

        return FirewallAction.ALLOW, None

    async def _check_geographic_restrictions(
        self, ip_address: str
    ) -> tuple[FirewallAction, str | None]:
        """Check geographic restrictions"""

        if not self.geoip_reader:
            return FirewallAction.ALLOW, None

        try:
            response = self.geoip_reader.country(ip_address)
            country_code = response.country.iso_code

            # Check geo block list
            if country_code in self.config["geo_block_countries"]:
                return (
                    FirewallAction.BLOCK,
                    f"Geographic restriction: {country_code}",
                )

            # Check geo allow list (if configured)
            if (
                self.config["geo_allow_countries"]
                and country_code not in self.config["geo_allow_countries"]
            ):
                return (
                    FirewallAction.BLOCK,
                    f"Geographic restriction: {country_code} not in allow list",
                )

        except geoip2.errors.AddressNotFoundError:
            # Unknown location, apply default policy
            if self.config["geo_allow_countries"]:
                return (
                    FirewallAction.BLOCK,
                    "Geographic restriction: Unknown location",
                )
        except Exception as e:
            logger.warning(f"GeoIP lookup failed for {ip_address}: {e}")

        return FirewallAction.ALLOW, None

    async def _check_ip_reputation(
        self, ip_address: str
    ) -> tuple[FirewallAction, str | None]:
        """Check IP reputation"""

        # Check cache first
        if ip_address in self.ip_reputation_cache:
            score, timestamp = self.ip_reputation_cache[ip_address]
            # Cache valid for 1 hour
            if datetime.now() - timestamp < timedelta(hours=1):
                if score < self.config["reputation_threshold"]:
                    return (
                        FirewallAction.BLOCK,
                        f"Poor reputation score: {score}",
                    )
                return FirewallAction.ALLOW, None

        # Would integrate with reputation services (VirusTotal, AbuseIPDB, etc.)
        # For now, return allow
        return FirewallAction.ALLOW, None

    async def _check_rate_limits(
        self, ip_address: str, request_context: dict[str, any] | None
    ) -> tuple[FirewallAction, str | None]:
        """Check rate limits"""

        current_minute = int(time.time() // 60)
        rate_key = f"firewall:rate:{ip_address}:{current_minute}"

        # Get current count
        current_count = await self.redis.incr(rate_key)
        await self.redis.expire(rate_key, 60)  # Expire after 1 minute

        if current_count > self.config["rate_limit_threshold"]:
            # Auto-block for rate limit violation
            await self.block_ip(
                ip_address,
                BlockReason.RATE_LIMIT,
                duration_seconds=self.config["default_block_duration"],
                threat_level=ThreatLevel.MEDIUM,
                details={"requests_per_minute": current_count},
            )
            return (
                FirewallAction.BLOCK,
                f"Rate limit exceeded: {current_count} requests/minute",
            )

        return FirewallAction.ALLOW, None

    async def _block_ip_iptables(self, ip_address: str):
        """Block IP using iptables"""
        try:
            cmd = f"iptables -A INPUT -s {ip_address} -j DROP"
            await asyncio.create_subprocess_shell(cmd)
            logger.debug(f"Blocked {ip_address} with iptables")
        except Exception as e:
            logger.error(f"Failed to block {ip_address} with iptables: {e}")

    async def _unblock_ip_iptables(self, ip_address: str):
        """Unblock IP using iptables"""
        try:
            cmd = f"iptables -D INPUT -s {ip_address} -j DROP"
            await asyncio.create_subprocess_shell(cmd)
            logger.debug(f"Unblocked {ip_address} with iptables")
        except Exception as e:
            logger.error(f"Failed to unblock {ip_address} with iptables: {e}")

    async def _block_ip_fail2ban(self, ip_address: str):
        """Block IP using fail2ban"""
        try:
            cmd = f"fail2ban-client set sgpt-firewall banip {ip_address}"
            await asyncio.create_subprocess_shell(cmd)
            logger.debug(f"Blocked {ip_address} with fail2ban")
        except Exception as e:
            logger.error(f"Failed to block {ip_address} with fail2ban: {e}")

    async def _unblock_ip_fail2ban(self, ip_address: str):
        """Unblock IP using fail2ban"""
        try:
            cmd = f"fail2ban-client set sgpt-firewall unbanip {ip_address}"
            await asyncio.create_subprocess_shell(cmd)
            logger.debug(f"Unblocked {ip_address} with fail2ban")
        except Exception as e:
            logger.error(f"Failed to unblock {ip_address} with fail2ban: {e}")

    async def _load_persistent_data(self):
        """Load persistent firewall data from Redis"""
        try:
            # Load whitelist
            whitelist = await self.redis.smembers("firewall:whitelist")
            self.allowed_ips = set(
                ip.decode() if isinstance(ip, bytes) else ip
                for ip in whitelist
            )

            # Load rules
            rules_data = await self.redis.hgetall("firewall:rules")
            for rule_id, rule_data in rules_data.items():
                try:
                    if isinstance(rule_data, bytes):
                        rule_data = rule_data.decode()
                    rule_dict = json.loads(rule_data)
                    rule_dict["created_at"] = datetime.fromisoformat(
                        rule_dict["created_at"]
                    )
                    if rule_dict.get("expires_at"):
                        rule_dict["expires_at"] = datetime.fromisoformat(
                            rule_dict["expires_at"]
                        )

                    rule = FirewallRule(**rule_dict)
                    self.firewall_rules[rule.rule_id] = rule
                except Exception as e:
                    logger.error(f"Failed to load rule {rule_id}: {e}")

            # Update statistics
            self.stats.active_rules = len(self.firewall_rules)

            logger.info(
                f"Loaded firewall data: {len(self.allowed_ips)} whitelisted IPs, {len(self.firewall_rules)} rules"
            )

        except Exception as e:
            logger.error(f"Failed to load persistent firewall data: {e}")

    async def _save_persistent_data(self):
        """Save current firewall state to Redis"""
        try:
            # This method could be used for explicit saves
            # Most data is already persisted in real-time
            logger.info("Firewall state saved")
        except Exception as e:
            logger.error(f"Failed to save firewall data: {e}")

    async def _initialize_system_integration(self):
        """Initialize system-level firewall integration"""
        if self.enable_iptables:
            try:
                # Create custom chain for SGPT firewall
                await asyncio.create_subprocess_shell(
                    "iptables -N SGPT-FIREWALL 2>/dev/null || true"
                )
                logger.info("Initialized iptables integration")
            except Exception as e:
                logger.error(f"Failed to initialize iptables: {e}")
                self.enable_iptables = False

        if self.enable_fail2ban:
            logger.info("Fail2ban integration enabled")

    async def _cleanup_loop(self):
        """Background task for cleanup"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes

                # Clean expired blocks
                expired_ips = []
                for ip, block in self.blocked_ips.items():
                    if block.expires_at and datetime.now() > block.expires_at:
                        expired_ips.append(ip)

                for ip in expired_ips:
                    await self._unblock_ip(ip, "Block expired")

                # Clean expired rules
                expired_rules = []
                for rule_id, rule in self.firewall_rules.items():
                    if rule.expires_at and datetime.now() > rule.expires_at:
                        expired_rules.append(rule_id)

                for rule_id in expired_rules:
                    await self.remove_firewall_rule(rule_id)

                if expired_ips or expired_rules:
                    logger.info(
                        f"Cleaned up {len(expired_ips)} expired blocks and {len(expired_rules)} expired rules"
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup error: {e}")

    async def _sync_loop(self):
        """Background task for syncing with distributed state"""
        while True:
            try:
                await asyncio.sleep(60)  # Run every minute

                # Sync blocked IPs from Redis
                # This ensures consistency across multiple instances

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Sync error: {e}")

    async def _reputation_update_loop(self):
        """Background task for updating IP reputation"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour

                # Update reputation for active IPs
                # Would integrate with external reputation services

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Reputation update error: {e}")


# Global firewall instance
_firewall_instance: AdvancedFirewall | None = None


async def get_firewall() -> AdvancedFirewall:
    """Get the global firewall instance"""
    global _firewall_instance
    if _firewall_instance is None:
        # Would get Redis client from app state
        redis_client = None  # Placeholder
        _firewall_instance = AdvancedFirewall(redis_client)
        await _firewall_instance.start_firewall()
    return _firewall_instance


async def shutdown_firewall():
    """Shutdown the global firewall instance"""
    global _firewall_instance
    if _firewall_instance:
        await _firewall_instance.stop_firewall()
        _firewall_instance = None


# Integration with existing middleware
async def ban_ip(
    ip_address: str,
    reason: str = "Rate limit violation",
    duration_seconds: int = 3600,
) -> bool:
    """Integration function for existing middleware"""
    firewall = await get_firewall()

    # Map reason to BlockReason enum
    block_reason = BlockReason.RATE_LIMIT
    if "brute" in reason.lower():
        block_reason = BlockReason.BRUTE_FORCE
    elif "malicious" in reason.lower():
        block_reason = BlockReason.MALICIOUS_PATTERN

    return await firewall.block_ip(
        ip_address=ip_address,
        reason=block_reason,
        duration_seconds=duration_seconds,
        threat_level=ThreatLevel.MEDIUM,
    )
