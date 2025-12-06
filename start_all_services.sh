#!/bin/bash

# SmartBill - Start All Services
# This script starts all backend services and frontend in separate terminal tabs/windows

echo "🚀 Starting SmartBill Services..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}📱 Detected macOS - Using Terminal.app${NC}"
    
    # Auth Service (Port 6000)
    osascript -e 'tell application "Terminal"
        do script "cd '$PWD'/backend/auth_service && source venv/bin/activate && echo \"🔐 Auth Service (Port 6000)\" && python -m uvicorn main:app --reload --port 6000"
    end tell'
    
    sleep 2
    
    # OCR Service (Port 8000)
    osascript -e 'tell application "Terminal"
        do script "cd '$PWD'/backend/ocr_service && source venv/bin/activate && echo \"📸 OCR Service (Port 8000)\" && python -m uvicorn main:app --reload --port 8000"
    end tell'
    
    sleep 2
    
    # STT Service (Port 8001)
    osascript -e 'tell application "Terminal"
        do script "cd '$PWD'/backend/stt_service && source venv/bin/activate && echo \"🎤 STT Service (Port 8001)\" && python -m uvicorn main:app --reload --port 8001"
    end tell'
    
    sleep 2
    
    # API Gateway (Port 5001)
    osascript -e 'tell application "Terminal"
        do script "cd '$PWD'/backend/api_service && source venv/bin/activate && echo \"🌐 API Gateway (Port 5001)\" && python -m uvicorn main:app --reload --port 5001"
    end tell'
    
    sleep 2
    
    # Frontend (Port 3000)
    osascript -e 'tell application "Terminal"
        do script "cd '$PWD'/smartbill-app && echo \"⚛️  Frontend (Port 3000)\" && npm start"
    end tell'
    
    echo -e "${GREEN}✅ All services started in separate terminal windows!${NC}"
    echo ""
    echo "Service Ports:"
    echo "  🔐 Auth Service:  http://localhost:6000"
    echo "  📸 OCR Service:   http://localhost:8000"
    echo "  🎤 STT Service:   http://localhost:8001"
    echo "  🌐 API Gateway:   http://localhost:5001"
    echo "  ⚛️  Frontend:      http://localhost:3000"
    echo ""
    echo "To stop all services: Close the terminal windows or press Ctrl+C in each"

else
    # Linux or other OS - use gnome-terminal or similar
    echo -e "${YELLOW}⚠️  Non-macOS detected. Please start services manually:${NC}"
    echo ""
    echo "Terminal 1: cd backend/auth_service && source venv/bin/activate && python -m uvicorn main:app --reload --port 6000"
    echo "Terminal 2: cd backend/ocr_service && source venv/bin/activate && python -m uvicorn main:app --reload --port 8000"
    echo "Terminal 3: cd backend/stt_service && source venv/bin/activate && python -m uvicorn main:app --reload --port 8001"
    echo "Terminal 4: cd backend/api_service && source venv/bin/activate && python -m uvicorn main:app --reload --port 5001"
    echo "Terminal 5: cd smartbill-app && npm start"
fi


