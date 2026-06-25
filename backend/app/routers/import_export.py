"""Export a hosted zone (JSON or BIND) and import records from a BIND file."""

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from ..bind import export_zone, parse_zone
from ..database import get_db
from ..dependencies import get_current_user
from ..models import DNSRecord, HostedZone, User
from ..validators import validate_record

router = APIRouter(prefix="/api/hosted-zones/{zone_id}", tags=["import-export"])


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


def _records(zone_id: str, db: Session) -> list[DNSRecord]:
    return db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id).all()


@router.get("/export")
def export(
    zone_id: str,
    format: str = Query("json", pattern="^(json|bind)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = _get_zone_or_404(zone_id, current_user.id, db)
    records = _records(zone_id, db)

    if format == "bind":
        filename = f"{zone.name.rstrip('.')}.zone"
        return PlainTextResponse(
            export_zone(zone, records),
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return {
        "zone": {
            "name": zone.name,
            "description": zone.description,
            "private_zone": zone.private_zone,
        },
        "records": [
            {
                "name": r.name,
                "type": r.type,
                "value": r.value,
                "ttl": r.ttl,
                "priority": r.priority,
                "weight": r.weight,
                "port": r.port,
                "flags": r.flags,
                "tag": r.tag,
            }
            for r in records
        ],
    }


@router.post("/import")
def import_bind(
    zone_id: str,
    content: str = Body(..., embed=True, description="BIND zone file contents"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = _get_zone_or_404(zone_id, current_user.id, db)

    parsed = parse_zone(content)
    if not parsed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No valid records found in the provided zone file",
        )

    imported = 0
    errors: list[str] = []
    for p in parsed:
        try:
            validate_record(
                p.type,
                p.value,
                priority=p.priority,
                weight=p.weight,
                port=p.port,
                flags=p.flags,
                tag=p.tag,
            )
        except HTTPException as exc:
            errors.append(f"{p.name} {p.type}: {exc.detail}")
            continue

        db.add(
            DNSRecord(
                zone_id=zone_id,
                name=p.name,
                type=p.type,
                value=p.value,
                ttl=p.ttl,
                priority=p.priority,
                weight=p.weight,
                port=p.port,
                flags=p.flags,
                tag=p.tag,
            )
        )
        imported += 1

    zone.record_count += imported
    db.commit()

    return {"imported": imported, "skipped": len(errors), "errors": errors}
