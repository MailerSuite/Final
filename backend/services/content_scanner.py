"""
Content Scanner Service
Basic spam content detection and link validation
"""

import logging
import re
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class ContentScanner:
    """Basic content scanning for spam detection"""

    # Common spam keywords (basic list)
    SPAM_KEYWORDS = [
        "urgent",
        "act now",
        "limited time",
        "free money",
        "guaranteed",
        "make money fast",
        "no questions asked",
        "risk free",
        "cash bonus",
        "earn extra cash",
        "home employment",
        "work from home",
        "get paid",
        "increase sales",
        "increase traffic",
        "million dollars",
        "opportunity",
        "serious cash",
        "while you sleep",
        "winner",
        "congratulations",
        "selected",
        "lucky",
        "prize",
        "jackpot",
        "lottery",
        "claim now",
    ]

    # Suspicious patterns
    SUSPICIOUS_PATTERNS = [
        r"\$\d+(?:,\d{3})*(?:\.\d{2})?",  # Money amounts
        r"\b\d+%\s*(?:off|discount|increase|guaranteed)\b",  # Percentages
        r"\b(?:click|tap)\s+(?:here|now|below)\b",  # Click here
        r"\b(?:call|text)\s+now\b",  # Call now
        r"\b(?:limited|exclusive)\s+(?:time|offer)\b",  # Limited time
        r"\b(?:free|no cost|no charge)\b.*(?:trial|shipping|sample)\b",  # Free offers
    ]

    # Suspicious domains (basic list)
    SUSPICIOUS_DOMAINS = [
        "bit.ly",
        "tinyurl.com",
        "goo.gl",
        "ow.ly",
        "t.co",
        "urlshortener.com",
        "short.link",
        "tiny.cc",
    ]

    def __init__(self):
        self.max_links = 10  # Maximum links allowed
        self.max_images = 5  # Maximum images allowed
        self.max_caps_percentage = 30  # Maximum percentage of caps

    def scan_content(
        self, subject: str, html_content: str, text_content: str = ""
    ) -> dict[str, Any]:
        """
        Comprehensive content scanning
        Returns detailed analysis and recommendations
        """
        results = {
            "spam_score": 0,
            "risk_level": "low",
            "is_spam": False,
            "recommendations": [],
            "details": {
                "keyword_matches": [],
                "pattern_matches": [],
                "link_analysis": {},
                "formatting_issues": [],
                "content_stats": {},
            },
        }

        # Combine all content for analysis
        all_content = f"{subject} {html_content} {text_content}".lower()

        # 1. Keyword analysis
        keyword_score = self._check_spam_keywords(
            all_content, results["details"]
        )
        results["spam_score"] += keyword_score

        # 2. Pattern analysis
        pattern_score = self._check_suspicious_patterns(
            all_content, results["details"]
        )
        results["spam_score"] += pattern_score

        # 3. Link analysis
        link_score = self._analyze_links(html_content, results["details"])
        results["spam_score"] += link_score

        # 4. Formatting analysis
        format_score = self._check_formatting(
            subject, html_content, results["details"]
        )
        results["spam_score"] += format_score

        # 5. Content statistics
        self._calculate_content_stats(
            subject, html_content, text_content, results["details"]
        )

        # Determine risk level and recommendations
        results["risk_level"] = self._determine_risk_level(
            results["spam_score"]
        )
        results["is_spam"] = results["spam_score"] >= 8
        results["recommendations"] = self._generate_recommendations(results)

        return results

    def _check_spam_keywords(self, content: str, details: dict) -> int:
        """Check for spam keywords"""
        score = 0
        matches = []

        for keyword in self.SPAM_KEYWORDS:
            if keyword in content:
                matches.append(keyword)
                score += 1

        details["keyword_matches"] = matches
        return min(score, 5)  # Cap at 5 points

    def _check_suspicious_patterns(self, content: str, details: dict) -> int:
        """Check for suspicious patterns"""
        score = 0
        matches = []

        for pattern in self.SUSPICIOUS_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                matches.append(pattern)
                score += 1

        details["pattern_matches"] = matches
        return min(score, 3)  # Cap at 3 points

    def _analyze_links(self, html_content: str, details: dict) -> int:
        """Analyze links in content"""
        score = 0
        link_analysis = {
            "total_links": 0,
            "suspicious_domains": [],
            "shortened_urls": [],
            "external_links": 0,
        }

        # Extract links using regex
        link_pattern = r'href=["\']([^"\']+)["\']'
        links = re.findall(link_pattern, html_content, re.IGNORECASE)

        link_analysis["total_links"] = len(links)

        # Too many links is suspicious
        if len(links) > self.max_links:
            score += 2

        for link in links:
            try:
                parsed = urlparse(link)
                domain = parsed.netloc.lower()

                # Check for suspicious domains
                if any(
                    sus_domain in domain
                    for sus_domain in self.SUSPICIOUS_DOMAINS
                ):
                    link_analysis["suspicious_domains"].append(domain)
                    score += 1

                # Check for URL shorteners
                if len(domain) < 10 and "." in domain:
                    link_analysis["shortened_urls"].append(link)
                    score += 1

                # Count external links
                if parsed.scheme in ["http", "https"]:
                    link_analysis["external_links"] += 1

            except Exception:
                continue

        details["link_analysis"] = link_analysis
        return min(score, 4)  # Cap at 4 points

    def _check_formatting(
        self, subject: str, html_content: str, details: dict
    ) -> int:
        """Check formatting issues"""
        score = 0
        issues = []

        # Check caps percentage in subject
        if subject:
            caps_count = sum(1 for c in subject if c.isupper())
            caps_percentage = (
                (caps_count / len(subject)) * 100 if subject else 0
            )

            if caps_percentage > self.max_caps_percentage:
                issues.append(
                    f"Subject has {caps_percentage:.1f}% caps (>{self.max_caps_percentage}%)"
                )
                score += 2

        # Check for excessive exclamation marks
        exclamation_count = subject.count("!") + html_content.count("!")
        if exclamation_count > 3:
            issues.append(f"Excessive exclamation marks ({exclamation_count})")
            score += 1

        # Check for excessive emojis/special characters
        emoji_pattern = r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]"
        emoji_count = len(re.findall(emoji_pattern, subject + html_content))
        if emoji_count > 5:
            issues.append(f"Excessive emojis ({emoji_count})")
            score += 1

        details["formatting_issues"] = issues
        return min(score, 3)  # Cap at 3 points

    def _calculate_content_stats(
        self, subject: str, html_content: str, text_content: str, details: dict
    ):
        """Calculate content statistics"""
        stats = {
            "subject_length": len(subject),
            "html_length": len(html_content),
            "text_length": len(text_content),
            "word_count": len((subject + " " + text_content).split()),
            "image_count": len(
                re.findall(r"<img[^>]+>", html_content, re.IGNORECASE)
            ),
            "link_count": len(
                re.findall(r"href=", html_content, re.IGNORECASE)
            ),
        }

        details["content_stats"] = stats

    def _determine_risk_level(self, spam_score: int) -> str:
        """Determine risk level based on spam score"""
        if spam_score >= 8:
            return "high"
        elif spam_score >= 5:
            return "medium"
        elif spam_score >= 2:
            return "low"
        else:
            return "very_low"

    def _generate_recommendations(self, results: dict) -> list[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        details = results["details"]

        if len(details["keyword_matches"]) > 3:
            recommendations.append("Reduce use of promotional keywords")

        if len(details["pattern_matches"]) > 2:
            recommendations.append("Avoid suspicious promotional patterns")

        link_analysis = details["link_analysis"]
        if link_analysis["total_links"] > self.max_links:
            recommendations.append(
                f"Reduce number of links (current: {link_analysis['total_links']}, max: {self.max_links})"
            )

        if link_analysis["suspicious_domains"]:
            recommendations.append("Avoid suspicious or shortened URL domains")

        if details["formatting_issues"]:
            recommendations.append(
                "Fix formatting issues: "
                + ", ".join(details["formatting_issues"])
            )

        stats = details["content_stats"]
        if stats["image_count"] > self.max_images:
            recommendations.append(
                f"Reduce number of images (current: {stats['image_count']}, max: {self.max_images})"
            )

        if not recommendations:
            recommendations.append("Content looks good!")

        return recommendations

    def quick_scan(self, subject: str, content: str) -> bool:
        """Quick spam check - returns True if likely spam"""
        quick_content = f"{subject} {content}".lower()

        # Quick keyword check
        spam_keywords_found = sum(
            1 for keyword in self.SPAM_KEYWORDS if keyword in quick_content
        )

        # Quick pattern check
        pattern_matches = sum(
            1
            for pattern in self.SUSPICIOUS_PATTERNS
            if re.search(pattern, quick_content, re.IGNORECASE)
        )

        # Simple scoring
        quick_score = spam_keywords_found + pattern_matches

        return quick_score >= 5

    def batch_scan(self, content_list: list[dict]) -> dict[str, dict]:
        """Batch scanning for multiple contents"""
        results = {}

        for i, content_data in enumerate(content_list):
            subject = content_data.get("subject", "")
            html_content = content_data.get("html_content", "")
            text_content = content_data.get("text_content", "")

            scan_result = self.scan_content(
                subject, html_content, text_content
            )
            results[f"content_{i}"] = scan_result

        return results
