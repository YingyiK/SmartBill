#!/bin/bash
echo "🚀 Starting SmartBill Services..."
echo "=================================="

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 Detected macOS - Using Terminal.app"
    
    # Auth Service (Port 6000)
    osascript -e 'tell application "Terminal"
        do script "cd '"$PWD"'/backend/auth_service && source venv/bin/activate && echo \"🔐 Auth Service (Port 6000)\" && python -m uvicorn main:app --reload --port 6000"
    end tell'
    
    sleep 2
    
    # OCR Service (Port 8000)
    osascript -e 'tell application "Terminal"
        do script "cd '"$PWD"'/backend/ocr_service && source venv/bin/activate && echo \"📸 OCR Service (Port 8000)\" && python -m uvicorn main:app --reload --port 8000"
    end tell'
    
    sleep 2
    
    # STT Service (Port 8001)
    osascript -e 'tell application "Terminal"
        do script "cd '"$PWD"'/backend/stt_service && source venv/bin/activate && echo \"🎤 STT Service (Port 8001)\" && python -m uvicorn main:app --reload --port 8001"
    end tell'
    
    sleep 2
    
    # API Gateway (Port 5001)
    osascript -e 'tell application "Terminal"
        do script "cd '"$PWD"'/backend/api_service && source venv/bin/activate && echo \"🌐 API Gateway (Port 5001)\" && python -m uvicorn main:app --reload --port 5001"
    end tell'
    
    sleep 2
    
    # Frontend (Port 3000)
    osascript -e 'tell application "Terminal"
        do script "cd '"$PWD"'/frontend && echo \"⚛️  Frontend (Port 3000)\" && npm start"
    end tell'
    
    echo "✅ All services started in separate terminal windows!"
    echo ""
    echo "Service Ports:"
    echo "  🔐 Auth Service:  http://localhost:6000"
    echo "  📸 OCR Service:   http://localhost:8000"
    echo "  🎤 STT Service:   http://localhost:8001"
    echo "  🌐 API Gateway:   http://localhost:5001"
    echo "  ⚛️  Frontend:      http://localhost:3000"
else
    echo "⚠️  Non-macOS detected. Please start services manually"
fi
