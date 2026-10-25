# Deploying LLM-Prop to Render 🚀

This guide provides step-by-step instructions for deploying **LLM-Prop** (FastAPI Backend + React 3D Crystal Explorer) to [Render](https://render.com).

The project is pre-configured with **`render.yaml`** (Render Blueprint), **`build.sh`**, and a **multi-stage `Dockerfile`**, allowing you to deploy either:
1. **Option A (Recommended & Free)**: **Single Unified Web Service** (FastAPI serves both the API and the React UI with zero CORS setup).
2. **Option B**: **Split Deployment** (FastAPI Web Service + Vite React Static Site).
3. **Option C**: **Docker Web Service**.

---

## 📋 Pre-Deployment: Push Your Code to GitHub

Render builds directly by pulling from your GitHub repository.

1. Open your terminal in the project directory:
   ```bash
   git init
   git add .
   git commit -m "Configure LLM-Prop for Render deployment"
   ```

2. Create a new repository on [GitHub](https://github.com/new).

3. Link and push to your remote repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

> **Note on Model Weights**: GitHub has a strict 100MB file limit per file. Large model checkpoints (`*.safetensors`, `*.bin`) are already included in `.gitignore`. The app is designed to run with physics-grounded fallback logic and validated test metrics out of the box, or you can supply `MODEL_WEIGHTS_URL` to download custom weights during build.

---

## ⚡ Option A: 1-Click Deploy via Render Blueprint (Recommended)

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right corner and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically read [`render.yaml`](render.yaml) and populate all build and run settings:
   - **Environment**: Python
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, set your API keys:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `MP_API_KEY`: Your Materials Project API Key
   - `OPENAI_API_KEY`: (Optional) OpenAI API Key fallback
6. Click **Apply**.
7. Once the build completes, visit your generated URL: `https://llm-prop-xxxx.onrender.com`.

---

## 🛠️ Option B: Manual Web Service Setup (Render Dashboard)

If you prefer configuring the service manually through Render's web UI:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your GitHub repository.
3. Configure the following fields:
   - **Name**: `llm-prop`
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Runtime**: `Python`
   - **Build Command**:
     ```bash
     chmod +x build.sh && ./build.sh
     ```
   - **Start Command**:
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: Free (or Starter if you want persistent warm memory)
4. Click **Advanced** and add the following **Environment Variables**:
   | Variable | Value | Notes |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python environment |
   | `GEMINI_API_KEY` | `your_gemini_key` | For scientific reasoning |
   | `MP_API_KEY` | `your_mp_api_key` | For crystal structures |
   | `OPENAI_API_KEY` | *(Optional)* | Fallback LLM provider |
   | `CORS_ORIGINS` | `*` | Allows cross-origin calls |
5. Set **Health Check Path** to `/api/health`.
6. Click **Create Web Service**.

---

## 🐳 Option C: Deploy via Docker

Render natively supports deploying from a Dockerfile:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Select **Docker** as the runtime. Render will automatically detect the [`Dockerfile`](Dockerfile) in the root.
4. Add your environment variables (`GEMINI_API_KEY`, `MP_API_KEY`, etc.).
5. Click **Create Web Service**.

---

## 🌐 Endpoints Available After Deployment

Once deployed, your service provides:
- **Interactive Web App**: `https://<your-service>.onrender.com/` (React UI + 3D Crystal Viewer)
- **API Health Check**: `https://<your-service>.onrender.com/api/health`
- **Interactive Swagger Docs**: `https://<your-service>.onrender.com/docs`
- **API Overview**: `https://<your-service>.onrender.com/api`
- **Material Search**: `https://<your-service>.onrender.com/api/materials/search?q=SiO2`
- **Predictions**: `POST https://<your-service>.onrender.com/api/predictions`
- **Explanations**: `POST https://<your-service>.onrender.com/api/explanations`

---

## 💡 Tips & Render Best Practices

1. **Free Tier Cold Starts**:
   Render Free Web Services spin down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds while the service spins back up. Subsequent requests will be instant.

2. **Memory Optimization**:
   The `build.sh` script installs the CPU-only build of PyTorch (`https://download.pytorch.org/whl/cpu`), which saves over 1 GB of slug size and prevents memory exhaustion on Render's 512MB free tier.

3. **Custom Model Weights**:
   If you have trained weights hosted on Hugging Face or Cloud Storage, add an environment variable `MODEL_WEIGHTS_URL=https://.../model.safetensors`. The `build.sh` script will automatically fetch them during deploy.
