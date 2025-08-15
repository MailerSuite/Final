"""
Client Security Testing API Router
Provides simple security testing tools for clients to validate their email setup
"""

import re
from typing import Any

import dns.resolver
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/security-test", tags=["Security"])


# Simple models for client testing
class SPFTestRequest(BaseModel):
    domain: str
    sending_ip: str


class EmailContentTestRequest(BaseModel):
    subject: str
    content: str
    from_email: EmailStr


class DomainTestRequest(BaseModel):
    domain: str


class BlacklistTestRequest(BaseModel):
    ip_address: str


@router.get("/")
async def security_testing_info():
    """Get information about available security tests"""
    return {
        "available_tests": {
            "spf_test": "Test SPF record for your domain",
            "content_test": "Basic spam content analysis",
            "domain_test": "Domain reputation and configuration check",
            "blacklist_test": "Check if IP is blacklisted",
            "email_headers_test": "Validate email headers",
        },
        "description": "Simple security testing tools for email setup validation",
    }


@router.post("/spf-test")
async def test_spf_record(
    request: SPFTestRequest, current_user=Depends(get_current_user)
):
    """Test SPF record for a domain"""
    try:
        # Simple SPF record lookup
        try:
            answers = dns.resolver.resolve(request.domain, "TXT")
            spf_record = None
            for rdata in answers:
                txt_string = str(rdata)
                if "v=spf1" in txt_string.lower():
                    spf_record = txt_string.strip('"')
                    break
        except:
            spf_record = None

        result = {
            "domain": request.domain,
            "sending_ip": request.sending_ip,
            "spf_record_found": spf_record is not None,
            "spf_record": spf_record,
            "test_result": "pass" if spf_record else "fail",
            "recommendations": [],
        }

        if not spf_record:
            result["recommendations"].append("Add SPF record to your domain")
        else:
            result["recommendations"].append(
                "SPF record found - validate syntax"
            )

        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": f"SPF test failed: {str(e)}"}


@router.post("/content-test")
async def test_email_content(
    request: EmailContentTestRequest, current_user=Depends(get_current_user)
):
    """Basic spam content analysis"""
    try:
        spam_indicators = []
        score = 0

        # Simple spam checks
        subject_lower = request.subject.lower()
        content_lower = request.content.lower()

        # Check for common spam words
        spam_words = [
            "free",
            "urgent",
            "act now",
            "limited time",
            "guarantee",
            "money back",
            "no risk",
            "winner",
            "congratulations",
        ]

        for word in spam_words:
            if word in subject_lower or word in content_lower:
                spam_indicators.append(f"Contains spam word: '{word}'")
                score += 1

        # Check for excessive caps
        if (
            len(re.findall(r"[A-Z]", request.subject))
            > len(request.subject) * 0.3
        ):
            spam_indicators.append("Excessive capital letters in subject")
            score += 2

        # Check for excessive exclamation marks
        if request.subject.count("!") > 2:
            spam_indicators.append("Too many exclamation marks")
            score += 1

        risk_level = "low" if score < 2 else "medium" if score < 4 else "high"

        return {
            "success": True,
            "result": {
                "subject": request.subject,
                "spam_score": score,
                "risk_level": risk_level,
                "spam_indicators": spam_indicators,
                "recommendation": "Review content"
                if score > 2
                else "Content looks good",
            },
        }
    except Exception as e:
        return {"success": False, "error": f"Content test failed: {str(e)}"}


@router.post("/domain-test")
async def test_domain_config(
    request: DomainTestRequest, current_user=Depends(get_current_user)
):
    """Test domain configuration"""
    try:
        results = {"domain": request.domain, "tests": {}}

        # Test MX record
        try:
            mx_records = dns.resolver.resolve(request.domain, "MX")
            results["tests"]["mx_record"] = {
                "status": "pass",
                "records": [str(mx) for mx in mx_records],
            }
        except:
            results["tests"]["mx_record"] = {
                "status": "fail",
                "message": "No MX record found",
            }

        # Test A record
        try:
            a_records = dns.resolver.resolve(request.domain, "A")
            results["tests"]["a_record"] = {
                "status": "pass",
                "records": [str(a) for a in a_records],
            }
        except:
            results["tests"]["a_record"] = {
                "status": "fail",
                "message": "No A record found",
            }

        # Test DMARC
        try:
            dmarc_records = dns.resolver.resolve(
                f"_dmarc.{request.domain}", "TXT"
            )
            results["tests"]["dmarc"] = {
                "status": "pass",
                "records": [
                    str(record).strip('"') for record in dmarc_records
                ],
            }
        except:
            results["tests"]["dmarc"] = {
                "status": "warning",
                "message": "No DMARC record found - recommended for email security",
            }

        return {"success": True, "result": results}
    except Exception as e:
        return {"success": False, "error": f"Domain test failed: {str(e)}"}


@router.post("/blacklist-test")
async def test_ip_blacklist(
    request: BlacklistTestRequest, current_user=Depends(get_current_user)
):
    """Test if IP is blacklisted"""
    try:
        # Simple blacklist check against common DNSBLs
        dnsbl_servers = [
            "zen.spamhaus.org",
            "bl.spamcop.net",
            "b.barracudacentral.org",
        ]

        results = {
            "ip_address": request.ip_address,
            "blacklist_status": {},
            "overall_status": "clean",
        }

        # Reverse IP for DNSBL lookup
        ip_parts = request.ip_address.split(".")
        reversed_ip = ".".join(reversed(ip_parts))

        blacklisted_count = 0
        for dnsbl in dnsbl_servers:
            try:
                query = f"{reversed_ip}.{dnsbl}"
                dns.resolver.resolve(query, "A")
                results["blacklist_status"][dnsbl] = "blacklisted"
                blacklisted_count += 1
            except:
                results["blacklist_status"][dnsbl] = "clean"

        if blacklisted_count > 0:
            results["overall_status"] = "blacklisted"
            results["recommendation"] = (
                "IP found on blacklists - contact providers to delist"
            )
        else:
            results["recommendation"] = "IP is clean on tested blacklists"

        return {"success": True, "result": results}
    except Exception as e:
        return {"success": False, "error": f"Blacklist test failed: {str(e)}"}


@router.post("/headers-test")
async def test_email_headers(
    data: dict[str, Any], current_user=Depends(get_current_user)
):
    """Test email headers configuration"""
    try:
        headers = data.get("headers", {})

        results = {"headers_analysis": {}, "recommendations": []}

        # Check important headers
        important_headers = {
            "From": "Required - sender identification",
            "To": "Required - recipient identification",
            "Subject": "Required - email subject",
            "Date": "Recommended - timestamp",
            "Message-ID": "Recommended - unique identifier",
            "Return-Path": "Recommended - bounce handling",
        }

        for header, description in important_headers.items():
            if header.lower() in [h.lower() for h in headers.keys()]:
                results["headers_analysis"][header] = "present"
            else:
                results["headers_analysis"][header] = "missing"
                results["recommendations"].append(
                    f"Add {header} header: {description}"
                )

        # Check for authentication headers
        auth_headers = [
            "DKIM-Signature",
            "Authentication-Results",
            "Received-SPF",
        ]
        auth_present = any(
            header.lower() in [h.lower() for h in headers.keys()]
            for header in auth_headers
        )

        results["authentication_headers"] = (
            "present" if auth_present else "missing"
        )
        if not auth_present:
            results["recommendations"].append(
                "Consider adding email authentication headers (DKIM, SPF)"
            )

        return {"success": True, "result": results}
    except Exception as e:
        return {"success": False, "error": f"Headers test failed: {str(e)}"}
