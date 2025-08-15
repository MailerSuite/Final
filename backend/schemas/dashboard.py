"""
📊 Dashboard Schemas
Schemas describing dashboard metrics. (📊 Dashboard Schemas)
"""


from pydantic import BaseModel, Field


class ConnectionStatus(BaseModel):
    status: str = Field(..., description="Connection status")
    total_connections: int = Field(..., description="Total connections")
    active_connections: int = Field(..., description="Active connections")
    smtp: dict[str, int] = Field(..., description="SMTP stats")
    imap: dict[str, int] = Field(..., description="IMAP stats")
    proxies: dict[str, int] = Field(..., description="Proxy stats")
    last_sync: str = Field(..., description="Last sync time")


class EmailStatistics(BaseModel):
    total_emails: int = Field(..., description="Total emails sent")
    messages_synced: int = Field(..., description="Messages synced")
    campaigns: dict[str, int] = Field(..., description="Campaign stats")
    leads: dict[str, int] = Field(..., description="Lead stats")
    delivery_rate: float = Field(..., description="Delivery rate")
    open_rate: float = Field(..., description="Open rate")


class StorageUsage(BaseModel):
    used: str = Field(..., description="Used storage")
    total: str = Field(..., description="Total storage")
    available: str = Field(..., description="Available storage")
    usage_percent: float = Field(..., description="Usage percentage")
    templates_count: int = Field(..., description="Number of templates")
    status: str = Field(..., description="Storage status")


class PerformanceStats(BaseModel):
    response_time: str = Field(..., description="Response time")
    average_latency: str = Field(..., description="Average latency")
    database_performance: str = Field(..., description="Database performance")
    campaign_avg_duration: str = Field(
        ..., description="Campaign average duration"
    )


class RecentActivity(BaseModel):
    type: str = Field(..., description="Activity type")
    title: str = Field(..., description="Activity title")
    status: str = Field(..., description="Activity status")
    created_at: str = Field(..., description="Creation time")


class DashboardOverview(BaseModel):
    connection_status: ConnectionStatus
    email_statistics: EmailStatistics
    storage_usage: StorageUsage
    performance_stats: PerformanceStats
    recent_activity: list[RecentActivity]


class SidebarCountsResponse(BaseModel):
    total_campaigns: int = Field(..., description="Total campaigns")
    active_campaigns: int = Field(..., description="Active campaigns")
    total_leads: int = Field(..., description="Total leads")
    total_templates: int = Field(..., description="Total templates")
    smtp_accounts: int = Field(..., description="SMTP accounts")
    imap_accounts: int = Field(..., description="IMAP accounts")
    proxy_count: int = Field(..., description="Proxy count")
    # Additional fields that are being returned by the service
    email_templates: int = Field(..., description="Email templates count")
    campaigns: int = Field(..., description="Campaigns count")
    proxy_servers: int = Field(..., description="Proxy servers count")
    lead_entries: int = Field(..., description="Lead entries count")
    leads: int = Field(..., description="Leads count")


class ServerPerformanceItem(BaseModel):
    name: str = Field(..., description="Server name")
    cpu_usage: float = Field(..., description="CPU usage percentage")
    memory_usage: float = Field(..., description="Memory usage percentage")
    disk_usage: float = Field(..., description="Disk usage percentage")
    network_io: dict[str, float] = Field(..., description="Network I/O stats")
    status: str = Field(..., description="Server status")
    last_updated: str = Field(..., description="Last update time")


class DashboardMetrics(BaseModel):
    overview: DashboardOverview
    server_performance: list[ServerPerformanceItem]
    counts: SidebarCountsResponse
