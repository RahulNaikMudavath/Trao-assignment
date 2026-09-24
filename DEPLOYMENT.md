# Hosting Guide: Deploying Frontend & Backend on Render

This guide explains how to host **both the Frontend and Backend exclusively on [Render.com](https://render.com)** for **100% free**.

---

## Method 1: Automatic Blueprint (1-Click - Recommended)

Because our repository includes a pre-configured [`render.yaml`](./render.yaml), Render can automatically create both services for you in a single step!

1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in with your GitHub account.
2. In the top right, click **New +** and select **Blueprint**.
3. Connect your repository: **`RahulNaikMudavath/Trao-assignment`**.
4. Render will scan `render.yaml` and show:
   - `trao-backend` (Web Service)
   - `trao-frontend` (Web Service)
5. Fill in the required environment variables:
   - **`GEMINI_API_KEY`**: Your Gemini API key (`AQ.Ab8RN...`)
   - **`NEXT_PUBLIC_API_URL`**: Leave blank for now, or fill in once backend URL is generated.
6. Click **Apply**.
7. Render will automatically build and deploy both services!

---

## Method 2: Manual Step-by-Step Setup on Render

If you prefer setting up the services manually via the Render UI:

### Step 1: Deploy Backend Web Service

1. On [Render](https://dashboard.render.com/), click **New +** -> **Web Service**.
2. Select **`RahulNaikMudavath/Trao-assignment`** and click **Connect**.
3. Fill in the details:
   - **Name**: `trao-backend`
   - **Region**: Any (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: *(leave completely empty)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/src/index.js`
   - **Instance Type**: **Free**
4. Expand **Advanced** -> **Add Environment Variable**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `GEMINI_API_KEY` | `<your_gemini_api_key>` | Your Gemini API key from Google AI Studio |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Stable high-speed model |
   | `CLIENT_URL` | `*` | Allows Render frontend to connect without CORS blocks |
   | `JWT_SECRET` | `super-secret-jwt-key-trao-assessment-2026` | Auth session token signing |
   | `MONGODB_URI` | *(optional)* | If omitted, uses resilient in-memory storage |

5. Click **Create Web Service**.
6. Wait 1–2 minutes until it shows **Live**.
7. Copy the backend URL at the top (e.g., `https://trao-backend-xxxx.onrender.com`).
   - Test it: visit `https://trao-backend-xxxx.onrender.com/api/health` — it will return `{"status":"ok"}`.

---

### Step 2: Deploy Frontend Web Service

1. In Render, click **New +** -> **Web Service**.
2. Select **`RahulNaikMudavath/Trao-assignment`** again.
3. Fill in the details:
   - **Name**: `trao-frontend`
   - **Region**: Same region as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
4. Expand **Advanced** -> **Add Environment Variable**:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `NEXT_PUBLIC_API_URL` | `https://trao-backend-xxxx.onrender.com/api` |
   *(Paste your actual backend URL from Step 1 with `/api` appended)*

5. Click **Create Web Service**.
6. Once deployed (~1 minute), click on your live frontend URL (e.g. `https://trao-frontend-xxxx.onrender.com`).

---

## Step 3: Test Your Live Hosted App

1. Open your live `trao-frontend` URL on Render.
2. Click **Register** to create an account.
3. Paste a job description and company URL (`https://example.com`), select days, and click **Generate Prep Kit**.
4. The frontend will stream live progress from your Render backend, run through all 7 pipeline steps, and present the complete prep kit!
