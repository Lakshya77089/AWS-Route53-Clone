from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import DNSRecord, HostedZone, User
from ..schemas import (
    DNSRecordCreate,
    DNSRecordResponse,
    DNSRecordUpdate,
    PaginatedDNSRecords,
)
from ..validators import validate_record

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["dns-records"])


def _get_zone_or_404(zone_id: str, user_id: int, db: Session) -> HostedZone:
    zone = (
        db.query(HostedZone)
        .filter(HostedZone.id == zone_id, HostedZone.user_id == user_id)
        .first()
    )
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found"
        )
    return zone


def _get_record_or_404(zone_id: str, record_id: str, db: Session) -> DNSRecord:
    record = (
        db.query(DNSRecord)
        .filter(DNSRecord.id == record_id, DNSRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Record not found"
        )
    return record


RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


@router.get("", response_model=PaginatedDNSRecords)
def list_records(
    zone_id: str,
    search: str = Query("", max_length=255),
    type: str = Query("", max_length=10),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, current_user.id, db)

    query = db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id)

    if type and type in RECORD_TYPES:
        query = query.filter(DNSRecord.type == type.upper())

    if search:
        query = query.filter(
            DNSRecord.name.ilike(f"%{search}%")
            | DNSRecord.value.ilike(f"%{search}%")
        )

    total = query.count()
    records = (
        query.order_by(DNSRecord.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedDNSRecords(
        records=records, total=total, page=page, page_size=page_size
    )


@router.get("/{record_id}", response_model=DNSRecordResponse)
def get_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, current_user.id, db)
    return _get_record_or_404(zone_id, record_id, db)


@router.post("", response_model=DNSRecordResponse, status_code=201)
def create_record(
    zone_id: str,
    body: DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = _get_zone_or_404(zone_id, current_user.id, db)

    record_type = body.type.upper()
    validate_record(
        record_type,
        body.value,
        priority=body.priority,
        weight=body.weight,
        port=body.port,
        flags=body.flags,
        tag=body.tag,
    )

    record = DNSRecord(
        zone_id=zone_id,
        name=body.name,
        type=record_type,
        value=body.value,
        ttl=body.ttl,
        priority=body.priority,
        weight=body.weight,
        port=body.port,
        flags=body.flags,
        tag=body.tag,
    )
    db.add(record)
    zone.record_count += 1
    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=DNSRecordResponse)
def update_record(
    zone_id: str,
    record_id: str,
    body: DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, current_user.id, db)
    record = _get_record_or_404(zone_id, record_id, db)

    if body.name is not None:
        record.name = body.name
    if body.value is not None:
        record.value = body.value
    if body.ttl is not None:
        record.ttl = body.ttl
    if body.priority is not None:
        record.priority = body.priority
    if body.weight is not None:
        record.weight = body.weight
    if body.port is not None:
        record.port = body.port
    if body.flags is not None:
        record.flags = body.flags
    if body.tag is not None:
        record.tag = body.tag

    # Validate the merged result so a partial update can't leave the record
    # in an invalid state for its type.
    validate_record(
        record.type,
        record.value,
        priority=record.priority,
        weight=record.weight,
        port=record.port,
        flags=record.flags,
        tag=record.tag,
    )

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = _get_zone_or_404(zone_id, current_user.id, db)
    record = _get_record_or_404(zone_id, record_id, db)

    db.delete(record)
    zone.record_count -= 1
    db.commit()
    return {"message": "Record deleted"}
