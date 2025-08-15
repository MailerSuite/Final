"""
Compatibility WebSocket routes under /api/v1/ws/*

Bridges existing metrics streams to the nicer /ws namespace expected by frontend.
"""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from starlette.websockets import WebSocketState
from fastapi.responses import StreamingResponse

from core.logger import get_logger
from core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.base import CampaignEmail, Campaign, ProxyServer
from utils.metrics import IMAP_METRICS, SMTP_METRICS
from core.error_handlers import ErrorCodes
from uuid import uuid4
import time


router = APIRouter()
logger = get_logger(__name__)


async def _stream_metrics(websocket: WebSocket, gather_fn, interval_seconds: float = 5.0) -> None:
    """Generic metrics streaming loop sending JSON snapshots periodically with unified envelope."""
    await websocket.accept()

    async def _gen():
        try:
            while True:
                yield await gather_fn()
                await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            pass

    gen = _gen()
    try:
        async for metric in gen:
            await websocket.send_json({
                "type": "metrics",
                "data": metric,
                "timestamp": time.time(),
                "correlation_id": websocket.headers.get("x-correlation-id") or None,
            })
    except WebSocketDisconnect as exc:
        logger.info("WS compat disconnect code=%s", exc.code)
    except Exception as exc:  # noqa: BLE001
        logger.error("WS compat streaming error: %s", exc)
        if websocket.application_state == WebSocketState.CONNECTED:
            try:
                await websocket.send_json(
                    {
                        "type": "error",
                        "data": {
                            "code": ErrorCodes.INTERNAL_ERROR,
                            "message": "An unexpected error occurred while streaming metrics",
                            "errorId": f"err_{uuid4().hex[:12]}",
                        },
                        "timestamp": time.time(),
                        "correlation_id": websocket.headers.get("x-correlation-id") or None,
                    }
                )
                await websocket.close(code=1011)
            except Exception:  # noqa: BLE001
                pass
    else:
        if websocket.application_state == WebSocketState.CONNECTED:
            try:
                await websocket.send_json({
                    "type": "complete",
                    "timestamp": time.time(),
                    "correlation_id": websocket.headers.get("x-correlation-id") or None,
                })
                await websocket.close(code=1000)
            except Exception:  # noqa: BLE001
                pass
    finally:
        try:
            await gen.aclose()
        except Exception:  # noqa: BLE001
            pass


async def _gather_imap_metrics() -> dict:
    return IMAP_METRICS.to_dict()


async def _gather_smtp_metrics() -> dict:
    return SMTP_METRICS.to_dict()


@router.websocket("/imap/metrics")
async def ws_imap_metrics(websocket: WebSocket) -> None:
    """Compatibility path: /api/v1/ws/imap/metrics"""
    await _stream_metrics(websocket, _gather_imap_metrics, interval_seconds=5.0)


@router.websocket("/smtp/metrics")
async def ws_smtp_metrics(websocket: WebSocket) -> None:
    """Compatibility path: /api/v1/ws/smtp/metrics"""
    await _stream_metrics(websocket, _gather_smtp_metrics, interval_seconds=5.0)


@router.websocket("/campaigns/{campaign_id}/progress")
async def ws_campaign_progress(websocket: WebSocket, campaign_id: str, db: AsyncSession = Depends(get_db)) -> None:
    """Minimal campaign progress stream.

    Sends periodic snapshots: { type: 'progress', data: { sent, total, status, pct }, timestamp }
    """
    await websocket.accept()
    try:
        while True:
            # Load counters with cheap aggregations
            res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
            camp = res.scalar_one_or_none()
            if not camp:
                await websocket.send_json({"type": "error", "message": "campaign not found"})
                await websocket.close()
                return
            sent = getattr(camp, "sent_count", None) or getattr(camp, "sent_emails", 0) or 0
            total = getattr(camp, "total_recipients", 0) or getattr(camp, "total_emails", 0) or 0
            status = getattr(camp, "status", "unknown")
            pct = 0.0
            if total and sent:
                try:
                    pct = round(float(sent) / float(total) * 100.0, 2)
                except Exception:
                    pct = 0.0
            await websocket.send_json({
                "type": "progress",
                "data": {
                    "campaign_id": campaign_id,
                    "sent": int(sent),
                    "total": int(total),
                    "status": status,
                    "pct": pct,
                },
                "timestamp": time.time(),
                "correlation_id": websocket.headers.get("x-correlation-id") or None,
            })
            await asyncio.sleep(3.0)
    except WebSocketDisconnect:
        logger.info("WS campaign progress disconnect")
    except Exception as exc:
        logger.error("WS campaign progress error: %s", exc)
        try:
            await websocket.send_json({
                "type": "error",
                "data": {"message": "internal error"},
                "timestamp": time.time(),
                "correlation_id": websocket.headers.get("x-correlation-id") or None,
            })
            await websocket.close(code=1011)
        except Exception:
            pass


