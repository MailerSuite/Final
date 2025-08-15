"""
AI Chatbot Service for automated chat responses and customer support
"""

import logging
import re
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.chat import Chat, ChatBotSession, ChatMessage, MessageType
from schemas.chat import BotResponse, UserContextData
from services.plan_service import PlanService

logger = logging.getLogger(__name__)


class AIService:
    """Placeholder AI service for chat functionality"""

    async def generate_chat_completion(
        self,
        messages: list[dict[str, str]],
        system_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> dict[str, Any]:
        """Simple placeholder implementation"""
        try:
            # This would integrate with actual AI service (OpenAI, Anthropic, etc.)
            # For now, return a basic response
            user_message = messages[-1]["content"] if messages else ""

            # Basic keyword-based responses
            if any(
                word in user_message.lower()
                for word in ["hi", "hello", "help"]
            ):
                response = "Hello! I'm here to help you with your email marketing needs. What can I assist you with today?"
            elif any(
                word in user_message.lower()
                for word in ["price", "cost", "plan"]
            ):
                response = "Our pricing is designed to be affordable and scalable. Would you like to see our current plans?"
            elif any(
                word in user_message.lower()
                for word in ["feature", "what", "can"]
            ):
                response = "SGPT offers email campaigns, SMTP/IMAP integration, templates, analytics, and AI-powered optimization. What specific feature interests you?"
            else:
                response = "I understand you're asking about our email marketing platform. Could you please be more specific so I can better assist you?"

            return {
                "success": True,
                "response": response,
                "tokens_used": len(response.split()),
                "model": "placeholder",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": "I'm sorry, I'm having trouble processing your request right now.",
            }


class ChatBotService:
    """Intelligent chatbot service for automated customer support and sales"""

    def __init__(
        self, ai_service: AIService | None, plan_service: PlanService
    ):
        self.ai_service = ai_service or AIService()
        self.plan_service = plan_service

        # Bot configuration
        self.bot_name = "SGPT Assistant"
        self.max_context_messages = 20  # Keep last 20 messages for context
        self.confidence_threshold = (
            70  # Minimum confidence for automated response
        )
        self.escalation_threshold = 50  # Below this, escalate to human

        # Initialize predefined knowledge base
        self.knowledge_base = self._init_knowledge_base()
        self.intent_patterns = self._init_intent_patterns()

    def _init_knowledge_base(self) -> dict[str, dict[str, Any]]:
        """Initialize the bot's knowledge base with product information"""
        return {
            "plans_and_pricing": {
                "keywords": [
                    "plan",
                    "pricing",
                    "cost",
                    "price",
                    "upgrade",
                    "features",
                    "basic",
                    "premium",
                    "deluxe",
                ],
                "response": """I'd be happy to help you with our pricing plans! 

**SGPT Plans:**
• **Basic** - Free forever: Basic email campaigns, SMTP/IMAP, templates
• **Premium** - AI-powered campaigns with subject generation and content optimization
• **Deluxe** - Full automation suite with unlimited AI calls and premium support
• **Enterprise** - Custom solutions with dedicated support

Would you like me to help you find the best plan for your needs? What's your main use case?""",
                "suggested_actions": [
                    "Show pricing page",
                    "Schedule demo",
                    "Contact sales",
                ],
                "intent": "pricing_inquiry",
            },
            "getting_started": {
                "keywords": [
                    "getting started",
                    "how to start",
                    "tutorial",
                    "guide",
                    "setup",
                    "begin",
                ],
                "response": """Welcome to SGPT! I'll help you get started:

**Quick Setup Steps:**
1. **Connect your email** - Add your SMTP/IMAP settings
2. **Import your contacts** - Upload your email lists
3. **Create templates** - Design beautiful email templates
4. **Launch campaigns** - Start sending targeted emails

**Need help with any of these steps?** I can guide you through each one. What would you like to start with?""",
                "suggested_actions": [
                    "SMTP setup guide",
                    "Import contacts",
                    "Template builder",
                ],
                "intent": "onboarding",
            },
            "smtp_imap_help": {
                "keywords": [
                    "smtp",
                    "imap",
                    "email settings",
                    "connection",
                    "configuration",
                    "server",
                ],
                "response": """I can help you configure your email settings:

**SMTP Setup (for sending):**
• Most providers: smtp.yourdomain.com, port 587
• Gmail: smtp.gmail.com, port 587
• Outlook: smtp-mail.outlook.com, port 587

**IMAP Setup (for receiving):**
• Gmail: imap.gmail.com, port 993
• Outlook: outlook.office365.com, port 993

**Need specific help?** I can provide detailed settings for your email provider. Which one are you using?""",
                "suggested_actions": [
                    "Gmail setup",
                    "Outlook setup",
                    "Custom domain",
                ],
                "intent": "technical_support",
            },
            "campaign_creation": {
                "keywords": [
                    "campaign",
                    "email campaign",
                    "send emails",
                    "create campaign",
                    "bulk email",
                ],
                "response": """Let me guide you through creating your first email campaign:

**Campaign Creation Steps:**
1. **Choose your audience** - Select your contact lists
2. **Design your email** - Use our template builder or HTML editor
3. **Set your schedule** - Send now or schedule for later
4. **Track performance** - Monitor opens, clicks, and responses

**Pro tip:** Our AI can help optimize your subject lines and content for better engagement!

Would you like help with any specific part?""",
                "suggested_actions": [
                    "Create campaign",
                    "Template builder",
                    "AI optimization",
                ],
                "intent": "feature_usage",
            },
            "ai_features": {
                "keywords": [
                    "ai",
                    "artificial intelligence",
                    "smart",
                    "optimization",
                    "auto",
                    "automation",
                ],
                "response": """Our AI features can supercharge your email marketing:

**Available AI Tools:**
• **Subject Line Generation** - Create compelling subjects that get opened
• **Content Optimization** - Improve your email copy for better engagement
• **Send Time Optimization** - AI picks the best time to send
• **Audience Segmentation** - Smart grouping for targeted campaigns

**Available on Premium+ plans.** These features use advanced AI to improve your results by up to 40%!

Want to see how AI can improve your campaigns?""",
                "suggested_actions": [
                    "Try AI features",
                    "View examples",
                    "Upgrade plan",
                ],
                "intent": "feature_inquiry",
            },
            "technical_issues": {
                "keywords": [
                    "error",
                    "problem",
                    "not working",
                    "bug",
                    "issue",
                    "help",
                    "support",
                ],
                "response": """I'm sorry you're experiencing an issue! Let me help troubleshoot:

**Common Solutions:**
• **Login issues** - Try clearing your browser cache
• **Email not sending** - Check your SMTP settings
• **Slow performance** - Check your internet connection
• **Import problems** - Verify your CSV format

**Still need help?** I can connect you with our technical support team who can diagnose the specific issue.

Can you describe what you're trying to do and what's happening?""",
                "suggested_actions": [
                    "Contact support",
                    "Check status page",
                    "View documentation",
                ],
                "intent": "technical_support",
                "escalate": True,
            },
            "account_billing": {
                "keywords": [
                    "billing",
                    "payment",
                    "invoice",
                    "refund",
                    "cancel",
                    "subscription",
                ],
                "response": """I can help with basic billing questions:

**Common Billing Info:**
• Plans are billed monthly/annually
• Cancel anytime from your account settings
• Refunds available within 30 days
• Upgrade/downgrade takes effect immediately

**For specific billing issues** like payment problems or refund requests, I'll connect you with our billing team who can access your account details.

What billing question can I help with?""",
                "suggested_actions": [
                    "View billing",
                    "Contact billing",
                    "Manage subscription",
                ],
                "intent": "billing_inquiry",
                "escalate": True,
            },
            "integrations": {
                "keywords": [
                    "integration",
                    "api",
                    "webhook",
                    "connect",
                    "third party",
                    "zapier",
                ],
                "response": """SGPT integrates with many popular tools:

**Popular Integrations:**
• **CRM Systems** - Salesforce, HubSpot, Pipedrive
• **E-commerce** - Shopify, WooCommerce, Magento
• **Automation** - Zapier, Make.com, IFTTT
• **Analytics** - Google Analytics, Facebook Pixel

**API Access** is available on Deluxe+ plans for custom integrations.

Which platform are you looking to connect with?""",
                "suggested_actions": [
                    "View all integrations",
                    "API documentation",
                    "Contact for custom",
                ],
                "intent": "integration_inquiry",
            },
        }

    def _init_intent_patterns(self) -> dict[str, list[str]]:
        """Initialize patterns for intent detection"""
        return {
            "greeting": [
                r"^(hi|hello|hey|good (morning|afternoon|evening))",
                r"(how are you|what's up)",
            ],
            "pricing_inquiry": [
                r"(how much|what.*cost|price|pricing|plan|upgrade)",
                r"(free|trial|demo)",
            ],
            "technical_support": [
                r"(help|problem|issue|error|not working|broken)",
                r"(how to|how do i|configure|setup|install)",
            ],
            "sales_inquiry": [
                r"(buy|purchase|sales|demo|consultation)",
                r"(features|capabilities|what can.*do)",
            ],
            "billing_inquiry": [
                r"(billing|payment|invoice|refund|cancel|subscription)",
                r"(charge|credit card|upgrade|downgrade)",
            ],
            "goodbye": [
                r"(bye|goodbye|see you|thanks|thank you)",
                r"(that's all|no more questions)",
            ],
        }

    async def generate_response(
        self,
        message: str,
        chat: Chat,
        db: AsyncSession,
        user_context: UserContextData | None = None,
    ) -> BotResponse:
        """Generate an intelligent response to user message"""

        try:
            # Get or create bot session
            chat_id = (
                getattr(chat, "id", chat.id)
                if hasattr(chat, "id")
                else chat.id
            )
            bot_session = await self._get_or_create_bot_session(chat_id, db)

            # Analyze user intent
            detected_intent = self._analyze_intent(message)

            # Get conversation context
            context = await self._build_conversation_context(chat_id, db)

            # Extract user data and update context
            extracted_data = self._extract_user_data(message, user_context)

            # Check for predefined responses first
            predefined_response = self._check_predefined_responses(
                message, detected_intent, user_context
            )

            if predefined_response:
                confidence = 85
                response_content = predefined_response["response"]
                suggested_actions = predefined_response.get(
                    "suggested_actions", []
                )
                requires_escalation = predefined_response.get(
                    "escalate", False
                )
            else:
                # Generate AI response using conversation context
                ai_response = await self._generate_ai_response(
                    message,
                    context,
                    detected_intent,
                    user_context,
                    bot_session,
                )
                confidence = ai_response["confidence"]
                response_content = ai_response["content"]
                suggested_actions = ai_response.get("suggested_actions", [])
                requires_escalation = confidence < self.escalation_threshold

            # Update bot session with new context
            await self._update_bot_session(
                bot_session,
                message,
                response_content,
                detected_intent,
                extracted_data,
                db,
            )

            # Determine if escalation is needed
            if requires_escalation or self._should_escalate(
                message, detected_intent
            ):
                suggested_actions.append("Connect with human agent")
                requires_escalation = True

            return BotResponse(
                content=response_content,
                confidence=confidence,
                suggested_actions=suggested_actions,
                requires_escalation=requires_escalation,
                detected_intent=detected_intent,
                extracted_data=extracted_data,
            )

        except Exception as e:
            logger.error(f"Error generating bot response: {e}")
            return BotResponse(
                content="I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent who can help.",
                confidence=0,
                suggested_actions=["Connect with human agent"],
                requires_escalation=True,
                detected_intent="error",
            )

    async def _get_or_create_bot_session(
        self, chat_id: int, db: AsyncSession
    ) -> ChatBotSession:
        """Get existing bot session or create new one"""
        stmt = select(ChatBotSession).where(ChatBotSession.chat_id == chat_id)
        result = await db.execute(stmt)
        bot_session = result.scalar_one_or_none()

        if not bot_session:
            bot_session = ChatBotSession(
                chat_id=chat_id,
                bot_name=self.bot_name,
                context_messages=[],
                user_data={},
                intent_analysis={},
            )
            db.add(bot_session)
            await db.commit()
            await db.refresh(bot_session)

        return bot_session

    def _analyze_intent(self, message: str) -> str | None:
        """Analyze message to detect user intent"""
        message_lower = message.lower()

        # Check against intent patterns
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return intent

        # Check against knowledge base keywords
        for topic, data in self.knowledge_base.items():
            keywords = data["keywords"]
            if any(keyword in message_lower for keyword in keywords):
                return data.get("intent", topic)

        return None

    async def _build_conversation_context(
        self, chat_id: int, db: AsyncSession
    ) -> list[dict[str, Any]]:
        """Build conversation context from recent messages"""
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.chat_id == chat_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(self.max_context_messages)
        )
        result = await db.execute(stmt)
        messages = result.scalars().all()

        context = []
        for msg in reversed(messages):  # Reverse to chronological order
            context.append(
                {
                    "role": "user"
                    if msg.message_type.name == MessageType.USER.name
                    else "assistant",
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat(),
                    "message_type": msg.message_type.value,
                }
            )

        return context

    def _extract_user_data(
        self, message: str, user_context: UserContextData | None = None
    ) -> dict[str, Any]:
        """Extract useful data from user message"""
        extracted = {}

        # Extract email addresses
        email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        emails = re.findall(email_pattern, message)
        if emails:
            extracted["emails"] = emails

        # Extract company names (basic pattern)
        company_pattern = (
            r"\b(?:at|from|work for|company) ([A-Z][a-zA-Z\s]+?)(?:\.|,|\s|$)"
        )
        companies = re.findall(company_pattern, message, re.IGNORECASE)
        if companies:
            extracted["companies"] = [c.strip() for c in companies]

        # Extract numbers (could be subscriber counts, etc.)
        number_pattern = r"\b(\d{1,3}(?:,\d{3})*|\d+)\b"
        numbers = re.findall(number_pattern, message)
        if numbers:
            extracted["numbers"] = numbers

        # Add user context if available
        if user_context:
            extracted["user_plan"] = user_context.plan_code
            extracted["is_registered"] = user_context.user_id is not None

        return extracted

    def _check_predefined_responses(
        self,
        message: str,
        intent: str | None,
        user_context: UserContextData | None = None,
    ) -> dict[str, Any] | None:
        """Check if message matches predefined responses"""

        message_lower = message.lower()

        # Direct intent match
        if intent and intent in [
            data.get("intent") for data in self.knowledge_base.values()
        ]:
            for topic, data in self.knowledge_base.items():
                if data.get("intent") == intent:
                    return data

        # Keyword matching with scoring
        best_match = None
        best_score = 0

        for topic, data in self.knowledge_base.items():
            keywords = data["keywords"]
            score = sum(1 for keyword in keywords if keyword in message_lower)

            if (
                score > best_score and score >= 2
            ):  # Require at least 2 keyword matches
                best_score = score
                best_match = data

        # Personalize response based on user context
        if best_match and user_context:
            response = best_match["response"]

            # Add user-specific information
            if user_context.username:
                response = f"Hi {user_context.username}! " + response

            # Customize based on plan
            if user_context.plan_code == "basic" and "ai" in message_lower:
                response += "\n\n*Note: AI features are available with Premium+ plans. Would you like to learn about upgrading?*"

        return best_match

    async def _generate_ai_response(
        self,
        message: str,
        context: list[dict[str, Any]],
        intent: str | None,
        user_context: UserContextData | None,
        bot_session: ChatBotSession,
    ) -> dict[str, Any]:
        """Generate AI response using the AI service"""

        try:
            # Build comprehensive prompt for AI
            system_prompt = self._build_system_prompt(user_context, intent)

            # Prepare conversation context
            conversation = []
            for msg in context[-10:]:  # Last 10 messages for context
                conversation.append(
                    {"role": msg["role"], "content": msg["content"]}
                )

            # Add current user message
            conversation.append({"role": "user", "content": message})

            # Call AI service
            ai_response = await self.ai_service.generate_chat_completion(
                messages=conversation,
                system_prompt=system_prompt,
                max_tokens=500,
                temperature=0.7,
            )

            if ai_response.get("success"):
                content = ai_response["response"]
                confidence = min(
                    85, max(60, len(content) // 2)
                )  # Basic confidence scoring

                return {
                    "content": content,
                    "confidence": confidence,
                    "suggested_actions": self._generate_suggested_actions(
                        intent, user_context
                    ),
                }
            else:
                raise Exception(
                    f"AI service error: {ai_response.get('error')}"
                )

        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            return {
                "content": "I'm having trouble understanding your request. Could you please rephrase it, or would you like me to connect you with a human agent?",
                "confidence": 30,
                "suggested_actions": [
                    "Rephrase question",
                    "Connect with human agent",
                ],
            }

    def _build_system_prompt(
        self, user_context: UserContextData | None, intent: str | None
    ) -> str:
        """Build system prompt for AI based on context"""

        base_prompt = f"""You are {self.bot_name}, a helpful AI assistant for SGPT, an email marketing platform. 

Key Information:
        - SGPT offers email marketing tools with SMTP/IMAP integration
- Plans: Basic (free), Premium (AI features), Deluxe (unlimited AI), Enterprise (custom)
- Main features: Email campaigns, templates, analytics, AI optimization, automation

Your personality:
- Friendly, professional, and helpful
- Knowledgeable about email marketing
- Always try to be solution-oriented
- Keep responses concise but informative
- If you're unsure, offer to connect with a human agent

"""

        if user_context:
            if user_context.plan_code:
                base_prompt += (
                    f"User's current plan: {user_context.plan_code.title()}\n"
                )
            if user_context.username:
                base_prompt += f"User's name: {user_context.username}\n"

        if intent:
            base_prompt += f"Detected intent: {intent}\n"

        base_prompt += "\nAlways end with a question or suggested next step to keep the conversation flowing."

        return base_prompt

    def _generate_suggested_actions(
        self, intent: str | None, user_context: UserContextData | None
    ) -> list[str]:
        """Generate contextual suggested actions"""

        actions = []

        if intent == "pricing_inquiry":
            actions.extend(["View pricing", "Compare plans", "Schedule demo"])
        elif intent == "technical_support":
            actions.extend(
                ["View documentation", "Contact support", "Check status"]
            )
        elif intent == "onboarding":
            actions.extend(["Setup guide", "Tutorial videos", "Live demo"])
        elif intent == "sales_inquiry":
            actions.extend(["Schedule call", "View features", "Get quote"])
        else:
            actions.extend(["Learn more", "Contact support", "View docs"])

        # Add plan-specific actions
        if user_context and user_context.plan_code == "basic":
            actions.append("Upgrade plan")

        return actions[:3]  # Limit to 3 actions

    def _should_escalate(self, message: str, intent: str | None) -> bool:
        """Determine if message should be escalated to human"""

        escalation_keywords = [
            "speak to human",
            "real person",
            "agent",
            "representative",
            "cancel my account",
            "refund",
            "billing issue",
            "payment problem",
            "urgent",
            "emergency",
            "complaint",
            "angry",
            "frustrated",
        ]

        message_lower = message.lower()

        # Check for explicit escalation requests
        if any(keyword in message_lower for keyword in escalation_keywords):
            return True

        # Escalate complex technical issues
        if intent == "technical_support" and any(
            word in message_lower
            for word in ["api", "webhook", "custom", "integration"]
        ):
            return True

        # Escalate billing/account issues
        if intent == "billing_inquiry":
            return True

        return False

    async def _update_bot_session(
        self,
        bot_session: ChatBotSession,
        user_message: str,
        bot_response: str,
        intent: str | None,
        extracted_data: dict[str, Any],
        db: AsyncSession,
    ):
        """Update bot session with conversation data"""

        # Add to context messages using model method
        bot_session.add_context_message(
            {
                "user_message": user_message,
                "bot_response": bot_response,
                "intent": intent,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # Keep only recent messages
        bot_session.trim_context_messages(self.max_context_messages)

        # Update user data using model method
        bot_session.update_user_data(extracted_data)

        # Update intent analysis using model method
        if intent:
            bot_session.increment_intent(intent)

        # Update counters and timestamp using model methods
        bot_session.increment_responses()
        bot_session.last_response_at = datetime.now()

        await db.commit()

    async def learn_from_conversation(
        self, chat_id: int, feedback: dict[str, Any], db: AsyncSession
    ):
        """Learn from conversation feedback to improve responses"""

        try:
            # Get bot session
            stmt = select(ChatBotSession).where(
                ChatBotSession.chat_id == chat_id
            )
            result = await db.execute(stmt)
            bot_session = result.scalar_one_or_none()

            if not bot_session:
                return

            # Process feedback
            if feedback.get("helpful") == True:
                bot_session.increment_successful_responses()

            if feedback.get("escalated") == True:
                bot_session.increment_escalations()

                # Learn from escalation triggers
                if "reason" in feedback:
                    recent_context = (
                        bot_session.get_context_messages()[-3:]
                        if bot_session.get_context_messages()
                        else []
                    )
                    bot_session.add_escalation_trigger(
                        {
                            "reason": feedback["reason"],
                            "timestamp": datetime.now().isoformat(),
                            "context": recent_context,
                        }
                    )

            if feedback.get("resolved") == True:
                # Track successful resolution
                context_messages = bot_session.get_context_messages()
                intent_analysis = bot_session.get_intent_analysis()
                bot_session.add_resolved_issue(
                    {
                        "timestamp": datetime.now().isoformat(),
                        "conversation_length": len(context_messages),
                        "primary_intent": self._get_primary_intent(
                            intent_analysis
                        ),
                    }
                )

            await db.commit()

        except Exception as e:
            logger.error(f"Error learning from conversation: {e}")

    def _get_primary_intent(
        self, intent_analysis: dict[str, int]
    ) -> str | None:
        """Get the most frequent intent from analysis"""
        if not intent_analysis:
            return None
        return max(intent_analysis.items(), key=lambda x: x[1])[0]

    async def get_bot_analytics(
        self, db: AsyncSession, days: int = 30
    ) -> dict[str, Any]:
        """Get bot performance analytics"""

        try:
            since_date = datetime.now() - timedelta(days=days)

            # Get bot sessions from the last N days
            stmt = select(ChatBotSession).where(
                ChatBotSession.created_at >= since_date
            )
            result = await db.execute(stmt)
            sessions = result.scalars().all()

            if not sessions:
                return {"error": "No bot sessions found"}

            # Calculate metrics
            total_responses = sum(
                getattr(s, "total_responses", 0) or 0 for s in sessions
            )
            successful_responses = sum(
                getattr(s, "successful_responses", 0) or 0 for s in sessions
            )
            total_escalations = sum(
                getattr(s, "escalations", 0) or 0 for s in sessions
            )

            success_rate = (
                (successful_responses / total_responses * 100)
                if total_responses > 0
                else 0
            )
            escalation_rate = (
                (total_escalations / len(sessions) * 100) if sessions else 0
            )

            # Aggregate intent analysis
            all_intents = {}
            for session in sessions:
                intent_analysis = session.get_intent_analysis()
                for intent, count in intent_analysis.items():
                    all_intents[intent] = all_intents.get(intent, 0) + count

            return {
                "period_days": days,
                "total_sessions": len(sessions),
                "total_responses": total_responses,
                "success_rate": round(success_rate, 2),
                "escalation_rate": round(escalation_rate, 2),
                "most_common_intents": dict(
                    sorted(
                        all_intents.items(), key=lambda x: x[1], reverse=True
                    )[:5]
                ),
                "avg_responses_per_session": round(
                    total_responses / len(sessions), 2
                )
                if sessions
                else 0,
            }

        except Exception as e:
            logger.error(f"Error getting bot analytics: {e}")
            return {"error": str(e)}
