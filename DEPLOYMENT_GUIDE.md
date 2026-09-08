# NutriLens Deployment Guide 🚀

This guide provides step-by-step instructions to deploy NutriLens:

- **Database**: PostgreSQL (Render PostgreSQL / Neon / Supabase)
- **Backend**: Vercel (Serverless Node.js / Express REST API)
- **Frontend**: Render (Static Site with client-side SPA routing)

---

## Architecture Flow

```
[User Browser]
       │
       ├──► Render (Frontend: Vite + React SPA)
       │
       └──► Vercel (Backend: Express Serverless on /api/*)
                   │
                   └──► PostgreSQL (Cloud Database with SSL)
```

---

## Pre-Deployment Checklist

Before deploying, make sure you commit and push your latest code to GitHub:

```bash
git add .
git commit -m "Configure NutriLens for Render, Vercel, and PostgreSQL deployment"
git push origin main
```

---

## Phase 1: Create & Seed the PostgreSQL Database

You need a hosted PostgreSQL database. You can choose either **Render PostgreSQL** (keeps your database and frontend in the same dashboard) or **Neon** (instant serverless Postgres).

### Option A: Render PostgreSQL (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **PostgreSQL**.
2. Set:
   - **Name**: `nutrilens-db`
   - **Database**: `nutrilens`
   - **User**: `postgres` (or default)
   - **Region**: Select the region closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Plan**: Free
3. Click **Create Database**.
4. Once provisioned, scroll to **Connections** and copy the **External Database URL** (e.g., `postgresql://nutrilens_user:password@dpg-xxxxx.oregon-postgres.render.com/nutrilens`).
   > Note: Append `?sslmode=require` if it is not already included.

### Option B: Neon PostgreSQL (Alternative)

1. Go to [neon.tech](https://neon.tech/) and sign up / log in.
2. Click **Create Project** (Name: `nutrilens-db`).
3. Under **Connection Details**, copy the **Pooled Connection String** (it starts with `postgresql://...`).

---

### Step 1.2: Run Migrations and Seed Demo Products

You can run the schema migrations and demo seed data directly from your local terminal against your cloud database:

```bash
cd backend

# On Windows PowerShell:
$env:DATABASE_URL="your-postgresql-external-connection-string"
npm run db:migrate
npm run db:seed

# On macOS/Linux:
DATABASE_URL="your-postgresql-external-connection-string" npm run db:migrate
DATABASE_URL="your-postgresql-external-connection-string" npm run db:seed
```

You should see:

```
✅ Connected to PostgreSQL database.
🎉 Database schema migration completed successfully!
🎉 Demo data seeded successfully! Total products: 12
```

---

## Phase 2: Deploy the Backend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Connect your GitHub account and select your **NutriLens** repository.
3. In the project configuration screen:
   - **Framework Preset**: Select **Other**.
   - **Root Directory**: Click **Edit** and set it to:
     - `NutriLens/backend` (if your repository root contains the `NutriLens` folder), OR
     - `backend` (if your repository root is the NutriLens project itself).
   - **Build & Development Settings**: Keep defaults (no build command needed).
4. Expand **Environment Variables** and add the following:

| Variable Name  | Example Value                                           | Description                                                           |
| -------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@host/nutrilens?sslmode=require` | Your PostgreSQL connection string from Phase 1                        |
| `JWT_SECRET`   | `nutrilens_prod_super_secret_key_2026`                  | Any secure 32+ character string                                       |
| `NODE_ENV`     | `production`                                            | Enables production mode & SSL                                         |
| `CLIENT_URL`   | `http://localhost:5173`                                 | Temporary value; update this with your Render frontend URL in Phase 4 |

5. Click **Deploy**.
6. Once deployment finishes, Vercel will give you a domain:
   `https://<your-backend-name>.vercel.app`

### Test Your Backend:

- Visit `https://<your-backend-name>.vercel.app/` in your browser. You should see:
  ```json
  {
    "status": "online",
    "name": "NutriLens API",
    "version": "1.0.0",
    "docs": "NutriLens packaged food analysis API",
    "healthCheck": "/api/health"
  }
  ```
- Visit `https://<your-backend-name>.vercel.app/api/health`. You should see `status: "healthy"` and `"connected": true` under database!

---

## Phase 3: Deploy the Frontend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Static Site**.
2. Connect your GitHub repository and select **NutriLens**.
3. In the setup form, configure:
   - **Name**: `nutrilens-frontend`
   - **Branch**: `main`
   - **Root Directory**:
     - `NutriLens/frontend` (if your repo root contains `NutriLens`), OR
     - `frontend` (if your repo root is the NutriLens project itself).
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Expand **Advanced** -> **Add Environment Variable**:

| Variable Name  | Value                                        |
| -------------- | -------------------------------------------- |
| `VITE_API_URL` | `https://<your-backend-name>.vercel.app/api` |

_(Note: Replace `<your-backend-name>` with your actual Vercel domain from Phase 2)._

5. Click **Create Static Site**.
6. Render will install dependencies, build Vite, bundle `dist/_redirects`, and publish the site.
7. Your frontend will be live at:
   `https://<your-frontend-name>.onrender.com`

---

## Phase 4: Connect Backend CORS to Frontend

Now that your Render frontend domain is live:

1. Return to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click your backend project -> **Settings** -> **Environment Variables**.
3. Edit the `CLIENT_URL` variable:
   - Change value to: `https://<your-frontend-name>.onrender.com`
4. Click **Save**.
5. Go to **Deployments** tab on Vercel, click the three dots (`...`) on your latest deployment, and click **Redeploy** to apply the updated environment variable.

---

## Phase 5: Verification Checklist

Test the live deployment from end-to-end:

- [ ] **Health Endpoint**: Open `https://<backend>.vercel.app/api/health` -> should report database `"connected": true`.
- [ ] **Homepage & Catalog**: Open `https://<frontend>.onrender.com` -> 12 benchmark demo products and categories should display.
- [ ] **Search**: Try searching for `chips` or `cola` in the search bar -> search results should return from the backend.
- [ ] **Compare Feature**: Add two products and click compare -> comparison table and health scores should render properly.
- [ ] **Direct URL Navigation**: Refresh the browser while on `https://<frontend>.onrender.com/compare` -> page should reload cleanly without a 404 error (handled by `_redirects`).
- [ ] **User Registration / Login**: Create a test account to verify PostgreSQL persistence.

---

## Troubleshooting

### 1. Database Connection Timeout or SSL Error

- **Symptom**: `/api/health` reports `database: { connected: false }`.
- **Fix**: Verify your `DATABASE_URL` contains `?sslmode=require`. In Render PostgreSQL, use the **External Database URL** (not the Internal URL, as Vercel runs outside Render's internal private network).

### 2. CORS Error in Browser Console

- **Symptom**: Browser console shows `Access to fetch at ... has been blocked by CORS policy`.
- **Fix**: Check `CLIENT_URL` in Vercel. Ensure it matches your Render frontend domain (e.g. `https://nutrilens-frontend.onrender.com`). NutriLens automatically strips trailing slashes and handles `.onrender.com` subdomains, but make sure to redeploy Vercel after updating environment variables.

### 3. Frontend Displays Network Error

- **Symptom**: Frontend shows "Network error occurred".
- **Fix**: Ensure `VITE_API_URL` is set in Render environment variables and that you triggered a **Manual Deploy -> Clear build cache & deploy** after adding it, as Vite environment variables are baked in during `npm run build`.
