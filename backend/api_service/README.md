# SmartBill API Gateway Service

主 API 网关服务，统一管理前端请求并路由到各个微服务。

## 功能

- ✅ 统一 API 入口
- ✅ JWT 认证中间件
- ✅ 请求路由转发
- ✅ 服务聚合

## 技术栈

- **框架**: FastAPI
- **HTTP 客户端**: httpx
- **认证**: JWT (python-jose)

## 安装

### 1. 创建虚拟环境

```bash
cd backend/api_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
# Service URLs
AUTH_SERVICE_URL=http://localhost:6000
OCR_SERVICE_URL=http://localhost:8000
STT_SERVICE_URL=http://localhost:8001
AI_SERVICE_URL=http://localhost:8002

# JWT (must match auth_service)
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
```

### 4. 启动服务

```bash
python -m uvicorn main:app --reload --port 5001
```

服务将在 `http://localhost:5001` 运行

## API 端点

### 认证相关（转发到 auth_service）

- `POST /api/auth/send-verification-code` - 发送验证码
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/send-password-reset-code` - 发送密码重置码
- `POST /api/auth/reset-password` - 重置密码
- `GET /api/auth/me` - 获取当前用户（需要认证）

### OCR 相关（转发到 ocr_service，需要认证）

- `POST /api/ocr/upload` - 上传收据图片
- `POST /api/ocr/test` - 测试 OCR 解析器

### STT 相关（转发到 stt_service，需要认证）

- `POST /api/stt/process-voice` - 处理语音输入

### AI 相关（转发到 ai_service，需要认证）

- `POST /api/ai/analyze-expense` - AI 分析账单

## 认证

需要认证的端点需要在请求头中包含 JWT Token：

```http
Authorization: Bearer <token>
```

## 使用示例

### 前端调用

```javascript
import { authAPI, ocrAPI } from './services/api';

// 登录
const response = await authAPI.login('user@example.com', 'password');
// Token 会自动保存到 localStorage

// 上传收据（自动使用保存的 token）
const result = await ocrAPI.uploadReceipt(imageFile);
```

## 开发

### 测试

使用 Swagger UI 测试 API：
```
http://localhost:5001/docs
```

### 注意事项

1. **服务依赖**: 确保所有微服务都在运行
2. **JWT Secret**: 必须与 `auth_service` 的 `JWT_SECRET_KEY` 相同
3. **CORS**: 已配置允许 `localhost:3000`（React 前端）

