"""
Comprehensive Bounce Handling Service
Processes email bounces, categorizes them, and manages suppression lists
"""

import logging
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.bounce import DeliverabilityStats, EmailBounce, SuppressionList

logger = logging.getLogger(__name__)


class BounceType(Enum):
    """Types of email bounces"""

    HARD_BOUNCE = "hard_bounce"
    SOFT_BOUNCE = "soft_bounce"
    BLOCK = "block"
    SPAM = "spam"
    UNSUBSCRIBE = "unsubscribe"
    AUTO_REPLY = "auto_reply"
    MAILBOX_FULL = "mailbox_full"
    INVALID_RECIPIENT = "invalid_recipient"
    QUOTA_EXCEEDED = "quota_exceeded"
    TECHNICAL_FAILURE = "technical_failure"


class BounceCategory(Enum):
    """Bounce processing categories"""

    PERMANENT = "permanent"  # Never retry
    TEMPORARY = "temporary"  # Retry after delay
    REPUTATION = "reputation"  # Domain/IP reputation issue
    POLICY = "policy"  # Policy-based rejection


@dataclass
class BounceAnalysis:
    """Result of bounce analysis"""

    bounce_type: BounceType
    category: BounceCategory
    reason: str
    should_suppress: bool
    should_retry: bool
    retry_after: timedelta | None = None
    confidence: float = 0.0


class BouncePatternMatcher:
    """Pattern matching for bounce categorization"""

    def __init__(self):
        self.patterns = {
            BounceType.HARD_BOUNCE: [
                r"user unknown|recipient unknown|no such user|invalid recipient",
                r"mailbox unavailable|account disabled|account closed",
                r"address rejected|recipient address rejected",
                r"550.*user.*not.*found|550.*invalid.*recipient",
            ],
            BounceType.SOFT_BOUNCE: [
                r"temporary failure|try again later|service unavailable",
                r"451.*temporarily.*rejected|452.*insufficient.*storage",
                r"421.*service.*unavailable|422.*recipient.*mailbox.*full",
            ],
            BounceType.MAILBOX_FULL: [
                r"mailbox full|quota exceeded|over quota|insufficient storage",
                r"552.*mailbox.*full|452.*mailbox.*full",
            ],
            BounceType.BLOCK: [
                r"blocked|blacklisted|reputation|sender blocked",
                r"550.*blocked|554.*blocked|571.*blocked",
                r"spam.*detected|content.*rejected",
            ],
            BounceType.SPAM: [
                r"spam|bulk mail|unsolicited|junk mail",
                r"550.*spam|554.*spam|content.*filter",
            ],
            BounceType.AUTO_REPLY: [
                r"auto.*reply|out.*of.*office|vacation|away message",
                r"automatic.*reply|auto.*response",
            ],
        }

    def analyze_bounce(
        self, bounce_message: str, smtp_response: str = ""
    ) -> BounceAnalysis:
        """Analyze bounce message and categorize"""

        combined_text = f"{bounce_message} {smtp_response}".lower()

        # Check patterns for each bounce type
        for bounce_type, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, combined_text, re.IGNORECASE):
                    return self._create_analysis(
                        bounce_type, pattern, combined_text
                    )

        # Default to technical failure if no pattern matches
        return BounceAnalysis(
            bounce_type=BounceType.TECHNICAL_FAILURE,
            category=BounceCategory.TEMPORARY,
            reason="Unclassified bounce",
            should_suppress=False,
            should_retry=True,
            retry_after=timedelta(hours=1),
            confidence=0.3,
        )

    def _create_analysis(
        self, bounce_type: BounceType, pattern: str, text: str
    ) -> BounceAnalysis:
        """Create bounce analysis based on type"""

        # High confidence mappings
        analysis_map = {
            BounceType.HARD_BOUNCE: BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.PERMANENT,
                reason="Permanent delivery failure",
                should_suppress=True,
                should_retry=False,
                confidence=0.9,
            ),
            BounceType.SOFT_BOUNCE: BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.TEMPORARY,
                reason="Temporary delivery failure",
                should_suppress=False,
                should_retry=True,
                retry_after=timedelta(hours=2),
                confidence=0.8,
            ),
            BounceType.MAILBOX_FULL: BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.TEMPORARY,
                reason="Recipient mailbox full",
                should_suppress=False,
                should_retry=True,
                retry_after=timedelta(days=1),
                confidence=0.9,
            ),
            BounceType.BLOCK: BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.REPUTATION,
                reason="Sender blocked or reputation issue",
                should_suppress=True,
                should_retry=False,
                confidence=0.85,
            ),
            BounceType.SPAM: BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.POLICY,
                reason="Message flagged as spam",
                should_suppress=True,
                should_retry=False,
                confidence=0.8,
            ),
            BounceType.AUTO_REPLY: BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.TEMPORARY,
                reason="Automatic reply received",
                should_suppress=False,
                should_retry=False,
                confidence=0.95,
            ),
        }

        return analysis_map.get(
            bounce_type,
            BounceAnalysis(
                bounce_type=bounce_type,
                category=BounceCategory.TEMPORARY,
                reason="Unknown bounce type",
                should_suppress=False,
                should_retry=True,
                retry_after=timedelta(hours=1),
                confidence=0.5,
            ),
        )


