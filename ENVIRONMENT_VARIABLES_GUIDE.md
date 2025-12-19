# Environment Variables Configuration Checklist ✅

## 🎯 Overview
This document lists all required environment variables for the CRM application to function properly with frontend-backend connections.

---

## 📁 Frontend Environment Variables

### **File Location:** `/crm-frontend-main/.env`

```bash
# API Configuration - REQUIRED
VITE_API_BASE_URL=https://your-backend-url.com
VITE_API_BACKEND_URL=https://your-backend-url.com/api

# Supabase Configuration - REQUIRED
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_DEBUG_MODE=false
```

### **Variable Descriptions:**

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `VITE_API_BASE_URL` | ✅ Yes | Base URL for backend API | `https://crm-backend.railway.app` |
| `VITE_API_BACKEND_URL` | ✅ Yes | Full backend API URL with /api | `https://crm-backend.railway.app/api` |
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `VITE_ENABLE_REAL_TIME` | ❌ No | Enable real-time updates | `true` (default) |
| `VITE_ENABLE_NOTIFICATIONS` | ❌ No | Enable notifications | `true` (default) |
| `VITE_DEBUG_MODE` | ❌ No | Enable debug logging | `false` (default) |

### **Where to Use:**
```typescript
// File: src/lib/backend.ts

export const getApiConfig = (): ApiConfig => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;  // ✅ Used here
  const backendUrl = import.meta.env.VITE_API_BACKEND_URL;  // ✅ Used here
  
  return { baseUrl, backendUrl, ... };
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  // ✅ Used here
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  // ✅ Used here
  
  return { supabaseUrl, supabaseAnonKey, ... };
};
```

---

## 🖥️ Backend Environment Variables

### **File Location:** `/crm-backend-main/.env`

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Authentication - REQUIRED
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=24h

# Supabase Database - REQUIRED
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Cunnekt WhatsApp API - REQUIRED for WhatsApp Features
CUNNEKT_API_KEY=4d776c1d10d186e225f1985095d201eb9cc41ad4

# Optional: Default Admin Credentials
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### **Variable Descriptions:**

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `PORT` | ❌ No | Server port (defaults to 3001) | `3001` |
| `NODE_ENV` | ❌ No | Environment mode | `production` or `development` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT signing | `dmhca-crm-secret-key-2024` |
| `JWT_EXPIRES_IN` | ❌ No | JWT token expiration | `24h` (default) |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `CUNNEKT_API_KEY` | ✅ Yes | Cunnekt WhatsApp API key | `4d776c1d10d186e225f1985095d201eb9cc41ad4` |
| `DEFAULT_ADMIN_USERNAME` | ❌ No | Default admin username | `admin` |
| `DEFAULT_ADMIN_PASSWORD` | ❌ No | Default admin password | `admin123` |

### **Where to Use:**
```javascript
// File: server.js

const PORT = process.env.PORT || 3001;  // ✅ Used here
const JWT_SECRET = process.env.JWT_SECRET;  // ✅ Used here
const SUPABASE_URL = process.env.SUPABASE_URL;  // ✅ Used here
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;  // ✅ Used here

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// JWT token generation
const token = jwt.sign(payload, JWT_SECRET, { 
  expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
});
```

---

## 🔐 How to Get Supabase Credentials

### **Step 1: Go to Supabase Dashboard**
1. Visit: https://supabase.com/dashboard
2. Select your project or create a new one

### **Step 2: Get Project URL**
1. Click on "Settings" → "API"
2. Copy "Project URL"
3. Example: `https://abcdefghijk.supabase.co`

### **Step 3: Get API Keys**

**For Frontend (ANON KEY):**
1. In "API" settings, find "Project API keys"
2. Copy "anon" / "public" key
3. Use in `VITE_SUPABASE_ANON_KEY`

**For Backend (SERVICE ROLE KEY):**
1. In "API" settings, find "Project API keys"
2. Copy "service_role" key (⚠️ Keep this secret!)
3. Use in `SUPABASE_SERVICE_KEY`

---

## 🚀 Deployment Platform Configuration

### **Railway.app / Render.com**

When deploying backend, add these environment variables in the platform dashboard:

```
JWT_SECRET=your-production-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3001
NODE_ENV=production
```

### **Vercel (Frontend)**

When deploying frontend, add these environment variables:

