# FinishVision — Complete Deployment Guide

This guide walks you through deploying FinishVision to production using free tier services: **Vercel** (frontend), **Render** (backend), and **Neon** (database).

## Prerequisites

- GitHub account with the finishvision repository pushed
- Neon account with database created
- Vercel account
- Render account

## Step 1: Database Setup (Neon)

### Create PostgreSQL Database

1. Go to https://neon.tech
2. Sign up with Google
3. Create a new project called "finishvision"
4. Copy the connection string (looks like: `postgresql://user:password@host/dbname`)
5. Save this for later — you'll need it for the backend

### Run Database Migrations

Once your backend is deployed (see Step 3), the migrations will run automatically. You can also run them manually:

```bash
DATABASE_URL="your_neon_connection_string" npx prisma migrate deploy
```

## Step 2: Frontend Deployment (Vercel)

### Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Paste: `https://github.com/eueron/finishvision`
5. Click "Import"
6. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`

7. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
   ```

8. Click "Deploy"

### Get Your Frontend URL

After deployment, Vercel will give you a URL like: `https://finishvision.vercel.app`

## Step 3: Backend Deployment (Render)

### Deploy to Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Select "Deploy an existing repository"
4. Choose `eueron/finishvision`
5. Configure:
   - **Name**: finishvision-api
   - **Environment**: Node
   - **Build Command**: `cd apps/backend && npm install && npx prisma generate && npm run build`
   - **Start Command**: `cd apps/backend && npm start`
   - **Root Directory**: `apps/backend`

6. Add Environment Variables:
   ```
   DATABASE_URL=your_neon_connection_string
   JWT_SECRET=your_secure_random_string_here
   NODE_ENV=production
   OPENAI_API_KEY=your_openai_api_key
   CORS_ORIGIN=https://finishvision.vercel.app
   ```

7. Click "Create Web Service"

### Get Your Backend URL

After deployment, Render will give you a URL like: `https://finishvision-api.onrender.com`

## Step 4: Connect Frontend to Backend

1. Go back to Vercel dashboard
2. Select your finishvision project
3. Go to Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL` to your Render backend URL
5. Redeploy (Vercel will auto-redeploy on any push to GitHub)

## Step 5: Test the Deployment

1. Open your Vercel frontend URL
2. Login with credentials:
   - Email: `admin@demo.com`
   - Password: `Demo@2024!`

3. Test the following:
   - Dashboard loads with stats
   - Projects page shows demo projects
   - Project detail page shows hierarchy
   - Blueprints upload works
   - Takeoff summary works
   - Estimates generate correctly
   - Reports export to PDF

## Troubleshooting

### "Network Error" on Login

- Check that `NEXT_PUBLIC_API_URL` in Vercel matches your Render URL
- Check CORS settings in backend
- Verify backend is running on Render (check logs)

### Database Connection Error

- Verify `DATABASE_URL` is correct in Render environment variables
- Check that Neon database is active
- Run migrations manually if needed

### Build Failures

**Frontend build fails:**
```bash
# Clear cache and rebuild
vercel env pull
pnpm install
pnpm build
```

**Backend build fails:**
```bash
# Check logs on Render dashboard
# Common issue: missing environment variables
# Solution: Add all required env vars to Render
```

### Slow Performance

- Render free tier has limited resources
- Upgrade to paid tier for production use
- Consider upgrading database on Neon

## Production Checklist

- [ ] Database backup enabled on Neon
- [ ] Environment variables secured (no secrets in code)
- [ ] CORS properly configured
- [ ] SSL/TLS enabled (automatic on Vercel/Render)
- [ ] Email notifications configured
- [ ] Error logging enabled
- [ ] Database indexes optimized
- [ ] API rate limiting configured

## Monitoring & Logs

### Vercel Logs
- Dashboard → Project → Deployments → Click deployment → Logs

### Render Logs
- Dashboard → finishvision-api → Logs

### Database Logs
- Neon Console → Query Editor → Check recent queries

## Scaling Beyond Free Tier

When you're ready to scale:

1. **Database**: Upgrade Neon to paid plan
2. **Backend**: Upgrade Render to paid tier
3. **Frontend**: Vercel pro tier (optional, free tier is sufficient)
4. **Storage**: Add AWS S3 for file uploads
5. **Email**: Add SendGrid or similar for notifications

## Next Steps

1. Deploy to production using this guide
2. Configure custom domain (optional)
3. Set up monitoring and alerts
4. Configure backup strategy
5. Plan scaling strategy

## Support

For issues:
- Vercel: https://vercel.com/support
- Render: https://render.com/docs
- Neon: https://neon.tech/docs
- FinishVision: Check GitHub issues

---

**Last Updated**: March 2026
**Version**: 1.0
