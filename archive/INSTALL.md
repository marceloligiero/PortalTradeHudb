# Portal Trade DataHub — Install & Start (Developer)

This file explains how to prepare and start the project in development.

Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Virtualenv (recommended)
- SQL Server or local DB matching `backend/.env` config

1) Backend (Python)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env
# edit .env with DB credentials
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2) Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if needed
npm run dev
```

3) Quick checks
- Backend docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

Recommended single-command dev start (Linux/macOS):
```bash
# from repo root
./start-all.sh
```

Recommended single-command dev start (Windows PowerShell):
```powershell
# from repo root
.\start-all.ps1
```

Notes
- I archived legacy test and helper scripts under `archive/removed_files/`.
- If you want me to push the cleanup branch to remote, tell me and I'll do it.
