#!/bin/bash

# Check which services are running

echo "🔍 Checking SmartBill Services..."
echo "=================================="
echo ""

check_port() {
    local port=$1
    local name=$2
    local url=$3
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "✅ $name (Port $port) - RUNNING"
        if [ ! -z "$url" ]; then
            response=$(curl -s $url 2>/dev/null)
            if [ ! -z "$response" ]; then
                echo "   Response: $response"
            fi
        fi
    else
        echo "❌ $name (Port $port) - NOT RUNNING"
        echo "   Start: See START_GUIDE.md"
    fi
    echo ""
}

check_port 6000 "Auth Service" "http://localhost:6000/health"
check_port 8000 "OCR Service" "http://localhost:8000/health"
check_port 8001 "STT Service" "http://localhost:8001/health"
check_port 5001 "API Gateway" "http://localhost:5001/health"
check_port 3000 "Frontend" ""

echo "=================================="
echo ""
echo "💡 To start missing services:"
echo "   1. Check new Terminal windows opened by start_all_services.sh"
echo "   2. Or manually start from START_GUIDE.md"
echo "   3. Or run ./start_all_services.sh again"
echo ""



