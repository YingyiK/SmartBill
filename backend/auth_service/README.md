# SmartBill Authentication Service

邮箱注册登录服务，支持邮箱验证码验证。

## 功能

- ✅ 邮箱注册（验证码验证）
- ✅ 邮箱登录
- ✅ JWT Token 认证
- ✅ 密码重置（邮箱验证码）
- ✅ 邮箱发送账单（预留功能）

## 技术栈

- **框架**: FastAPI
- **数据库**: PostgreSQL + SQLAlchemy
- **认证**: JWT (python-jose)
- **密码加密**: bcrypt (passlib)
- **邮件服务**: aiosmtplib

## 安装

### 1. 创建虚拟环境

```bash
cd backend/auth_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置数据库

确保 PostgreSQL 已安装并运行，然后创建数据库：

```sql
CREATE DATABASE smartbill;
```

### 4. 配置环境变量

创建 `.env` 文件：

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartbill

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Gmail 设置**：
1. 启用两步验证
2. 生成应用专用密码：https://myaccount.google.com/apppasswords
3. 使用应用专用密码作为 `SMTP_PASSWORD`

### 5. 初始化数据库

```bash
python init_db.py
```

### 6. 启动服务

```bash
python -m uvicorn main:app --reload --port 6000
```

服务将在 `http://localhost:6000` 运行

## API 端点

### 1. 发送验证码

```http
POST /send-verification-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. 注册

```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "verification_code": "123456"
}
```

**响应**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

### 3. 登录

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 4. 发送密码重置码

```http
POST /send-password-reset-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 5. 重置密码

```http
POST /reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "verification_code": "123456",
  "new_password": "newpassword123"
}
```

### 6. 验证 Token

```http
GET /verify-token?token=eyJ...
```

### 7. 获取当前用户

```http
GET /me?token=eyJ...
```

## 数据库模型

### users 表
- `id` (UUID): 主键
- `email` (String): 邮箱（唯一）
- `password_hash` (String): 密码哈希
- `email_verified` (Boolean): 邮箱是否已验证
- `created_at` (Timestamp): 创建时间
- `updated_at` (Timestamp): 更新时间

### email_verification_codes 表
- `id` (UUID): 主键
- `email` (String): 邮箱
- `code` (String): 6位验证码
- `expires_at` (Timestamp): 过期时间
- `used` (Boolean): 是否已使用
- `created_at` (Timestamp): 创建时间

### password_reset_codes 表
- `id` (UUID): 主键
- `email` (String): 邮箱
- `code` (String): 6位验证码
- `expires_at` (Timestamp): 过期时间
- `used` (Boolean): 是否已使用
- `created_at` (Timestamp): 创建时间

## 开发

### 测试

使用 Swagger UI 测试 API：
```
http://localhost:6000/docs
```

### 注意事项

1. **JWT Secret Key**: 生产环境必须使用强随机密钥
2. **SMTP 配置**: 如果未配置 SMTP，验证码会在控制台打印（开发模式）
3. **数据库连接**: 确保 PostgreSQL 服务运行中
4. **CORS**: 已配置允许 `localhost:3000` 和 `localhost:5000`