@router.websocket("/proxies/test/{proxy_id}")
async def ws_proxy_test(websocket: WebSocket, proxy_id: str, db: AsyncSession = Depends(get_db)) -> None:
    """One-shot proxy test over WebSocket with unified envelope.

    Path: /api/v1/ws/proxies/test/{proxy_id}
    """
    await websocket.accept()
    try:
        res = await db.execute(select(ProxyServer).where(ProxyServer.id == proxy_id))
        proxy = res.scalar_one_or_none()
        if not proxy:
            await websocket.send_json({
                "type": "error",
                "data": {"message": "proxy not found", "proxy_id": proxy_id},
                "timestamp": time.time(),
            })
            await websocket.close(code=1008)
            return
        from services.proxy_service import ProxyService

        service = ProxyService(db)
        await websocket.send_json({
            "type": "proxy_test_start",
            "data": {"proxy_id": str(proxy.id), "host": proxy.host, "port": proxy.port},
            "timestamp": time.time(),
            "correlation_id": websocket.headers.get("x-correlation-id") or None,
        })
        result = await service.test_proxy_connection(proxy, timeout=10)
        result.update({
            "proxy_id": str(proxy.id),
            "proxy_host": proxy.host,
            "proxy_port": proxy.port,
        })
        await websocket.send_json({
            "type": "proxy_test_result",
            "data": result,
            "timestamp": time.time(),
            "correlation_id": websocket.headers.get("x-correlation-id") or None,
        })
        await websocket.send_json({
            "type": "complete",
            "timestamp": time.time(),
            "correlation_id": websocket.headers.get("x-correlation-id") or None,
        })
        await websocket.close(code=1000)
    except WebSocketDisconnect as exc:
        logger.info("WS proxy test disconnect code=%s", exc.code)
    except Exception as exc:  # noqa: BLE001
        logger.error("WS proxy test error: %s", exc)
        try:
            await websocket.send_json({
                "type": "error",
                "data": {"message": "internal error", "details": str(exc)},
                "timestamp": time.time(),
                "correlation_id": websocket.headers.get("x-correlation-id") or None,
            })
            await websocket.close(code=1011)
        except Exception:  # noqa: BLE001
            pass


# ----------------------------------------------------------------------------
# Server-Sent Events (SSE) endpoints as WS alternatives
# ----------------------------------------------------------------------------

async def _sse_event_stream(generator):
    async for payload in generator:
        data = json.dumps(payload)
        yield f"data: {data}\n\n"


@router.get("/sse/imap/metrics")
async def sse_imap_metrics() -> StreamingResponse:
    async def gen():
        while True:
            yield {"type": "metrics", "data": await _gather_imap_metrics(), "timestamp": time.time(), "correlation_id": None}
            await asyncio.sleep(5.0)
    return StreamingResponse(_sse_event_stream(gen()), media_type="text/event-stream")


@router.get("/sse/smtp/metrics")
async def sse_smtp_metrics() -> StreamingResponse:
    async def gen():
        while True:
            yield {"type": "metrics", "data": await _gather_smtp_metrics(), "timestamp": time.time(), "correlation_id": None}
            await asyncio.sleep(5.0)
    return StreamingResponse(_sse_event_stream(gen()), media_type="text/event-stream")


@router.get("/sse/campaigns/{campaign_id}/progress")
async def sse_campaign_progress(campaign_id: str, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    async def gen():
        while True:
            res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
            camp = res.scalar_one_or_none()
            if not camp:
                yield {"type": "error", "data": {"message": "campaign not found"}, "timestamp": time.time()}
                break
            sent = getattr(camp, "sent_count", None) or getattr(camp, "sent_emails", 0) or 0
            total = getattr(camp, "total_recipients", 0) or getattr(camp, "total_emails", 0) or 0
            status = getattr(camp, "status", "unknown")
            pct = 0.0
            if total and sent:
                try:
                    pct = round(float(sent) / float(total) * 100.0, 2)
                except Exception:
                    pct = 0.0
            yield {"type": "progress", "data": {"campaign_id": campaign_id, "sent": int(sent), "total": int(total), "status": status, "pct": pct}, "timestamp": time.time(), "correlation_id": None}
            await asyncio.sleep(3.0)
    return StreamingResponse(_sse_event_stream(gen()), media_type="text/event-stream")
