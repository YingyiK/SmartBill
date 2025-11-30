# SmartBill 快速测试指南

## 一次性测试所有服务

### 1. 启动所有服务

打开 5 个终端窗口，分别运行：

**终端 1 - 数据库（如果还没运行）**
```bash
# macOS
brew services start postgresql
```

**终端 2 - Auth Service**
```bash
cd backend/auth_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 6000
```

**终端 3 - OCR Service**
```bash
cd backend/ocr_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

**终端 4 - STT Service**
```bash
cd backend/stt_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 8001
```

**终端 5 - API Gateway**
```bash
cd backend/api_service
source venv/bin/activate
python -m uvicorn main:app --reload --port 5001
```

**终端 6 - Frontend**
```bash
cd smartbill-app
npm start
```

### 2. 测试服务健康状态

```bash
# 运行测试脚本
./test_all_services.sh
```

或者手动测试：

```bash
curl http://localhost:5001/health  # API Gateway
curl http://localhost:6000/health  # Auth Service
curl http://localhost:8000/health  # OCR Service
curl http://localhost:8001/health   # STT Service
```

### 3. 测试 API（需要手动输入验证码）

```bash
./test_api.sh
```

### 4. 测试前端

1. 打开浏览器访问：http://localhost:3000
2. 会自动跳转到登录页面
3. 点击"立即注册"
4. 输入邮箱，点击"发送验证码"
5. 检查邮箱（或控制台）获取验证码
6. 输入验证码和密码完成注册
7. 自动跳转到 Dashboard

## 前端登录/注册页面

已创建以下页面：

- ✅ `src/pages/Login.js` - 登录页面
- ✅ `src/pages/Register.js` - 注册页面（两步：发送验证码 → 注册）
- ✅ `src/components/ProtectedRoute.js` - 路由保护组件
- ✅ 更新了 `App.js` 添加登录/注册路由

### 功能特点

1. **自动路由保护**：未登录用户自动跳转到登录页
2. **Token 管理**：登录后自动保存 Token 到 localStorage
3. **两步注册**：
   - 第一步：输入邮箱，发送验证码
   - 第二步：输入验证码和密码，完成注册
4. **错误处理**：显示友好的错误信息

## 测试流程

### 完整测试流程

1. **启动所有服务**（见上方）
2. **测试服务健康**：`./test_all_services.sh`
3. **测试 API**：`./test_api.sh`（需要输入验证码）
4. **测试前端**：
   - 访问 http://localhost:3000
   - 注册新账户
   - 登录
   - 测试上传收据（需要先实现前端上传功能）

## 常见问题

### 1. 服务启动失败

- 检查端口是否被占用：`lsof -i :5001`
- 检查虚拟环境是否激活：`which python`
- 检查依赖是否安装：`pip list`

### 2. 数据库连接失败

- 检查 PostgreSQL 是否运行：`brew services list`
- 检查数据库是否存在：`psql -l | grep smartbill`
- 检查 `.env` 文件中的 `DATABASE_URL`

### 3. 验证码收不到

- 检查 SMTP 配置（如果未配置，验证码会在服务端控制台打印）
- 检查邮箱是否正确
- 查看 auth_service 的终端输出

### 4. 前端无法连接后端

- 检查 API Gateway 是否运行（端口 5001）
- 检查浏览器控制台的错误信息
- 检查 CORS 配置

## 下一步

- [ ] 实现前端上传收据功能
- [ ] 实现前端语音输入功能
- [ ] 实现账单保存到数据库
- [ ] 实现账单历史记录
- [ ] 实现账单邮件发送

