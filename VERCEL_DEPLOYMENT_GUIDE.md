# Vercel Deployment Guide for HireMind AI

This guide will help you deploy both the frontend and backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Connect your repository
3. **Database**: Set up a PostgreSQL database (recommended: Neon, Supabase, or Railway)
4. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com)

## Backend Deployment (FastAPI)

### 1. Prepare Backend for Vercel

The backend has been configured with:
- `vercel.json` - Vercel configuration
- `api/index.py` - Vercel serverless entry point
- `requirements.txt` - Updated with `mangum` for serverless support

### 2. Add Required Dependencies

Add `mangum` to your `requirements.txt`:

```bash
echo "mangum==0.17.0" >> backend/requirements.txt
```

### 3. Environment Variables for Backend

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `SECRET_KEY` | `your-super-secret-key` | JWT secret key (generate with `openssl rand -hex 32`) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiration |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key |
| `FRONTEND_ORIGIN` | `https://your-frontend.vercel.app` | Frontend URL for CORS |

### 4. Deploy Backend

1. Go to Vercel Dashboard → **Add New Project**
2. Import your repository
3. Set **Root Directory** to `backend`
4. Vercel should auto-detect Python framework
5. Add environment variables from step 3
6. Deploy

Your backend will be available at: `https://your-backend.vercel.app`

## Frontend Deployment (React + Vite)

### 1. Prepare Frontend for Vercel

The frontend has been configured with:
- `vercel.json` - Vercel configuration with SPA routing
- Updated `src/api/client.js` - Uses `VITE_API_URL` environment variable

### 2. Environment Variables for Frontend

Set in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` | Backend API URL |

### 3. Deploy Frontend

1. Go to Vercel Dashboard → **Add New Project**
2. Import your repository
3. Set **Root Directory** to `frontend`
4. Vercel should auto-detect Vite framework
4. Add environment variable from step 2
5. Deploy

Your frontend will be available at: `https://your-frontend.vercel.app`

## Post-Deployment Configuration

### 1. Update CORS in Backend

After frontend deployment, update the `FRONTEND_ORIGIN` environment variable in your backend Vercel project to match your frontend URL:

```
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

### 2. Run Database Migrations

After backend deployment, run migrations:

```bash
# Option 1: Vercel CLI
vercel env pull .env.local
cd backend
alembic upgrade head

# Option 2: Use a migration script in your CI/CD
```

### 3. Test the Deployment

1. Visit your frontend URL
2. Try registering a new user
3. Test resume upload, job creation, interview features

## Troubleshooting

### 500 Internal Server Error (Backend)

**Common causes:**
1. **Missing environment variables** - Check all required vars are set in Vercel
2. **Database connection** - Ensure DATABASE_URL is correct and database allows Vercel IPs
3. **Missing dependencies** - Check `requirements.txt` has all needed packages
4. **Cold start timeout** - Increase `maxDuration` in `vercel.json` if needed

**Debug steps:**
1. Check Vercel Function Logs in Dashboard
2. Test locally with `vercel dev`
3. Verify database connectivity

### Frontend Build Errors

**Common causes:**
1. **Missing VITE_API_URL** - Ensure environment variable is set
2. **Build failures** - Check build logs in Vercel dashboard
3. **Routing issues** - SPA fallback configured in `vercel.json`

### CORS Errors

If you see CORS errors:
1. Verify `FRONTEND_ORIGIN` in backend matches your frontend URL exactly
2. Check that frontend is making requests to correct backend URL
3. Ensure both are deployed to Vercel (same domain helps)

## Environment-Specific Notes

### Database (PostgreSQL)
- **Development**: SQLite (local file)
- **Production**: PostgreSQL (Neon, Supabase, Railway, etc.)
- Update `DATABASE_URL` in Vercel environment variables

### File Storage
- **Development**: Local filesystem
- **Production**: Consider AWS S3, Cloudflare R2, or Vercel Blob for file uploads

### Background Jobs
- Vercel Functions have 30s max duration (Pro: 300s)
- For long-running tasks, use Vercel Cron Jobs or external queue (Redis + BullMQ)

## CI/CD Pipeline (Optional)

Add `.github/workflows/deploy.yml` for automatic deployments:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.FRONTEND_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.BACKEND_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./backend
```

## Useful Commands

```bash
# Local development with Vercel
vercel dev

# Deploy from CLI
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull .env.local
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)