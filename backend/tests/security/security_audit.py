"""
Security Auditing Framework for MailerSuite2
Automated security testing and vulnerability assessment
"""

import asyncio
import json
import logging
import os
import subprocess
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import requests
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SecurityAuditor:
    """Main security auditing class"""
    
    def __init__(self, target_url: str = "http://localhost:8000", output_dir: str = "security_reports"):
        self.target_url = target_url.rstrip('/')
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.report_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.vulnerabilities = []
        self.test_results = {}
        
    def run_full_audit(self) -> Dict[str, Any]:
        """Run complete security audit"""
        logger.info("Starting comprehensive security audit...")
        
        # Basic connectivity test
        if not self._test_connectivity():
            logger.error("Cannot connect to target. Aborting audit.")
            return {"error": "Target unreachable"}
        
        audit_results = {
            "timestamp": self.report_timestamp,
            "target": self.target_url,
            "tests": {}
        }
        
        # Run all security tests
        test_methods = [
            ("authentication_security", self._test_authentication_security),
            ("authorization_bypass", self._test_authorization_bypass),
            ("input_validation", self._test_input_validation),
            ("sql_injection", self._test_sql_injection),
            ("xss_vulnerabilities", self._test_xss_vulnerabilities),
            ("csrf_protection", self._test_csrf_protection),
            ("api_security", self._test_api_security),
            ("rate_limiting", self._test_rate_limiting),
            ("information_disclosure", self._test_information_disclosure),
            ("server_configuration", self._test_server_configuration),
        ]
        
        for test_name, test_method in test_methods:
            logger.info(f"Running {test_name} tests...")
            try:
                result = test_method()
                audit_results["tests"][test_name] = result
                logger.info(f"✓ {test_name} completed")
            except Exception as e:
                logger.error(f"✗ {test_name} failed: {e}")
                audit_results["tests"][test_name] = {"error": str(e)}
        
        # Generate report
        self._generate_report(audit_results)
        
        return audit_results
    
    def _test_connectivity(self) -> bool:
        """Test basic connectivity to target"""
        try:
            response = requests.get(f"{self.target_url}/api/v1/health/live", timeout=10)
            return response.status_code in [200, 404]  # 404 is ok if endpoint doesn't exist
        except Exception:
            return False
    
    def _test_authentication_security(self) -> Dict[str, Any]:
        """Test authentication security mechanisms"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test 1: Weak password acceptance
        weak_passwords = ["123", "password", "admin", "test"]
        for weak_pass in weak_passwords:
            try:
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/register",
                    json={"email": f"test_{weak_pass}@example.com", "password": weak_pass},
                    timeout=10
                )
                if response.status_code == 200:
                    results["vulnerabilities"].append(f"Weak password '{weak_pass}' accepted")
                else:
                    results["passed"].append(f"Weak password '{weak_pass}' rejected")
            except Exception as e:
                results["warnings"].append(f"Auth test error: {e}")
        
        # Test 2: Brute force protection
        login_attempts = []
        for i in range(10):
            try:
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/login",
                    json={"email": "admin@sgpt.dev", "password": "wrong_password"},
                    timeout=5
                )
                login_attempts.append(response.status_code)
            except Exception:
                login_attempts.append("timeout")
        
        # Check if rate limiting is in place
        if all(attempt in [401, 400, 422] for attempt in login_attempts):
            results["vulnerabilities"].append("No brute force protection detected")
        else:
            results["passed"].append("Brute force protection appears active")
        
        # Test 3: Default credentials
        default_creds = [
            ("admin", "admin"),
            ("admin", "password"),
            ("administrator", "administrator"),
            ("root", "root"),
            ("admin@sgpt.dev", "admin123")  # Known default from conftest
        ]
        
        for username, password in default_creds:
            try:
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/login",
                    json={"email": username, "password": password},
                    timeout=10
                )
                if response.status_code == 200:
                    results["vulnerabilities"].append(f"Default credentials work: {username}:{password}")
                else:
                    results["passed"].append(f"Default credentials rejected: {username}")
            except Exception:
                pass
        
        return results
    
    def _test_authorization_bypass(self) -> Dict[str, Any]:
        """Test for authorization bypass vulnerabilities"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test 1: Access protected endpoints without authentication
        protected_endpoints = [
            "/api/v1/auth/me",
            "/api/v1/campaigns",
            "/api/v1/smtp/accounts",
            "/api/v1/admin/dashboard"
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = requests.get(f"{self.target_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    results["vulnerabilities"].append(f"Unprotected endpoint: {endpoint}")
                elif response.status_code in [401, 403]:
                    results["passed"].append(f"Protected endpoint: {endpoint}")
                else:
                    results["warnings"].append(f"Unexpected response for {endpoint}: {response.status_code}")
            except Exception as e:
                results["warnings"].append(f"Error testing {endpoint}: {e}")
        
        # Test 2: JWT token manipulation
        try:
            # First get a valid token
            reg_response = requests.post(
                f"{self.target_url}/api/v1/auth/register",
                json={"email": "authtest@example.com", "password": "TestPass123!"},
                timeout=10
            )
            
            if reg_response.status_code == 200:
                token = reg_response.json().get("access_token")
                if token:
                    # Test with modified token
                    modified_token = token[:-5] + "XXXXX"
                    response = requests.get(
                        f"{self.target_url}/api/v1/auth/me",
                        headers={"Authorization": f"Bearer {modified_token}"},
                        timeout=10
                    )
                    if response.status_code == 200:
                        results["vulnerabilities"].append("Modified JWT token accepted")
                    else:
                        results["passed"].append("Modified JWT token rejected")
        except Exception as e:
            results["warnings"].append(f"JWT test error: {e}")
        
        return results
    
    def _test_input_validation(self) -> Dict[str, Any]:
        """Test input validation across endpoints"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test 1: SQL injection payloads
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "admin'--",
            "1' OR 1=1#"
        ]
        
        for payload in sql_payloads:
            try:
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/login",
                    json={"email": payload, "password": "test"},
                    timeout=10
                )
                # Check response for signs of SQL injection
                if response.status_code == 500:
                    results["vulnerabilities"].append(f"Possible SQL injection with payload: {payload}")
                elif "error" in response.text.lower() and ("sql" in response.text.lower() or "database" in response.text.lower()):
                    results["vulnerabilities"].append(f"Database error exposure with payload: {payload}")
                else:
                    results["passed"].append(f"SQL payload handled safely: {payload}")
            except Exception as e:
                results["warnings"].append(f"SQL injection test error: {e}")
        
        # Test 2: XSS payloads
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "';alert('XSS');//"
        ]
        
        for payload in xss_payloads:
            try:
                # Test in registration
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/register",
                    json={"email": f"test@example.com", "password": "TestPass123!", "username": payload},
                    timeout=10
                )
                
                # Check if payload is reflected without encoding
                if payload in response.text:
                    results["vulnerabilities"].append(f"Possible XSS vulnerability with payload: {payload}")
                else:
                    results["passed"].append(f"XSS payload handled safely: {payload}")
            except Exception as e:
                results["warnings"].append(f"XSS test error: {e}")
        
        return results
    
    def _test_sql_injection(self) -> Dict[str, Any]:
        """Dedicated SQL injection testing"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Advanced SQL injection payloads
        advanced_payloads = [
            {"email": "admin' AND (SELECT COUNT(*) FROM users) > 0 --", "password": "test"},
            {"email": "test@example.com' OR 1=1 LIMIT 1 --", "password": "test"},
            {"email": "'; WAITFOR DELAY '00:00:05' --", "password": "test"},
            {"email": "test' AND SUBSTRING(@@version,1,1) = '5' --", "password": "test"}
        ]
        
        for payload in advanced_payloads:
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/login",
                    json=payload,
                    timeout=15
                )
                end_time = time.time()
                
                # Check for time-based SQL injection
                if end_time - start_time > 5:
                    results["vulnerabilities"].append(f"Possible time-based SQL injection: {payload['email']}")
                
                # Check for error-based SQL injection
                if any(keyword in response.text.lower() for keyword in ['sql', 'mysql', 'postgresql', 'sqlite', 'database']):
                    results["vulnerabilities"].append(f"Database error exposed: {payload['email']}")
                
                results["passed"].append(f"SQL injection payload handled: {payload['email']}")
                
            except Exception as e:
                results["warnings"].append(f"SQL injection test error: {e}")
        
        return results
    
    def _test_xss_vulnerabilities(self) -> Dict[str, Any]:
        """Dedicated XSS vulnerability testing"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Advanced XSS payloads
        xss_payloads = [
            "<script>alert(document.cookie)</script>",
            "javascript:alert(document.domain)",
            "<img src=x onerror=alert(document.cookie)>",
            "<svg onload=alert(document.domain)>",
            "'+alert(document.cookie)+'",
            "\"><script>alert(document.cookie)</script>",
            "<iframe src=javascript:alert(document.cookie)></iframe>"
        ]
        
        # Test XSS in various endpoints
        test_endpoints = [
            {"url": "/api/v1/auth/register", "data": {"email": "xss@example.com", "password": "Test123!", "username": ""}},
            {"url": "/api/v1/smtp/accounts", "data": {"email": "", "host": "smtp.test.com", "port": 587}},
        ]
        
        for endpoint in test_endpoints:
            for payload in xss_payloads:
                try:
                    # Insert payload into each string field
                    data = endpoint["data"].copy()
                    for key, value in data.items():
                        if isinstance(value, str):
                            test_data = data.copy()
                            test_data[key] = payload
                            
                            response = requests.post(
                                f"{self.target_url}{endpoint['url']}",
                                json=test_data,
                                timeout=10
                            )
                            
                            # Check if payload is reflected
                            if payload in response.text and not any(escaped in response.text for escaped in ['&lt;', '&gt;', '&amp;']):
                                results["vulnerabilities"].append(f"XSS vulnerability in {endpoint['url']} field {key}")
                            else:
                                results["passed"].append(f"XSS payload escaped in {endpoint['url']} field {key}")
                                
                except Exception as e:
                    results["warnings"].append(f"XSS test error: {e}")
        
        return results
    
    def _test_csrf_protection(self) -> Dict[str, Any]:
        """Test CSRF protection mechanisms"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        try:
            # First authenticate to get a session
            reg_response = requests.post(
                f"{self.target_url}/api/v1/auth/register",
                json={"email": "csrf_test@example.com", "password": "TestPass123!"},
                timeout=10
            )
            
            if reg_response.status_code == 200:
                token = reg_response.json().get("access_token")
                if token:
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # Test state-changing operations without CSRF protection
                    csrf_test_endpoints = [
                        {"method": "POST", "url": "/api/v1/smtp/accounts", "data": {"email": "csrf@test.com", "host": "smtp.test.com", "port": 587}},
                        {"method": "DELETE", "url": "/api/v1/smtp/accounts/test", "data": {}},
                        {"method": "PATCH", "url": "/api/v1/auth/profile", "data": {"name": "CSRF Test"}},
                    ]
                    
                    for test in csrf_test_endpoints:
                        try:
                            # Test without any CSRF token
                            response = requests.request(
                                test["method"],
                                f"{self.target_url}{test['url']}",
                                json=test["data"],
                                headers=headers,
                                timeout=10
                            )
                            
                            # If request succeeds without CSRF protection, it's vulnerable
                            if response.status_code in [200, 201]:
                                results["vulnerabilities"].append(f"No CSRF protection on {test['method']} {test['url']}")
                            elif response.status_code == 403:
                                results["passed"].append(f"CSRF protection active on {test['method']} {test['url']}")
                            else:
                                results["warnings"].append(f"Unexpected CSRF test response: {response.status_code}")
                                
                        except Exception as e:
                            results["warnings"].append(f"CSRF test error: {e}")
        
        except Exception as e:
            results["warnings"].append(f"CSRF setup error: {e}")
        
        return results
    
    def _test_api_security(self) -> Dict[str, Any]:
        """Test API-specific security issues"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test 1: API versioning bypass
        version_bypass_tests = [
            "/api/v2/auth/me",  # Try future version
            "/api/v0/auth/me",  # Try old version
            "/api/auth/me",     # Try without version
            "/auth/me",         # Try without api prefix
        ]
        
        for endpoint in version_bypass_tests:
            try:
                response = requests.get(f"{self.target_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    results["vulnerabilities"].append(f"API version bypass possible: {endpoint}")
                else:
                    results["passed"].append(f"API version control enforced: {endpoint}")
            except Exception:
                pass
        
        # Test 2: HTTP method override
        try:
            response = requests.post(
                f"{self.target_url}/api/v1/auth/me",
                headers={"X-HTTP-Method-Override": "GET"},
                timeout=10
            )
            if response.status_code == 200:
                results["vulnerabilities"].append("HTTP method override allowed")
            else:
                results["passed"].append("HTTP method override prevented")
        except Exception as e:
            results["warnings"].append(f"Method override test error: {e}")
        
        # Test 3: API documentation exposure
        doc_endpoints = [
            "/docs",
            "/api/docs",
            "/swagger",
            "/api/swagger",
            "/openapi.json",
            "/api/openapi.json"
        ]
        
        for endpoint in doc_endpoints:
            try:
                response = requests.get(f"{self.target_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    results["warnings"].append(f"API documentation exposed: {endpoint}")
                else:
                    results["passed"].append(f"API documentation protected: {endpoint}")
            except Exception:
                pass
        
        return results
    
    def _test_rate_limiting(self) -> Dict[str, Any]:
        """Test rate limiting mechanisms"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test rate limiting on authentication endpoint
        responses = []
        for i in range(50):  # Make 50 rapid requests
            try:
                response = requests.post(
                    f"{self.target_url}/api/v1/auth/login",
                    json={"email": "rate_test@example.com", "password": "wrong"},
                    timeout=5
                )
                responses.append(response.status_code)
            except Exception:
                responses.append("timeout")
        
        # Check if rate limiting kicks in
        rate_limited = any(status == 429 for status in responses)
        if rate_limited:
            results["passed"].append("Rate limiting active on authentication")
        else:
            results["vulnerabilities"].append("No rate limiting detected on authentication")
        
        # Test rate limiting on health endpoint
        health_responses = []
        for i in range(100):  # Make 100 rapid requests
            try:
                response = requests.get(f"{self.target_url}/api/v1/health/live", timeout=2)
                health_responses.append(response.status_code)
            except Exception:
                health_responses.append("timeout")
        
        health_rate_limited = any(status == 429 for status in health_responses)
        if health_rate_limited:
            results["passed"].append("Rate limiting active on health endpoint")
        else:
            results["warnings"].append("No rate limiting on health endpoint (may be intentional)")
        
        return results
    
    def _test_information_disclosure(self) -> Dict[str, Any]:
        """Test for information disclosure vulnerabilities"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test 1: Server header disclosure
        try:
            response = requests.get(f"{self.target_url}/api/v1/health/live", timeout=10)
            
            server_header = response.headers.get("Server", "")
            if server_header and any(keyword in server_header.lower() for keyword in ["nginx", "apache", "iis", "tomcat"]):
                results["warnings"].append(f"Server information disclosed: {server_header}")
            else:
                results["passed"].append("Server information not disclosed")
            
            # Check for other revealing headers
            revealing_headers = ["X-Powered-By", "X-AspNet-Version", "X-Framework"]
            for header in revealing_headers:
                if header in response.headers:
                    results["warnings"].append(f"Revealing header: {header}: {response.headers[header]}")
                    
        except Exception as e:
            results["warnings"].append(f"Header test error: {e}")
        
        # Test 2: Error message disclosure
        try:
            response = requests.post(
                f"{self.target_url}/api/v1/auth/login",
                json={"invalid": "data"},
                timeout=10
            )
            
            if "traceback" in response.text.lower() or "exception" in response.text.lower():
                results["vulnerabilities"].append("Detailed error messages exposed")
            else:
                results["passed"].append("Error messages properly sanitized")
                
        except Exception as e:
            results["warnings"].append(f"Error disclosure test error: {e}")
        
        return results
    
    def _test_server_configuration(self) -> Dict[str, Any]:
        """Test server configuration security"""
        results = {"vulnerabilities": [], "passed": [], "warnings": []}
        
        # Test 1: HTTPS enforcement
        if self.target_url.startswith("http://"):
            try:
                https_url = self.target_url.replace("http://", "https://")
                response = requests.get(f"{https_url}/api/v1/health/live", timeout=10, verify=False)
                if response.status_code == 200:
                    results["warnings"].append("HTTPS available but not enforced")
                else:
                    results["vulnerabilities"].append("HTTPS not available")
            except Exception:
                results["vulnerabilities"].append("HTTPS not available")
        else:
            results["passed"].append("Using HTTPS")
        
        # Test 2: Security headers
        try:
            response = requests.get(f"{self.target_url}/api/v1/health/live", timeout=10)
            
            security_headers = {
                "X-Frame-Options": "Clickjacking protection",
                "X-Content-Type-Options": "MIME sniffing protection",
                "X-XSS-Protection": "XSS protection",
                "Strict-Transport-Security": "HSTS protection",
                "Content-Security-Policy": "CSP protection",
                "Referrer-Policy": "Referrer policy"
            }
            
            for header, description in security_headers.items():
                if header in response.headers:
                    results["passed"].append(f"{description} enabled")
                else:
                    results["warnings"].append(f"{description} missing")
                    
        except Exception as e:
            results["warnings"].append(f"Security headers test error: {e}")
        
        return results
    
    def _generate_report(self, audit_results: Dict[str, Any]) -> None:
        """Generate comprehensive security audit report"""
        report_file = self.output_dir / f"security_audit_{self.report_timestamp}.json"
        html_report_file = self.output_dir / f"security_audit_{self.report_timestamp}.html"
        
        # Save JSON report
        with open(report_file, 'w') as f:
            json.dump(audit_results, f, indent=2, default=str)
        
        # Generate HTML report
        html_content = self._generate_html_report(audit_results)
        with open(html_report_file, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Security audit report saved to: {report_file}")
        logger.info(f"HTML report saved to: {html_report_file}")
        
        # Print summary
        self._print_summary(audit_results)
    
    def _generate_html_report(self, audit_results: Dict[str, Any]) -> str:
        """Generate HTML report"""
        total_vulnerabilities = 0
        total_warnings = 0
        total_passed = 0
        
        for test_name, test_result in audit_results.get("tests", {}).items():
            if isinstance(test_result, dict):
                total_vulnerabilities += len(test_result.get("vulnerabilities", []))
                total_warnings += len(test_result.get("warnings", []))
                total_passed += len(test_result.get("passed", []))
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Security Audit Report - {audit_results['timestamp']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .vulnerability {{ background-color: #ffebee; padding: 10px; margin: 5px 0; border-left: 5px solid #f44336; }}
                .warning {{ background-color: #fff3e0; padding: 10px; margin: 5px 0; border-left: 5px solid #ff9800; }}
                .passed {{ background-color: #e8f5e8; padding: 10px; margin: 5px 0; border-left: 5px solid #4caf50; }}
                .test-section {{ margin: 20px 0; }}
                .summary {{ background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Security Audit Report</h1>
                <p><strong>Target:</strong> {audit_results['target']}</p>
                <p><strong>Timestamp:</strong> {audit_results['timestamp']}</p>
            </div>
            
            <div class="summary">
                <h2>Summary</h2>
                <p><strong>Vulnerabilities:</strong> {total_vulnerabilities}</p>
                <p><strong>Warnings:</strong> {total_warnings}</p>
                <p><strong>Tests Passed:</strong> {total_passed}</p>
            </div>
        """
        
        for test_name, test_result in audit_results.get("tests", {}).items():
            if isinstance(test_result, dict):
                html += f"""
                <div class="test-section">
                    <h2>{test_name.replace('_', ' ').title()}</h2>
                """
                
                for vuln in test_result.get("vulnerabilities", []):
                    html += f'<div class="vulnerability"><strong>VULNERABILITY:</strong> {vuln}</div>'
                
                for warning in test_result.get("warnings", []):
                    html += f'<div class="warning"><strong>WARNING:</strong> {warning}</div>'
                
                for passed in test_result.get("passed", []):
                    html += f'<div class="passed"><strong>PASSED:</strong> {passed}</div>'
                
                html += "</div>"
        
        html += "</body></html>"
        return html
    
    def _print_summary(self, audit_results: Dict[str, Any]) -> None:
        """Print audit summary to console"""
        total_vulnerabilities = 0
        total_warnings = 0
        total_passed = 0
        
        print("\n" + "="*80)
        print("SECURITY AUDIT SUMMARY")
        print("="*80)
        
        for test_name, test_result in audit_results.get("tests", {}).items():
            if isinstance(test_result, dict):
                vulnerabilities = test_result.get("vulnerabilities", [])
                warnings = test_result.get("warnings", [])
                passed = test_result.get("passed", [])
                
                total_vulnerabilities += len(vulnerabilities)
                total_warnings += len(warnings)
                total_passed += len(passed)
                
                print(f"\n{test_name.replace('_', ' ').title()}:")
                print(f"  Vulnerabilities: {len(vulnerabilities)}")
                print(f"  Warnings: {len(warnings)}")
                print(f"  Passed: {len(passed)}")
                
                if vulnerabilities:
                    for vuln in vulnerabilities:
                        print(f"    🔴 {vuln}")
        
        print("\n" + "="*80)
        print(f"TOTAL VULNERABILITIES: {total_vulnerabilities}")
        print(f"TOTAL WARNINGS: {total_warnings}")
        print(f"TOTAL TESTS PASSED: {total_passed}")
        print("="*80)


def run_automated_security_scan():
    """Run automated security scan"""
    auditor = SecurityAuditor()
    results = auditor.run_full_audit()
    return results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Security Audit Tool for MailerSuite2")
    parser.add_argument("--target", default="http://localhost:8000", help="Target URL")
    parser.add_argument("--output", default="security_reports", help="Output directory")
    
    args = parser.parse_args()
    
    auditor = SecurityAuditor(target_url=args.target, output_dir=args.output)
    results = auditor.run_full_audit()
    
    # Exit with error code if vulnerabilities found
    total_vulns = sum(
        len(test.get("vulnerabilities", [])) 
        for test in results.get("tests", {}).values() 
        if isinstance(test, dict)
    )
    
    exit(1 if total_vulns > 0 else 0)