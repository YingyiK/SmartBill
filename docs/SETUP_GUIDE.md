# SmartBill 完整设置指南

## 架构概览

```
前端 (React) :3000
    ↓
API Gateway :5001
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│ Auth      │ OCR       │ STT       │ AI        │
│ :6000     │ :8000     │ :8001     │ :8002     │
└───────────┴───────────┴───────────┴───────────┘
    ↓
PostgreSQL 数据库
```

## 完整设置步骤

### 1. 数据库设置

```bash
# 安装 PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# 创建数据库
createdb smartbill

# 或者使用 psql
psql -U postgres
CREATE DATABASE smartbill;
\q
```

### 2. 认证服务设置

```bash
cd backend/auth_service

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartbill
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
EOF

# 初始化数据库
python init_db.py

# 启动服务（新终端窗口）
python -m uvicorn main:app --reload --port 6000
```

### 3. OCR 服务设置

```bash
cd backend/ocr_service

# 使用现有虚拟环境或创建新的
source venv/bin/activate  # 如果已有
# 或: python -m venv venv && source venv/bin/activate

# 安装依赖（如果还没安装）
pip install -r requirements.txt

# 创建 .env 文件（如果还没有）
echo "GEMINI_API_KEY=your-gemini-api-key" > .env

# 启动服务（新终端窗口）
python -m uvicorn main:app --reload --port 8000
```

### 4. STT 服务设置

```bash
cd backend/stt_service

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件
echo "OPENAI_API_KEY=your-openai-api-key" > .env

# 启动服务（新终端窗口）
python -m uvicorn main:app --reload --port 8001
```

### 5. API Gateway 设置

```bash
cd backend/api_service

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件
cat > .env << EOF
AUTH_SERVICE_URL=http://localhost:6000
OCR_SERVICE_URL=http://localhost:8000
STT_SERVICE_URL=http://localhost:8001
AI_SERVICE_URL=http://localhost:8002
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
EOF

# 启动服务（新终端窗口）
python -m uvicorn main:app --reload --port 5001
```

### 6. 前端设置

```bash
cd smartbill-app

# 安装依赖
npm install

# 创建 .env 文件（可选）
echo "REACT_APP_API_URL=http://localhost:5001" > .env

# 启动开发服务器（新终端窗口）
npm start
```

## 验证服务运行

### 检查所有服务

```bash
# 检查端口是否被占用
lsof -i :5001  # API Gateway
lsof -i :6000  # Auth Service
lsof -i :8000  # OCR Service
lsof -i :8001  # STT Service
lsof -i :3000  # Frontend
```

### 测试 API

```bash
# 测试 API Gateway
curl http://localhost:5001/health

# 测试 Auth Service
curl http://localhost:6000/health

# 测试 OCR Service
curl http://localhost:8000/health
```

## 使用流程

### 1. 用户注册

```javascript
// 前端调用
import { authAPI } from './services/api';

// 1. 发送验证码
await authAPI.sendVerificationCode('user@example.com');

// 2. 注册（输入验证码）
const response = await authAPI.register(
  'user@example.com',
  'password123',
  '123456'  // 验证码
);
// Token 会自动保存
```

### 2. 上传收据

```javascript
import { ocrAPI } from './services/api';

// 上传收据图片
const result = await ocrAPI.uploadReceipt(imageFile);
console.log(result.items);  // 解析出的商品列表
```

### 3. 语音输入

```javascript
import { sttAPI } from './services/api';

// 处理语音
const result = await sttAPI.processVoice(audioFile);
console.log(result.transcript);  // 转录文本
```

## 常见问题

### 1. 数据库连接失败

- 检查 PostgreSQL 是否运行：`brew services list` (macOS)
- 检查数据库名称和用户是否正确
- 检查 `DATABASE_URL` 环境变量

### 2. 邮件发送失败

- Gmail 需要启用"应用专用密码"
- 检查 SMTP 配置是否正确
- 开发环境可以暂时不配置，验证码会在控制台打印

### 3. 服务无法连接

- 确保所有服务都在运行
- 检查端口是否被占用
- 检查 `.env` 文件中的服务 URL 是否正确

### 4. JWT Token 验证失败

- 确保 `auth_service` 和 `api_service` 使用相同的 `JWT_SECRET_KEY`

## 开发建议

1. **使用多个终端窗口**：每个服务一个窗口，方便查看日志
2. **使用 `.env` 文件**：不要提交敏感信息到 Git
3. **查看 Swagger UI**：每个服务都有 `/docs` 端点，方便测试 API
4. **数据库迁移**：使用 SQLAlchemy 的迁移工具管理数据库变更

## 下一步

- [ ] 实现账单数据库存储
- [ ] 实现账单邮件发送功能
- [ ] 添加用户设置页面
- [ ] 实现账单历史记录
- [ ] 添加账单分享功能

