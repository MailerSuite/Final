import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy import create_engine

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import with fallback handling
try:
    from config.settings import settings
    database_url = getattr(settings, 'SYNC_DATABASE_URL', None)
except ImportError:
    database_url = os.getenv(
        'DATABASE_URL', 
        'postgresql://postgres:postgres@localhost:5432/sgpt_dev'
    )

try:
    from models.base import Base
    target_metadata = Base.metadata
except ImportError:
    # Fallback if models can't be imported
    target_metadata = None

config = context.config

# Override with environment variable if available
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

fileConfig(config.config_file_name)


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
