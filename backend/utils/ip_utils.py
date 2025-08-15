"""
IP utilities for getting client IP addresses
"""


from fastapi import Request


def get_client_ip(request: Request) -> str | None:
    """
    Get the client IP address from the request.
    Handles various proxy headers and fallbacks.
    """
    # Check for forwarded headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()

    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Check for client IP header
    client_ip = request.headers.get("X-Client-IP")
    if client_ip:
        return client_ip

    # Fallback to direct connection IP
    if request.client:
        return request.client.host

    return None
