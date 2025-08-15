"""
Consolidated Routers Package

Lightweight package init to avoid importing heavy submodules at import time.
Routers should be imported explicitly where needed, e.g.:
    from routers.consolidated.unified_imap_router import router as unified_imap_router

This prevents optional dependencies in unrelated routers from breaking imports.
"""

__all__ = [
    # Legacy consolidated routers
    "auth_router",
    "email_router",
    "data_router",
    "admin_router",
    # New unified routers
    "unified_smtp_router",
    "unified_imap_router",
    "unified_admin_router",
    "unified_health_router",
]
