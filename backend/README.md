# PulseDepth Backend

REST API backend for the **PulseDepth** project (Smart India Hackathon).

The backend is intentionally independent of the frontend framework and the
ML model. It only exposes standard HTTP/REST endpoints that speak JSON.

## Technology Stack

- Python 3.10+
- FastAPI — API framework
- Uvicorn — ASGI server
- SQLAlchemy — ORM / database access
- SQLite — initial local database (swappable via `DATABASE_URL`)
- Pydantic / pydantic-settings — request/response validation + config
- Pytest — tests

## Folder Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI app + CORS setup
│   ├── core/
│   │   └── config.py          # Settings from .env
│   ├── api/
│   │   └── routes/
│   │       └── health.py      # GET /api/health
│   ├── db/
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   └── models/            # ORM models (added later)
│   ├── schemas/               # Pydantic request/response models
│   ├── services/              # Business logic (added later)
│   └── ml/
│       ├── interface.py       # Prediction contract (model-agnostic)
│       └── mock_model.py      # Temporary mock implementation
├── tests/
│   └── test_health.py
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Installation

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Optional: copy `.env.example` to `.env` and adjust values if needed.
The defaults work out of the box.

## Start the Server

```bash
cd backend
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

## Swagger / OpenAPI Docs

With the server running, open:

- Interactive docs (Swagger UI): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc
- OpenAPI JSON schema: http://localhost:8000/openapi.json

## Run Tests

```bash
cd backend
pytest
```

Tests run locally and do **not** require the ML model or a real database.

## How the Frontend Communicates

The frontend talks to this backend exclusively over **HTTP/REST with JSON**:

```
Frontend (any framework)
        │  HTTP / REST / JSON
        ▼
FastAPI backend
```

Example:

```
GET http://localhost:8000/api/health
```

Response:

```json
{
  "status": "ok",
  "service": "PulseDepth Backend"
}
```

The backend is not coupled to any specific frontend technology (React,
Flutter, Next.js, plain JS, etc.), and CORS origins are configurable via
`.env` so local development is straightforward.

## ML Layer Is Model-Independent

The ML integration uses a small contract so the actual model can be replaced
without backend changes:

```
Frontend  →  FastAPI  →  Backend services  →  ML interface  →  Real model
```

- `app/ml/interface.py` defines the `PredictionModel` contract with a single
  `predict()` method.
- `app/ml/mock_model.py` is a temporary stub used for backend development and
  frontend integration testing.
- The factory `get_prediction_model()` in `app/ml/__init__.py` is the single
  place that decides which implementation is active.

Later, the ML teammate can plug in YOLO, a CNN, PyTorch, TensorFlow or any
other framework behind this interface. **No ML framework is imported**
anywhere in the API layer, so nothing else in the backend changes when the
model is swapped.

## Database Foundation

### SQLite Usage

The backend uses SQLite as the initial database, configured via the
`DATABASE_URL` environment variable (default: `sqlite:///./pulsedepth.db`).

The SQLite configuration in `app/db/database.py` includes:

```python
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
```

The `check_same_thread=False` argument is required for SQLite to work correctly
with FastAPI's async request handling, allowing the same connection to be used
across multiple threads.

### SQLAlchemy Usage

The SQLAlchemy foundation in `app/db/database.py` provides:

- **Engine**: Created from `DATABASE_URL` with SQLite-specific connect args
- **SessionLocal**: A `sessionmaker` with `autocommit=False`, `autoflush=False`,
  `expire_on_commit=False`
- **Base**: Declarative base class for all ORM models (`app/db/models/__init__.py`)
- **get_db()**: FastAPI dependency that yields a database session, safely closing
  it in the `finally` block

Tables are automatically created on application startup via SQLAlchemy's
`Base.metadata.create_all(bind=engine)` in `app/main.py`.

### Database File Location

