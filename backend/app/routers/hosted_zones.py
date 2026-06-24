from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import HostedZone, User
from ..schemas import (
    HostedZoneCreate,
    HostedZoneResponse,
    HostedZoneUpdate,
    PaginatedHostedZones,
)

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


@router.get("", response_model=PaginatedHostedZones)
def list_zones(
    search: str = Query("", max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(HostedZone).filter(HostedZone.user_id == current_user.id)

    if search:
        query = query.filter(
            HostedZone.name.ilike(f"%{search}%")
            | HostedZone.description.ilike(f"%{search}%")
        )

    total = query.count()
    zones = (
        query.order_by(HostedZone.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedHostedZones(
        zones=zones, total=total, page=page, page_size=page_size
    )


@router.post("", response_model=HostedZoneResponse, status_code=201)
def create_zone(
    body: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = HostedZone(
        name=body.name,
        description=body.description,
        private_zone=body.private_zone,
        user_id=current_user.id,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = (
        db.query(HostedZone)
        .filter(
            HostedZone.id == zone_id, HostedZone.user_id == current_user.id
        )
        .first()
    )
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found"
        )
    return zone


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_zone(
    zone_id: str,
    body: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = (
        db.query(HostedZone)
        .filter(
            HostedZone.id == zone_id, HostedZone.user_id == current_user.id
        )
        .first()
    )
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found"
        )
    if body.name is not None:
        zone.name = body.name
    if body.description is not None:
        zone.description = body.description
    if body.private_zone is not None:
        zone.private_zone = body.private_zone
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}")
def delete_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = (
        db.query(HostedZone)
        .filter(
            HostedZone.id == zone_id, HostedZone.user_id == current_user.id
        )
        .first()
    )
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found"
        )
    db.delete(zone)
    db.commit()
    return {"message": "Zone deleted"}
