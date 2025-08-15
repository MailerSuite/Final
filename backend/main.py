"""
Thin wrapper to keep a single authoritative FastAPI app.
Delegates to `app.main:app` to avoid duplicate entrypoints.
"""

from app.main import app  # re-export the canonical app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    from config.settings import settings

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
    )
