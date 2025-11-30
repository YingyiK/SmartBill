#!/bin/bash

# SmartBill 服务测试脚本
# 测试所有服务是否正常运行

echo "🚀 SmartBill 服务测试"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_service() {
    local name=$1
    local url=$2
    
    echo -n "测试 $name ($url)... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 运行中${NC}"
        return 0
    else
        echo -e "${RED}❌ 未运行${NC}"
        return 1
    fi
}

# 测试各个服务
echo "1. 测试 API Gateway (端口 5001)..."
test_service "API Gateway" "http://localhost:5001/health"

echo "2. 测试 Auth Service (端口 6000)..."
test_service "Auth Service" "http://localhost:6000/health"

echo "3. 测试 OCR Service (端口 8000)..."
test_service "OCR Service" "http://localhost:8000/health"

echo "4. 测试 STT Service (端口 8001)..."
test_service "STT Service" "http://localhost:8001/health"

echo ""
echo "===================="
echo "测试完成！"
echo ""
echo "如果所有服务都显示 ✅，说明环境配置正确！"
echo "如果显示 ❌，请检查对应服务是否已启动"

