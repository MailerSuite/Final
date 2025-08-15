import logging
import time
import traceback
import uuid

from fastapi import Request

logger = logging.getLogger("extended_debug")


async def log_request(request: Request, call_next):
    trace_id = uuid.uuid4().hex
    start = time.perf_counter()

    try:
        response = await call_next(request)
        duration = (time.perf_counter() - start) * 1000

        logger.info(
            "CURSOR:DEBUG: %s",
            {
                "trace_id": trace_id,
                "path": request.url.path,
                "method": request.method,
                "status": response.status_code,
                "duration_ms": round(duration, 2),
            },
        )
        response.headers["X-Trace-Id"] = trace_id
        return response
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        logger.error(
            "CURSOR:DEBUG: REQUEST_ERROR: %s",
            {
                "trace_id": trace_id,
                "path": request.url.path,
                "method": request.method,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "duration_ms": round(duration, 2),
            },
        )
        raise
