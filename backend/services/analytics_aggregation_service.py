"""
Analytics Aggregation Service for Enhanced Bulk Checker
Comprehensive data analysis, insight generation, and dashboard data preparation
"""

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import get_logger
from models.analytics import (
    BulkCheckJob,
    BulkCheckJobType,
    BulkCheckPerformanceSnapshot,
    JobStatus,
    PerformanceTrend,
    SessionInsight,
    SystemHealthInsight,
    calculate_performance_tier,
    generate_recommendations,
)
from models.base import ProxyServer
from services.error_classifier import ErrorClassifier

logger = get_logger(__name__)


class AnalyticsAggregationService:
    """Comprehensive analytics aggregation and insight generation service"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.error_classifier = ErrorClassifier()

    async def get_dashboard_data(
        self, session_id: str | None = None, time_period: str = "24h"
    ) -> dict[str, Any]:
        """
        Get comprehensive dashboard data for the analytics interface

        Args:
            session_id: Optional session filter
            time_period: Time period for analysis (1h, 24h, 7d, 30d)

        Returns:
            Dashboard data with all metrics and insights
        """
        # Calculate time range
        end_time = datetime.now()
        if time_period == "1h":
            start_time = end_time - timedelta(hours=1)
        elif time_period == "24h":
            start_time = end_time - timedelta(hours=24)
        elif time_period == "7d":
            start_time = end_time - timedelta(days=7)
        elif time_period == "30d":
            start_time = end_time - timedelta(days=30)
        else:
            start_time = end_time - timedelta(hours=24)

        # Gather all dashboard components
        overview_stats = await self._get_overview_statistics(
            start_time, end_time, session_id
        )
        performance_trends = await self._get_performance_trends(
            start_time, end_time, session_id
        )
        session_insights = await self._get_session_insights(
            start_time, end_time, session_id
        )
        error_analysis = await self._get_error_analysis(
            start_time, end_time, session_id
        )
        proxy_health = await self._get_proxy_health_metrics(
            start_time, end_time
        )
        system_health = await self._get_system_health_insight(
            start_time, end_time
        )
        top_performers = await self._get_top_performing_sessions(
            start_time, end_time
        )
        recommendations = await self._generate_dashboard_recommendations(
            start_time, end_time, session_id
        )

        return {
            "time_period": time_period,
            "data_range": {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
            },
            "overview": overview_stats,
            "performance_trends": performance_trends,
            "session_insights": session_insights,
            "error_analysis": error_analysis,
            "proxy_health": proxy_health,
            "system_health": system_health,
            "top_performers": top_performers,
            "recommendations": recommendations,
            "last_updated": datetime.now().isoformat(),
        }

    async def _get_overview_statistics(
        self,
        start_time: datetime,
        end_time: datetime,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        """Get overview statistics for the dashboard"""

        # Base query conditions
        conditions = [
            BulkCheckJob.created_at >= start_time,
            BulkCheckJob.created_at <= end_time,
        ]
        if session_id:
            conditions.append(BulkCheckJob.session_id == session_id)

        # Total jobs and basic metrics
        result = await self.db.execute(
            select(
                func.count(BulkCheckJob.id).label("total_jobs"),
                func.sum(BulkCheckJob.total_combos).label("total_checks"),
                func.sum(BulkCheckJob.valid_count).label("total_valid"),
                func.sum(BulkCheckJob.invalid_count).label("total_invalid"),
                func.sum(BulkCheckJob.error_count).label("total_errors"),
                func.avg(BulkCheckJob.success_rate).label("avg_success_rate"),
                func.avg(BulkCheckJob.average_speed).label("avg_speed"),
            ).where(and_(*conditions))
        )
        stats = result.first()

        # Jobs by type
        smtp_result = await self.db.execute(
            select(
                func.count(BulkCheckJob.id).label("smtp_jobs"),
                func.sum(BulkCheckJob.total_combos).label("smtp_checks"),
                func.avg(BulkCheckJob.success_rate).label("smtp_success_rate"),
            ).where(
                and_(
                    BulkCheckJob.job_type == BulkCheckJobType.SMTP.value,
                    *conditions,
                )
            )
        )
        smtp_stats = smtp_result.first()

        imap_result = await self.db.execute(
            select(
                func.count(BulkCheckJob.id).label("imap_jobs"),
                func.sum(BulkCheckJob.total_combos).label("imap_checks"),
                func.avg(BulkCheckJob.success_rate).label("imap_success_rate"),
            ).where(
                and_(
                    BulkCheckJob.job_type == BulkCheckJobType.IMAP.value,
                    *conditions,
                )
            )
        )
        imap_stats = imap_result.first()

        # Performance tier distribution
        tier_result = await self.db.execute(
            select(
                BulkCheckJob.performance_tier,
                func.count(BulkCheckJob.id).label("count"),
            )
            .where(and_(*conditions))
            .group_by(BulkCheckJob.performance_tier)
        )
        tier_distribution = {
            row.performance_tier or "unknown": row.count for row in tier_result
        }

        return {
            "total_jobs": stats.total_jobs or 0,
            "total_checks": stats.total_checks or 0,
            "total_valid": stats.total_valid or 0,
            "total_invalid": stats.total_invalid or 0,
            "total_errors": stats.total_errors or 0,
            "overall_success_rate": round(stats.avg_success_rate or 0, 2),
            "overall_speed": round(stats.avg_speed or 0, 2),
            "smtp": {
                "jobs": smtp_stats.smtp_jobs or 0,
                "checks": smtp_stats.smtp_checks or 0,
                "success_rate": round(smtp_stats.smtp_success_rate or 0, 2),
            },
            "imap": {
                "jobs": imap_stats.imap_jobs or 0,
                "checks": imap_stats.imap_checks or 0,
                "success_rate": round(imap_stats.imap_success_rate or 0, 2),
            },
            "performance_distribution": tier_distribution,
        }

    async def _get_performance_trends(
        self,
        start_time: datetime,
        end_time: datetime,
        session_id: str | None = None,
    ) -> list[PerformanceTrend]:
        """Get performance trends over time"""

        # Get jobs grouped by hour for trending
        time_bucket = func.date_trunc("hour", BulkCheckJob.created_at)

        conditions = [
            BulkCheckJob.created_at >= start_time,
            BulkCheckJob.created_at <= end_time,
            BulkCheckJob.status == JobStatus.COMPLETED.value,
        ]
        if session_id:
            conditions.append(BulkCheckJob.session_id == session_id)

        result = await self.db.execute(
            select(
                time_bucket.label("time_bucket"),
                func.avg(BulkCheckJob.success_rate).label("avg_success_rate"),
                func.avg(BulkCheckJob.average_speed).label("avg_throughput"),
                func.avg(
                    BulkCheckJob.total_errors / BulkCheckJob.total_combos * 100
                ).label("avg_error_rate"),
                func.count(BulkCheckJob.id).label("active_jobs"),
            )
            .where(and_(*conditions))
            .group_by(time_bucket)
            .order_by(time_bucket)
        )

        trends = []
        for row in result:
            trends.append(
                PerformanceTrend(
                    timestamp=row.time_bucket,
                    success_rate=round(row.avg_success_rate or 0, 2),
                    throughput=round(row.avg_throughput or 0, 2),
                    error_rate=round(row.avg_error_rate or 0, 2),
                    active_jobs=row.active_jobs or 0,
                )
            )

        return trends

    async def _get_session_insights(
        self,
        start_time: datetime,
        end_time: datetime,
        session_id: str | None = None,
    ) -> list[SessionInsight]:
        """Get insights for individual sessions"""

        conditions = [
            BulkCheckJob.created_at >= start_time,
            BulkCheckJob.created_at <= end_time,
        ]
        if session_id:
            conditions.append(BulkCheckJob.session_id == session_id)

        # Get session summary data
        result = await self.db.execute(
            select(
                BulkCheckJob.session_id,
                func.count(BulkCheckJob.id).label("total_jobs"),
                func.sum(BulkCheckJob.total_combos).label("total_checks"),
                func.avg(BulkCheckJob.success_rate).label("avg_success_rate"),
                func.avg(BulkCheckJob.average_speed).label("avg_speed"),
                func.avg(
                    BulkCheckJob.total_errors / BulkCheckJob.total_combos * 100
                ).label("avg_error_rate"),
            )
            .where(and_(*conditions))
            .group_by(BulkCheckJob.session_id)
        )

        insights = []
        for row in result:
            # Calculate performance tier
            tier = calculate_performance_tier(
                row.avg_success_rate or 0, row.avg_speed or 0
            )

            # Generate recommendations
            recommendations = generate_recommendations(
                {
                    "success_rate": row.avg_success_rate or 0,
                    "error_rate": row.avg_error_rate or 0,
                    "speed": row.avg_speed or 0,
                }
            )

            # Get trends for this session
            session_trends = await self._get_performance_trends(
                start_time, end_time, row.session_id
            )

            insights.append(
                SessionInsight(
                    session_id=row.session_id,
                    performance_tier=tier,
                    total_checks=row.total_checks or 0,
                    success_rate=round(row.avg_success_rate or 0, 2),
                    recommendations=recommendations,
                    trends=session_trends,
                )
            )

        return insights

    async def _get_error_analysis(
        self,
        start_time: datetime,
        end_time: datetime,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        """Get comprehensive error analysis"""

        conditions = [
            BulkCheckJob.created_at >= start_time,
            BulkCheckJob.created_at <= end_time,
        ]
        if session_id:
            conditions.append(BulkCheckJob.session_id == session_id)

        # Get error breakdown
        result = await self.db.execute(
            select(
                func.sum(BulkCheckJob.auth_errors).label("auth_errors"),
                func.sum(BulkCheckJob.connection_errors).label(
                    "connection_errors"
                ),
                func.sum(BulkCheckJob.timeout_errors).label("timeout_errors"),
                func.sum(BulkCheckJob.proxy_errors).label("proxy_errors"),
                func.sum(BulkCheckJob.total_errors).label("total_errors"),
            ).where(and_(*conditions))
        )
        error_stats = result.first()

        # Get error patterns from recent jobs
        recent_jobs = await self.db.execute(
            select(BulkCheckJob.error_samples)
            .where(and_(*conditions, BulkCheckJob.error_samples.isnot(None)))
            .limit(10)
        )

        # Aggregate error patterns
        error_patterns = {}
        for job in recent_jobs:
            if job.error_samples:
                for error in job.error_samples:
                    category = error.get("category", "unknown")
                    error_patterns[category] = (
                        error_patterns.get(category, 0) + 1
                    )

        return {
            "total_errors": error_stats.total_errors or 0,
            "error_breakdown": {
                "authentication": error_stats.auth_errors or 0,
                "connection": error_stats.connection_errors or 0,
                "timeout": error_stats.timeout_errors or 0,
                "proxy": error_stats.proxy_errors or 0,
            },
            "error_patterns": error_patterns,
            "top_error_categories": sorted(
                [
                    {"category": k, "count": v}
                    for k, v in error_patterns.items()
                ],
                key=lambda x: x["count"],
                reverse=True,
            )[:5],
        }

    async def _get_proxy_health_metrics(
        self, start_time: datetime, end_time: datetime
    ) -> dict[str, Any]:
        """Get proxy health and performance metrics"""

        # Get proxy usage from jobs
        proxy_usage_result = await self.db.execute(
            select(
                func.count(BulkCheckJob.id).label("jobs_with_proxy"),
                func.avg(BulkCheckJob.proxy_success_rate).label(
                    "avg_proxy_success_rate"
                ),
            ).where(
                and_(
                    BulkCheckJob.created_at >= start_time,
                    BulkCheckJob.created_at <= end_time,
                    BulkCheckJob.proxy_enabled == True,
                )
            )
        )
        proxy_stats = proxy_usage_result.first()

        # Get active proxy count
        active_proxies_result = await self.db.execute(
            select(func.count(ProxyServer.id)).where(
                and_(
                    ProxyServer.is_active == True,
                    ProxyServer.status == "valid",
                )
            )
        )
        active_proxies = active_proxies_result.scalar() or 0

        return {
            "active_proxies": active_proxies,
            "jobs_using_proxies": proxy_stats.jobs_with_proxy or 0,
            "average_proxy_success_rate": round(
                proxy_stats.avg_proxy_success_rate or 0, 2
            ),
            "proxy_health": "healthy" if active_proxies > 0 else "warning",
        }

    async def _get_system_health_insight(
        self, start_time: datetime, end_time: datetime
    ) -> SystemHealthInsight:
        """Generate overall system health insight"""

        # Get recent performance data
        recent_jobs = await self.db.execute(
            select(
                func.avg(BulkCheckJob.success_rate).label("avg_success_rate"),
                func.avg(BulkCheckJob.average_speed).label("avg_speed"),
                func.count(BulkCheckJob.id).label("total_jobs"),
            ).where(
                and_(
                    BulkCheckJob.created_at >= start_time,
                    BulkCheckJob.created_at <= end_time,
                    BulkCheckJob.status == JobStatus.COMPLETED.value,
                )
            )
        )
        performance = recent_jobs.first()

        # Calculate health status
        success_rate = performance.avg_success_rate or 0
        speed = performance.avg_speed or 0
        total_jobs = performance.total_jobs or 0

        if success_rate >= 70 and speed >= 20 and total_jobs > 0:
            overall_health = "healthy"
        elif success_rate >= 50 and speed >= 10:
            overall_health = "warning"
        else:
            overall_health = "critical"

        # Get trends
        success_rate_trend = await self._calculate_trend(
            "success_rate", start_time, end_time
        )
        throughput_trend = await self._calculate_trend(
            "throughput", start_time, end_time
        )

        # Get error analysis
        error_analysis = await self._get_error_analysis(start_time, end_time)
        proxy_health = await self._get_proxy_health_metrics(
            start_time, end_time
        )

        # Generate system-level recommendations
        recommendations = []
        if success_rate < 60:
            recommendations.append(
                "System-wide success rate is below optimal levels"
            )
        if speed < 15:
            recommendations.append(
                "System throughput is below recommended levels"
            )
        if proxy_health["active_proxies"] < 5:
            recommendations.append(
                "Consider adding more proxy servers for better performance"
            )

        return SystemHealthInsight(
            overall_health=overall_health,
            success_rate_trend=success_rate_trend,
            throughput_trend=throughput_trend,
            top_error_categories=error_analysis["top_error_categories"],
            proxy_health=proxy_health,
            recommendations=recommendations,
        )

    async def _calculate_trend(
        self, metric: str, start_time: datetime, end_time: datetime
    ) -> str:
        """Calculate trend direction for a metric"""

        # Split time period in half
        mid_time = start_time + (end_time - start_time) / 2

        # Get first half average
        if metric == "success_rate":
            field = BulkCheckJob.success_rate
        else:  # throughput
            field = BulkCheckJob.average_speed

        first_half = await self.db.execute(
            select(func.avg(field)).where(
                and_(
                    BulkCheckJob.created_at >= start_time,
                    BulkCheckJob.created_at < mid_time,
                    BulkCheckJob.status == JobStatus.COMPLETED.value,
                )
            )
        )
        first_avg = first_half.scalar() or 0

        second_half = await self.db.execute(
            select(func.avg(field)).where(
                and_(
                    BulkCheckJob.created_at >= mid_time,
                    BulkCheckJob.created_at <= end_time,
                    BulkCheckJob.status == JobStatus.COMPLETED.value,
                )
            )
        )
        second_avg = second_half.scalar() or 0

        # Calculate trend
        if second_avg > first_avg * 1.05:  # 5% improvement
            return "improving"
        elif second_avg < first_avg * 0.95:  # 5% decline
            return "declining"
        else:
            return "stable"

    async def _get_top_performing_sessions(
        self, start_time: datetime, end_time: datetime
    ) -> list[dict[str, Any]]:
        """Get top performing sessions"""

        result = await self.db.execute(
            select(
                BulkCheckJob.session_id,
                func.avg(BulkCheckJob.success_rate).label("avg_success_rate"),
                func.avg(BulkCheckJob.average_speed).label("avg_speed"),
                func.sum(BulkCheckJob.total_combos).label("total_checks"),
                func.count(BulkCheckJob.id).label("total_jobs"),
            )
            .where(
                and_(
                    BulkCheckJob.created_at >= start_time,
                    BulkCheckJob.created_at <= end_time,
                    BulkCheckJob.status == JobStatus.COMPLETED.value,
                )
            )
            .group_by(BulkCheckJob.session_id)
            .order_by(desc("avg_success_rate"), desc("avg_speed"))
            .limit(10)
        )

        top_performers = []
        for row in result:
            tier = calculate_performance_tier(
                row.avg_success_rate or 0, row.avg_speed or 0
            )
            top_performers.append(
                {
                    "session_id": row.session_id,
                    "success_rate": round(row.avg_success_rate or 0, 2),
                    "speed": round(row.avg_speed or 0, 2),
                    "total_checks": row.total_checks or 0,
                    "total_jobs": row.total_jobs or 0,
                    "performance_tier": tier.value,
                }
            )

        return top_performers

    async def _generate_dashboard_recommendations(
        self,
        start_time: datetime,
        end_time: datetime,
        session_id: str | None = None,
    ) -> list[str]:
        """Generate recommendations for the dashboard"""

        recommendations = []

        # Get overview stats
        overview = await self._get_overview_statistics(
            start_time, end_time, session_id
        )
        error_analysis = await self._get_error_analysis(
            start_time, end_time, session_id
        )
        proxy_health = await self._get_proxy_health_metrics(
            start_time, end_time
        )

        # System-wide recommendations
        if overview["overall_success_rate"] < 60:
            recommendations.append(
                "📊 Overall success rate is below 60% - consider reviewing combo quality and proxy configuration"
            )

        if overview["overall_speed"] < 15:
            recommendations.append(
                "🚀 System throughput is below optimal - consider increasing thread counts or optimizing network settings"
            )

        if (
            error_analysis["error_breakdown"]["authentication"]
            / max(1, error_analysis["total_errors"])
            > 0.5
        ):
            recommendations.append(
                "🔐 High authentication failure rate detected - combo lists may need updating"
            )

        if (
            error_analysis["error_breakdown"]["proxy"]
            / max(1, error_analysis["total_errors"])
            > 0.3
        ):
            recommendations.append(
                "🌐 Proxy-related errors are high - consider updating proxy list or reducing concurrency"
            )

        if proxy_health["active_proxies"] < 5:
            recommendations.append(
                "⚠️ Low proxy count detected - add more SOCKS5 proxies for better performance"
            )

        # Performance distribution recommendations
        poor_jobs_pct = (
            overview["performance_distribution"].get("poor", 0)
            / max(1, overview["total_jobs"])
            * 100
        )
        if poor_jobs_pct > 30:
            recommendations.append(
                "📈 High percentage of poor-performing jobs - review system configuration and data quality"
            )

        return recommendations

    async def create_performance_snapshot(self, time_window: str = "1h"):
        """Create a performance snapshot for historical tracking"""

        end_time = datetime.now()
        if time_window == "1h":
            start_time = end_time - timedelta(hours=1)
        elif time_window == "24h":
            start_time = end_time - timedelta(hours=24)
        elif time_window == "7d":
            start_time = end_time - timedelta(days=7)
        else:
            start_time = end_time - timedelta(hours=1)

        # Get metrics for snapshot
        overview = await self._get_overview_statistics(start_time, end_time)
        error_analysis = await self._get_error_analysis(start_time, end_time)
        proxy_health = await self._get_proxy_health_metrics(
            start_time, end_time
        )

        # Calculate performance distribution
        tier_counts = overview["performance_distribution"]
        total_jobs = sum(tier_counts.values())

        if total_jobs > 0:
            excellent_pct = tier_counts.get("excellent", 0) / total_jobs * 100
            good_pct = tier_counts.get("good", 0) / total_jobs * 100
            fair_pct = tier_counts.get("fair", 0) / total_jobs * 100
            poor_pct = tier_counts.get("poor", 0) / total_jobs * 100
        else:
            excellent_pct = good_pct = fair_pct = poor_pct = 0

        # Create snapshot record
        snapshot = BulkCheckPerformanceSnapshot(
            snapshot_time=end_time,
            time_window=time_window,
            # SMTP metrics
            smtp_total_jobs=overview["smtp"]["jobs"],
            smtp_successful_jobs=overview["smtp"][
                "jobs"
            ],  # Assuming completed jobs are successful
            smtp_avg_success_rate=overview["smtp"]["success_rate"],
            smtp_total_checks=overview["smtp"]["checks"],
            # IMAP metrics
            imap_total_jobs=overview["imap"]["jobs"],
            imap_successful_jobs=overview["imap"]["jobs"],
            imap_avg_success_rate=overview["imap"]["success_rate"],
            imap_total_checks=overview["imap"]["checks"],
            # System metrics
            total_active_sessions=len(
                await self._get_session_insights(start_time, end_time)
            ),
            proxy_utilization_rate=proxy_health["average_proxy_success_rate"],
            # Error rates
            overall_error_rate=error_analysis["total_errors"]
            / max(1, overview["total_checks"])
            * 100,
            auth_error_rate=error_analysis["error_breakdown"]["authentication"]
            / max(1, overview["total_checks"])
            * 100,
            connection_error_rate=error_analysis["error_breakdown"][
                "connection"
            ]
            / max(1, overview["total_checks"])
            * 100,
            proxy_error_rate=error_analysis["error_breakdown"]["proxy"]
            / max(1, overview["total_checks"])
            * 100,
            # Performance distribution
            excellent_jobs_pct=excellent_pct,
            good_jobs_pct=good_pct,
            fair_jobs_pct=fair_pct,
            poor_jobs_pct=poor_pct,
        )

        self.db.add(snapshot)
        await self.db.commit()

        logger.info(
            f"Created performance snapshot for time window: {time_window}"
        )

    async def cleanup_old_data(self, retention_days: int = 90):
        """Clean up old analytics data beyond retention period"""
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        # Clean up old jobs
        await self.db.execute(
            BulkCheckJob.__table__.delete().where(
                BulkCheckJob.created_at < cutoff_date
            )
        )

        # Clean up old snapshots
        await self.db.execute(
            BulkCheckPerformanceSnapshot.__table__.delete().where(
                BulkCheckPerformanceSnapshot.created_at < cutoff_date
            )
        )

        await self.db.commit()
        logger.info(
            f"Cleaned up analytics data older than {retention_days} days"
        )