class BounceHandler:
    """Main bounce handling service"""

    def __init__(self):
        self.pattern_matcher = BouncePatternMatcher()
        self.suppression_cache = {}

    async def process_bounce(
        self,
        email_address: str,
        bounce_message: str,
        smtp_response: str = "",
        campaign_id: str | None = None,
        user_id: str | None = None,
        db: AsyncSession = None,
    ) -> BounceAnalysis:
        """Process an email bounce"""

        if not db:
            async for session in get_db():
                db = session
                break

        try:
            # Analyze the bounce
            analysis = self.pattern_matcher.analyze_bounce(
                bounce_message, smtp_response
            )

            # Record the bounce in database
            bounce_record = EmailBounce(
                email_address=email_address,
                bounce_type=analysis.bounce_type.value,
                bounce_category=analysis.category.value,
                reason=analysis.reason,
                original_message=bounce_message,
                smtp_response=smtp_response,
                campaign_id=campaign_id,
                user_id=user_id,
                confidence_score=analysis.confidence,
                processed_at=datetime.utcnow(),
            )

            db.add(bounce_record)

            # Handle suppression if needed
            if analysis.should_suppress:
                await self._add_to_suppression_list(
                    email_address, analysis.bounce_type, analysis.reason, db
                )

            # Update deliverability stats
            await self._update_deliverability_stats(
                email_address, analysis, db
            )

            await db.commit()

            logger.info(
                f"Processed bounce for {email_address}: {analysis.bounce_type.value}"
            )
            return analysis

        except Exception as e:
            logger.error(f"Error processing bounce for {email_address}: {e}")
            await db.rollback()
            raise

    async def _add_to_suppression_list(
        self,
        email_address: str,
        bounce_type: BounceType,
        reason: str,
        db: AsyncSession,
    ):
        """Add email to suppression list"""

        # Check if already suppressed
        existing = await db.execute(
            select(SuppressionList).where(
                SuppressionList.email_address == email_address,
                SuppressionList.is_active == True,
            )
        )

        if existing.scalar_one_or_none():
            return  # Already suppressed

        # Add to suppression list
        suppression = SuppressionList(
            email_address=email_address,
            suppression_type=bounce_type.value,
            reason=reason,
            added_at=datetime.utcnow(),
            is_active=True,
        )

        db.add(suppression)

        # Update cache
        self.suppression_cache[email_address] = True

        logger.info(f"Added {email_address} to suppression list: {reason}")

    async def _update_deliverability_stats(
        self, email_address: str, analysis: BounceAnalysis, db: AsyncSession
    ):
        """Update deliverability statistics"""

        domain = (
            email_address.split("@")[1] if "@" in email_address else "unknown"
        )

        # Get or create stats record
        stats = await db.execute(
            select(DeliverabilityStats).where(
                DeliverabilityStats.domain == domain
            )
        )

        stats_record = stats.scalar_one_or_none()

        if not stats_record:
            stats_record = DeliverabilityStats(
                domain=domain,
                total_sent=0,
                total_bounced=0,
                hard_bounces=0,
                soft_bounces=0,
                reputation_issues=0,
                last_updated=datetime.utcnow(),
            )
            db.add(stats_record)

        # Update counts
        stats_record.total_bounced += 1

        if analysis.category == BounceCategory.PERMANENT:
            stats_record.hard_bounces += 1
        elif analysis.category == BounceCategory.TEMPORARY:
            stats_record.soft_bounces += 1
        elif analysis.category == BounceCategory.REPUTATION:
            stats_record.reputation_issues += 1

        stats_record.last_updated = datetime.utcnow()

    async def is_suppressed(
        self, email_address: str, db: AsyncSession = None
    ) -> bool:
        """Check if email address is suppressed"""

        # Check cache first
        if email_address in self.suppression_cache:
            return self.suppression_cache[email_address]

        if not db:
            async for session in get_db():
                db = session
                break

        # Check database
        result = await db.execute(
            select(SuppressionList).where(
                SuppressionList.email_address == email_address,
                SuppressionList.is_active == True,
            )
        )

        is_suppressed = result.scalar_one_or_none() is not None

        # Update cache
        self.suppression_cache[email_address] = is_suppressed

        return is_suppressed

    async def get_bounce_statistics(
        self,
        domain: str | None = None,
        days: int = 30,
        db: AsyncSession = None,
    ) -> dict[str, Any]:
        """Get bounce statistics"""

        if not db:
            async for session in get_db():
                db = session
                break

        since_date = datetime.utcnow() - timedelta(days=days)

        query = select(EmailBounce).where(EmailBounce.created_at >= since_date)

        if domain:
            query = query.where(EmailBounce.email_address.like(f"%@{domain}"))

        bounces = await db.execute(query)
        bounce_list = bounces.scalars().all()

        # Calculate statistics
        total_bounces = len(bounce_list)
        bounce_types = {}
        bounce_categories = {}

        for bounce in bounce_list:
            bounce_types[bounce.bounce_type] = (
                bounce_types.get(bounce.bounce_type, 0) + 1
            )
            bounce_categories[bounce.bounce_category] = (
                bounce_categories.get(bounce.bounce_category, 0) + 1
            )

        return {
            "total_bounces": total_bounces,
            "bounce_types": bounce_types,
            "bounce_categories": bounce_categories,
            "period_days": days,
            "domain": domain,
        }

    async def remove_from_suppression(
        self,
        email_address: str,
        reason: str = "Manual removal",
        db: AsyncSession = None,
    ) -> bool:
        """Remove email from suppression list"""

        if not db:
            async for session in get_db():
                db = session
                break

        try:
            # Update suppression record
            await db.execute(
                update(SuppressionList)
                .where(
                    SuppressionList.email_address == email_address,
                    SuppressionList.is_active == True,
                )
                .values(
                    is_active=False,
                    removed_at=datetime.utcnow(),
                    removal_reason=reason,
                )
            )

            await db.commit()

            # Update cache
            self.suppression_cache[email_address] = False

            logger.info(
                f"Removed {email_address} from suppression list: {reason}"
            )
            return True

        except Exception as e:
            logger.error(
                f"Error removing {email_address} from suppression: {e}"
            )
            await db.rollback()
            return False


# Global bounce handler instance
bounce_handler = BounceHandler()


# Utility functions for easy access
async def process_bounce(
    email_address: str, bounce_message: str, **kwargs
) -> BounceAnalysis:
    """Process a bounce message"""
    return await bounce_handler.process_bounce(
        email_address, bounce_message, **kwargs
    )


async def is_email_suppressed(email_address: str) -> bool:
    """Check if email is suppressed"""
    return await bounce_handler.is_suppressed(email_address)


async def get_bounce_stats(
    domain: str | None = None, days: int = 30
) -> dict[str, Any]:
    """Get bounce statistics"""
    return await bounce_handler.get_bounce_statistics(domain, days)
