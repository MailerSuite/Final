# Compatibility shim for tests expecting `app.core.database`
from core.database import get_db, async_session, engine, Base  # type: ignore
