"""Security utilities for the automation service."""

import hashlib
import hmac
from typing import Optional


def generate_signature(payload: str, secret: str) -> str:
    """
    Generate HMAC-SHA256 signature for a payload.

    Args:
        payload: The payload to sign
        secret: The secret key

    Returns:
        Hex-encoded signature
    """
    return hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_signature(
    payload: str,
    signature: Optional[str],
    secret: str,
) -> bool:
    """
    Verify webhook signature using timing-safe comparison.

    Args:
        payload: The raw request body
        signature: The signature from request header
        secret: The webhook secret

    Returns:
        True if signature is valid
    """
    if not signature or not secret:
        return False

    expected = generate_signature(payload, secret)

    try:
        return hmac.compare_digest(expected, signature)
    except (ValueError, TypeError):
        return False
