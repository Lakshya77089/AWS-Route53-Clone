"""Type-specific validation for DNS record values.

Route53 enforces a value format per record type and requires certain extra
fields for some types (priority for MX, port/weight/priority for SRV, etc.).
We mirror the most important of those rules so the API rejects clearly invalid
records instead of silently storing them.
"""

import ipaddress
import re

from fastapi import HTTPException, status

# Hostname-ish check used for CNAME/MX/NS/PTR/SRV targets. Permissive on
# purpose — we accept an optional trailing dot like Route53 does.
_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}\.?$)(?:[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9])?\.)+"
    r"[a-zA-Z]{2,63}\.?$"
)

_CAA_TAGS = {"issue", "issuewild", "iodef"}


def _fail(message: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message
    )


def _require_hostname(value: str, label: str) -> None:
    if not _HOSTNAME_RE.match(value.strip()):
        _fail(f"{label} must be a valid hostname (e.g. example.com.)")


def validate_record(
    record_type: str,
    value: str,
    *,
    priority: int | None = None,
    weight: int | None = None,
    port: int | None = None,
    flags: int | None = None,
    tag: str | None = None,
) -> None:
    """Raise HTTPException(422) if the record is invalid for its type."""
    value = (value or "").strip()
    if not value:
        _fail("Value is required")

    if record_type == "A":
        try:
            if not isinstance(ipaddress.ip_address(value), ipaddress.IPv4Address):
                raise ValueError
        except ValueError:
            _fail("A record value must be a valid IPv4 address (e.g. 192.0.2.1)")

    elif record_type == "AAAA":
        try:
            if not isinstance(ipaddress.ip_address(value), ipaddress.IPv6Address):
                raise ValueError
        except ValueError:
            _fail("AAAA record value must be a valid IPv6 address (e.g. 2001:db8::1)")

    elif record_type == "CNAME":
        _require_hostname(value, "CNAME target")

    elif record_type == "NS":
        _require_hostname(value, "NS target")

    elif record_type == "PTR":
        _require_hostname(value, "PTR target")

    elif record_type == "MX":
        if priority is None:
            _fail("MX records require a priority")
        if not 0 <= priority <= 65535:
            _fail("MX priority must be between 0 and 65535")
        _require_hostname(value, "MX mail server")

    elif record_type == "SRV":
        for field_value, name in ((priority, "priority"), (weight, "weight"), (port, "port")):
            if field_value is None:
                _fail(f"SRV records require a {name}")
        if not 0 <= priority <= 65535:
            _fail("SRV priority must be between 0 and 65535")
        if not 0 <= weight <= 65535:
            _fail("SRV weight must be between 0 and 65535")
        if not 1 <= port <= 65535:
            _fail("SRV port must be between 1 and 65535")
        _require_hostname(value, "SRV target")

    elif record_type == "CAA":
        if flags is None:
            _fail("CAA records require flags")
        if not 0 <= flags <= 255:
            _fail("CAA flags must be between 0 and 255")
        if tag not in _CAA_TAGS:
            _fail("CAA tag must be one of: issue, issuewild, iodef")

    # TXT: any non-empty string is acceptable.
