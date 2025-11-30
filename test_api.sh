#!/bin/bash

# API 测试脚本
# 测试注册、登录、OCR 等 API

API_URL="http://localhost:5001"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="test123456"

echo "🧪 SmartBill API 测试"
echo "===================="
echo ""

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 发送验证码
echo "1. 发送验证码..."
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/send-verification-code" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\"}")

if echo "$RESPONSE" | grep -q "message"; then
  echo -e "${GREEN}✅ 验证码已发送${NC}"
  echo "   响应: $RESPONSE"
else
  echo -e "${RED}❌ 发送验证码失败${NC}"
  echo "   响应: $RESPONSE"
  exit 1
fi

echo ""
echo "⚠️  请检查邮箱获取验证码，然后输入："
read -p "验证码: " VERIFICATION_CODE

# 2. 注册
echo ""
echo "2. 注册用户..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"verification_code\": \"$VERIFICATION_CODE\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✅ 注册成功${NC}"
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "   Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}❌ 注册失败${NC}"
  echo "   响应: $REGISTER_RESPONSE"
  exit 1
fi

# 3. 登录
echo ""
echo "3. 登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✅ 登录成功${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "   Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}❌ 登录失败${NC}"
  echo "   响应: $LOGIN_RESPONSE"
  exit 1
fi

# 4. 获取当前用户
echo ""
echo "4. 获取当前用户信息..."
USER_RESPONSE=$(curl -s -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | grep -q "email"; then
  echo -e "${GREEN}✅ 获取用户信息成功${NC}"
  echo "   响应: $USER_RESPONSE"
else
  echo -e "${RED}❌ 获取用户信息失败${NC}"
  echo "   响应: $USER_RESPONSE"
fi

# 5. 测试 OCR (需要图片文件)
echo ""
echo "5. 测试 OCR 服务..."
if [ -f "test_receipt.jpg" ]; then
  OCR_RESPONSE=$(curl -s -X POST "$API_URL/api/ocr/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "image=@test_receipt.jpg")
  
  if echo "$OCR_RESPONSE" | grep -q "items"; then
    echo -e "${GREEN}✅ OCR 测试成功${NC}"
    echo "   响应: $(echo $OCR_RESPONSE | head -c 200)..."
  else
    echo -e "${YELLOW}⚠️  OCR 测试失败或服务未运行${NC}"
    echo "   响应: $OCR_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️  跳过 OCR 测试（需要 test_receipt.jpg 文件）${NC}"
fi

echo ""
echo "===================="
echo -e "${GREEN}测试完成！${NC}"

