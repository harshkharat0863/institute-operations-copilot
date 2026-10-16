# One-URL Live Cloud Deployment Guide

This guide enables you to deploy both **Frontend (React)** and **Backend (FastAPI)** together under **ONE single live public URL** connected to your Supabase PostgreSQL database.

---

## Architecture of Single URL Deployment
FastAPI now serves both:
1. **The compiled Vite React Single Page Application (SPA)** at `/` and all sub-routes.
2. **All REST API & Copilot endpoints** at `/students`, `/copilot/ask`, `/auth`, etc.
3. Connected directly to **Supabase** at `https://boywgdihldfxrhxuqkjr.supabase.co`.

---

## Option 1: Deploy on Render.com (Recommended Free/Easy 1-URL)

1. **Push your code to GitHub**:
   - Create a repository on [github.com/new](https://github.com/new).
   - In your project directory:
     ```bash
     git init
     git add .
     git commit -m "Initial Full-Stack Institute Operations Copilot"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<your-repo-name>.git
     git push -u origin main
     ```

2. **Deploy on Render**:
   - Go to **[dashboard.render.com](https://dashboard.render.com)**.
   - Click **"New +"** ➔ **"Web Service"**.
   - Select your GitHub repository.
   - Set the settings:
     - **Name**: `institute-operations-copilot`
     - **Runtime**: `Python 3`
     - **Build Command**:
       ```bash
       npm install --legacy-peer-deps && npm run build && pip install -r requirements.txt
       ```
     - **Start Command**:
       ```bash
       uvicorn backend.main:app --host 0.0.0.0 --port $PORT
       ```
   - Click **"Advanced" ➔ "Add Environment Variable"**:
     - `SUPABASE_URL` = `https://boywgdihldfxrhxuqkjr.supabase.co`
     - `SUPABASE_ANON_KEY` = `<your-anon-key>`
     - `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
     - `VITE_USE_MOCK` = `false`
     - `JWT_SECRET` = `super-secret-institute-copilot-key-2026`
   - Click **"Create Web Service"**.
   
Once built, Render will give you a single live URL:
👉 **`https://institute-operations-copilot.onrender.com`**

---

## Option 2: Deploy on Railway.app (Automatic Docker Detection)

1. Go to **[railway.com](https://railway.com)** and log in with GitHub.
2. Click **"New Project"** ➔ **"Deploy from GitHub repo"**.
3. Select your repository.
4. Railway will automatically detect the [`Dockerfile`](file:///c:/Users/ABC/Downloads/institute-operations-copilot/Dockerfile) already prepared in your repo!
5. In **Variables**, add:
   - `SUPABASE_URL` = `https://boywgdihldfxrhxuqkjr.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
   - `SUPABASE_ANON_KEY` = `<your-anon-key>`
6. In **Settings** ➔ **Networking**, click **"Generate Domain"**.
👉 You get a live URL: **`https://institute-operations-copilot.up.railway.app`**

---

## Option 3: Deploy to Hugging Face Spaces (Free Docker URL)
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) ➔ **"Create new Space"**.
2. Select **Space SDK**: **Docker** (Blank).
3. Clone the space repo or push this repo directly to Hugging Face.
4. Under Settings ➔ Repository Secrets, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
👉 Your app is immediately live with HTTPS at `https://huggingface.co/spaces/<user>/<space-name>`!
