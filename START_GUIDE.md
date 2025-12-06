# 🚀 SmartBill - One-Click Startup Guide

## 📋 Quick Start (Recommended)

### Option 1: Auto Start All Services (macOS)

Run the startup script:

```bash
cd /Users/kongyingyi/Documents/SmartBill
./start_all_services.sh
```

**What it does:**
- Opens 5 new Terminal windows
- Starts all services automatically
- Each service in its own window

**Services started:**
1. 🔐 Auth Service (Port 6000)
2. 📸 OCR Service (Port 8000)
3. 🎤 STT Service (Port 8001)
4. 🌐 API Gateway (Port 5001)
5. ⚛️  Frontend (Port 3000)

**Wait 30 seconds** for all services to initialize, then visit: `http://localhost:3000`

---

### Option 2: Manual Start (If script doesn't work)

Open 5 terminal windows and run:

**Terminal 1 - Auth Service:**
```bash
cd /Users/kongyingyi/Documents/SmartBill/backend/auth_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 6000
```

**Terminal 2 - OCR Service:**
```bash
cd /Users/kongyingyi/Documents/SmartBill/backend/ocr_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

**Terminal 3 - STT Service:**
```bash
cd /Users/kongyingyi/Documents/SmartBill/backend/stt_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 8001
```

**Terminal 4 - API Gateway:**
```bash
cd /Users/kongyingyi/Documents/SmartBill/backend/api_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 5001
```

**Terminal 5 - Frontend:**
```bash
cd /Users/kongyingyi/Documents/SmartBill/smartbill-app
npm start
```

---

## 🛑 How to Stop All Services

### Option 1: Individual Stop
- Go to each terminal window
- Press `Ctrl+C`

### Option 2: Kill by Port
```bash
# Kill a specific service
lsof -ti:6000 | xargs kill  # Auth Service
lsof -ti:8000 | xargs kill  # OCR Service
lsof -ti:8001 | xargs kill  # STT Service
lsof -ti:5001 | xargs kill  # API Gateway
lsof -ti:3000 | xargs kill  # Frontend
```

### Option 3: Kill All
```bash
# Kill all at once
lsof -ti:6000,8000,8001,5001,3000 | xargs kill
```

---

## ✅ Health Check

After starting, verify all services are running:

```bash
curl http://localhost:6000/health  # Auth
curl http://localhost:8000/health  # OCR
curl http://localhost:8001/health  # STT
curl http://localhost:5001/health  # API Gateway
curl http://localhost:3000         # Frontend
```

Or use the test script:
```bash
./test_all_services.sh
```

---

## 🔧 Troubleshooting

### "Address already in use"
One or more services are already running.

**Solution:**
```bash
# Check what's running
lsof -i:6000  # Check specific port
lsof -i:5001
lsof -i:8000

# Kill if needed
lsof -ti:6000 | xargs kill
```

### "Module not found"
Virtual environment not activated or dependencies not installed.

**Solution:**
```bash
cd backend/auth_service
source venv/bin/activate
pip install -r requirements.txt
```

### Script doesn't open new windows
Make sure Terminal.app is installed and has permissions.

**Alternative:** Use manual start (Option 2 above)

---

## 💡 Pro Tips

### Daily Development Workflow:

**Morning (Start):**
```bash
cd /Users/kongyingyi/Documents/SmartBill
./start_all_services.sh
# Wait 30 seconds
# Visit http://localhost:3000
```

**Evening (Stop):**
```bash
# Press Ctrl+C in each terminal
# Or run:
lsof -ti:6000,8000,8001,5001,3000 | xargs kill
```

### Keep Services Running
Services will auto-reload when you edit code (thanks to `--reload` flag).

Only restart if:
- Installing new packages
- Changing .env files
- Weird errors occur

---

## 📊 Service Dependencies

```
Frontend (3000)
    ↓
API Gateway (5001)
    ↓ ↓ ↓
Auth (6000)  OCR (8000)  STT (8001)
```

**Minimum Required:**
- Auth Service (6000) ✅ Must have
- API Gateway (5001) ✅ Must have
- Frontend (3000) ✅ Must have

**Optional (for full features):**
- OCR Service (8000) - Only needed for receipt upload
- STT Service (8001) - Only needed for voice input

---

## 🎯 Quick Commands Reference

```bash
# Start all (auto)
./start_all_services.sh

# Check all services
./test_all_services.sh

# Check database
cd backend/auth_service
python check_db.py

# Clean test data
python cleanup_test_data.py

# Stop all services
lsof -ti:6000,8000,8001,5001,3000 | xargs kill
```

---

## 🚨 Common Issues

### 1. "Failed to fetch" in frontend
**Cause:** API Gateway (5001) not running

**Fix:**
```bash
cd backend/api_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 5001
```

### 2. "OCR service unavailable"
**Cause:** OCR Service (8000) not running

**Fix:**
```bash
cd backend/ocr_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

### 3. "Cannot connect to auth service"
**Cause:** Auth Service (6000) not running

**Fix:**
```bash
cd backend/auth_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 6000
```

---

## ✨ Recommended Setup

**First Time Setup:**
1. Run `./start_all_services.sh`
2. Wait for all services to start
3. Check Terminal windows for "Application startup complete"
4. Visit `http://localhost:3000`

**Daily Use:**
- Keep terminal windows open
- Services auto-reload on code changes
- Just focus on development!

---

**Happy coding! 🎉**


