# CORS and Port Configuration Fix

## Summary
Fixed CORS (Cross-Origin Resource Sharing) errors and port conflicts that were preventing the frontend from communicating with the backend.

## Issues Fixed

### 1. **Port Conflict (Port 5000)**
- **Problem**: macOS AirPlay Receiver (ControlCenter) was using port 5000
- **Solution**: Changed backend to port 5001
- **Files Updated**:
  - `apps/backend/.env` - Changed `PORT=5000` to `PORT=5001`
  - `apps/frontend/.env` - Changed `VITE_API_URL=http://localhost:5001`

### 2. **CORS Configuration**
- **Problem**: 403 Forbidden errors due to improper CORS configuration
- **Solution**: Enhanced CORS middleware with proper preflight handling
- **Changes in `apps/backend/server.js`**:
  ```javascript
  // Added comprehensive CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
  }));

  // Handle preflight requests
  app.options('*', cors());
  ```

### 3. **Frontend Port References**
Updated all hardcoded port references from 5000 to 5001:
- `apps/frontend/src/services/api.ts`
- `apps/frontend/src/services/profileService.ts`
- `apps/frontend/src/utils/imageUtils.ts`
- `apps/frontend/src/components/AIAgentSidebar.tsx`
- `apps/frontend/src/pages/PropertyDetail.tsx`
- `apps/frontend/src/pages/EditProfile.tsx`
- `apps/frontend/src/App.tsx`

### 4. **Environment Variables**
Created proper environment variable configuration:

**Backend (`.env`)**:
```env
PORT=5001
MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
```

**Frontend (`.env`)**:
```env
VITE_API_URL=http://localhost:5001
```

## Current Server Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5001 | http://localhost:5001 |
| Frontend | 5173 | http://localhost:5173 |
| Agent Service | 8000 | http://localhost:8000 |

## How to Start Servers

### Start All Servers:
```bash
# Terminal 1 - Backend
cd apps/backend
node server.js

# Terminal 2 - Agent Service
cd apps/agent-service
bash start.sh

# Terminal 3 - Frontend
cd apps/frontend
npm run dev
```

### Stop All Servers:
```bash
# Kill backend
lsof -ti:5001 | xargs kill -9

# Kill agent service
lsof -ti:8000 | xargs kill -9

# Kill frontend
lsof -ti:5173 | xargs kill -9
```

## Testing

### Verify Backend Health:
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-15T..."
}
```

### Test Login:
1. Open browser to http://localhost:5173
2. Try logging in with existing credentials
3. Check browser console - should see no CORS errors
4. Network tab should show successful requests to http://localhost:5001

## Key Changes Summary

✅ **Fixed CORS errors** - Proper preflight handling and headers
✅ **Resolved port conflicts** - Moved backend from 5000 to 5001
✅ **Environment variables** - No more hardcoded credentials
✅ **MongoDB Atlas** - Connected and working
✅ **Session management** - Cookies working across origins
✅ **All servers running** - Backend, Frontend, and Agent Service

## Troubleshooting

### If CORS errors persist:
1. Clear browser cache and cookies
2. Restart all servers
3. Check that CORS_ORIGIN in backend .env matches frontend URL

### If port conflicts occur:
```bash
# Check what's using a port
lsof -i:5001

# Kill process on specific port
lsof -ti:5001 | xargs kill -9
```

### If MongoDB connection fails:
1. Check MONGODB_URI in backend .env
2. Verify IP whitelist in MongoDB Atlas
3. Check database user permissions

## Date
November 15, 2025