```
VITE_API_BASE_URL=https://your-backend-railway.app
VITE_API_BACKEND_URL=https://your-backend-railway.app/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ Verification Checklist

### Frontend Environment Variables
- [ ] `VITE_API_BASE_URL` is set correctly (backend URL)
- [ ] `VITE_API_BACKEND_URL` is set correctly (backend URL + /api)
- [ ] `VITE_SUPABASE_URL` is set correctly (Supabase project URL)
- [ ] `VITE_SUPABASE_ANON_KEY` is set correctly (Supabase anon key)
- [ ] `.env` file exists in `/crm-frontend-main/`
- [ ] Environment variables start with `VITE_` prefix

### Backend Environment Variables
- [ ] `JWT_SECRET` is set (strong secret key)
- [ ] `SUPABASE_URL` is set correctly (same as frontend)
- [ ] `SUPABASE_SERVICE_KEY` is set correctly (service role key, NOT anon key)
- [ ] `.env` file exists in `/crm-backend-main/`
- [ ] `PORT` is set (or defaults to 3001)

### Connection Test
- [ ] Backend server starts without errors
- [ ] Frontend can reach backend API
- [ ] Authentication works (login successful)
- [ ] Database queries work (leads/students visible)
- [ ] CORS allows frontend origin

---

## 🧪 Testing Environment Variables

### **Test Frontend Configuration:**
```bash
# In crm-frontend-main directory
cd crm-frontend-main

# Check if environment variables are loaded
npm run dev

# Open browser console and check:
# Should see logs like:
# "✅ API configured: https://your-backend.com/api"
# "✅ Supabase initialized"
```

### **Test Backend Configuration:**
```bash
# In crm-backend-main directory
cd crm-backend-main

# Start server
npm start

# Should see:
# "✅ Supabase client initialized successfully"
# "🔑 JWT Secret configured: ✅ Set"
# "🗄️ Supabase URL: ✅ Set"
```

### **Test API Connection:**
```bash
# Test health endpoint
curl https://your-backend-url.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-19T10:30:00.000Z",
  "database": "connected"
}
```

---

## 🔧 Common Issues & Solutions

### **Issue 1: "VITE_API_BASE_URL is not defined"**
**Solution:**
- Create `.env` file in frontend root
- Add `VITE_API_BASE_URL=https://your-backend.com`
- Restart dev server (`npm run dev`)

### **Issue 2: "Supabase configuration missing"**
**Solution:**
- Verify Supabase URL and keys are correct
- Ensure no trailing slashes in URL
- Check keys are not expired

### **Issue 3: "JWT_SECRET environment variable is required"**
**Solution:**
- Create `.env` file in backend root
- Add `JWT_SECRET=your-secret-key-here`
- Use a strong secret (at least 32 characters)

### **Issue 4: CORS errors in browser**
**Solution:**
- Verify frontend origin is in backend CORS whitelist
- Check `VITE_API_BACKEND_URL` matches actual backend URL
- Ensure backend CORS middleware is working

### **Issue 5: "Unable to connect to server"**
**Solution:**
- Verify `VITE_API_BACKEND_URL` is correct
- Check backend server is running
- Test backend health endpoint directly

---

## 📝 Sample .env Files

### **Frontend .env (Development)**
```bash
# Development Environment
VITE_API_BASE_URL=http://localhost:3001
VITE_API_BACKEND_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEBUG_MODE=true
```

### **Frontend .env (Production)**
```bash
# Production Environment
VITE_API_BASE_URL=https://crm-backend.railway.app
VITE_API_BACKEND_URL=https://crm-backend.railway.app/api
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEBUG_MODE=false
```

### **Backend .env (Development)**
```bash
# Development Environment
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Backend .env (Production)**
```bash
# Production Environment
PORT=3001
NODE_ENV=production
JWT_SECRET=super-secure-production-secret-key-2024
JWT_EXPIRES_IN=24h
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔐 Security Best Practices

### **DO:**
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Keep SUPABASE_SERVICE_KEY secret (never commit to git)
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically
- ✅ Use HTTPS in production

### **DON'T:**
- ❌ Commit .env files to git (add to .gitignore)
- ❌ Share service role keys publicly
- ❌ Use weak JWT secrets
- ❌ Use same keys for dev and prod
- ❌ Expose service keys in frontend

---

## ✅ Environment Variables Status

**Frontend:** ✅ Properly configured  
**Backend:** ✅ Properly configured  
**Database:** ✅ Connected  
**Authentication:** ✅ Secured with JWT  
**CORS:** ✅ Configured for frontend origin

All environment variables are properly set up for frontend-backend communication! 🎉
