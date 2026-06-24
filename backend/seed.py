"""Seed the database with a default user and sample data."""

from app.database import Base, SessionLocal, engine
from app.dependencies import hash_password
from app.models import DNSRecord, HostedZone, User

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()

    if db.query(User).count() == 0:
        user = User(
            username="admin",
            password_hash=hash_password("admin"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("Created default user: admin / admin")

        zone = HostedZone(
            name="example.com.",
            description="Sample hosted zone",
            user_id=user.id,
        )
        db.add(zone)
        db.commit()
        db.refresh(zone)

        records = [
            DNSRecord(
                zone_id=zone.id, name="@", type="A", value="192.0.2.1",
            ),
            DNSRecord(
                zone_id=zone.id, name="www", type="A", value="192.0.2.1",
            ),
            DNSRecord(
                zone_id=zone.id, name="mail", type="MX", value="mail.example.com.", priority=10,
            ),
            DNSRecord(
                zone_id=zone.id, name="@", type="NS", value="ns1.example.com.",
            ),
            DNSRecord(
                zone_id=zone.id, name="@", type="TXT", value="v=spf1 include:_spf.example.com ~all",
            ),
        ]
        db.add_all(records)
        zone.record_count = len(records)
        db.commit()
        print("Created sample hosted zone with 5 DNS records")
    else:
        print("Database already seeded")

    db.close()


if __name__ == "__main__":
    seed()
