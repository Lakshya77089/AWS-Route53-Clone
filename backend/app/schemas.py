from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ─── Auth ───────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: UserResponse
    token: str


# ─── Hosted Zones ──────────────────────────────────────────────────────
class HostedZoneCreate(BaseModel):
    name: str = Field(..., description="Domain name, e.g. example.com")
    description: Optional[str] = None
    private_zone: bool = False


class HostedZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    private_zone: Optional[bool] = None


class HostedZoneResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    private_zone: bool
    record_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedHostedZones(BaseModel):
    zones: list[HostedZoneResponse]
    total: int
    page: int
    page_size: int


# ─── DNS Records ───────────────────────────────────────────────────────
class DNSRecordCreate(BaseModel):
    name: str = Field(..., description="Record name, e.g. www or @")
    type: str = Field(..., pattern="^(A|AAAA|CNAME|TXT|MX|NS|PTR|SRV|CAA)$")
    value: str
    ttl: int = 300
    priority: Optional[int] = None
    weight: Optional[int] = None
    port: Optional[int] = None
    flags: Optional[int] = None
    tag: Optional[str] = None


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None
    ttl: Optional[int] = None
    priority: Optional[int] = None
    weight: Optional[int] = None
    port: Optional[int] = None
    flags: Optional[int] = None
    tag: Optional[str] = None


class DNSRecordResponse(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    value: str
    ttl: int
    priority: Optional[int] = None
    weight: Optional[int] = None
    port: Optional[int] = None
    flags: Optional[int] = None
    tag: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedDNSRecords(BaseModel):
    records: list[DNSRecordResponse]
    total: int
    page: int
    page_size: int
