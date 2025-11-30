# SmartBill 架构实现总结

## 已完成的工作

### 1. 认证服务 (auth_service) ✅

**位置**: `backend/auth_service/`

**功能**:
- ✅ 邮箱注册（验证码验证）
- ✅ 邮箱登录
- ✅ JWT Token 生成和验证
- ✅ 密码重置（邮箱验证码）
- ✅ 邮件发送服务（支持发送账单）

**技术实现**:
- FastAPI + SQLAlchemy + PostgreSQL
- JWT 认证 (python-jose)
- 密码加密 (bcrypt)
- SMTP 邮件服务 (aiosmtplib)

**数据库表**:
- `users` - 用户信息
- `email_verification_codes` - 邮箱验证码
- `password_reset_codes` - 密码重置码

### 2. API 网关服务 (api_service) ✅

**位置**: `backend/api_service/`

**功能**:
- ✅ 统一 API 入口（端口 5001）
- ✅ JWT 认证中间件
- ✅ 请求路由转发到各个微服务
- ✅ 服务聚合

**路由**:
- `/api/auth/*` → auth_service (端口 6000)
- `/api/ocr/*` → ocr_service (端口 8000)
- `/api/stt/*` → stt_service (端口 8001)
- `/api/ai/*` → ai_service (端口 8002)

### 3. 前端 API 客户端 ✅

**位置**: `smartbill-app/src/services/`

**文件**:
- `api.js` - API 客户端（所有 API 调用）
- `authService.js` - 认证服务封装

**功能**:
- ✅ 自动 Token 管理（localStorage）
- ✅ 自动添加认证头
- ✅ 统一错误处理
- ✅ 401 自动跳转登录

**使用示例**:
```javascript
import { authAPI, ocrAPI } from './services/api';

// 登录
await authAPI.login('user@example.com', 'password');

// 上传收据（自动使用保存的 token）
await ocrAPI.uploadReceipt(imageFile);
```

### 4. 文档 ✅

**已创建文档**:
- `docs/ARCHITECTURE.md` - 系统架构设计
- `docs/SETUP_GUIDE.md` - 完整设置指南
- `backend/auth_service/README.md` - 认证服务文档
- `backend/api_service/README.md` - API 网关文档
- 更新了根目录 `README.md`

## 架构设计

### 微服务架构

```
前端 (React :3000)
    ↓ HTTP
API Gateway (:5001)
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│ Auth      │ OCR       │ STT       │ AI        │
│ :6000     │ :8000     │ :8001     │ :8002     │
└───────────┴───────────┴───────────┴───────────┘
    ↓
PostgreSQL
```

### 数据流

1. **用户注册流程**:
   ```
   前端 → API Gateway → Auth Service → 数据库
                        ↓
                   发送验证码邮件
   ```

2. **上传收据流程**:
   ```
   前端 → API Gateway (验证 JWT) → OCR Service → 返回结果
   ```

3. **语音输入流程**:
   ```
   前端 → API Gateway (验证 JWT) → STT Service → 返回结果
   ```

## 技术选型理由

### 为什么用 Python 写认证服务？

1. **一致性**: 其他服务（OCR、STT）都是 Python，保持技术栈统一
2. **FastAPI**: 高性能、自动生成 API 文档、类型提示支持
3. **生态**: Python 的数据库 ORM、JWT、邮件库都很成熟
4. **开发效率**: 快速开发和迭代

### 为什么用 API Gateway？

1. **统一入口**: 前端只需要连接一个服务
2. **认证集中**: 所有认证逻辑在一个地方
3. **服务解耦**: 前端不需要知道各个微服务的地址
4. **易于扩展**: 可以添加限流、日志、监控等

### 为什么用 PostgreSQL？

1. **关系型数据**: 用户、账单、商品等有明确关系
2. **ACID 保证**: 财务数据需要事务保证
3. **成熟稳定**: 生产环境广泛使用
4. **SQLAlchemy**: Python 最好的 ORM

## 下一步工作

### 需要实现的功能

1. **前端登录/注册页面**
   - 创建 `Login.js` 和 `Register.js` 页面
   - 集成 `authService`
   - 添加路由保护

2. **账单数据库存储**
   - 创建 `expenses` 表
   - 创建 `expense_items` 表
   - 创建 `participants` 表
   - 实现保存账单 API

3. **账单邮件发送**
   - 在 `email_service.py` 中实现 `send_bill_email`
   - 创建邮件模板
   - 添加发送账单 API

4. **前端集成**
   - 在 `NewExpense.js` 中调用 OCR API
   - 在 `NewExpense.js` 中调用 STT API
   - 显示解析结果
   - 保存账单到数据库

## 环境变量配置清单

### auth_service/.env
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartbill
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### api_service/.env
```env
AUTH_SERVICE_URL=http://localhost:6000
OCR_SERVICE_URL=http://localhost:8000
STT_SERVICE_URL=http://localhost:8001
AI_SERVICE_URL=http://localhost:8002
JWT_SECRET_KEY=your-secret-key  # 必须与 auth_service 相同
```

### ocr_service/.env
```env
GEMINI_API_KEY=your-gemini-api-key
```

### stt_service/.env
```env
OPENAI_API_KEY=your-openai-api-key
```

## 启动顺序

1. PostgreSQL 数据库
2. Auth Service (端口 6000)
3. OCR Service (端口 8000)
4. STT Service (端口 8001)
5. API Gateway (端口 5001)
6. Frontend (端口 3000)

## 测试建议

1. **使用 Swagger UI**: 每个服务都有 `/docs` 端点
2. **Postman**: 测试 API 调用
3. **前端集成测试**: 测试完整流程
4. **单元测试**: 为关键功能添加测试

## 注意事项

1. **JWT Secret Key**: 生产环境必须使用强随机密钥
2. **SMTP 配置**: Gmail 需要应用专用密码
3. **CORS 配置**: 确保前端 URL 在允许列表中
4. **数据库迁移**: 使用 Alembic 管理数据库变更
5. **环境变量**: 不要提交 `.env` 文件到 Git

