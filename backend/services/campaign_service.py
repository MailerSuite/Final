import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import smtp_configs
from core.logger import get_logger
from models.base import (
    Campaign,
    Domain,
    EmailTemplate,
    LeadBase,
    LeadEntry,
    ProxyServer,
    SMTPAccount,
)
from routers.websocket import send_job_log_update
from schemas.campaigns import (
    CampaignCreate,
    CampaignOptions,
    CampaignProgress,
    CampaignResponse,
    CampaignSummary,
    MailerConfigOut,
    MockTestError,
    SchedulingOption,
)
from schemas.domain import Domain as DomainSchema
from schemas.proxy import ProxyServer as ProxyServerSchema
from schemas.smtp import SMTPAccount as SMTPAccountSchema
from schemas.templates import EmailTemplate as EmailTemplateSchema
from services.email_service import EmailService
from services.proxy_service import ProxyService
from services.smtp_service import SMTPService
from services.template_service import TemplateService
from tasks.campaign_tasks import send_campaign_batch
from utils.html_randomizer import randomize_html

logger = get_logger(__name__)

from sqlalchemy import desc
from sqlalchemy.orm import Session

from core.logger import get_logger
from models.base import CampaignEmail
from models.email_status import EmailStatus

# from models.recipients import RecipientList, Recipient  # Replaced with LeadEntry
from schemas.campaigns import CampaignStatus, CampaignUpdate

logger = get_logger(__name__)


