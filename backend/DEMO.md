# PulseDepth (SIH-57) — Local Demonstration & Running Guide

This document provides exact, tested instructions to run and demonstrate the integrated PulseDepth application locally.

---

## 1. Prerequisites
- **Python**: 3.11+ (Tested on Python 3.13.14)
- **Node.js**: 18+ (Tested on Node.js 20+)
- **OS**: Windows (PowerShell/CMD) or Linux / macOS

---

## 2. Environment Configuration

### Backend (`backend/.env`)
Ensure `backend/.env` exists with the following configuration:
```ini
APP_NAME=PulseDepth Backend
DEBUG=false
DATABASE_URL=sqlite:///./pulsedepth.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173
JWT_SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=10
ML_MODEL=mock
ML_MODEL_PATH=
```

### Frontend (`frontend/.env.local`)
Ensure `frontend/.env.local` exists:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 3. Installation

### Backend Setup
From repository root:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend Setup
From repository root:
```powershell
cd frontend
npm.cmd install
```

---

## 4. Actual Start Commands

### Option A: One-Click Launcher (Windows)
Double-click `run_app.bat` or run in PowerShell:
```powershell
.\run_app.ps1
```

### Option B: Dedicated Terminals

#### Terminal 1 — Backend (FastAPI):
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend Base URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/api/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

#### Terminal 2 — Frontend (Next.js):
```powershell
cd frontend
npm.cmd run dev
```
- **Frontend URL**: `http://localhost:3000`

---

## 5. End-to-End Demonstration Flow

1. **Launch**: Open `http://localhost:3000` in the browser. The tactical Cyber Sonar landing interface appears.
2. **Authenticate**:
   - Click **"OPERATOR ACCESS"** or **"Sign In"** in the top bar.
   - Switch to **"Register"** tab.
   - Enter Username (e.g. `hydrographer_demo`), valid Email (`demo@pulsedepth.org`), and Password (`SecurePass123!`).
   - Click **"CREATE ACCOUNT"**. You are instantly authenticated with a persistent JWT Bearer token.
3. **Mission Dashboard**:
   - The Topbar reflects your operator username and ID.
   - The Mission Overview displays live synchronization status: `FASTAPI SYNCED`.
4. **Sonar Image Upload & Analysis**:
   - Navigate to the **"Upload Sonar"** module from the left sidebar or quick action button.
   - Drop any Side-Scan Sonar capture (`.png`, `.jpg`, `.tiff`, `.webp` up to 10 MB) or click **"Load Demonstration Scan"**.
   - Click **"START ACOUSTIC PIPELINE"**.
   - Watch the 7-stage pipeline execute:
     - Preprocessing & Multipart Upload (`POST /api/files/images`)
     - AI YOLOv8 Detection (`POST /api/detections/`)
     - Shadow Triangulation & Geometry Consistency
     - Bayesian Evidence Fusion & Risk Calculation
     - SQLite Database Commit (`SAVED ID #...`)
5. **View Results & Risk**:
   - The target contact is immediately added to the top of the contact list and Sonar Waterfall.
   - The **Detection Panel** displays the raw AI confidence, multi-factor fused confidence, target depth, slant range, and category probability.
   - Click **"Deep Inspect"** to view the **Detection Modal**: it queries `GET /api/detections/{id}` to display the backend Risk Engine explanation and server-side ML model labels.
6. **Geospatial Map**:
   - Switch to **"Geo Intelligence"** tab to see the georeferenced anomaly marker pinned at its GPS coordinates with the sonar swath corridor.
   - Click on the marker popup to see target details and click **"INSPECT CONTACT →"**.
7. **Anomaly Database**:
   - Switch to **"Anomaly Database"** tab (`GET /api/detections/`).
   - Click **"SYNC DATABASE"** to pull the latest SQLite database records.
   - Filter by priority, status, or search query. Click **"EXPORT CSV / GIS"** to export structured data.
8. **Hydrographic Reports**:
   - Switch to **"Reports"** tab.
   - Click **"CREATE REPORT"** and submit an assessment with linked Detection ID.
   - Export **Executive Briefing (.txt)** or **GeoJSON (.geojson)** spatial dataset for QGIS/ArcGIS.
9. **Mission Analytics**:
   - Switch to **"Mission Analytics"** tab (`GET /api/dashboard/summary`).
   - Inspect the dynamic **Target Classification Ratio** derived directly from server database predictions.
   - Click **"SYNC"** to refresh metrics in real time.
10. **Sign Out**:
    - Click the exit icon in the Topbar. Session token is cleared and UI safely resets to guest read-only view.

---

## 6. Backend Independent Demonstration (Swagger)
Even without the frontend running, the backend is 100% testable via Swagger at `http://localhost:8000/docs`:
1. `GET /api/health`: Returns `{ "status": "ok", "service": "PulseDepth Backend" }`.
2. `POST /api/auth/register`: Create a user account.
3. `POST /api/auth/login`: Acquire JWT access token.
4. Click **"Authorize"** button at top of Swagger UI and enter `Bearer <token>`.
5. `POST /api/files/images`: Upload image file.
6. `POST /api/detections/`: Execute detection workflow with `file_id`.
7. `GET /api/detections/`: List user detections.
8. `GET /api/dashboard/summary`: View aggregated user analytics.
9. `POST /api/reports/`: Create hydrographic survey report.

---

## 7. Troubleshooting & Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **CORS error in browser** | Frontend origin missing from backend CORS list | Check `CORS_ORIGINS` in `backend/.env`. Ensure `http://localhost:3000` is listed. |
| **401 Unauthorized** | Token expired or missing Bearer header | Click "Sign In" in the top bar to refresh your session. |
| **422 Validation Error on Registration** | Invalid email format | Use standard domain email like `user@pulsedepth.org` (reserved domains like `.local` are rejected by email validators). |
| **Port 8000 or 3000 already in use** | Stale server process running in background | In PowerShell: `Stop-Process -Name python, node -Force` and restart. |

---

## 8. How to Stop Both Servers
- In the dedicated PowerShell/CMD windows, press `Ctrl + C`.
- Or terminate all running instances via PowerShell:
  ```powershell
  Stop-Process -Name "python", "node" -ErrorAction SilentlyContinue
  ```
