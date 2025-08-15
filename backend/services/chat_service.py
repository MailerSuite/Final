"""
Chat Service for managing live chat sessions and operations
"""

import logging
from datetime import datetime

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app_websockets.connection_manager import ConnectionManager
from core.config import get_settings
from models.base import User
from models.chat import (
    Chat,
    ChatAnalytics,
    ChatMessage,
    ChatPriority,
    ChatStatus,
    MessageType,
)
from schemas.chat import (
    ChatFeatureAccess,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatWidgetStatus,
    PlanChatLimits,
    UserContextData,
)
from services.chat_bot_service import ChatBotService
from services.plan_service import PlanService

logger = logging.getLogger(__name__)
settings = get_settings()


class ChatService:
    """Main service for chat operations and management"""

    def __init__(
        self,
        chat_bot_service: ChatBotService,
        plan_service: PlanService,
        connection_manager: ConnectionManager,
    ):
        self.chat_bot_service = chat_bot_service
        self.plan_service = plan_service
        self.connection_manager = connection_manager

        # Chat configuration
        self.max_concurrent_chats_per_admin = 5
        self.auto_assign_timeout = 300  # 5 minutes
        self.inactive_timeout = 1800  # 30 minutes

    async def create_chat_session(
        self,
        session_data: ChatSessionCreate,
        db: AsyncSession,
        user_id: int | None = None,
        ip_address: str | None = None,
    ) -> ChatSessionResponse:
        """Create a new chat session"""

        try:
            # Check plan limits if user is registered
            if user_id:
                limits = await self._check_plan_limits(user_id, db)
                if not limits.feature_access.can_initiate_chat:
                    raise ValueError(
                        "Chat feature not available in your current plan"
                    )

                if limits.current_month_chats >= (
                    limits.max_monthly_chats or float("inf")
                ):
                    raise ValueError("Monthly chat limit exceeded")

            # Get user plan for context
            user_plan = None
            if user_id:
                plan = await self.plan_service.get_user_plan(str(user_id))
                user_plan = plan.code if plan else "basic"

            # Create chat session
            chat = Chat(
                user_id=user_id,
                guest_email=session_data.guest_email,
                guest_name=session_data.guest_name,
                subject=session_data.subject,
                page_url=session_data.page_url,
                user_agent=session_data.user_agent,
                ip_address=ip_address,
                timezone=session_data.timezone,
                user_plan=user_plan,
                status=ChatStatus.PENDING,
            )

            db.add(chat)
            await db.flush()  # Get the ID

            # Create initial message if provided
            if session_data.initial_message:
                initial_msg = ChatMessage(
                    chat_id=chat.id,
                    message_type=MessageType.USER,
                    content=session_data.initial_message,
                    sender_name=session_data.guest_name or "Guest",
                )
                db.add(initial_msg)

            await db.commit()
            await db.refresh(chat)

            # Convert to response model
            response = await self._chat_to_response(chat, db)

            # Notify admins of new chat
            await self._notify_new_chat(chat, db)

            # Send bot greeting if enabled
            await self._send_bot_greeting(chat, db)

            logger.info(
                f"Created chat session {chat.session_id} for user {user_id or 'guest'}"
            )
            return response

        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            await db.rollback()
            raise

    async def send_message(
        self,
        session_id: str,
        message_data: ChatMessageCreate,
        db: AsyncSession,
        sender_id: int | None = None,
        is_admin: bool = False,
    ) -> ChatMessageResponse:
        """Send a message in a chat session"""

        try:
            # Get chat session
            chat = await self._get_chat_by_session_id(session_id, db)
            if not chat:
                raise ValueError("Chat session not found")

            # Check if chat is still active
            if chat.status in [ChatStatus.CLOSED, ChatStatus.RESOLVED]:
                raise ValueError("Cannot send message to closed chat")

            # Create message
            message = ChatMessage(
                chat_id=chat.id,
                message_type=MessageType.ADMIN
                if is_admin
                else MessageType.USER,
                content=message_data.content,
                sender_id=sender_id,
                sender_name=message_data.sender_name,
                is_internal=message_data.is_internal,
            )

            db.add(message)

            # Update chat activity
            chat.last_activity = datetime.now()
            if chat.status == ChatStatus.PENDING:
                chat.status = ChatStatus.ACTIVE

            await db.commit()
            await db.refresh(message)

            # Convert to response
            response = ChatMessageResponse.from_orm(message)

            # Send real-time notifications
            await self._broadcast_message(chat, response)

            # Generate bot response if it's a user message and not internal
            if not is_admin and not message_data.is_internal:
                await self._handle_bot_response(chat, message_data.content, db)

            logger.info(
                f"Message sent in chat {session_id} by {'admin' if is_admin else 'user'}"
            )
            return response

        except Exception as e:
            logger.error(f"Error sending message: {e}")
            await db.rollback()
            raise

    async def get_chat_messages(
        self,
        session_id: str,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0,
        include_internal: bool = False,
    ) -> list[ChatMessageResponse]:
        """Get messages for a chat session"""

        try:
            chat = await self._get_chat_by_session_id(session_id, db)
            if not chat:
                raise ValueError("Chat session not found")

            # Build query
            stmt = (
                select(ChatMessage)
                .where(ChatMessage.chat_id == chat.id)
                .order_by(ChatMessage.created_at.asc())
                .offset(offset)
                .limit(limit)
            )

            # Filter internal messages for non-admin users
            if not include_internal:
                stmt = stmt.where(ChatMessage.is_internal == False)

            result = await db.execute(stmt)
            messages = result.scalars().all()

            return [ChatMessageResponse.from_orm(msg) for msg in messages]

        except Exception as e:
            logger.error(f"Error getting chat messages: {e}")
            raise

    async def assign_chat_to_admin(
        self, session_id: str, admin_id: int, db: AsyncSession
    ) -> ChatSessionResponse:
        """Assign chat to an admin"""

        try:
            chat = await self._get_chat_by_session_id(session_id, db)
            if not chat:
                raise ValueError("Chat session not found")

            # Check if admin exists and is actually an admin
            admin = await db.get(User, admin_id)
            if not admin or not admin.is_admin:
                raise ValueError("Invalid admin user")

            # Check admin's current workload
            current_chats = await self._get_admin_active_chats_count(
                admin_id, db
            )
            if current_chats >= self.max_concurrent_chats_per_admin:
                raise ValueError("Admin has reached maximum concurrent chats")

            # Assign chat
            chat.assigned_admin_id = admin_id
            chat.status = ChatStatus.ACTIVE

            # Add system message
            system_msg = ChatMessage(
                chat_id=chat.id,
                message_type=MessageType.SYSTEM,
                content=f"Chat assigned to {admin.username}",
                is_internal=True,
            )
            db.add(system_msg)

            await db.commit()

            response = await self._chat_to_response(chat, db)

            # Notify about assignment
            await self._notify_chat_assignment(chat, admin, db)

            logger.info(
                f"Chat {session_id} assigned to admin {admin.username}"
            )
            return response

        except Exception as e:
            logger.error(f"Error assigning chat: {e}")
            await db.rollback()
            raise

    async def update_chat_status(
        self,
        session_id: str,
        status: ChatStatus,
        db: AsyncSession,
        admin_id: int | None = None,
        note: str | None = None,
    ) -> ChatSessionResponse:
        """Update chat status"""

        try:
            chat = await self._get_chat_by_session_id(session_id, db)
            if not chat:
                raise ValueError("Chat session not found")

            old_status = chat.status
            chat.status = status

            if status in [ChatStatus.RESOLVED, ChatStatus.CLOSED]:
                chat.resolved_at = datetime.now()

            # Add system message about status change
            status_msg = f"Chat status changed from {old_status.value} to {status.value}"
            if note:
                status_msg += f": {note}"

            system_msg = ChatMessage(
                chat_id=chat.id,
                message_type=MessageType.SYSTEM,
                content=status_msg,
                sender_id=admin_id,
                is_internal=True,
            )
            db.add(system_msg)

            await db.commit()

            response = await self._chat_to_response(chat, db)

            # Notify about status change
            await self._notify_status_change(chat, old_status, status)

            # Update analytics
            await self._update_chat_analytics(chat, db)

            logger.info(f"Chat {session_id} status changed to {status.value}")
            return response

        except Exception as e:
            logger.error(f"Error updating chat status: {e}")
            await db.rollback()
            raise

    async def get_admin_chats(
        self,
        admin_id: int,
        db: AsyncSession,
        status_filter: list[ChatStatus] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ChatSessionResponse], int]:
        """Get chats for an admin"""

        try:
            # Build base query
            stmt = (
                select(Chat)
                .options(selectinload(Chat.messages))
                .where(Chat.assigned_admin_id == admin_id)
                .order_by(desc(Chat.last_activity))
            )

            # Apply status filter
            if status_filter:
                stmt = stmt.where(Chat.status.in_(status_filter))

            # Get total count
            count_stmt = select(func.count(Chat.id)).where(
                Chat.assigned_admin_id == admin_id
            )
            if status_filter:
                count_stmt = count_stmt.where(Chat.status.in_(status_filter))

            total_result = await db.execute(count_stmt)
            total = total_result.scalar()

            # Get paginated results
            paginated_stmt = stmt.offset(offset).limit(limit)
            result = await db.execute(paginated_stmt)
            chats = result.scalars().all()

            # Convert to response models
            responses = []
            for chat in chats:
                responses.append(await self._chat_to_response(chat, db))

            return responses, total

        except Exception as e:
            logger.error(f"Error getting admin chats: {e}")
            raise

    async def get_widget_status(
        self, db: AsyncSession, user_id: int | None = None
    ) -> ChatWidgetStatus:
        """Get chat widget availability status"""

        try:
            # Check if any admins are online
            admin_online = len(self.connection_manager.admin_connections) > 0

            # Get queue position if user has pending chat
            queue_position = None
            if user_id:
                pending_chats = await self._get_pending_chats_count(db)
                user_pending = await self._get_user_pending_chat(user_id, db)
                if user_pending:
                    queue_position = pending_chats

            # Estimate response time based on current load
            estimated_response = await self._estimate_response_time(db)

            return ChatWidgetStatus(
                is_available=True,  # Chat always available (bot can handle)
                admin_online=admin_online,
                estimated_response_time=estimated_response,
                queue_position=queue_position,
                bot_enabled=True,
                greeting_message="How can we help you today?",
            )

        except Exception as e:
            logger.error(f"Error getting widget status: {e}")
            return ChatWidgetStatus(
                is_available=False,
                admin_online=False,
                bot_enabled=False,
                greeting_message="Chat temporarily unavailable",
            )

    async def _check_plan_limits(
        self, user_id: int, db: AsyncSession
    ) -> PlanChatLimits:
        """Check user's plan limits for chat features"""

        try:
            plan = await self.plan_service.get_user_plan(str(user_id))
            if not plan:
                plan_code = "basic"
            else:
                plan_code = plan.code

            # Get current month chat count
            start_of_month = datetime.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )

            stmt = select(func.count(Chat.id)).where(
                and_(
                    Chat.user_id == user_id, Chat.created_at >= start_of_month
                )
            )
            result = await db.execute(stmt)
            current_month_chats = result.scalar() or 0

            # Define plan-based features
            feature_access = self._get_plan_chat_features(plan_code)

            # Define limits by plan
            limits_by_plan = {
                "basic": {"max_monthly_chats": 5},
                "premium": {"max_monthly_chats": 50},
                "deluxe": {"max_monthly_chats": None},  # Unlimited
                "enterprise": {"max_monthly_chats": None},  # Unlimited
            }

            plan_limits = limits_by_plan.get(
                plan_code, limits_by_plan["basic"]
            )

            return PlanChatLimits(
                plan_code=plan_code,
                max_monthly_chats=plan_limits["max_monthly_chats"],
                current_month_chats=current_month_chats,
                feature_access=feature_access,
                upgrade_required_for=[],
            )

        except Exception as e:
            logger.error(f"Error checking plan limits: {e}")
            # Return basic limits on error
            return PlanChatLimits(
                plan_code="basic",
                max_monthly_chats=5,
                current_month_chats=0,
                feature_access=self._get_plan_chat_features("basic"),
                upgrade_required_for=[],
            )

    def _get_plan_chat_features(self, plan_code: str) -> ChatFeatureAccess:
        """Get chat features based on plan"""

        features_by_plan = {
            "basic": ChatFeatureAccess(
                can_initiate_chat=True,
                can_upload_files=False,
                priority_support=False,
                dedicated_agent=False,
                chat_history_retention_days=7,
                max_concurrent_chats=1,
                estimated_response_time="Within 24 hours",
            ),
            "premium": ChatFeatureAccess(
                can_initiate_chat=True,
                can_upload_files=True,
                priority_support=False,
                dedicated_agent=False,
                chat_history_retention_days=30,
                max_concurrent_chats=3,
                estimated_response_time="Within 4 hours",
            ),
            "deluxe": ChatFeatureAccess(
                can_initiate_chat=True,
                can_upload_files=True,
                priority_support=True,
                dedicated_agent=True,
                chat_history_retention_days=90,
                max_concurrent_chats=10,
                estimated_response_time="Within 1 hour",
            ),
            "enterprise": ChatFeatureAccess(
                can_initiate_chat=True,
                can_upload_files=True,
                priority_support=True,
                dedicated_agent=True,
                chat_history_retention_days=365,
                max_concurrent_chats=25,
                estimated_response_time="Within 15 minutes",
            ),
        }

        return features_by_plan.get(plan_code, features_by_plan["basic"])

    async def _get_chat_by_session_id(
        self, session_id: str, db: AsyncSession
    ) -> Chat | None:
        """Get chat by session ID"""
        stmt = (
            select(Chat)
            .options(selectinload(Chat.messages))
            .where(Chat.session_id == session_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _chat_to_response(
        self, chat: Chat, db: AsyncSession
    ) -> ChatSessionResponse:
        """Convert Chat model to response schema"""

        # Count messages
        message_count = len(chat.messages) if chat.messages else 0

        # Count unread messages (simplified - could be more sophisticated)
        unread_count = sum(
            1
            for msg in (chat.messages or [])
            if not msg.is_read and msg.message_type == MessageType.USER
        )

        # Check if admin is online
        admin_online = False
        if chat.assigned_admin_id:
            admin_online = (
                str(chat.assigned_admin_id)
                in self.connection_manager.admin_connections
            )

        return ChatSessionResponse(
            id=chat.id,
            session_id=chat.session_id,
            user_id=chat.user_id,
            guest_email=chat.guest_email,
            guest_name=chat.guest_name,
            subject=chat.subject,
            status=chat.status,
            priority=chat.priority,
            assigned_admin_id=chat.assigned_admin_id,
            page_url=chat.page_url,
            user_plan=chat.user_plan,
            started_at=chat.started_at,
            last_activity=chat.last_activity,
            resolved_at=chat.resolved_at,
            message_count=message_count,
            unread_messages=unread_count,
            is_online=admin_online,
        )

    async def _notify_new_chat(self, chat: Chat, db: AsyncSession):
        """Notify admins about new chat"""

        try:
            # Create notification payload
            notification = {
                "type": "new_chat",
                "chat_id": chat.id,
                "session_id": chat.session_id,
                "user_plan": chat.user_plan,
                "page_url": chat.page_url,
                "timestamp": datetime.now().isoformat(),
            }

            # Send to all online admins
            await self.connection_manager.broadcast_to_admins(notification)

        except Exception as e:
            logger.error(f"Error notifying new chat: {e}")

    async def _send_bot_greeting(self, chat: Chat, db: AsyncSession):
        """Send automated bot greeting"""

        try:
            # Get user context
            user_context = None
            if chat.user_id:
                user = await db.get(User, chat.user_id)
                if user:
                    plan = await self.plan_service.get_user_plan(str(user.id))
                    user_context = UserContextData(
                        user_id=user.id,
                        email=user.email,
                        username=user.username,
                        plan_code=plan.code if plan else "basic",
                        is_admin=user.is_admin,
                    )

            # Generate greeting based on context
            greeting = await self._generate_contextual_greeting(
                chat, user_context
            )

            # Create bot message
            bot_message = ChatMessage(
                chat_id=chat.id,
                message_type=MessageType.BOT,
                content=greeting,
                sender_name="MailerSuite Assistant",
            )

            db.add(bot_message)
            await db.commit()

            # Broadcast to connected users
            message_response = ChatMessageResponse.from_orm(bot_message)
            await self._broadcast_message(chat, message_response)

        except Exception as e:
            logger.error(f"Error sending bot greeting: {e}")

    async def _generate_contextual_greeting(
        self, chat: Chat, user_context: UserContextData | None
    ) -> str:
        """Generate personalized greeting message"""

        base_greeting = "Hi there! 👋 Welcome to SGPT support."

        if user_context and user_context.username:
            base_greeting = (
                f"Hi {user_context.username}! 👋 Welcome back to SGPT support."
            )

        # Add plan-specific context
        plan_context = ""
        if user_context and user_context.plan_code:
            if user_context.plan_code == "basic":
                plan_context = " I see you're on our Basic plan - I can help you get the most out of your free features!"
            elif user_context.plan_code in ["premium", "deluxe"]:
                plan_context = f" I see you're on our {user_context.plan_code.title()} plan - I can help with all our advanced features!"

        # Add page-specific context
        page_context = ""
        if chat.page_url:
            if "pricing" in chat.page_url.lower():
                page_context = " I noticed you were looking at our pricing - I can help you find the perfect plan!"
            elif "features" in chat.page_url.lower():
                page_context = " I see you're exploring our features - I'm here to answer any questions!"

        # Combine greeting
        full_greeting = base_greeting + plan_context + page_context
        full_greeting += "\n\nHow can I help you today? I can assist with:\n• Getting started\n• Plan questions\n• Technical support\n• Feature guidance"

        return full_greeting

    async def _handle_bot_response(
        self, chat: Chat, user_message: str, db: AsyncSession
    ):
        """Handle automated bot response to user message"""

        try:
            # Get user context
            user_context = None
            if chat.user_id:
                user = await db.get(User, chat.user_id)
                if user:
                    plan = await self.plan_service.get_user_plan(str(user.id))
                    user_context = UserContextData(
                        user_id=user.id,
                        email=user.email,
                        username=user.username,
                        plan_code=plan.code if plan else "basic",
                        is_admin=user.is_admin,
                    )

            # Generate bot response
            bot_response = await self.chat_bot_service.generate_response(
                user_message, chat, db, user_context
            )

            # Create bot message
            bot_message = ChatMessage(
                chat_id=chat.id,
                message_type=MessageType.BOT,
                content=bot_response.content,
                sender_name="SGPT Assistant",
                bot_response_id=f"bot_{chat.id}_{datetime.now().timestamp()}",
                bot_confidence=bot_response.confidence,
            )

            db.add(bot_message)
            await db.commit()
            await db.refresh(bot_message)

            # Broadcast bot response
            message_response = ChatMessageResponse.from_orm(bot_message)
            await self._broadcast_message(chat, message_response)

            # Handle escalation if needed
            if bot_response.requires_escalation:
                await self._handle_escalation(chat, bot_response, db)

        except Exception as e:
            logger.error(f"Error handling bot response: {e}")

    async def _handle_escalation(
        self, chat: Chat, bot_response, db: AsyncSession
    ):
        """Handle chat escalation to human agent"""

        try:
            # Update chat priority if escalated
            if bot_response.confidence < 30:
                chat.priority = ChatPriority.HIGH

            # Add escalation message
            escalation_msg = ChatMessage(
                chat_id=chat.id,
                message_type=MessageType.SYSTEM,
                content="This conversation has been escalated to a human agent. Someone will be with you shortly.",
                is_internal=False,
            )
            db.add(escalation_msg)

            await db.commit()

            # Notify admins about escalation
            notification = {
                "type": "chat_escalated",
                "chat_id": chat.id,
                "session_id": chat.session_id,
                "priority": chat.priority.value,
                "reason": "Bot confidence low"
                if bot_response.confidence < 30
                else "User requested human agent",
            }

            await self.connection_manager.broadcast_to_admins(notification)

        except Exception as e:
            logger.error(f"Error handling escalation: {e}")

    async def _broadcast_message(
        self, chat: Chat, message: ChatMessageResponse
    ):
        """Broadcast message to connected users"""

        try:
            # Create broadcast payload
            payload = {
                "type": "chat_message",
                "session_id": chat.session_id,
                "message": message.dict(),
            }

            # Send to user if connected
            if chat.user_id:
                user_connection_id = str(chat.user_id)
                if (
                    user_connection_id
                    in self.connection_manager.customer_connections
                ):
                    await self.connection_manager.send_personal_message(
                        payload, user_connection_id
                    )

            # Send to assigned admin if connected
            if chat.assigned_admin_id:
                admin_connection_id = str(chat.assigned_admin_id)
                if (
                    admin_connection_id
                    in self.connection_manager.admin_connections
                ):
                    await self.connection_manager.send_personal_message(
                        payload, admin_connection_id
                    )

        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")

    async def _notify_chat_assignment(
        self, chat: Chat, admin: User, db: AsyncSession
    ):
        """Notify about chat assignment"""

        try:
            notification = {
                "type": "chat_assigned",
                "chat_id": chat.id,
                "session_id": chat.session_id,
                "admin_id": admin.id,
                "admin_name": admin.username,
            }

            await self.connection_manager.broadcast_to_admins(notification)

        except Exception as e:
            logger.error(f"Error notifying chat assignment: {e}")

    async def _notify_status_change(
        self, chat: Chat, old_status: ChatStatus, new_status: ChatStatus
    ):
        """Notify about chat status change"""

        try:
            notification = {
                "type": "chat_status_changed",
                "chat_id": chat.id,
                "session_id": chat.session_id,
                "old_status": old_status.value,
                "new_status": new_status.value,
            }

            await self.connection_manager.broadcast_to_admins(notification)

        except Exception as e:
            logger.error(f"Error notifying status change: {e}")

    async def _get_admin_active_chats_count(
        self, admin_id: int, db: AsyncSession
    ) -> int:
        """Get count of active chats for admin"""

        stmt = select(func.count(Chat.id)).where(
            and_(
                Chat.assigned_admin_id == admin_id,
                Chat.status.in_([ChatStatus.ACTIVE, ChatStatus.PENDING]),
            )
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def _get_pending_chats_count(self, db: AsyncSession) -> int:
        """Get total pending chats count"""

        stmt = select(func.count(Chat.id)).where(
            Chat.status == ChatStatus.PENDING
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def _get_user_pending_chat(
        self, user_id: int, db: AsyncSession
    ) -> Chat | None:
        """Get user's pending chat if any"""

        stmt = (
            select(Chat)
            .where(
                and_(
                    Chat.user_id == user_id, Chat.status == ChatStatus.PENDING
                )
            )
            .order_by(desc(Chat.created_at))
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _estimate_response_time(self, db: AsyncSession) -> str:
        """Estimate response time based on current load"""

        try:
            # Get current pending chats
            pending_count = await self._get_pending_chats_count(db)

            # Get online admin count
            online_admins = len(self.connection_manager.admin_connections)

            if online_admins == 0:
                return "Within 24 hours"
            elif pending_count == 0:
                return "Within 5 minutes"
            elif pending_count <= online_admins:
                return "Within 15 minutes"
            elif pending_count <= online_admins * 3:
                return "Within 1 hour"
            else:
                return "Within 4 hours"

        except Exception:
            return "Within 4 hours"

    async def _update_chat_analytics(self, chat: Chat, db: AsyncSession):
        """Update chat analytics when chat is resolved"""

        try:
            if chat.status not in [ChatStatus.RESOLVED, ChatStatus.CLOSED]:
                return

            today = datetime.now().date()

            # Get or create analytics record for today
            stmt = select(ChatAnalytics).where(
                and_(
                    ChatAnalytics.date == today,
                    ChatAnalytics.period_type == "daily",
                )
            )
            result = await db.execute(stmt)
            analytics = result.scalar_one_or_none()

            if not analytics:
                analytics = ChatAnalytics(date=today, period_type="daily")
                db.add(analytics)

            # Update metrics
            if chat.status == ChatStatus.RESOLVED:
                analytics.resolved_chats += 1

            # Calculate response time if available
            if chat.resolved_at and chat.started_at:
                resolution_time = int(
                    (chat.resolved_at - chat.started_at).total_seconds()
                )
                current_avg = analytics.avg_resolution_time
                total_resolved = analytics.resolved_chats

                if total_resolved > 1:
                    analytics.avg_resolution_time = int(
                        (current_avg * (total_resolved - 1) + resolution_time)
                        / total_resolved
                    )
                else:
                    analytics.avg_resolution_time = resolution_time

            # Update plan breakdown
            plan_breakdown = analytics.plan_breakdown or {}
            plan = chat.user_plan or "guest"
            plan_breakdown[plan] = plan_breakdown.get(plan, 0) + 1
            analytics.plan_breakdown = plan_breakdown

            await db.commit()

        except Exception as e:
            logger.error(f"Error updating chat analytics: {e}")
