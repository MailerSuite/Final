import json
import logging
import sys
from datetime import datetime

import sqlalchemy as sa


def get_json_logger(name: str) -> logging.Logger:
    """Return a logger that outputs JSON formatted records."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    handler = logging.StreamHandler(sys.stdout)

    class JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            payload = {
                "time": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "name": record.name,
                "message": record.getMessage(),
            }
            if isinstance(record.args, dict):
                payload.update(record.args)
            return json.dumps(payload)

    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


import os
from typing import Any


async def log_check_result(
    db,
    *,
    check_type: str,
    input_params: dict,
    status: str,
    response: Any | None = None,
    error: str | None = None,
    duration: float | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
) -> None:
    if os.getenv("LOG_CHECK_RESULTS", "false").lower() != "true":
        return
    await db.execute(
        "\n        INSERT INTO check_logs (check_type, input_params, status, response, error_message, duration_ms, checked_at, user_id, session_id)\n        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8)\n        ",
        check_type,
        json.dumps(input_params),
        status,
        json.dumps(response) if response is not None else None,
        error,
        duration * 1000 if duration is not None else None,
        user_id,
        session_id,
    )


def log_check_result_sync(
    session,
    *,
    check_type: str,
    input_params: dict,
    status: str,
    response: Any | None = None,
    error: str | None = None,
    duration: float | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
) -> None:
    if os.getenv("LOG_CHECK_RESULTS", "false").lower() != "true":
        return
    session.execute(
        sa.text(
            "\n        INSERT INTO check_logs (check_type, input_params, status, response, error_message, duration_ms, checked_at, user_id, session_id)\n        VALUES (:check_type, :input_params, :status, :response, :error_message, :duration_ms, :checked_at, :user_id, :session_id)\n        "
        ),
        {
            "check_type": check_type,
            "input_params": input_params,
            "status": status,
            "response": response,
            "error_message": error,
            "duration_ms": duration * 1000 if duration is not None else None,
            "checked_at": datetime.utcnow(),
            "user_id": user_id,
            "session_id": session_id,
        },
    )
    session.commit()
