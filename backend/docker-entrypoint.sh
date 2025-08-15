#!/usr/bin/env bash
set -euo pipefail

cd /app

# Load production environment if available
if [ -f "/app/env.production" ]; then
	set -a
	. /app/env.production
	set +a
fi

# Helper to parse host and port from URL using Python
parse_host_port() {
	python3 - "$1" <<'PY'
import sys, urllib.parse
url = sys.argv[1]
if not url:
	print(" ")
	sys.exit(0)
parsed = urllib.parse.urlparse(url)
host = parsed.hostname or ""
port = parsed.port or (5432 if parsed.scheme.startswith('postgres') else 6379)
print(f"{host} {port}")
PY
}

# Wait for Postgres if DATABASE_URL is provided
if [ "${DATABASE_URL:-}" != "" ]; then
	read DB_HOST DB_PORT < <(parse_host_port "$DATABASE_URL")
	if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
		echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
		until nc -z "$DB_HOST" "$DB_PORT"; do
			sleep 2
			echo "... still waiting for PostgreSQL"
		done
		echo "PostgreSQL is up"
	fi
fi

# Wait for Redis if REDIS_URL is provided
if [ "${REDIS_URL:-}" != "" ]; then
	read RD_HOST RD_PORT < <(parse_host_port "$REDIS_URL")
	if [ -n "$RD_HOST" ] && [ -n "$RD_PORT" ]; then
		echo "Waiting for Redis at $RD_HOST:$RD_PORT..."
		until nc -z "$RD_HOST" "$RD_PORT"; do
			sleep 2
			echo "... still waiting for Redis"
		done
		echo "Redis is up"
	fi
fi

# Run database migrations (alembic)
echo "Running Alembic migrations..."
# Prefer SYNC_DATABASE_URL if provided to avoid async driver issues with Alembic
if [ -n "${SYNC_DATABASE_URL:-}" ]; then
	extra_env="-x sqlalchemy.url=$SYNC_DATABASE_URL"
else
	extra_env=""
fi
python3 -m alembic upgrade head $extra_env

echo "Starting Uvicorn..."
exec python3 -m uvicorn app.main:app \
	--host "${HOST:-0.0.0.0}" \
	--port "${PORT:-8000}" \
	--workers "${WORKERS:-4}" \
	--log-level "${LOG_LEVEL:-info}"