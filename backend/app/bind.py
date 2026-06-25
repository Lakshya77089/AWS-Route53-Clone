"""Serialize a hosted zone to BIND zone-file format and parse one back.

This is a pragmatic subset of RFC 1035 zone-file syntax — enough to round-trip
the record types this app supports. It intentionally ignores directives like
$TTL/$ORIGIN beyond reading them, and does not attempt full BIND compatibility.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .models import DNSRecord, HostedZone

SUPPORTED_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


def _rdata(record: DNSRecord) -> str:
    """Render the type-specific rdata portion of a record line."""
    t = record.type
    if t == "MX":
        return f"{record.priority or 0} {record.value}"
    if t == "SRV":
        return f"{record.priority or 0} {record.weight or 0} {record.port or 0} {record.value}"
    if t == "CAA":
        return f'{record.flags or 0} {record.tag or "issue"} "{record.value}"'
    if t == "TXT":
        # Quote TXT data if not already quoted.
        value = record.value
        if not (value.startswith('"') and value.endswith('"')):
            value = '"' + value.replace('"', '\\"') + '"'
        return value
    return record.value


def export_zone(zone: HostedZone, records: list[DNSRecord]) -> str:
    """Produce a BIND zone-file string for the given zone and records."""
    origin = zone.name if zone.name.endswith(".") else zone.name + "."
    lines = [
        f"; BIND zone file for {origin}",
        f"$ORIGIN {origin}",
        "$TTL 300",
        "",
    ]
    for r in sorted(records, key=lambda x: (x.name, x.type)):
        name = r.name if r.name else "@"
        lines.append(f"{name}\t{r.ttl}\tIN\t{r.type}\t{_rdata(r)}")
    return "\n".join(lines) + "\n"


@dataclass
class ParsedRecord:
    name: str
    type: str
    value: str
    ttl: int = 300
    priority: int | None = None
    weight: int | None = None
    port: int | None = None
    flags: int | None = None
    tag: str | None = None


_DEFAULT_TTL_RE = re.compile(r"^\$TTL\s+(\d+)", re.IGNORECASE)


def parse_zone(text: str) -> list[ParsedRecord]:
    """Parse a BIND zone file into a list of records.

    Supports the common form ``NAME [TTL] [IN] TYPE RDATA``. The ``IN`` class
    and TTL are optional; a missing name reuses the previous record's name.
    """
    records: list[ParsedRecord] = []
    default_ttl = 300
    last_name = "@"

    for raw in text.splitlines():
        line = raw.split(";", 1)[0].strip()  # strip comments
        if not line:
            continue

        ttl_match = _DEFAULT_TTL_RE.match(line)
        if ttl_match:
            default_ttl = int(ttl_match.group(1))
            continue
        if line.startswith("$"):  # $ORIGIN and other directives: ignore
            continue

        tokens = line.split()
        idx = 0

        # Leading whitespace in the original means "same owner as previous".
        if raw[:1].isspace():
            name = last_name
        else:
            name = tokens[idx]
            idx += 1
        last_name = name

        ttl = default_ttl
        if idx < len(tokens) and tokens[idx].isdigit():
            ttl = int(tokens[idx])
            idx += 1
        if idx < len(tokens) and tokens[idx].upper() == "IN":
            idx += 1
        if idx >= len(tokens):
            continue

        rtype = tokens[idx].upper()
        idx += 1
        if rtype not in SUPPORTED_TYPES:
            continue
        rdata = tokens[idx:]
        if not rdata:
            continue

        rec = ParsedRecord(name=name, type=rtype, value="", ttl=ttl)

        if rtype == "MX" and len(rdata) >= 2:
            rec.priority = int(rdata[0])
            rec.value = rdata[1]
        elif rtype == "SRV" and len(rdata) >= 4:
            rec.priority = int(rdata[0])
            rec.weight = int(rdata[1])
            rec.port = int(rdata[2])
            rec.value = rdata[3]
        elif rtype == "CAA" and len(rdata) >= 3:
            rec.flags = int(rdata[0])
            rec.tag = rdata[1]
            rec.value = " ".join(rdata[2:]).strip('"')
        elif rtype == "TXT":
            rec.value = " ".join(rdata).strip('"')
        else:
            rec.value = rdata[0]

        records.append(rec)

    return records
