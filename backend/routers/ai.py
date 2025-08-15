"""
Unified AI Router
- Registry of AI functions
- Usage tracking with Redis
- Per-user/endpoint rate limiting
- Streaming (SSE) for chat
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any, AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request, status, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from config.redis_config import get_redis_client
from core.database import async_session
from core.rate_limit import get_rate_limiter
from routers.auth import get_current_user

# Mock implementations for AI functionality
from typing import Any

class MLAnalysisRequest(BaseModel):
    content: str
    analysis_type: str = "general"
    model_id: str = "gpt-4"

class MLChatMessage(BaseModel):
    role: str
    content: str
    timestamp: float = Field(default_factory=time.time)

async def generate_ai_response(message: str, model_id: str = "gpt-4") -> str:
    """Mock AI response generation"""
    return f"Mock AI response to: {message}"

async def perform_content_analysis(content: str, analysis_type: str = "general") -> dict:
    """Mock content analysis"""
    return {
        "sentiment": "positive",
        "keywords": ["mock", "content", "analysis"],
        "readability": "high",
        "content_length": len(content)
    }

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


class AIRegistryItem(BaseModel):
    key: str
    title: str
    description: str
    inputs: dict[str, Any] = Field(default_factory=dict)


class AIExecutePayload(BaseModel):
    fn: str
    args: dict[str, Any] = Field(default_factory=dict)


class AIChatRequest(BaseModel):
    model_id: str = Field("gpt-4-001")
    message: str
    temperature: float | None = 0.7
    max_tokens: int | None = 400
    chat_history: list[MLChatMessage] | None = []


# Database session dependency (local to this router)
async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


REGISTRY: list[AIRegistryItem] = [
    AIRegistryItem(
        key="ai.chat",
        title="Chat with AI",
        description="General chat with selected model (mock).",
        inputs={"model_id": "str", "message": "str", "temperature": "float?"},
    ),
    AIRegistryItem(
        key="ai.analyze",
        title="Analyze Content",
        description="Analyze content for sentiment/keywords/readability (mock).",
        inputs={"content": "str", "analysis_type": "str", "model_id": "str?"},
    ),
    AIRegistryItem(
        key="content.subject_lines",
        title="Generate Subject Lines",
        description="Suggest email subject lines from content.",
        inputs={"email_content": "str", "count": "int? (1-10)"},
    ),
    AIRegistryItem(
        key="mailing.optimize",
        title="Optimize Email Copy",
        description="Suggest improvements to email copy.",
        inputs={"content": "str", "optimization_type": "str?"},
    ),
]


@router.get("/", summary="AI API Info")
async def ai_info() -> dict[str, Any]:
    return {
        "service": "MailerSuite AI API",
        "version": "1.0.0",
        "endpoints": {
            "registry": "/api/v1/ai/registry",
            "execute": "/api/v1/ai/execute",
            "chat_stream": "/api/v1/ai/chat/stream",
            "usage": "/api/v1/ai/usage",
        },
    }


@router.get("/registry", response_model=list[AIRegistryItem])
async def list_registry(current_user=Depends(get_current_user)) -> list[AIRegistryItem]:
    return REGISTRY


async def _incr_usage(redis, user_id: str, fn: str) -> None:
    try:
        now = int(time.time())
        day_key = time.strftime("%Y%m%d", time.gmtime(now))
        await redis.incr(f"ai_usage:{user_id}:total")
        await redis.incr(f"ai_usage:{user_id}:{fn}:{day_key}")
        await redis.expire(f"ai_usage:{user_id}:{fn}:{day_key}", 3 * 24 * 3600)
    except Exception:
        pass


@router.get("/usage")
async def get_usage(current_user=Depends(get_current_user)) -> dict[str, Any]:
    redis = await get_redis_client()
    data: dict[str, Any] = {"total": 0, "fns": {}}
    try:
        total = await redis.get(f"ai_usage:{current_user.id}:total")
        data["total"] = int(total) if total else 0
        for item in REGISTRY:
            # Check today key only for quick view
            day_key = time.strftime("%Y%m%d", time.gmtime())
            val = await redis.get(f"ai_usage:{current_user.id}:{item.key}:{day_key}")
            data["fns"][item.key] = int(val) if val else 0
    except Exception:
        pass
    return data


async def _check_rate_limit(user_id: str, fn: str) -> None:
    """Best-effort rate limit; allow if Redis unavailable."""
    try:
        redis = await get_redis_client()
        limiter = get_rate_limiter(redis)
        # If limiter could not be created for some reason, skip enforcement
        if not limiter:
            return
        allowed, _remaining = await limiter.is_allowed(
            key=f"user:{user_id}:ai:{fn}", limit=60, window=60
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"AI rate limit exceeded for {fn}. Try later.",
            )
    except Exception:
        # On any Redis/limiter error, do not block requests
        return


@router.post("/execute")
async def execute_fn(
    payload: AIExecutePayload,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Any:
    # Rate limit per-user per-function
    await _check_rate_limit(str(current_user.id), payload.fn)

    fn = payload.fn
    args = payload.args or {}

    # Route to functions
    if fn == "ai.chat":
        message = str(args.get("message", ""))
        model_id = str(args.get("model_id", "gpt-4-001"))
        temperature = float(args.get("temperature", 0.7))
        max_tokens = int(args.get("max_tokens", 200))
        resp = await generate_ai_response(
            message=message,
            model={"model_type": type("T", (), {"value": model_id})()},  # shim
            temperature=temperature,
            max_tokens=max_tokens,
            chat_history=args.get("chat_history", []),
        )
        await _incr_usage(await get_redis_client(), str(current_user.id), fn)
        return {"response": resp["response"], "tokens_used": resp["tokens_used"], "model": model_id}

    if fn == "ai.analyze":
        # Map request to MLAnalysisRequest fields
        content = str(args.get("content", ""))
        analysis_type = str(args.get("analysis_type", "sentiment"))
        model_id = str(args.get("model_id", "gpt-4-001"))
        result = await perform_content_analysis(
            content=content,
            analysis_type=analysis_type,
            options=args.get("options", {}),
            model={"model_type": type("T", (), {"value": model_id})()},  # shim
        )
        await _incr_usage(await get_redis_client(), str(current_user.id), fn)
        return {"result": result, "model": model_id}

    if fn == "content.subject_lines":
        email_content = str(args.get("email_content", ""))
        count = max(1, min(int(args.get("count", 5)), 10))
        words = email_content.split()[:10]
        key_phrase = " ".join(words[:5]) if words else "Your email"
        subject_lines = [
            {
                "subject_line": f"Subject Line {i + 1}: {key_phrase}",
                "engagement_score": round(0.7 - i * 0.05, 3),
                "spam_score": 0.1,
            }
            for i in range(count)
        ]
        await _incr_usage(await get_redis_client(), str(current_user.id), fn)
        return {"subject_lines": subject_lines}

    if fn == "mailing.optimize":
        content = str(args.get("content", ""))
        improvements = ["Improve clarity", "Tighten call-to-action", "Shorten sentences"]
        await _incr_usage(await get_redis_client(), str(current_user.id), fn)
        return {"optimized_content": content, "improvements": improvements, "score_improvement": 0.12}

    raise HTTPException(status_code=404, detail="Function not found")


@router.post("/chat/stream")
async def chat_stream(
    req: AIChatRequest,
    request: Request,
    current_user=Depends(get_current_user),
) -> StreamingResponse:
    await _check_rate_limit(str(current_user.id), "ai.chat")

    async def event_gen() -> AsyncGenerator[bytes, None]:
        # Generate a mock response and stream chunks
        resp = await generate_ai_response(
            message=req.message,
            model={"model_type": type("T", (), {"value": req.model_id})()},
            temperature=req.temperature or 0.7,
            max_tokens=req.max_tokens or 200,
            chat_history=req.chat_history or [],
        )
        text = resp.get("response", "")
        # Stream in small chunks
        for i in range(0, len(text), 32):
            if await request.is_disconnected():
                break
            chunk = text[i : i + 32]
            data = json.dumps({"type": "token", "content": chunk})
            yield f"data: {data}\n\n".encode()
            await asyncio.sleep(0.02)
        # Done message
        done = json.dumps({"type": "done"})
        yield f"data: {done}\n\n".encode()
        # Track usage
        await _incr_usage(await get_redis_client(), str(current_user.id), "ai.chat")

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@router.websocket("/chat/ws")
async def chat_ws(websocket: WebSocket):
    """WebSocket streaming for AI chat tokens.

    Client should send a JSON message: {"message": str, "model_id": str, "temperature": float?, "max_tokens": int?}
    The server responds with JSON frames: {type: "token" | "done", content?: str}
    """
    await websocket.accept()
    try:
        # Receive the initial payload
        payload = await websocket.receive_json()
        message = str(payload.get("message", ""))
        model_id = str(payload.get("model_id", "gpt-4-001"))
        temperature = float(payload.get("temperature", 0.7))
        max_tokens = int(payload.get("max_tokens", 200))

        # Generate full response then stream in chunks to the client
        resp = await generate_ai_response(
            message=message,
            model={"model_type": type("T", (), {"value": model_id})()},
            temperature=temperature,
            max_tokens=max_tokens,
            chat_history=payload.get("chat_history", []),
        )
        text = resp.get("response", "")
        for i in range(0, len(text), 32):
            chunk = text[i : i + 32]
            await websocket.send_json({"type": "token", "content": chunk})
            await asyncio.sleep(0.02)
        await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        # Client disconnected; nothing to do
        return
    except Exception:
        # Send a minimal error frame if possible
        try:
            await websocket.send_json({"type": "error", "message": "processing_failed"})
        except Exception:
            pass
        finally:
            await websocket.close()
