"""Central application configuration, loaded from environment / .env file.

Values fall back to development-friendly defaults so the app runs out of the
box, but anything sensitive or environment-specific should be set via .env in
a real deployment.
"""

import os

from dotenv import load_dotenv

# Load a .env file from the backend directory if present. Real environment
# variables always take precedence over .env values.
load_dotenv()

# Secret used to sign JWT tokens. MUST be overridden in any real deployment.
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "route53-clone-dev-secret-key-do-not-use-in-production"
)

ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")

# SQLAlchemy database URL.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./route53.db")

# Comma-separated list of allowed CORS origins (the frontend's URL).
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000"
    ).split(",")
    if origin.strip()
]

