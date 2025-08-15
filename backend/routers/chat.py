"""
Chat router for livechat functionality with REST and WebSocket endpoints
"""

import json
import logging
from datetime import datetime
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

from app_websockets.connection_manager import ConnectionManager
from core.database import get_db
from models.base import User
from routers.auth import (
    get_current_admin_user as get_current_admin,
)
from routers.auth import (
    get_current_user,
)
from schemas.chat import (
    AdminChatListResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatWidgetConfig,
    ChatWidgetStatus,
    PlanChatLimits,
)
from services.chat_bot_service import ChatBotService
from services.chat_service import ChatService
from services.plan_service import PlanService
from utils.ip_utils import get_client_ip

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["AI Content"])
security = HTTPBearer()

# Global connection manager (can be initialized at module level)
connection_manager = ConnectionManager()


# Services will be initialized per request with proper database session
def get_chat_services(db: AsyncSession):
    """Factory function to create chat services with database session"""
    plan_service = PlanService(db)
    chat_bot_service = ChatBotService(
        ai_service=None, plan_service=plan_service
    )
    chat_service = ChatService(
        chat_bot_service, plan_service, connection_manager
    )
    return chat_service, plan_service, chat_bot_service


# ===== PUBLIC ENDPOINTS =====


@router.get("/widget/status", response_model=ChatWidgetStatus)
async def get_widget_status(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Get chat widget availability status"""
    try:
        user_id = current_user.id if current_user else None
        chat_service, _, _ = get_chat_services(db)
        return await chat_service.get_widget_status(db, user_id)
    except Exception as e:
        logger.error(f"Error getting widget status: {e}")
        raise HTTPException(
            status_code=500, detail="Unable to get widget status"
        )


@router.get("/widget/config", response_model=ChatWidgetConfig)
async def get_widget_config():
    """Get chat widget configuration"""
    return ChatWidgetConfig(
        title="MailerSuite Support",
        subtitle="Get help with your email marketing",
        primary_color="#EF4444",
        bot_name="MailerSuite Assistant",
    )


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Create a new chat session"""
    try:
        user_id = current_user.id if current_user else None
        ip_address = get_client_ip(request)

        return await chat_service.create_chat_session(
            session_data, db, user_id, ip_address
        )
    except ValueError as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise HTTPException(
            status_code=500, detail="Unable to create chat session"
        )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str = Path(..., description="Chat session ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Get chat session details"""
    try:
        chat = await chat_service._get_chat_by_session_id(session_id, db)
        if not chat:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND, detail="Chat session not found"
            )

        # Check access permissions
        if current_user:
            # Users can access their own chats or admins can access any
            if chat.user_id != current_user.id and not current_user.is_admin:
                raise HTTPException(
                    status_code=HTTP_403_FORBIDDEN, detail="Access denied"
                )
        else:
            # Guest access only for their own sessions (basic security)
            # In production, you'd want better session validation
            pass

        return await chat_service._chat_to_response(chat, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session: {e}")
        raise HTTPException(
            status_code=500, detail="Unable to get chat session"
        )


@router.get(
    "/sessions/{session_id}/messages", response_model=list[ChatMessageResponse]
)
async def get_chat_messages(
    session_id: str = Path(..., description="Chat session ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Get messages for a chat session"""
    try:
        # Check session access (similar to get_chat_session)
        chat = await chat_service._get_chat_by_session_id(session_id, db)
        if not chat:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND, detail="Chat session not found"
            )

        if current_user:
            if chat.user_id != current_user.id and not current_user.is_admin:
                raise HTTPException(
                    status_code=HTTP_403_FORBIDDEN, detail="Access denied"
                )

        include_internal = current_user and current_user.is_admin

        return await chat_service.get_chat_messages(
            session_id, db, limit, offset, include_internal
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat messages: {e}")
        raise HTTPException(status_code=500, detail="Unable to get messages")


@router.post(
    "/sessions/{session_id}/messages", response_model=ChatMessageResponse
)
async def send_message(
    session_id: str = Path(..., description="Chat session ID"),
    message_data: ChatMessageCreate = ...,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Send a message in a chat session"""
    try:
        # Check session access
        chat = await chat_service._get_chat_by_session_id(session_id, db)
        if not chat:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND, detail="Chat session not found"
            )

        is_admin = current_user and current_user.is_admin
        sender_id = current_user.id if current_user else None

        # Non-admin users can only send to their own chats
        if current_user and not is_admin and chat.user_id != current_user.id:
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN, detail="Access denied"
            )

        return await chat_service.send_message(
            session_id, message_data, db, sender_id, is_admin
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Unable to send message")


# ===== USER ENDPOINTS =====


@router.get("/my/limits", response_model=PlanChatLimits)
async def get_my_chat_limits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's chat limits based on plan"""
    try:
        return await chat_service._check_plan_limits(current_user.id, db)
    except Exception as e:
        logger.error(f"Error getting chat limits: {e}")
        raise HTTPException(
            status_code=500, detail="Unable to get chat limits"
        )


@router.get("/my/sessions", response_model=list[ChatSessionResponse])
async def get_my_chat_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's chat sessions"""
    try:
        from sqlalchemy import desc, select

        from models.chat import Chat

        stmt = (
            select(Chat)
            .where(Chat.user_id == current_user.id)
            .order_by(desc(Chat.last_activity))
            .offset(offset)
            .limit(limit)
        )

        result = await db.execute(stmt)
        chats = result.scalars().all()

        responses = []
        for chat in chats:
            responses.append(await chat_service._chat_to_response(chat, db))

        return responses
    except Exception as e:
        logger.error(f"Error getting user chat sessions: {e}")
        raise HTTPException(
            status_code=500, detail="Unable to get chat sessions"
        )


# ===== ADMIN ENDPOINTS =====


@router.get("/admin/chats", response_model=AdminChatListResponse)
async def get_admin_chats(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    assigned_to_me: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Get chats for admin management"""
    try:
        from sqlalchemy import and_, desc, select

        from models.chat import Chat, ChatPriority, ChatStatus

        # Build query
        stmt = select(Chat).order_by(desc(Chat.last_activity))

        # Apply filters
        conditions = []

        if status:
            try:
                status_enum = ChatStatus(status)
                conditions.append(Chat.status == status_enum)
            except ValueError:
                pass

        if priority:
            try:
                priority_enum = ChatPriority(priority)
                conditions.append(Chat.priority == priority_enum)
            except ValueError:
                pass

        if assigned_to_me:
            conditions.append(Chat.assigned_admin_id == current_admin.id)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Get total count
        from sqlalchemy import func

        count_stmt = select(func.count(Chat.id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))

        total_result = await db.execute(count_stmt)
        total = total_result.scalar()

        # Get paginated results
        offset = (page - 1) * size
        paginated_stmt = stmt.offset(offset).limit(size)
        result = await db.execute(paginated_stmt)
        chats = result.scalars().all()

        # Convert to response models
        chat_responses = []
        for chat in chats:
            chat_responses.append(
                await chat_service._chat_to_response(chat, db)
            )

        return AdminChatListResponse(
            chats=chat_responses,
            total=total,
            page=page,
            size=size,
            has_next=(page * size) < total,
            has_previous=page > 1,
        )
    except Exception as e:
        logger.error(f"Error getting admin chats: {e}")
        raise HTTPException(status_code=500, detail="Unable to get chats")


@router.post("/admin/chats/{session_id}/assign")
async def assign_chat(
    session_id: str = Path(..., description="Chat session ID"),
    admin_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Assign chat to an admin"""
    try:
        # If no admin_id provided, assign to current admin
        target_admin_id = admin_id or current_admin.id

        return await chat_service.assign_chat_to_admin(
            session_id, target_admin_id, db
        )
    except ValueError as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning chat: {e}")
        raise HTTPException(status_code=500, detail="Unable to assign chat")


@router.patch("/admin/chats/{session_id}/status")
async def update_chat_status(
    session_id: str = Path(..., description="Chat session ID"),
    update_data: ChatSessionUpdate = ...,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Update chat status and other properties"""
    try:
        if update_data.status:
            return await chat_service.update_chat_status(
                session_id, update_data.status, db, current_admin.id
            )

        # Handle other updates (priority, assignment, etc.)
        chat = await chat_service._get_chat_by_session_id(session_id, db)
        if not chat:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND, detail="Chat not found"
            )

        if update_data.priority:
            chat.priority = update_data.priority

        if update_data.assigned_admin_id is not None:
            chat.assigned_admin_id = update_data.assigned_admin_id

        if update_data.subject:
            chat.subject = update_data.subject

        await db.commit()
        return await chat_service._chat_to_response(chat, db)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating chat: {e}")
        raise HTTPException(status_code=500, detail="Unable to update chat")


@router.get("/admin/analytics")
async def get_chat_analytics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Get chat analytics for admin dashboard"""
    try:
        # Get bot analytics
        bot_analytics = await chat_bot_service.get_bot_analytics(db, days)

        # Get general chat analytics
        from datetime import timedelta

        from sqlalchemy import and_, func

        from models.chat import Chat, ChatStatus

        since_date = datetime.now() - timedelta(days=days)

        # Total chats
        total_result = await db.execute(
            select(func.count(Chat.id)).where(Chat.created_at >= since_date)
        )
        total_chats = total_result.scalar() or 0

        # Resolved chats
        resolved_result = await db.execute(
            select(func.count(Chat.id)).where(
                and_(
                    Chat.created_at >= since_date,
                    Chat.status == ChatStatus.RESOLVED,
                )
            )
        )
        resolved_chats = resolved_result.scalar() or 0

        # Average resolution time
        resolution_time_result = await db.execute(
            select(
                func.avg(
                    func.extract("epoch", Chat.resolved_at - Chat.started_at)
                )
            ).where(
                and_(
                    Chat.resolved_at.isnot(None), Chat.created_at >= since_date
                )
            )
        )
        avg_resolution_time = resolution_time_result.scalar() or 0

        # Plan breakdown
        plan_result = await db.execute(
            select(Chat.user_plan, func.count(Chat.id))
            .where(Chat.created_at >= since_date)
            .group_by(Chat.user_plan)
        )
        plan_breakdown = dict(plan_result.fetchall())

        return {
            "period_days": days,
            "total_chats": total_chats,
            "resolved_chats": resolved_chats,
            "resolution_rate": round((resolved_chats / total_chats * 100), 2)
            if total_chats > 0
            else 0,
            "avg_resolution_time_seconds": int(avg_resolution_time)
            if avg_resolution_time
            else 0,
            "plan_breakdown": plan_breakdown,
            "bot_analytics": bot_analytics,
            "online_admins": len(connection_manager.admin_connections),
            "active_sessions": len(connection_manager.customer_connections),
        }

    except Exception as e:
        logger.error(f"Error getting chat analytics: {e}")
        raise HTTPException(status_code=500, detail="Unable to get analytics")


# ===== WEBSOCKET ENDPOINTS =====


@router.websocket("/ws/{session_id}")
async def chat_websocket(
    websocket: WebSocket,
    session_id: str = Path(..., description="Chat session ID"),
    token: str | None = Query(None, description="Authentication token"),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for real-time chat communication"""

    user_id = None
    is_admin = False

    # Authenticate user if token provided
    if token:
        try:
            # In production, properly validate JWT token
            # For now, assume token validation logic here
            pass
        except Exception:
            await websocket.close(code=4001, reason="Invalid authentication")
            return

    # Verify chat session exists
    try:
        chat = await chat_service._get_chat_by_session_id(session_id, db)
        if not chat:
            await websocket.close(code=4004, reason="Chat session not found")
            return
    except Exception as e:
        logger.error(f"Error verifying chat session: {e}")
        await websocket.close(code=4000, reason="Server error")
        return

    # Connect to websocket manager
    try:
        await connection_manager.connect(websocket, user_id, is_admin)
        logger.info(f"WebSocket connected for chat {session_id}")

        # Send connection confirmation
        await websocket.send_json(
            {
                "type": "connection_established",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
            }
        )

        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)

                # Handle different message types
                if message_data.get("type") == "chat_message":
                    await _handle_websocket_chat_message(
                        session_id,
                        message_data,
                        websocket,
                        user_id,
                        is_admin,
                        db,
                    )
                elif message_data.get("type") == "typing":
                    await _handle_typing_indicator(
                        session_id, message_data, websocket, user_id, is_admin
                    )
                elif message_data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                else:
                    logger.warning(
                        f"Unknown message type: {message_data.get('type')}"
                    )

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for chat {session_id}")
                break
            except json.JSONDecodeError:
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON format"}
                )
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await websocket.send_json(
                    {"type": "error", "message": "Message processing error"}
                )

    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        connection_manager.disconnect(websocket)


@router.websocket("/admin/ws")
async def admin_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="Admin authentication token"),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for admin real-time notifications"""

    admin_id = None

    # Authenticate admin
    try:
        # In production, properly validate admin JWT token
        # For now, assume token validation logic here
        admin_id = "admin_user_id"  # Would be extracted from token
    except Exception:
        await websocket.close(code=4001, reason="Invalid admin authentication")
        return

    try:
        await connection_manager.connect(websocket, admin_id, is_admin=True)
        logger.info(f"Admin WebSocket connected: {admin_id}")

        # Send admin connection confirmation
        await websocket.send_json(
            {
                "type": "admin_connected",
                "admin_id": admin_id,
                "timestamp": datetime.now().isoformat(),
            }
        )

        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)

                # Handle admin-specific message types
                if message_data.get("type") == "get_pending_chats":
                    await _handle_get_pending_chats(websocket, db)
                elif message_data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

            except WebSocketDisconnect:
                logger.info(f"Admin WebSocket disconnected: {admin_id}")
                break
            except Exception as e:
                logger.error(f"Admin WebSocket error: {e}")

    except Exception as e:
        logger.error(f"Admin WebSocket connection error: {e}")
    finally:
        connection_manager.disconnect(websocket)


# ===== WEBSOCKET HELPER FUNCTIONS =====


async def _handle_websocket_chat_message(
    session_id: str,
    message_data: dict[str, Any],
    websocket: WebSocket,
    user_id: int | None,
    is_admin: bool,
    db: AsyncSession,
):
    """Handle chat message sent via WebSocket"""
    try:
        content = message_data.get("content")
        if not content or len(content.strip()) == 0:
            await websocket.send_json(
                {"type": "error", "message": "Message content cannot be empty"}
            )
            return

        # Create message
        message_create = ChatMessageCreate(
            content=content,
            message_type=MessageType.ADMIN if is_admin else MessageType.USER,
            sender_name=message_data.get("sender_name", "Guest"),
        )

        # Send message through service
        response = await chat_service.send_message(
            session_id, message_create, db, user_id, is_admin
        )

        # Confirm message sent
        await websocket.send_json(
            {
                "type": "message_sent",
                "message_id": response.id,
                "timestamp": response.created_at.isoformat(),
            }
        )

    except Exception as e:
        logger.error(f"Error handling WebSocket chat message: {e}")
        await websocket.send_json(
            {"type": "error", "message": "Failed to send message"}
        )


async def _handle_typing_indicator(
    session_id: str,
    message_data: dict[str, Any],
    websocket: WebSocket,
    user_id: int | None,
    is_admin: bool,
):
    """Handle typing indicator"""
    try:
        is_typing = message_data.get("is_typing", False)

        # Broadcast typing indicator to other participants
        typing_event = {
            "type": "typing_indicator",
            "session_id": session_id,
            "is_typing": is_typing,
            "user_type": "admin" if is_admin else "user",
            "timestamp": datetime.now().isoformat(),
        }

        # Send to all connections for this chat session
        # (Implementation would depend on how you track session participants)

    except Exception as e:
        logger.error(f"Error handling typing indicator: {e}")


async def _handle_get_pending_chats(websocket: WebSocket, db: AsyncSession):
    """Handle admin request for pending chats"""
    try:
        from sqlalchemy import select

        from models.chat import Chat, ChatStatus

        stmt = (
            select(Chat)
            .where(Chat.status == ChatStatus.PENDING)
            .order_by(Chat.created_at.asc())
            .limit(10)
        )

        result = await db.execute(stmt)
        pending_chats = result.scalars().all()

        # Convert to response format
        chat_list = []
        for chat in pending_chats:
            chat_response = await chat_service._chat_to_response(chat, db)
            chat_list.append(chat_response.dict())

        await websocket.send_json(
            {
                "type": "pending_chats",
                "chats": chat_list,
                "count": len(chat_list),
            }
        )

    except Exception as e:
        logger.error(f"Error getting pending chats: {e}")
        await websocket.send_json(
            {"type": "error", "message": "Failed to get pending chats"}
        )
