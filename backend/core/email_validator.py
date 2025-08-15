import re

from email_validator import EmailNotValidError, validate_email

from core.logger import get_logger

logger = get_logger(__name__)


class EmailValidator:
    def __init__(self):
        self.email_regex = re.compile(
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        )

    def validate_format(self, email: str) -> bool:
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False

    def validate_multiple_formats(self, emails: list[str]) -> dict:
        valid_emails = []
        invalid_emails = []
        for email in emails:
            if self.validate_format(email):
                valid_emails.append(email)
            else:
                invalid_emails.append(email)
        return {
            "valid": valid_emails,
            "invalid": invalid_emails,
            "total": len(emails),
            "valid_count": len(valid_emails),
            "invalid_count": len(invalid_emails),
        }

    def remove_duplicates(self, emails: list[str]) -> list[str]:
        seen = set()
        unique_emails = []
        for email in emails:
            email_lower = email.lower()
            if email_lower not in seen:
                seen.add(email_lower)
                unique_emails.append(email)
        return unique_emails

    def parse_email_list(self, content: str) -> list[dict]:
        emails = []
        lines = content.strip().split("\n")
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" in line:
                parts = line.split(":", 2)
                if len(parts) == 3:
                    first_name, last_name, email = parts
                    emails.append(
                        {
                            "email": email.strip(),
                            "first_name": first_name.strip(),
                            "last_name": last_name.strip(),
                        }
                    )
                else:
                    emails.append(
                        {
                            "email": line.strip(),
                            "first_name": None,
                            "last_name": None,
                        }
                    )
            elif "," in line:
                parts = line.split(",", 2)
                if len(parts) == 3:
                    first_name, last_name, email = parts
                    emails.append(
                        {
                            "email": email.strip(),
                            "first_name": first_name.strip(),
                            "last_name": last_name.strip(),
                        }
                    )
                else:
                    emails.append(
                        {
                            "email": line.strip(),
                            "first_name": None,
                            "last_name": None,
                        }
                    )
            else:
                emails.append(
                    {
                        "email": line.strip(),
                        "first_name": None,
                        "last_name": None,
                    }
                )
        return emails

    async def check_mx_records(self, domains: set[str]) -> dict:
        valid_domains = set()
        invalid_domains = set()
        for domain in domains:
            try:
                valid_domains.add(domain)
            except Exception as e:
                logger.warning(f"MX check failed for {domain}: {e}")
                invalid_domains.add(domain)
        return {
            "valid_domains": list(valid_domains),
            "invalid_domains": list(invalid_domains),
        }