By default, the database file is created at `./pulsedepth.db` relative to the
working directory (when using `sqlite:///./pulsedepth.db`). The file is
excluded from version control via `.gitignore` (`*.db`).

To use a different path, set `DATABASE_URL=sqlite:///./custom/path.db` in your
`.env` file.

### Core Entities

The following core entities are defined in `app/db/models/`:

- **User** — application users (authentication deferred to later steps)
- **Location** — geographic locations with latitude/longitude
- **Detection** — ML prediction results linked to users and locations
- **Report** — user-generated observations linked to users and detections

### Entity Relationships

The conceptual entity-relationship diagram:

```
User
│
├── many Detections
│   └── belongs to Location
│
└── many Reports
    └── may reference a Detection

Location
│
└── many Detections

Detection
├── belongs to User
├── belongs to Location
└── may have many Reports

Report
├── belongs to User
└── may reference a Detection
```

Status/Level enums used across entities:

| Field               | Values                                          |
|---------------------|-------------------------------------------------|
| `Detection.status`  | pending, processing, completed, failed          |
| `RiskLevel`         | low, medium, high, unknown                      |
| `Report.status`     | pending, reviewed, resolved, rejected           |

### Database Initialization

Tables are initialized automatically when the FastAPI application starts, via the
lifespan context manager in `app/main.py`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
```

This creates all tables defined in `app/db/models/` if they don't already exist.
Tables are **not** dropped on restart, so existing data is preserved.

To reset the database manually, delete the `.db` file or run `drop_all` on the
engine.

### How to Run Database Tests

```bash
cd backend
pytest
```

All database tests use an in-memory SQLite database (`sqlite:///:memory:`), so
they run quickly without touching the file-based database. Tests are defined in
`tests/test_models.py` and cover:

- Database connection and table creation
- Location CRUD operations
- User creation
- Detection-to-Location relationships
- Report-to-User and Report-to-Detection relationships
- Optional relationships (detection without report, report without detection)

The test suite also includes the health endpoint test (`tests/test_health.py`).

## ML Layer Is Model-Independent

The ML integration uses a small contract so the actual model can be replaced
without backend changes:

```
Frontend  →  FastAPI  →  Backend services  →  ML interface  →  Real model
```

- `app/ml/interface.py` defines the `PredictionModel` contract with a single
  `predict()` method.
- `app/ml/mock_model.py` is a temporary stub used for backend development and
  frontend integration testing.
- The factory `get_prediction_model()` in `app/ml/__init__.py` is the single
  place that decides which implementation is active.

Later, the ML teammate can plug in YOLO, a CNN, PyTorch, TensorFlow or any
other framework behind this interface. **No ML framework is imported**
anywhere in the API layer, so nothing else in the backend changes when the
model is swapped.

## Authentication

### JWT-Based Authentication

The backend uses JWT (JSON Web Tokens) for stateless authentication. The
configuration is loaded from environment variables:

- `JWT_SECRET_KEY` — secret key for signing tokens
- `JWT_ALGORITHM` — signing algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — token lifetime (default: 30 minutes)

### Endpoints

#### POST /api/auth/register

Register a new user.

**Request:**

```json
{
  "username": "example_user",
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "username": "example_user",
  "email": "user@example.com",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

- Username and email must be unique
- Password is hashed using Argon2id before storage
- Password is **not** returned in the response

#### POST /api/auth/login

Login and receive JWT access token.

**Request (form data):**

```
username or email: "example_user"
password: "secure-password"
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

- Invalid credentials return 401 Unauthorized
- The username/password distinction is hidden for security
- Active users only

#### GET /api/auth/me

Get the currently authenticated user's information.

**Requirements:**

- Valid JWT Bearer token in `Authorization: Bearer <token>` header

**Response (200 OK):**

```json
{
  "id": 1,
  "username": "example_user",
  "email": "user@example.com",
  "is_active": true,
  "created_at": "..."
}
```

