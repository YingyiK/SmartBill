# SmartBill 架构设计

## 系统架构

```
┌─────────────────┐
│   React 前端    │  (端口 3000)
│  (smartbill-app)│
└────────┬────────┘
         │ HTTP/HTTPS
         │
┌────────▼─────────────────────────────────────┐
│        主 API 服务 (api_service)              │  (端口 5001)
│  - 路由转发                                    │
│  - 认证中间件                                  │
│  - 请求聚合                                    │
└────────┬──────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
┌───▼───┐ ┌───▼───┐    ┌─────▼─────┐  ┌─────▼─────┐
│认证服务│ │OCR服务│    │ STT服务   │  │ AI服务    │
│:6000  │ │:8000  │    │ :8001     │  │ :8002     │
└───────┘ └───────┘    └───────────┘  └───────────┘
    │
┌───▼──────────────┐
│   PostgreSQL     │
│   数据库          │
└──────────────────┘
```

## 服务说明

### 1. 认证服务 (auth_service) - 端口 6000
- **功能**：
  - 邮箱注册（验证码）
  - 邮箱登录
  - JWT Token 生成和验证
  - 密码重置（邮箱验证码）
- **技术栈**：Python FastAPI + SQLAlchemy + PostgreSQL

### 2. 主 API 服务 (api_service) - 端口 5001
- **功能**：
  - 统一 API 网关
  - 认证中间件（验证 JWT）
  - 路由转发到各个微服务
  - 请求聚合和响应处理
- **技术栈**：Python FastAPI + httpx

### 3. OCR 服务 (ocr_service) - 端口 8000
- **已存在**：处理收据图片 OCR

### 4. STT 服务 (stt_service) - 端口 8001
- **已存在**：处理语音转文字

### 5. AI 服务 (ai_service) - 端口 8002
- **功能**：LLM 处理（账单分析、智能分账等）

## 数据流

### 用户注册流程
```
前端 → api_service → auth_service → 数据库
                ↓
           发送验证码邮件
                ↓
前端 → api_service → auth_service (验证码验证) → 数据库
```

### 上传收据流程
```
前端 → api_service (验证 JWT) → ocr_service → 返回结果
```

### 语音输入流程
```
前端 → api_service (验证 JWT) → stt_service → 返回结果
```

## 数据库设计

### users 表
- id (UUID, Primary Key)
- email (String, Unique)
- password_hash (String)
- email_verified (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)

### email_verification_codes 表
- id (UUID, Primary Key)
- email (String)
- code (String, 6位数字)
- expires_at (Timestamp)
- used (Boolean)

### expenses 表
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- store_name (String)
- total_amount (Decimal)
- subtotal (Decimal)
- tax_amount (Decimal)
- receipt_image_url (String, Optional)
- created_at (Timestamp)

### expense_items 表
- id (UUID, Primary Key)
- expense_id (UUID, Foreign Key)
- name (String)
- price (Decimal)
- quantity (Integer)

### participants 表
- id (UUID, Primary Key)
- expense_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- amount_owed (Decimal)

## 环境变量配置

### auth_service/.env
```
DATABASE_URL=postgresql://user:password@localhost:5432/smartbill
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### api_service/.env
```
AUTH_SERVICE_URL=http://localhost:6000
OCR_SERVICE_URL=http://localhost:8000
STT_SERVICE_URL=http://localhost:8001
AI_SERVICE_URL=http://localhost:8002
JWT_SECRET_KEY=your-secret-key (与 auth_service 相同)
```

