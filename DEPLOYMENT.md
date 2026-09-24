# Deployment Guide: Trao AI Interview Prep Kit

This guide walks you through deploying the **Trao AI Interview Prep Kit** live to the web in under 5 minutes for **100% free**.

The recommended production architecture uses:
- **Backend API**: Hosted on [Render](https://render.com) (Free Node.js Web Service)
- **Frontend App**: Hosted on [Vercel](https://vercel.com) (Free Next.js Edge CDN)
- **Database**: In-memory (zero configuration) or [MongoDB Atlas](https://www.mongodb.com/atlas) (Free Tier)

---

## Part 1: Deploy Backend to Render (2 Minutes)

1. Sign up or log into [Render.com](https://render.com) using your GitHub account.
2. Click **New +** in the top navigation bar and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your repo: `RahulNaikMudavath/Trao-assignment`.
4. Configure the service settings:
   - **Name**: `trao-backend` (or your preferred name)
   - **Region**: Choose the region closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/src/index.js`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `GEMINI_API_KEY` | `<your_gemini_api_key_from_google_ai_studio>` | Live LLM generation key |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Stable, high-speed Gemini model |
   | `CLIENT_URL` | `*` | Allows your Vercel frontend to communicate |
   | `JWT_SECRET` | *(any random 32-character string)* | Auth session token signing |
   | `MONGODB_URI` | *(optional)* | If left empty, uses resilient in-memory storage |

6. Click **Create Web Service**.
7. Render will build and deploy your backend. When complete, copy your live backend URL (e.g. `https://trao-backend-xxxx.onrender.com`).
8. You can verify it is healthy by visiting `https://trao-backend-xxxx.onrender.com/api/health`.

---

## Part 2: Deploy Frontend to Vercel (1 Minute)

1. Sign up or log into [Vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select your repository `RahulNaikMudavath/Trao-assignment` and click **Import**.
4. Configure the project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend`.
5. Expand the **Environment Variables** section and add:
   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://trao-backend-xxxx.onrender.com/api` |
   *(Replace with the actual Render URL from Part 1 with `/api` appended at the end)*

6. Click **Deploy**.
7. In ~45 seconds, your frontend will be live on a `https://trao-assignment-xxxx.vercel.app` URL!

---

## Part 3: Test Your Live App

1. Open your live Vercel URL in your browser.
2. Click **Register** or **Login** to create an account.
3. Paste a target job description and company URL (`https://example.com`), select days, and click **Generate Prep Kit**.
4. Watch the live 7-step autonomous pipeline execute and explore your generated questions, flashcards, and mock interview studio!