- Without valid token: 401 Unauthorized
- With invalid token: 401 Unauthorized
- With expired token: 401 Unauthorized
- Inactive users cannot authenticate

### Password Security

- Passwords are **never** stored as plain text
- Hashed using Argon2id (via `passlib`)
- Password hashes are **never** returned through API responses
- Password verification uses constant-time comparison

### Environment Variables

See `.env.example` for configuration:

```
APP_NAME=PulseDepth Backend
DEBUG=false
DATABASE_URL=sqlite:///./pulsedepth.db
CORS_ORIGINS=*

# JWT Authentication
JWT_SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=10
```

## File Upload

### Upload Architecture

Files are uploaded via `multipart/form-data` and stored on the local filesystem.
**SQLite only stores metadata, not binary data.**

### Upload Directory

Configured via `UPLOAD_DIR` env variable (default: `uploads/`).
The directory is created automatically on startup.

### Supported File Types

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WEBP (.webp)

File type is validated both by extension and MIME content type.

### Maximum File Size

Configured via `MAX_UPLOAD_SIZE_MB` env variable (default: 10 MB).
Files exceeding the limit are rejected before storage.

### Upload Endpoint

#### POST /api/files/images

Upload an image file.

**Requirements:**

- Valid JWT Bearer token in `Authorization: Bearer <token>` header
- Multipart/form-data with field name `file`
- File type and size validation
- Generates safe unique filename using UUID

**Request (multipart/form-data):**

```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

[file]: image.jpg
```

**Response (201 Created):**

```json
{
  "file_id": 1,
  "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "content_type": "image/jpeg",
  "size": 123456,
  "path": "uploads/images/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

- Binary data is **not** returned in the JSON response
- Original filename is **never** stored directly
- Paths are not exposed in a way that allows directory traversal

### File Retrieval

#### GET /api/files/images/{file_id}

Retrieve file metadata and serve the file.

**Requirements:**

- Valid JWT Bearer token
- User can only access their own files

**Response:** Returns the image file with correct media type.

### File Deletion

#### DELETE /api/files/images/{file_id}

Delete an uploaded file.

**Requirements:**

- Valid JWT Bearer token
- User can only delete their own files
- Both the physical file and database metadata are removed

### Security Measures

- Path traversal prevention: original filenames are sanitized
- No executable file uploads allowed
- File size limits prevent DoS
- Ownership verified via JWT before any file operation
- Users cannot access another user's private files
- Missing files are handled gracefully (404, not error leak)

### File Metadata Model (`UploadedFile`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Primary key |
| `user_id` | int | Foreign key to users |
| `original_filename` | str | Original user-provided name |
| `stored_filename` | str | UUID-based safe filename |
| `content_type` | str | MIME type (e.g., image/jpeg) |
| `file_size` | int | File size in bytes |
| `storage_path` | str | Full path to the file on disk |
| `created_at` | datetime | When the file was uploaded |

- Binary data is stored on local filesystem, NOT in SQLite
- `storage_path` uses the configured `UPLOAD_DIR`
- Files are associated with the authenticated user via `user_id`

## File Access / Retrieval

Files are served through the backend, not as public static files. This ensures:

- Authentication is required to access any file
- Users can only access their own files unless explicitly permitted
- Path traversal attacks are prevented
- The raw upload directory is never exposed publicly

## ML Independence

 uploaded files are simply stored as validated references. The ML integration
layer (`app/ml/interface.py`) will later retrieve the file and run inference.
No ML-specific code or dependencies are required for file upload functionality.

The flow will become:

```
Upload image
↓
UploadedFile metadata stored
↓
Detection request
↓
ML Interface
↓
Actual model (YOLO/CNN/TensorFlow/PyTorch)
↓
Prediction record
```

## Scope (Current Stage)

This is a foundation only. Real ML inference, YOLO integration, model training,
detection endpoints, risk scoring, maps, reports, dashboards, notifications,
cloud storage, and deployment are intentionally **not** implemented yet and will
be added in later steps.