# AWS Route 53 Clone

A functional clone of the AWS Route 53 console: hosted zone and DNS record management with a Next.js frontend, FastAPI backend, and SQLite persistence. Mocked authentication; mocked AWS dependencies (IAM, Organizations, Billing, etc.).

## Live Demo

- **App:** https://awsroute.lakshyasharma.me
- **API:** https://api.awsroute.lakshyasharma.me/api (Swagger docs at `/docs`)
- **Login:** `admin` / `admin`

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **State management**: Redux Toolkit + RTK Query
- **Backend**: FastAPI + SQLAlchemy
- **Database**: SQLite

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # then edit as needed (optional for local dev)
python seed.py                # creates route53.db with a default user + sample zone
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000` (Swagger docs at `/docs`).

Configuration is read from `backend/.env` (loaded via `python-dotenv`); see `backend/.env.example`. All values have working defaults, so a local run works without a `.env` file.

| Variable        | Default                          | Purpose                                            |
| --------------- | -------------------------------- | --------------------------------------------------- |
| `SECRET_KEY`    | dev fallback                     | Secret used to sign JWT tokens. **Set a strong value in production.** |
| `JWT_ALGORITHM` | `HS256`                          | JWT signing algorithm.                             |
| `DATABASE_URL`  | `sqlite:///./route53.db`         | SQLAlchemy database URL.                            |
| `CORS_ORIGINS`  | `http://localhost:3000`          | Comma-separated allowed CORS origins (frontend URL). |

Default seeded credentials: **admin / admin**.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # then edit as needed (optional for local dev)
npm run dev
```

The app runs at `http://localhost:3000`. Configuration is read from `frontend/.env.local`; see `frontend/.env.example`.

| Variable               | Default                       | Purpose                  |
| ---------------------- | ----------------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8000/api`   | Base URL of the backend API. |

## Architecture Overview

### System diagram

```mermaid
flowchart LR
    subgraph Browser["Browser — Next.js (App Router)"]
        UI["Pages & Components<br/>(hosted zones, records, dashboard)"]
        Store["Redux Toolkit store<br/>auth slice · theme slice"]
        RTKQ["RTK Query API<br/>cache · auto-invalidation"]
        UI --> Store
        UI --> RTKQ
    end

    subgraph Server["FastAPI backend"]
        Routers["Routers<br/>auth · hosted_zones · dns_records · import_export"]
        Deps["Auth dependency<br/>JWT verify · bcrypt"]
        Valid["Validators<br/>type-specific record rules"]
        Routers --> Deps
        Routers --> Valid
    end

    DB[("SQLite<br/>route53.db")]

    RTKQ -- "REST /api  (Bearer JWT)" --> Routers
    Routers -- "SQLAlchemy ORM" --> DB
```

### Folder layout

```
frontend/        Next.js app (App Router, client components)
  src/app/         routes: /login, /, /hosted-zones, /hosted-zones/[id],
                    /hosted-zones/create, /hosted-zones/[id]/records/create,
                    /hosted-zones/[id]/records/[recordId]/edit,
                    /traffic-policies, /health-checks, /resolver, /profiles
  src/store/       Redux store, slices (auth, theme), RTK Query API, typed hooks
  src/components/  TopNav, Sidebar, Modal, RecordForm, ComingSoon
  src/lib/         auth + theme wrappers (Redux-backed), toast context, shortcuts
  src/types/       shared TS types (HostedZone, DNSRecord, RecordType)

backend/         FastAPI app
  app/main.py       app + CORS + router wiring
  app/database.py   SQLAlchemy engine/session (SQLite)
  app/models.py     ORM models: User, HostedZone, DNSRecord
  app/schemas.py    Pydantic request/response models
  app/dependencies.py  password hashing, JWT issuing/verification
  app/validators.py    type-specific DNS record validation
  app/bind.py          BIND zone-file export/parse
  app/routers/      auth, hosted_zones, dns_records, import_export endpoints
