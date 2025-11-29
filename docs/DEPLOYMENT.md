# Arogya-Swarm Deployment Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Git

---

## Local Development Setup

### Backend Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-team/arogya-swarm.git
cd arogya-swarm/backend
```

2. **Create Virtual Environment**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Setup Environment Variables**
```bash
# Windows
copy .env.example .env
# Mac/Linux
cp .env.example .env
```

Edit `.env` with your API keys:
```bash
GOOGLE_API_KEY=your_gemini_key
OPENWEATHERMAP_API_KEY=your_weather_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/arogya_swarm
```

5. **Initialize Database**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE arogya_swarm;"

# Run schema
psql -U postgres -d arogya_swarm -f ../database/schema.sql

# Load seed data
psql -U postgres -d arogya_swarm -f ../database/seed_data.sql
```

6. **Start Backend**
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

1. **Navigate to Frontend**
```bash
cd ../frontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Environment**
```bash
# Create .env file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
echo "VITE_WS_URL=ws://localhost:8000/ws" >> .env
```

4. **Start Dev Server**
```bash
npm run dev
```

5. **Access Application**
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Deploy Backend to Railway

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd backend
railway init
```

4. **Add PostgreSQL**
```bash
railway add postgresql
```

5. **Add Redis**
```bash
railway add redis
```

6. **Set Environment Variables**
```bash
railway variables set GOOGLE_API_KEY=your_key
railway variables set OPENWEATHERMAP_API_KEY=your_key
railway variables set FRONTEND_URL=https://your-app.vercel.app
```

7. **Deploy**
```bash
railway up
```

8. **Get Backend URL**
```bash
railway domain
# Example: https://arogya-swarm.railway.app
```

#### Deploy Frontend to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Navigate to Frontend**
```bash
cd ../frontend
```

3. **Deploy**
```bash
vercel --prod
```

4. **Set Environment Variables in Vercel Dashboard**
```
VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_WS_URL=wss://your-backend.railway.app/ws
```

---

### Option 2: Docker Compose (All-in-One)

1. **Create docker-compose.yml** (in project root)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: arogya_swarm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/1-schema.sql
      - ./database/seed_data.sql:/docker-entrypoint-initdb.d/2-seed.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/arogya_swarm
      REDIS_URL: redis://redis:6379/0
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      OPENWEATHERMAP_API_KEY: ${OPENWEATHERMAP_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:8000/api/v1
      VITE_WS_URL: ws://localhost:8000/ws
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
```

2. **Create Backend Dockerfile**
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3. **Create Frontend Dockerfile**
```dockerfile
# frontend/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
```

4. **Start All Services**
```bash
docker-compose up -d
```

---

## Environment Variables Reference

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
GOOGLE_API_KEY=your_gemini_key

# External APIs
OPENWEATHERMAP_API_KEY=your_weather_key
SAFAR_AIR_API_KEY=your_safar_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Configuration
HOSPITAL_NAME=Apollo Metro Hospital
HOSPITAL_CITY=Mumbai
HOSPITAL_BEDS=400
DEMO_MODE=true
FRONTEND_URL=http://localhost:5173

# Feature Flags
ENABLE_VOICE_NARRATION=true
ENABLE_SMS_NOTIFICATIONS=false
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

---

## Monitoring & Logs

### Railway Logs
```bash
railway logs
```

### Vercel Logs
```bash
vercel logs
```

### Local Logs
Backend logs: Check terminal output
Frontend logs: Browser console

---

## Database Migrations

Using Alembic for schema changes:

```bash
# Create migration
alembic revision -m "Add new column"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Troubleshooting

### Backend Won't Start
1. Check PostgreSQL is running: `pg_isready`
2. Verify Redis connection: `redis-cli ping`
3. Check environment variables: `printenv | grep DATABASE_URL`

### Frontend Build Fails
1. Clear cache: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Check Node version: `node -v` (should be 18+)

### WebSocket Connection Fails
1. Verify backend is running
2. Check CORS settings in main.py
3. Ensure WebSocket URL uses `ws://` (local) or `wss://` (production)

### Database Connection Errors
1. Check PostgreSQL is running
2. Verify connection string format
3. Test connection: `psql $DATABASE_URL`

---

## Performance Optimization

### Backend
- Enable PostgreSQL connection pooling (already configured)
- Use Redis caching for external API responses
- Implement request rate limiting
- Use async endpoints where possible

### Frontend
- Enable production build: `npm run build`
- Use CDN for static assets
- Implement lazy loading for components
- Optimize bundle size with code splitting

---

## Security Checklist

- [ ] API keys stored in environment variables
- [ ] Database credentials secured
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled (production)
- [ ] WebSocket authentication implemented

---

## Backup & Recovery

### Database Backup
```bash
# Backup
pg_dump -U postgres arogya_swarm > backup.sql

# Restore
psql -U postgres arogya_swarm < backup.sql
```

### Redis Backup
```bash
# Save snapshot
redis-cli SAVE

# Copy dump.rdb file
```

---

## Support

For deployment issues, contact:
- Email: team@arogyaswarm.com
- GitHub Issues: https://github.com/your-team/arogya-swarm/issues
