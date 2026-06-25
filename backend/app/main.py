from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, dns_records, hosted_zones, import_export

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Route53 Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(import_export.router)
app.include_router(dns_records.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
