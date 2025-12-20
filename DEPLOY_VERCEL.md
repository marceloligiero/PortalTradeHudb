# Deploying the frontend to Vercel

This project uses a monorepo layout. The frontend lives in the `frontend/` folder and builds to `frontend/dist` using Vite.

Quick steps to deploy on Vercel:

1. Connect this GitHub repository to Vercel (https://vercel.com/new).
2. In the Vercel project settings choose the repository and let Vercel detect the project. If you prefer manual settings, use these values:
   - **Framework Preset:** Other / Static
   - **Build Command:** `cd frontend && npm ci && npm run build`
   - **Output Directory:** `frontend/dist`

3. Environment variables (important):
   - `VITE_API_BASE_URL` — set to the base URL of your backend API (for example: `https://api.example.com`). The frontend will append `/api` automatically when necessary.

4. If your backend is hosted elsewhere, keep it running and reachable from Vercel. The frontend will call the API using `VITE_API_BASE_URL` in production.

5. After deploying, open the site and check the console/network tab to confirm API requests target the correct backend URL.

Notes:
- This repo contains a backend (FastAPI). Vercel's static deploy supports only the frontend. If you want the backend to be on Vercel as serverless functions, we need to refactor the FastAPI app into individual serverless endpoints or deploy the backend to another provider (Railway, Render, DigitalOcean App Platform, etc.) and then point `VITE_API_BASE_URL` to it.
- A `vercel.json` is included that tells Vercel to build the `frontend` package and serve `frontend/dist`.
