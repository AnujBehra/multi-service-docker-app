# 🚀 Deploy to Railway (Free Domain)

## Quick Deploy Steps

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Create New Project
```bash
railway init
```

### 4. Add Services (Railway Dashboard)

Go to [railway.app](https://railway.app) and add these services to your project:

#### PostgreSQL Database
- Click "New" → "Database" → "PostgreSQL"
- Railway auto-configures `DATABASE_URL`

#### Redis Cache
- Click "New" → "Database" → "Redis"  
- Railway auto-configures `REDIS_URL`

#### Backend API
- Click "New" → "GitHub Repo" → Select your repo
- Set Root Directory: `backend`
- Add Environment Variables:
  ```
  PORT=3000
  NODE_ENV=production
  DB_HOST=${{Postgres.PGHOST}}
  DB_PORT=${{Postgres.PGPORT}}
  DB_NAME=${{Postgres.PGDATABASE}}
  DB_USER=${{Postgres.PGUSER}}
  DB_PASSWORD=${{Postgres.PGPASSWORD}}
  REDIS_HOST=${{Redis.REDISHOST}}
  REDIS_PORT=${{Redis.REDISPORT}}
  JWT_SECRET=your-super-secret-jwt-key-change-this
  ```

#### Frontend
- Click "New" → "GitHub Repo" → Select your repo
- Set Root Directory: `frontend`
- Add Environment Variable:
  ```
  REACT_APP_API_URL=https://your-backend.railway.app
  ```

### 5. Generate Free Domain

For each service:
1. Click on the service
2. Go to "Settings" → "Networking"
3. Click "Generate Domain"
4. You'll get: `your-app-name.up.railway.app`

## Alternative: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/multi-service)

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL |
| `REDIS_URL` | Auto-set by Railway Redis |
| `JWT_SECRET` | Your secret key for JWT tokens |
| `NODE_ENV` | Set to `production` |
| `PORT` | Railway sets this automatically |

## Free Tier Limits

- **$5 free credit/month**
- **500 hours of runtime**
- **1GB RAM per service**
- **Free `.railway.app` subdomain**

## After Deployment

Your app will be available at:
- **Frontend**: `https://frontend-xxx.up.railway.app`
- **Backend API**: `https://backend-xxx.up.railway.app`
- **API Docs**: `https://backend-xxx.up.railway.app/api/docs`
