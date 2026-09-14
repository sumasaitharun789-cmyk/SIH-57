# PULSEDEPTH (SIH-57)
> **Automated Underwater Marine Debris and Anomaly Detection System**  
> *Side-Scan Sonar Acoustic Swath • Acoustic Shadow Triangulation • Bayesian Multi-Factor Evidence Fusion*

---

## 🌊 Overview

**PulseDepth** is an end-to-end intelligent marine debris detection and hydrographic surveillance platform developed for the Smart India Hackathon (SIH-57). It pairs a high-performance **FastAPI** Python ML backend with a Next.js 16 (React 19 + Tailwind CSS) mission control dashboard.

---

## 🏛 System Architecture

```text
PulseDepth / SIH-57
├── backend/                  # FastAPI REST API & ML Pipeline
│   ├── app/
│   │   ├── api/routes/       # Endpoints: auth, files, detections, locations, reports, dashboard
│   │   ├── core/             # JWT auth, security, settings, CORS configuration
│   │   ├── db/               # SQLAlchemy SQLite engine & models (users, detections, reports, files)
│   │   ├── ml/               # Sonar detection interface, YOLOv8 mock & shadow analysis
│   │   ├── schemas/          # Pydantic validation models
│   │   └── services/         # Business logic for detections, dashboard, reports
│   └── tests/                # 21 automated pytest test suites
│
├── frontend/                 # Next.js 16 Turbopack Mission Control Dashboard
│   ├── app/                  # Main mission workspace & section transitions
│   ├── components/           # Tactical sonar waterfall, geo map, evidence fusion, upload, auth
│   └── lib/                  # api.ts client, type models, audio telemetry, mock datasets
│
├── run_app.bat               # Single-click launcher (Windows CMD)
└── run_app.ps1               # Single-click launcher (PowerShell)
```

---

## 🚀 Quick Start

### Option A: One-Click Launch (Recommended)
Double-click `run_app.bat` or run:
```powershell
.\run_app.ps1
```
This automatically boots both the FastAPI backend at `http://localhost:8000` and the Next.js frontend at `http://localhost:3000`.

---

### Option B: Manual Startup

#### 1. Backend Setup & Run
```powershell
cd backend
# Activate pre-installed virtual environment:
.\.venv\Scripts\Activate.ps1

# Or recreate if needed:
# python -m venv .venv
# .venv\Scripts\pip install -r requirements.txt

# Start FastAPI server:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

#### 2. Frontend Setup & Run
```powershell
cd frontend
# (If installing fresh: npm install)
npm run dev
```
- **Frontend Mission Control**: `http://localhost:3000`

---

## 🧪 Testing & Verification

### Backend Automated Test Suite (21 Tests)
```powershell
cd backend
$env:PYTHONPATH="."
.\.venv\Scripts\pytest tests/
```
Output:
```text
====================== 21 passed in ~18s =======================
```

### Frontend TypeScript & Production Build Check
```powershell
cd frontend
npm run build
```
Output:
```text
✓ Compiled successfully
✓ Finished TypeScript check with 0 errors
✓ Generated static routes
```

---

## 🔑 Key Integrated Features

1. **Secure JWT Authentication**:
   - Operator login & registration via tactical modal in Topbar and Landing page.
   - Bearer token authorization stored in local secure session and attached to all data operations.
   - Role-based badges (Lead Hydrographer / Operator).

2. **Acoustic Sonar Ingestion & 7-Stage Pipeline**:
   - Supports raw side-scan sonar image ingestion (TIFF, PNG, JPEG) and hydrographic survey samples.
   - Uploads files to `/api/files/images` and registers detections in SQLite via `/api/detections/`.
   - Real-time visual tracking across 7 distinct pipeline stages (Image Ingestion, Lee Filtering, YOLOv8 localization, Shadow Triangulation, Geometry Consistency, Bayesian Fusion, and Verification).

3. **Bayesian Evidence Fusion & Hallucination Defense**:
   - Four independent channels (AI YOLOv8, Acoustic Shadow, Geometry Symmetry, Specular Return).
   - Penalizes false positives (e.g. natural rock formations, sand ripples).

4. **Interactive Hydrographic Reports Engine (IHO S-44 Compliant)**:
   - Full CRUD operations synchronized with `/api/reports/`.
   - Live report creation dialog linking to specific target contacts.
   - Instant export of formatted survey briefings (TXT) and Spatial GeoJSON layers compatible with QGIS / ArcGIS.

5. **Real-time Map & Bathymetric Visualization**:
   - Dynamic leaflet-powered spatial projection with vessel position telemetry and target overlays.