class CampaignService:
    @staticmethod
    def get_user_campaigns(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[Campaign]:
        """Get user campaigns with filtering"""
        query = db.query(Campaign).filter(Campaign.user_id == user_id)

        if status:
            query = query.filter(Campaign.status == status)

        return (
            query.order_by(desc(Campaign.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_campaign(db: Session, campaign_id: int) -> Campaign | None:
        """Get campaign by ID"""
        return db.query(Campaign).filter(Campaign.id == campaign_id).first()

    @staticmethod
    def create_campaign(
        db: Session, campaign_data: CampaignCreate, user_id: int
    ) -> Campaign:
        """Create a new campaign"""
        try:
            # Create campaign object
            campaign = Campaign(
                user_id=user_id,
                name=campaign_data.name,
                subject=campaign_data.subject,
                preview_text=campaign_data.preview_text,
                from_name=campaign_data.from_name,
                from_email=campaign_data.from_email,
                reply_to=campaign_data.reply_to,
                html_content=campaign_data.html_content,
                text_content=campaign_data.text_content,
                template_id=campaign_data.template_id,
                scheduled_at=campaign_data.scheduled_at,
                tracking_enabled=campaign_data.tracking_enabled,
                open_tracking=campaign_data.open_tracking,
                click_tracking=campaign_data.click_tracking,
                unsubscribe_tracking=campaign_data.unsubscribe_tracking,
                status=CampaignStatus.SCHEDULED
                if campaign_data.scheduled_at
                else CampaignStatus.DRAFT,
            )

            db.add(campaign)
            db.flush()  # Fetch generated campaign ID

            # Process recipients
            recipients_count = 0

            # Add recipients from lists
            if campaign_data.recipient_lists:
                for list_id in campaign_data.recipient_lists:
                    # Replace Recipient with LeadEntry
                    recipients = (
                        db.query(LeadEntry)
                        .filter(
                            LeadEntry.lead_base_id == list_id,
                            LeadEntry.email.isnot(None),
                        )
                        .all()
                    )

                    for recipient in recipients:
                        campaign_email = CampaignEmail(
                            campaign_id=campaign.id,
                            email=recipient.email,
                            lead_id=recipient.id,
                            status=EmailStatus.PENDING,
                        )
                        db.add(campaign_email)
                        recipients_count += 1

            # Add direct recipients
            if (
                hasattr(campaign_data, "recipients")
                and campaign_data.recipients
            ):
                for email in campaign_data.recipients:
                    campaign_email = CampaignEmail(
                        campaign_id=campaign.id,
                        email=str(email),
                        status=EmailStatus.PENDING,
                    )
                    db.add(campaign_email)
                    recipients_count += 1

            # Update recipients counter
            campaign.total_recipients = recipients_count

            db.commit()
            db.refresh(campaign)

            logger.info(
                f"Campaign {campaign.id} created with {recipients_count} recipients"
            )
            return campaign

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating campaign: {e}")
            raise

    @staticmethod
    def update_campaign(
        db: Session, campaign_id: int, campaign_data: CampaignUpdate
    ) -> Campaign:
        """Update campaign"""
        try:
            campaign = (
                db.query(Campaign).filter(Campaign.id == campaign_id).first()
            )

            if not campaign:
                raise ValueError("Campaign not found")

            # Update fields
            update_data = campaign_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(campaign, field, value)

            campaign.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(campaign)

            logger.info(f"Campaign {campaign_id} updated")
            return campaign

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating campaign {campaign_id}: {e}")
            raise

    @staticmethod
    def delete_campaign(db: Session, campaign_id: int) -> bool:
        """Delete campaign"""
        try:
            # Delete related emails
            db.query(CampaignEmail).filter(
                CampaignEmail.campaign_id == campaign_id
            ).delete()

            # Delete campaign
            campaign = (
                db.query(Campaign).filter(Campaign.id == campaign_id).first()
            )
            if campaign:
                db.delete(campaign)
                db.commit()
                logger.info(f"Campaign {campaign_id} deleted")
                return True

            return False

        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting campaign {campaign_id}: {e}")
            raise

    @staticmethod
    def update_campaign_status(
        db: Session, campaign_id: int, status: str
    ) -> Campaign:
        """Update campaign status"""
        try:
            campaign = (
                db.query(Campaign).filter(Campaign.id == campaign_id).first()
            )

            if not campaign:
                raise ValueError("Campaign not found")

            campaign.status = status
            campaign.updated_at = datetime.utcnow()

            if status == CampaignStatus.SENT:
                campaign.sent_at = datetime.utcnow()

            db.commit()
            db.refresh(campaign)

            logger.info(f"Campaign {campaign_id} status updated to {status}")
            return campaign

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating campaign {campaign_id} status: {e}")
            raise

    @staticmethod
    def get_campaign_stats(db: Session, campaign_id: int) -> dict[str, Any]:
        """Get campaign statistics"""
        try:
            campaign = (
                db.query(Campaign).filter(Campaign.id == campaign_id).first()
            )

            if not campaign:
                raise ValueError("Campaign not found")

            # Compute statistics
            stats = (
                db.query(
                    func.count(CampaignEmail.id).label("total_recipients"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.status == EmailStatus.SENT, 1)],
                            else_=0,
                        )
                    ).label("emails_sent"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.status == EmailStatus.PENDING, 1)],
                            else_=0,
                        )
                    ).label("emails_pending"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.status == EmailStatus.FAILED, 1)],
                            else_=0,
                        )
                    ).label("emails_failed"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.opened_at.isnot(None), 1)], else_=0
                        )
                    ).label("opens"),
                    func.count(
                        func.distinct(
                            func.case(
                                [
                                    (
                                        CampaignEmail.opened_at.isnot(None),
                                        CampaignEmail.id,
                                    )
                                ],
                                else_=None,
                            )
                        )
                    ).label("unique_opens"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.clicked_at.isnot(None), 1)],
                            else_=0,
                        )
                    ).label("clicks"),
                    func.count(
                        func.distinct(
                            func.case(
                                [
                                    (
                                        CampaignEmail.clicked_at.isnot(None),
                                        CampaignEmail.id,
                                    )
                                ],
                                else_=None,
                            )
                        )
                    ).label("unique_clicks"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.status == EmailStatus.BOUNCED, 1)],
                            else_=0,
                        )
                    ).label("bounces"),
                    func.sum(
                        func.case(
                            [(CampaignEmail.unsubscribed_at.isnot(None), 1)],
                            else_=0,
                        )
                    ).label("unsubscribes"),
                )
                .filter(CampaignEmail.campaign_id == campaign_id)
                .first()
            )

            # Calculate percentages
            total = stats.total_recipients or 1
            sent = stats.emails_sent or 0

            return {
                "campaign_id": campaign_id,
                "total_recipients": stats.total_recipients or 0,
                "emails_sent": sent,
                "emails_pending": stats.emails_pending or 0,
                "emails_failed": stats.emails_failed or 0,
                "opens": stats.opens or 0,
                "unique_opens": stats.unique_opens or 0,
                "clicks": stats.clicks or 0,
                "unique_clicks": stats.unique_clicks or 0,
                "bounces": stats.bounces or 0,
                "unsubscribes": stats.unsubscribes or 0,
                "open_rate": round((stats.opens or 0) / sent * 100, 2)
                if sent > 0
                else 0,
                "click_rate": round((stats.clicks or 0) / sent * 100, 2)
                if sent > 0
                else 0,
                "bounce_rate": round((stats.bounces or 0) / sent * 100, 2)
                if sent > 0
                else 0,
                "unsubscribe_rate": round(
                    (stats.unsubscribes or 0) / sent * 100, 2
                )
                if sent > 0
                else 0,
            }

        except Exception as e:
            logger.error(f"Error getting campaign {campaign_id} stats: {e}")
            raise

    @staticmethod
    def get_campaign_emails(
        db: Session,
        campaign_id: int,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[CampaignEmail]:
        """Get campaign emails"""
        query = db.query(CampaignEmail).filter(
            CampaignEmail.campaign_id == campaign_id
        )

        if status:
            query = query.filter(CampaignEmail.status == status)

        return (
            query.order_by(desc(CampaignEmail.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_campaigns_for_sending(db: Session) -> list[Campaign]:
        """Get campaigns ready for sending"""
        now = datetime.utcnow()
        return (
            db.query(Campaign)
            .filter(
                Campaign.status == CampaignStatus.SCHEDULED,
                Campaign.scheduled_at <= now,
            )
            .all()
        )

    @staticmethod
    def update_email_status(
        db: Session,
        email_id: int,
        status: str,
        error_message: str | None = None,
    ) -> bool:
        """Update email status"""
        try:
            email = (
                db.query(CampaignEmail)
                .filter(CampaignEmail.id == email_id)
                .first()
            )

            if not email:
                return False

            email.status = status

            if status == EmailStatus.SENT:
                email.sent_at = datetime.utcnow()
            elif status == EmailStatus.OPENED:
                email.opened_at = datetime.utcnow()
            elif status == EmailStatus.CLICKED:
                email.clicked_at = datetime.utcnow()
            elif status == EmailStatus.BOUNCED:
                email.bounced_at = datetime.utcnow()

            if error_message:
                email.error_message = error_message

            db.commit()
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating email {email_id} status: {e}")
            return False

    def __init__(self, db: AsyncSession):
        self.db = db
        self.smtp_service = SMTPService(db)
        self.email_service = EmailService()
        self.proxy_service = ProxyService(db)
        self.active_campaigns: dict[str, asyncio.Task] = {}

    async def create_campaign(
        self, campaign_data: CampaignCreate, session_id: str
    ) -> CampaignResponse:
        """
        📧 Create a new campaign

        Process:
        1. Validate template and resources
        2. Count recipients from lead bases
        3. Create database record
        4. Autostart if enabled
        """
        try:
            template_query = select(EmailTemplate).where(
                EmailTemplate.id == campaign_data.template_id,
                EmailTemplate.session_id == session_id,
            )
            template = await self.db.scalar(template_query)
            if not template:
                raise ValueError(
                    f"Template {campaign_data.template_id} not found"
                )
            if campaign_data.lead_base_ids:
                lead_bases_query = select(LeadBase).where(
                    LeadBase.id.in_(campaign_data.lead_base_ids),
                    LeadBase.session_id == session_id,
                )
                lead_bases = await self.db.scalars(lead_bases_query)
                lead_bases_list = list(lead_bases)
                if len(lead_bases_list) != len(campaign_data.lead_base_ids):
                    raise ValueError("Some lead bases not found")
            total_recipients = await self._count_recipients(
                campaign_data.lead_base_ids, session_id
            )
            campaign = Campaign(
                id=str(uuid.uuid4()),
                session_id=session_id,
                name=campaign_data.name,
                template_id=campaign_data.template_id,
                subject=campaign_data.subject or template.subject,
                proxy_type=campaign_data.proxy_type,
                proxy_host=campaign_data.proxy_host,
                proxy_port=campaign_data.proxy_port,
                proxy_username=campaign_data.proxy_username,
                proxy_password=campaign_data.proxy_password,
                sender=campaign_data.sender,
                cc=campaign_data.cc,
                bcc=campaign_data.bcc,
                status="draft",
                total_recipients=total_recipients,
                batch_size=campaign_data.batch_size,
                delay_between_batches=campaign_data.delay_between_batches,
                threads_count=campaign_data.threads_count,
                created_at=datetime.utcnow(),
            )
            self.db.add(campaign)
            await self.db.commit()
            await self.db.refresh(campaign)
            if campaign_data.autostart:
                await self.start_campaign(campaign.id, session_id)
            logger.info(
                f"Campaign {campaign.id} created with {total_recipients} recipients"
            )
            return CampaignResponse.model_validate(campaign)
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating campaign: {e}")
            raise

    async def get_campaigns(
        self,
        session_id: str,
        skip: int = 0,
        limit: int = 50,
        status: str | None = None,
    ) -> list[CampaignResponse]:
        """📧 Get campaigns list with filtering"""
        query = select(Campaign).where(Campaign.session_id == session_id)
        if status:
            query = query.where(Campaign.status == status)
        query = (
            query.offset(skip)
            .limit(limit)
            .order_by(Campaign.created_at.desc())
        )
        campaigns = await self.db.scalars(query)
        return [CampaignResponse.model_validate(c) for c in campaigns]

    async def get_campaign(
        self, campaign_id: str, session_id: str
    ) -> CampaignResponse:
        """📧 Get campaign details"""
        query = select(Campaign).where(
            Campaign.id == campaign_id, Campaign.session_id == session_id
        )
        campaign = await self.db.scalar(query)
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        return CampaignResponse.model_validate(campaign)

    async def get_campaign_resources(
        self, campaign_id: str, session_id: str
    ) -> dict[str, Any]:
        campaign = await self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id, Campaign.session_id == session_id
            )
        )
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        template = await self.db.scalar(
            select(EmailTemplate).where(
                EmailTemplate.id == campaign.template_id
            )
        )
        smtp_accounts = await self.db.scalars(
            select(SMTPAccount).where(SMTPAccount.session_id == session_id)
        )
        proxies = await self.db.scalars(
            select(ProxyServer).where(ProxyServer.session_id == session_id)
        )
        domains = await self.db.scalars(select(Domain))
        return {
            "campaign": CampaignResponse.model_validate(campaign),
            "template": (
                EmailTemplateSchema.model_validate(template)
                if template
                else None
            ),
            "smtp_accounts": [
                SMTPAccountSchema.model_validate(a) for a in smtp_accounts
            ],
            "proxies": [ProxyServerSchema.model_validate(p) for p in proxies],
            "domains": [DomainSchema.model_validate(d) for d in domains],
        }

    async def start_campaign(
        self, campaign_id: str, session_id: str
    ) -> dict[str, Any]:
        """
        🚀 Start campaign

        Process:
        1. Check readiness (SMTP, proxy, leads)
        2. Update status to "running"
        3. Launch background sending task
        4. Monitoring via WebSocket
        """
        try:
            campaign = await self.db.scalar(
                select(Campaign).where(
                    Campaign.id == campaign_id,
                    Campaign.session_id == session_id,
                )
            )
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            if campaign.status not in ["draft", "paused"]:
                raise ValueError(
                    f"Campaign status {campaign.status} cannot be started"
                )
            await self._validate_campaign_resources(campaign, session_id)
            campaign.status = "running"
            campaign.started_at = datetime.utcnow()
            await self.db.commit()
            from tasks.campaign_tasks import run_campaign

            task = run_campaign.delay(campaign_id, session_id)
            self.active_campaigns[campaign_id] = task
            logger.info(f"Campaign {campaign_id} started")
            return {
                "message": "Campaign started successfully",
                "campaign_id": campaign_id,
                "status": "running",
            }
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error starting campaign {campaign_id}: {e}")
            raise

    async def pause_campaign(
        self, campaign_id: str, session_id: str
    ) -> dict[str, Any]:
        """⏸️ Pause campaign"""
        campaign = await self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id, Campaign.session_id == session_id
            )
        )
        if not campaign or campaign.status != "running":
            raise ValueError("Campaign not found or not running")
        if campaign_id in self.active_campaigns:
            self.active_campaigns[campaign_id].revoke(terminate=True)
            del self.active_campaigns[campaign_id]
        campaign.status = "paused"
        await self.db.commit()
        return {"message": "Campaign paused", "status": "paused"}

    async def stop_campaign(
        self, campaign_id: str, session_id: str
    ) -> dict[str, Any]:
        """⏹️ Stop campaign"""
        campaign = await self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id, Campaign.session_id == session_id
            )
        )
        if not campaign:
            raise ValueError("Campaign not found")
        if campaign_id in self.active_campaigns:
            self.active_campaigns[campaign_id].revoke(terminate=True)
            del self.active_campaigns[campaign_id]
        campaign.status = "stopped"
        campaign.completed_at = datetime.utcnow()
        await self.db.commit()
        return {"message": "Campaign stopped", "status": "stopped"}

    async def delete_campaign(
        self, campaign_id: str, session_id: str
    ) -> dict[str, str]:
        """🗑️ Delete campaign if it is not running"""
        campaign = await self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id, Campaign.session_id == session_id
            )
        )
        if not campaign:
            raise ValueError("Campaign not found")
        if campaign.status == "running":
            raise ValueError("Cannot delete a running campaign")
        if campaign_id in self.active_campaigns:
            self.active_campaigns[campaign_id].revoke(terminate=True)
            del self.active_campaigns[campaign_id]
        await self.db.delete(campaign)
        await self.db.commit()
        logger.info(f"Deleted campaign {campaign_id}")
        return {"message": "Campaign deleted"}

    async def get_campaign_progress(
        self, campaign_id: str, session_id: str
    ) -> CampaignProgress:
        """📊 Get campaign progress"""
        campaign = await self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id, Campaign.session_id == session_id
            )
        )
        if not campaign:
            raise ValueError("Campaign not found")
        progress_percentage = 0
        if campaign.total_recipients > 0:
            progress_percentage = (
                campaign.sent_count / campaign.total_recipients * 100
            )
        estimated_completion = None
        if (
            campaign.status == "running"
            and campaign.started_at
            and (campaign.sent_count > 0)
        ):
            elapsed = datetime.utcnow() - campaign.started_at
            rate = campaign.sent_count / elapsed.total_seconds()
            remaining = campaign.total_recipients - campaign.sent_count
            if rate > 0:
                remaining_seconds = remaining / rate
                estimated_completion = datetime.utcnow() + timedelta(
                    seconds=remaining_seconds
                )
        return CampaignProgress(
            campaign_id=campaign_id,
            status=campaign.status,
            progress_percentage=round(progress_percentage, 2),
            sent_count=campaign.sent_count,
            delivered_count=campaign.delivered_count,
            opened_count=campaign.opened_count,
            clicked_count=campaign.clicked_count,
            bounced_count=campaign.bounced_count,
            total_recipients=campaign.total_recipients,
            estimated_completion=estimated_completion,
        )

    async def _execute_campaign(self, campaign_id: str, session_id: str):
        try:
            logger.info(f"Starting campaign execution: {campaign_id}")
            campaign = await self.db.scalar(
                select(Campaign).where(Campaign.id == campaign_id)
            )
            if not campaign:
                logger.error(
                    f"Campaign {campaign_id} not found during execution."
                )
                return
            template = await self.db.scalar(
                select(EmailTemplate).where(
                    EmailTemplate.id == campaign.template_id
                )
            )
            if not template:
                logger.error(
                    f"Template {campaign.template_id} not found for campaign {campaign_id}."
                )
                campaign.status = "failed"
                campaign.error_message = "Email template not found."
                await self.db.commit()
                return
            smtp_accounts = await self.db.scalars(
                select(SMTPAccount).where(
                    SMTPAccount.session_id == session_id,
                    SMTPAccount.is_checked.is_(True),
                    SMTPAccount.status == "checked",
                )
            )
            smtp_list = list(smtp_accounts)
            if not smtp_list:
                logger.error(
                    f"No checked SMTP accounts found for campaign {campaign_id}."
                )
                campaign.status = "failed"
                campaign.error_message = "No checked SMTP accounts available."
                await self.db.commit()
                return
            proxy_list = await self.proxy_service.get_working_proxies(
                session_id
            )
            import os

            if os.getenv("FORCE_PROXY", "false").lower() == "true" and (
                not proxy_list
            ):
                logger.error(
                    f"No valid proxies found (required by FORCE_PROXY setting) for campaign {campaign_id}."
                )
                campaign.status = "failed"
                campaign.error_message = (
                    "No valid proxies available (FORCE_PROXY is true)."
                )
                await self.db.commit()
                return
            leads = await self._get_campaign_leads(campaign_id, session_id)
            if not leads:
                logger.warning(
                    f"No leads found for campaign {campaign_id}. Marking as completed."
                )
                campaign.status = "completed"
                campaign.completed_at = datetime.utcnow()
                await self.db.commit()
                return
            batch_size = campaign.batch_size
            delay = campaign.delay_between_batches
            threads = campaign.threads_count
            total_leads = len(leads)
            template_data = {
                "subject": template.subject,
                "html_content": template.html_content,
                "text_content": template.text_content,
            }
            for i in range(0, total_leads, batch_size):
                batch_leads = [
                    {
                        "id": lead.id,
                        "email": lead.email,
                        "first_name": lead.first_name,
                        "last_name": lead.last_name,
                    }
                    for lead in leads[i : i + batch_size]
                ]
                send_campaign_batch.delay(
                    campaign_id=campaign.id,
                    leads=batch_leads,
                    template=template_data,
                    batch_size=batch_size,
                    delay_between_batches=delay,
                    threads_count=threads,
                    proxy_type=campaign.proxy_type,
                    proxy_host=campaign.proxy_host,
                    proxy_port=campaign.proxy_port,
                    proxy_username=campaign.proxy_username,
                    proxy_password=campaign.proxy_password,
                )
                await send_job_log_update(
                    str(campaign.id),
                    {"event": "batch_queued", "batch": i // batch_size},
                )
                if i + batch_size < total_leads:
                    await asyncio.sleep(delay)
            logger.info(f"Campaign {campaign_id} queued {total_leads} leads")
        except asyncio.CancelledError:
            logger.info(f"Campaign {campaign_id} was cancelled")
            campaign = await self.db.scalar(
                select(Campaign).where(Campaign.id == campaign_id)
            )
            if campaign:
                campaign.status = "paused"
                await self.db.commit()
        except Exception as e:
            logger.error(f"Campaign {campaign_id} failed: {e}")
            campaign = await self.db.scalar(
                select(Campaign).where(Campaign.id == campaign_id)
            )
            if campaign:
                campaign.status = "failed"
                campaign.error_message = str(e)
                await self.db.commit()
        finally:
            if campaign_id in self.active_campaigns:
                del self.active_campaigns[campaign_id]
            await self.db.close()

    def _personalize_email(
        self, template: EmailTemplate, lead: LeadEntry
    ) -> dict[str, str]:
        """🎯 Personalize email for a specific lead"""
        replacements = {
            "{{EMAIL}}": lead.email,
            "{{FIRST_NAME}}": lead.first_name or "",
            "{{LAST_NAME}}": lead.last_name or "",
            "{{FULL_NAME}}": f"{lead.first_name or ''} {lead.last_name or ''}".strip(),
        }
        html_content = template.html_content or ""
        text_content = template.text_content or ""
        subject = template.subject
        for placeholder, value in replacements.items():
            html_content = html_content.replace(placeholder, value)
            text_content = text_content.replace(placeholder, value)
            subject = subject.replace(placeholder, value)
        tracking_pixel = f'<img src="https://track.example.com/open/{lead.id}" width="1" height="1" style="display:none;">'
        html_content += tracking_pixel
        return {"subject": subject, "html": html_content, "text": text_content}

    async def _count_recipients(
        self, lead_base_ids: list[str], session_id: str
    ) -> int:
        """📊 Count recipients from lead bases"""
        if not lead_base_ids:
            return 0
        query = select(func.count(LeadEntry.id)).where(
            LeadEntry.lead_base_id.in_(lead_base_ids),
            LeadEntry.status.in_(["new", "valid"]),
        )
        result = await self.db.scalar(query)
        return result or 0

    async def _get_campaign_leads(
        self, campaign_id: str, session_id: str
    ) -> list[LeadEntry]:
        """👥 Get leads for the campaign"""
        query = (
            select(LeadEntry)
            .where(LeadEntry.status.in_(["new", "valid"]))
            .limit(1000)
        )
        leads = await self.db.scalars(query)
        return list(leads)

    async def _update_campaign_stats(self, campaign_id: str, stat_type: str):
        """📊 Update campaign statistics"""
        campaign = await self.db.scalar(
            select(Campaign).where(Campaign.id == campaign_id)
        )
        if campaign:
            if stat_type == "delivered":
                campaign.delivered_count += 1
            elif stat_type == "bounced":
                campaign.bounced_count += 1
            elif stat_type == "opened":
                campaign.opened_count += 1
            elif stat_type == "clicked":
                campaign.clicked_count += 1
            await self.db.commit()

    async def _validate_campaign_resources(
        self, campaign: Campaign, session_id: str
    ):
        """✅ Validate resources before starting"""
        smtp_count = await self.db.scalar(
            select(func.count(SMTPAccount.id)).where(
                SMTPAccount.session_id == session_id,
                SMTPAccount.is_checked.is_(True),
                SMTPAccount.status == "checked",
            )
        )
        if smtp_count == 0:
            raise ValueError("No checked SMTP accounts found")
        proxy_count = await self.db.scalar(
            select(func.count(ProxyServer.id)).where(
                ProxyServer.session_id == session_id,
                ProxyServer.status == "valid",
                ProxyServer.is_active.is_(True),
            )
        )
        import os

        if (
            os.getenv("FORCE_PROXY", "false").lower() == "true"
            and proxy_count == 0
        ):
            raise ValueError(
                "No valid proxies found (required by FORCE_PROXY setting)"
            )
        logger.info(
            f"Campaign validation passed: {smtp_count} SMTP, {proxy_count} proxies"
        )

    async def run_mock_test(self, campaign_id: str) -> list[MockTestError]:
        errors: list[MockTestError] = []
        campaign = await self.db.scalar(
            select(Campaign).where(Campaign.id == campaign_id)
        )
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        try:
            await self._validate_campaign_resources(
                campaign, campaign.session_id
            )
        except Exception as exc:
            errors.append(
                MockTestError(step="campaign_settings", message=str(exc))
            )
        try:
            template = await self.db.scalar(
                select(EmailTemplate).where(
                    EmailTemplate.id == campaign.template_id
                )
            )
            if not template:
                raise ValueError("Template not found")
            service = TemplateService(self.db)
            rendered = await service.process_macros(
                template.html_content or "",
                {"email": "test@example.com"},
                {"id": campaign.id, "name": campaign.name},
            )
            if "{{" in rendered and "}}" in rendered:
                raise ValueError("Unresolved macros found")
        except Exception as exc:
            errors.append(MockTestError(step="template", message=str(exc)))
        try:
            smtp_account = await self.db.scalar(
                select(SMTPAccount).where(
                    SMTPAccount.session_id == campaign.session_id
                )
            )
            if not smtp_account:
                raise ValueError("No SMTP accounts available")
            await asyncio.to_thread(self._smtp_handshake, smtp_account)
        except Exception as exc:
            errors.append(MockTestError(step="smtp", message=str(exc)))
        try:
            if (
                campaign.proxy_type
                and campaign.proxy_type != "none"
                and campaign.proxy_host
            ):
                await asyncio.wait_for(
                    asyncio.open_connection(
                        campaign.proxy_host, int(campaign.proxy_port)
                    ),
                    timeout=5,
                )
        except Exception as exc:
            errors.append(MockTestError(step="proxy", message=str(exc)))
        redirect_domains = getattr(campaign, "redirect_domains", []) or []
        for domain in redirect_domains:
            try:
                await asyncio.get_event_loop().getaddrinfo(domain, None)
            except Exception as exc:
                errors.append(
                    MockTestError(
                        step="redirect_domains", message=f"{domain}: {exc}"
                    )
                )
        try:
            if template and template.html_content:
                randomize_html(template.html_content)
        except Exception as exc:
            errors.append(MockTestError(step="random_html", message=str(exc)))
        return errors

    def _smtp_handshake(self, account: SMTPAccount) -> None:
        import smtplib

        server = smtplib.SMTP(
            account.smtp_server, account.smtp_port, timeout=5
        )
        try:
            server.ehlo()
            if account.smtp_port in (587, 25):
                server.starttls()
                server.ehlo()
            server.login(account.email, account.password)
        finally:
            try:
                server.quit()
            except Exception:
                pass

    async def get_campaign_summary(
        self, session_id: str, db: AsyncSession
    ) -> CampaignSummary:
        """Return summary counts for templates and SMTP accounts."""
        tpl_count = await db.scalar(
            select(func.count())
            .select_from(EmailTemplate)
            .where(EmailTemplate.session_id == session_id)
        )
        smtp_count = await db.scalar(
            select(func.count())
            .select_from(SMTPAccount)
            .where(SMTPAccount.session_id == session_id)
        )
        return CampaignSummary(
            total_templates_loaded=tpl_count or 0,
            total_smtp_servers_configured=smtp_count or 0,
        )

    async def get_campaign_options(self) -> CampaignOptions:
        try:
            templates_result = await self.db.scalars(select(EmailTemplate))
            templates = [
                EmailTemplateSchema.model_validate(t) for t in templates_result
            ]
            mailers: list[MailerConfigOut] = []
            for name, cfg in smtp_configs.__dict__.items():
                if name.endswith("_CONFIG") and isinstance(cfg, dict):
                    mailers.append(
                        MailerConfigOut(
                            name=name.replace("_CONFIG", ""),
                            host=cfg.get("host", ""),
                            port=int(cfg.get("port", 0)),
                            encryption=str(cfg.get("encryption", "")),
                            username=str(cfg.get("username", "")),
                            password=str(cfg.get("password", "")),
                            tls_verify=bool(cfg.get("tls_verify", False)),
                        )
                    )
            scheduling_options = [
                SchedulingOption(
                    label="slow",
                    batch_size=50,
                    delay_between_batches=120,
                    threads_count=1,
                ),
                SchedulingOption(
                    label="normal",
                    batch_size=100,
                    delay_between_batches=60,
                    threads_count=5,
                ),
                SchedulingOption(
                    label="fast",
                    batch_size=200,
                    delay_between_batches=30,
                    threads_count=10,
                ),
            ]
            return CampaignOptions(
                templates=templates,
                mailers=mailers,
                schedulingOptions=scheduling_options,
            )
        except Exception as exc:
            logger.error(f"Error fetching campaign options: {exc}")
            raise
