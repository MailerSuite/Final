"""
🎯 TEMPLATE SERVICE - BUSINESS LOGIC
"""

import re
import uuid
from datetime import datetime

from core.logger import get_logger

logger = get_logger(__name__)


class TemplateService:
    """
    📧 Service for template management
    """

    def __init__(self, db_session):
        self.db = db_session

    async def process_macros(
        self, content: str, lead_data: dict, campaign_data: dict = None
    ) -> str:
        if not content:
            return content
        try:
            macros = {
                "{{EMAIL}}": lead_data.get("email", ""),
                "{{FIRST_NAME}}": lead_data.get("first_name", ""),
                "{{LAST_NAME}}": lead_data.get("last_name", ""),
                "{{FULL_NAME}}": f"{lead_data.get('first_name', '')} {lead_data.get('last_name', '')}".strip(),
                "{{COMPANY}}": lead_data.get("company", ""),
                "{{PHONE}}": lead_data.get("phone", ""),
                "{{COUNTRY}}": lead_data.get("country", ""),
                "{{CITY}}": lead_data.get("city", ""),
                "{{INDUSTRY}}": lead_data.get("industry", ""),
                "{{POSITION}}": lead_data.get("position", ""),
            }
            if campaign_data:
                macros.update(
                    {
                        "{{CAMPAIGN_NAME}}": campaign_data.get("name", ""),
                        "{{UNSUBSCRIBE_LINK}}": f"https://unsubscribe.example.com/{campaign_data.get('id')}/{lead_data.get('email')}",
                        "{{TRACKING_PIXEL}}": f"https://track.example.com/open/{campaign_data.get('id')}/{lead_data.get('email')}",
                    }
                )
            macros.update(
                {
                    "{{CURRENT_DATE}}": datetime.now().strftime("%Y-%m-%d"),
                    "{{CURRENT_YEAR}}": str(datetime.now().year),
                    "{{RANDOM_NUMBER}}": str(uuid.uuid4().int)[:6],
                }
            )
            if lead_data.get("custom_fields"):
                for field, value in lead_data["custom_fields"].items():
                    macros[f"{ {{field.upper()}} } "] = str(value)
            processed_content = content
            for macro, value in macros.items():
                processed_content = processed_content.replace(macro, value)
            logger.debug(f"✅ Processed {len(macros)} macros")
            return processed_content
        except Exception as e:
            logger.error(f"❌ Macro processing error: {e}")
            return content

    async def validate_template(
        self, template_data: dict
    ) -> dict[str, list[str]]:
        errors = []
        warnings = []
        try:
            if not template_data.get("name"):
                errors.append("Template name is required")
            if not template_data.get("subject"):
                errors.append("Subject is required")
            if not template_data.get("html_content") and (
                not template_data.get("text_content")
            ):
                errors.append("Either HTML or text content is required")
            html_content = template_data.get("html_content", "")
            if html_content:
                if not re.search(
                    "<html.*?>.*</html>",
                    html_content,
                    re.DOTALL | re.IGNORECASE,
                ):
                    warnings.append(
                        "HTML content should have proper HTML structure"
                    )
                if (
                    "{{UNSUBSCRIBE_LINK}}" not in html_content
                    and "unsubscribe" not in html_content.lower()
                ):
                    warnings.append(
                        "Consider adding unsubscribe link for compliance"
                    )
                if "{{TRACKING_PIXEL}}" not in html_content:
                    warnings.append(
                        "Tracking pixel will be automatically added"
                    )
            content = html_content + template_data.get("text_content", "")
            macros = re.findall("\\{\\{([^}]+)\\}\\}", content)
            known_macros = [
                "EMAIL",
                "FIRST_NAME",
                "LAST_NAME",
                "FULL_NAME",
                "COMPANY",
                "PHONE",
                "COUNTRY",
                "CITY",
                "INDUSTRY",
                "POSITION",
                "CAMPAIGN_NAME",
                "UNSUBSCRIBE_LINK",
                "TRACKING_PIXEL",
                "CURRENT_DATE",
                "CURRENT_YEAR",
                "RANDOM_NUMBER",
            ]
            unknown_macros = [m for m in macros if m not in known_macros]
            if unknown_macros:
                warnings.append(
                    f"Unknown macros found: {', '.join(unknown_macros)}"
                )
            return {
                "errors": errors,
                "warnings": warnings,
                "is_valid": len(errors) == 0,
            }
        except Exception as e:
            logger.error(f"❌ Template validation error: {e}")
            return {
                "errors": [f"Validation error: {str(e)}"],
                "warnings": [],
                "is_valid": False,
            }

    async def get_template_stats(self, template_id: str) -> dict:
        """
        📊 Template usage statistics
        """
        try:
            campaigns_query = "\n                SELECT \n                    COUNT(*) as total_campaigns,\n                    SUM(sent_count) as total_sent,\n                    SUM(delivered_count) as total_delivered,\n                    SUM(opened_count) as total_opened,\n                    SUM(clicked_count) as total_clicked\n                FROM campaigns \n                WHERE template_id = $1\n            "
            stats = await self.db.fetchrow(campaigns_query, template_id)
            total_sent = stats["total_sent"] or 0
            total_delivered = stats["total_delivered"] or 0
            total_opened = stats["total_opened"] or 0
            total_clicked = stats["total_clicked"] or 0
            delivery_rate = (
                total_delivered / total_sent * 100 if total_sent > 0 else 0
            )
            open_rate = (
                total_opened / total_delivered * 100
                if total_delivered > 0
                else 0
            )
            click_rate = (
                total_clicked / total_delivered * 100
                if total_delivered > 0
                else 0
            )
            return {
                "usage": {
                    "total_campaigns": stats["total_campaigns"],
                    "total_sent": total_sent,
                    "total_delivered": total_delivered,
                    "total_opened": total_opened,
                    "total_clicked": total_clicked,
                },
                "metrics": {
                    "delivery_rate": round(delivery_rate, 2),
                    "open_rate": round(open_rate, 2),
                    "click_rate": round(click_rate, 2),
                },
            }
        except Exception as e:
            logger.error(f"❌ Template stats error: {e}")
            return {"usage": {}, "metrics": {}, "error": str(e)}


print("🎯 Template service ready")
