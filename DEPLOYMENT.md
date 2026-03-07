# FinishVision Deployment Guide

This guide explains how to deploy FinishVision to production using free-tier services.

## Architecture

- **Frontend**: Vercel (Next.js)
- **Backend**: Render (Docker)
- **Database**: Neon (PostgreSQL)

## Prerequisites

1. GitHub account (to host the code)
2. Vercel account (free tier)
3. Render account (free tier)
4. Neon account (free tier)

## Step 1: Create GitHub Repository

```bash
cd /home/ubuntu/finishvision
git add .
git commit -m "Initial commit: FinishVision SaaS platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/finishvision.git
git push -u origin main
```

## Step 2: Setup Neon Database

1. Go to https://neon.tech
2. Sign up with Google
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:password@host/database`)
5. Save this for later

## Step 3: Deploy Backend to Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: finishvision-api
   - **Runtime**: Docker
   - **Region**: Oregon (free)
   - **Plan**: Free
6. Add environment variables:
   - `DATABASE_URL`: (paste from Neon)
   - `JWT_SECRET`: (generate a random string)
   - `CORS_ORIGIN`: (will be your Vercel frontend URL)
   - `OPENAI_API_KEY`: (your OpenAI key if you have one)
7. Click "Deploy"

## Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your finishvision repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: apps/frontend
6. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: (your Render backend URL)
7. Click "Deploy"

## Step 5: Update Backend CORS

After Vercel deployment completes, update the backend:

1. Go to Render dashboard
2. Select finishvision-api service
3. Go to Environment
4. Update `CORS_ORIGIN` to your Vercel URL (e.g., https://finishvision.vercel.app)
5. Redeploy

## Accessing Your App

- **Frontend**: https://finishvision.vercel.app
- **Backend API**: https://finishvision-api.onrender.com
- **API Docs**: https://finishvision-api.onrender.com/api/docs

## Default Credentials

- Email: `admin@demo.com`
- Password: `Demo@2024!`

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify DATABASE_URL is correct
- Ensure Prisma migrations ran successfully

### Frontend can't connect to API
- Check NEXT_PUBLIC_API_URL environment variable
- Verify backend CORS_ORIGIN includes your frontend URL
- Check browser console for CORS errors

### Database connection fails
- Verify Neon connection string is correct
- Check if database exists in Neon
- Run migrations manually if needed

## Next Steps

- Configure custom domain
- Setup CI/CD for automatic deployments
- Add monitoring and logging
- Configure backups for database