```

The frontend talks to the backend exclusively over REST under `/api`. **State lives in a Redux Toolkit store**: `auth` and `theme` slices hold global UI state, while **RTK Query** owns all server data (hosted zones, records) with automatic caching and tag-based invalidation — a create/update/delete refreshes the affected lists without manual refetching.

Auth is JWT-based: `POST /api/auth/login` returns a bearer token, which the frontend stores in `localStorage` and the RTK Query base query attaches as `Authorization: Bearer <token>` on every request. On load, the app calls `GET /api/auth/me` with the stored token to restore the session; an invalid/expired (401) response clears the token and redirects to `/login`. All Hosted Zone and DNS Record data is scoped to the authenticated user and persisted in SQLite (`backend/route53.db`).

## Database Schema

### Entity-relationship diagram

```mermaid
erDiagram
    USERS ||--o{ HOSTED_ZONES : owns
    HOSTED_ZONES ||--o{ DNS_RECORDS : contains

    USERS {
        int id PK
        string username UK
        string password_hash
        bool is_active
        datetime created_at
    }

    HOSTED_ZONES {
        string id PK "UUID"
        string name
        string description
        bool private_zone
        int record_count
        int user_id FK
        datetime created_at
        datetime updated_at
    }

    DNS_RECORDS {
        string id PK "UUID"
        string zone_id FK
        string name
        string type "A|AAAA|CNAME|TXT|MX|NS|PTR|SRV|CAA"
        text value
        int ttl
        int priority "MX/SRV"
        int weight "SRV"
        int port "SRV"
        int flags "CAA"
        string tag "CAA"
        datetime created_at
        datetime updated_at
    }
```

A user has many hosted zones; a hosted zone has many DNS records. Deleting a zone cascades to its records.

### Column reference

**users**
| Column         | Type      | Notes                  |
| -------------- | --------- | ----------------------- |
| id             | Integer   | PK, autoincrement       |
| username       | String    | unique                  |
| password_hash  | String    | bcrypt hash             |
| is_active      | Boolean   | default true            |
| created_at     | DateTime  |                          |

**hosted_zones**
| Column         | Type      | Notes                              |
| -------------- | --------- | ------------------------------------ |
| id             | String(36)| PK, UUID                            |
| name           | String    | domain name, e.g. `example.com.`    |
| description    | String    | optional                            |
| private_zone   | Boolean   | public vs private                  |
| record_count   | Integer   | denormalized count of child records |
| created_at     | DateTime  |                                      |
| updated_at     | DateTime  |                                      |
| user_id        | Integer   | FK → users.id                       |

**dns_records**
| Column     | Type       | Notes                                            |
| ---------- | ---------- | -------------------------------------------------- |
| id         | String(36) | PK, UUID                                          |
| zone_id    | String(36) | FK → hosted_zones.id (cascade delete)            |
| name       | String     | record name, e.g. `www` or `@`                   |
| type       | String     | one of A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA |
| value      | Text       |                                                    |
| ttl        | Integer    | default 300                                       |
| priority   | Integer    | MX / SRV                                          |
| weight     | Integer    | SRV                                                |
| port       | Integer    | SRV                                                |
| flags      | Integer    | CAA                                                |
| tag        | String     | CAA (`issue` / `issuewild` / `iodef`)             |
| created_at | DateTime   |                                                    |
| updated_at | DateTime   |                                                    |

## API Overview

All endpoints except `/api/health`, `/api/auth/login`, and `/api/auth/register` require `Authorization: Bearer <token>`.

**Auth** (`/api/auth`)
| Method | Path        | Description                  |
| ------ | ----------- | ----------------------------- |
| POST   | `/login`    | Authenticate, returns user + token |
| POST   | `/logout`   | Stateless logout acknowledgement |
| GET    | `/me`       | Current authenticated user    |
| POST   | `/register` | Create a new user             |

**Hosted Zones** (`/api/hosted-zones`)
| Method | Path           | Description                                   |
| ------ | -------------- | ----------------------------------------------- |
| GET    | `/`            | List zones (paginated, `search`, `page`, `page_size`) |
| POST   | `/`            | Create a zone                                  |
| GET    | `/{zone_id}`   | Get a single zone                              |
| PUT    | `/{zone_id}`   | Update a zone                                  |
| DELETE | `/{zone_id}`   | Delete a zone (cascades to its records)        |

**DNS Records** (`/api/hosted-zones/{zone_id}/records`)
| Method | Path             | Description                                                   |
| ------ | ---------------- | ---------------------------------------------------------------- |
| GET    | `/`              | List records (paginated, `search`, `type`, `page`, `page_size`) |
| GET    | `/{record_id}`   | Get a single record                                              |
| POST   | `/`              | Create a record                                                  |
| PUT    | `/{record_id}`   | Update a record                                                  |
| DELETE | `/{record_id}`   | Delete a record                                                  |

**Import / Export** (`/api/hosted-zones/{zone_id}`)
| Method | Path        | Description                                                |
| ------ | ----------- | ----------------------------------------------------------- |
| GET    | `/export`   | Export the zone as `?format=json` or `?format=bind` (file) |
| POST   | `/import`   | Import records from a BIND zone file (`{ "content": ... }`) |

**Health**
| Method | Path          | Description     |
| ------ | ------------- | ---------------- |
| GET    | `/api/health` | Liveness check   |

## Features

- Mocked authentication (login, logout, session persistence via JWT + `localStorage`)
- Centralized state management with Redux Toolkit + RTK Query (cached server data, automatic cache invalidation on mutations)
- Full CRUD for Hosted Zones with search and pagination
- Full CRUD for DNS Records (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA) with search, type filtering, and pagination
- Route53-styled navigation, tables, forms, modals, and toast notifications
- Type-specific record validation (IPv4 for A, IPv6 for AAAA, hostnames for CNAME/NS/PTR/MX/SRV, required priority/weight/port/flags/tag where applicable)
- "Coming Soon" placeholder pages for Dashboard-adjacent sections not in scope: Traffic Policies, Health Checks, Resolver, Profiles

## Bonus Features

- **Import / Export** — export a hosted zone as JSON or a BIND zone file, and import records from a BIND zone file (invalid records are skipped and reported)
- **Dark mode** — toggle in the top navigation bar; the choice persists across sessions
- **Keyboard shortcuts** — `/` focuses the search box, `c` starts creating a hosted zone or record (depending on the page)
- **Bulk operations** — select multiple rows and delete them in one action via the Actions menu

## Deployment

The live demo runs on an **Azure Ubuntu 24.04 VM**, fronted by **Nginx** with **Let's Encrypt** HTTPS. The frontend and backend run as **systemd** services (auto-start on boot, auto-restart on crash), and DNS is managed at **Namecheap**.

```
                 Internet (HTTPS)
                       │
            ┌──────────┴───────────┐
            ▼                      ▼
 awsroute.lakshyasharma.me   api.awsroute.lakshyasharma.me
            │                      │
            └──────────┬───────────┘
                       ▼
                   Nginx (:80/:443, TLS)
            ┌──────────┴───────────┐
            ▼                      ▼
   Next.js (127.0.0.1:3000)   FastAPI/gunicorn (127.0.0.1:8000)
   systemd: route53-frontend   systemd: route53-backend
                                       │
                                       ▼
                                 SQLite (route53.db)
```

Only Nginx is exposed publicly (ports 80/443); both app processes bind to localhost. Two A records (`awsroute` and `api.awsroute`) point at the VM's static IP.

### Deploy steps (summary)

1. **VM + network** — Azure VM with a static public IP; open inbound TCP 80/443 in the Network Security Group; `ufw allow OpenSSH` + `ufw allow 'Nginx Full'`.
2. **DNS (Namecheap → Advanced DNS)** — A records `awsroute` and `api.awsroute` → VM IP.
3. **Dependencies** — `python3-venv`, `python3-pip`, `nginx`, `git`, Node.js 20.
4. **Backend** — clone repo; `python3 -m venv venv && pip install -r requirements.txt gunicorn`; create `backend/.env` (set `SECRET_KEY`, `CORS_ORIGINS=https://awsroute.lakshyasharma.me`); `python seed.py`.
5. **Frontend** — `npm install`; set `frontend/.env.local` → `NEXT_PUBLIC_API_URL=https://api.awsroute.lakshyasharma.me/api`; `npm run build`.
6. **systemd services** — `route53-backend` runs gunicorn (uvicorn worker) on `127.0.0.1:8000`; `route53-frontend` runs `next start` on `127.0.0.1:3000`; both `enable --now`.
7. **Nginx** — two server blocks reverse-proxying the app domain → 3000 and the api domain → 8000.
8. **HTTPS** — `certbot --nginx -d awsroute.lakshyasharma.me -d api.awsroute.lakshyasharma.me` (auto-renews).

### Redeploying after a change

```bash
cd ~/route53-clone && git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate
cd ../frontend && npm install && npm run build
sudo systemctl restart route53-backend route53-frontend
```

## Mocked / Out of Scope

IAM, AWS Accounts, Organizations, and Billing are not implemented — authentication is a single mocked user model. Traffic Policies, Health Checks, Resolver, and Profiles are placeholder pages only.
