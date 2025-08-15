"""
MailerSuite API Routers
Note: Many individual routers have been consolidated into unified routers.
Archived routers are in _archived_consolidated/ directory.
"""

# Import only active routers (not archived ones)
from . import admin_panel_bridge  # Bridge router for AdminPanel
from . import ai  # Unified AI router
from . import analytics  # ✅ Phase 3 Enterprise - ENABLED
from . import auth
from . import automation
# from . import blacklist  # ARCHIVED - consolidated into unified_infrastructure_router
from . import bootstrap  # Bootstrap for fast frontend init
# from . import bulk_checker  # ARCHIVED - consolidated into unified_email_operations_router
# from . import bulk_mail  # ARCHIVED - consolidated into unified_email_operations_router
from . import campaigns_endpoints  # Campaign endpoints
from . import chat
# from . import check_monitor  # ARCHIVED - consolidated into unified_email_operations_router
# from . import compose  # ARCHIVED - consolidated into unified_email_operations_router
from . import core
from . import dashboard
from . import debug
# from . import domain_checker  # ARCHIVED - consolidated into unified_infrastructure_router
# from . import domains  # ARCHIVED - consolidated into unified_infrastructure_router
# from . import email_check  # ARCHIVED - consolidated into unified_email_operations_router
from . import handshake
# from . import health  # ARCHIVED - consolidated into unified_health_router
from . import imap  # ✅ ACTIVE - workspace-based endpoints
# from . import imap_checker  # ARCHIVED - consolidated into unified_imap_router
# from . import imap_client  # ARCHIVED - consolidated into unified_imap_router
# from . import imap_discovery  # ARCHIVED - consolidated into unified_imap_router
# from . import imap_manager  # ARCHIVED - consolidated into unified_imap_router
# from . import imap_metrics  # ARCHIVED - consolidated into unified_imap_router
# from . import inbox_check  # ARCHIVED - consolidated into unified_email_operations_router
from . import jobs
from . import landing
from . import leads
from . import licenses
# from . import mailing  # ARCHIVED - consolidated into unified_email_operations_router
# from . import materials  # ARCHIVED - consolidated into unified_email_operations_router
from . import metrics  # Re-enabled
from . import performance
from . import plans
from . import process_metrics
from . import processes
# from . import proxies  # ARCHIVED - consolidated into unified_infrastructure_router
# from . import proxy_checker  # ARCHIVED - consolidated into unified_infrastructure_router
from . import security
# from . import sessions  # REMOVED - functionality consolidated into workspaces
from . import smtp  # ✅ ACTIVE - workspace-based endpoints
# from . import smtp_checker  # ARCHIVED - consolidated into unified_smtp_router
# from . import smtp_discovery  # ARCHIVED - consolidated into unified_smtp_router
# from . import smtp_metrics  # ARCHIVED - consolidated into unified_smtp_router
# from . import smtp_settings  # ARCHIVED - consolidated into unified_smtp_router
# from . import socks  # ARCHIVED - consolidated into unified_infrastructure_router
from . import stop_conditions
from . import system
from . import templates  # Re-enabled for unit tests
from . import thread_pools
from . import upload
from . import ws_compat
from . import api_keys
from . import subscription
from . import workspaces  # Workspaces (Session alias)

# Week 1 Critical Routers - RE-ENABLED
from . import websocket  # ✅ ENABLED - Real-time features
# from . import bounce_management  # ARCHIVED - consolidated into unified_email_operations_router
from . import plan_protection  # ✅ ENABLED - Access control

# Phase 2 Advanced Routers - ENABLED
# from . import deliverability  # ARCHIVED - consolidated into unified_email_operations_router
# from . import unsubscribe  # ARCHIVED - consolidated into unified_email_operations_router
from . import todos  # ✅ ENABLED - Task management
# Re-enabled - import structure issues resolved
from . import auth_2fa  # ✅ ENABLED - Two-factor authentication  
from . import system_smtp  # ✅ ENABLED - System SMTP configuration

# Phase 3 Advanced Integration Framework - ENABLED
from . import template_builder  # ✅ ENABLED - Visual email template builder
from . import webhooks  # ✅ ENABLED - Real-time event notifications

# All major routers now enabled - Full feature completeness achieved!

# Export only active routers (archived ones commented out)
__all__ = [
    "admin_panel_bridge",
    "ai",
    "analytics",  # ✅ Phase 3 Enterprise - ENABLED
    "auth",
    # "blacklist",  # ARCHIVED
    "bootstrap",
    # "bulk_mail",  # ARCHIVED
    "campaigns_endpoints",
    # "check_monitor",  # ARCHIVED
    # "compose",  # ARCHIVED
    "dashboard",
    # "domains",  # ARCHIVED
    # "email_check",  # ARCHIVED
    "handshake",
    # "health",  # ARCHIVED
    # "imap",  # ARCHIVED
    # "imap_checker",  # ARCHIVED
    # "imap_client",  # ARCHIVED
    # "imap_discovery",  # ARCHIVED
    # "imap_manager",  # ARCHIVED
    # "imap_metrics",  # ARCHIVED
    # "inbox_check",  # ARCHIVED
    "jobs",
    "landing",
    "leads",
    "licenses",
    # "mailing",  # ARCHIVED
    # "materials",  # ARCHIVED
    "metrics",
    "performance",
    "plans",
    "process_metrics",
    "processes",
    # "proxies",  # ARCHIVED
    # "proxy_checker",  # ARCHIVED
    "sessions",
    # "smtp",  # ARCHIVED
    # "smtp_checker",  # ARCHIVED
    # "smtp_discovery",  # ARCHIVED
    # "smtp_metrics",  # ARCHIVED
    # "smtp_settings",  # ARCHIVED
    # "socks",  # ARCHIVED
    "stop_conditions",
    "system",
    "templates",
    "thread_pools",
    "upload",
    "ws_compat",
    "api_keys",
    "subscription",
    "workspaces",
    # "bulk_checker",  # ARCHIVED
    # "domain_checker",  # ARCHIVED
    "core",
    "automation",
    "security",
    "debug",
    "chat",
    # Week 1 Critical - RE-ENABLED
    "websocket",
    # "bounce_management",  # ARCHIVED
    "plan_protection",
    # Phase 2 Advanced - ENABLED
    # "deliverability",  # ARCHIVED
    # "unsubscribe",  # ARCHIVED
    "todos",
    # Re-enabled routers
    "auth_2fa",
    "system_smtp",
    "template_builder",
    "webhooks",
]
