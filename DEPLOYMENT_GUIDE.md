# Deployment Guide: Vercel & Render

This project supports dual deployment on **Vercel** and **Render** without code conflicts or structural merges. You can deploy to Vercel at any time while preserving full compatibility with Render.

---

## Deployment Architectures

### Option 1: Hybrid Deployment (Recommended for Socket.io & Scheduled Tasks)
- **Frontend**: Deployed on **Vercel** (ultra-fast global CDN).
- **Backend**: Deployed on **Render** (persistent WebSockets & scheduled auto-launch intervals).

#### Steps for Option 1:
1. **Deploy Backend to Render**:
   - Connect repository to Render.
   - Select **Web Service** or use the existing `render.yaml` file.
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Set Environment Variables:
     - `NODE_ENV`: `production`
     - `MONGO_URI`: Your MongoDB Atlas URI
     - `JWT_SECRET`: Your JWT Secret
   - Copy your deployed backend URL (e.g. `https://smart-quiz-platform.onrender.com`).

2. **Deploy Frontend to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your GitHub repository.
   - Set **Root Directory** to `frontend` (or keep root).
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add Environment Variable:
     - `VITE_API_URL`: `https://smart-quiz-platform.onrender.com` (Your Render backend URL)
   - Click **Deploy**.

---

### Option 2: Full-Stack Monorepo on Vercel
- **Frontend & REST API**: Both served entirely from **Vercel** using Vercel Serverless Functions (`/api/*`).

#### Steps for Option 2:
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import the root of your GitHub repository.
3. Keep default settings (`vercel.json` will automatically configure builds and API rewrites).
4. Add Environment Variables in Vercel settings:
   - `MONGO_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Your secret key
5. Click **Deploy**.

*Note: Serverless API functions execute per request. For continuous WebSockets or background intervals, Option 1 is recommended.*

---

### Option 3: Full-Stack on Render (Pure Render)
- **Frontend & Backend**: Both served as a unified web service on **Render**.

#### Steps for Option 3:
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Create a new **Web Service** from your GitHub repo.
3. Render automatically reads `render.yaml`:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. Set `MONGO_URI` and `JWT_SECRET` in environment variables.
5. Click **Deploy Web Service**.

---

## File Configuration Summary
- `vercel.json`: Handles Vercel monorepo static build outputs and `/api/*` routing to serverless functions.
- `api/index.js`: Serverless entry point wrapping the Express app.
- `render.yaml`: Configures Render persistent server deployment.
- `backend/server.js`: Dual-mode entry point supporting both Vercel serverless imports and Render standalone listener execution.
