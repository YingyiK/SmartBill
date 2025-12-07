import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewExpense from './pages/NewExpense';
import Participants from './pages/Participants';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ExpenseDetail from './pages/ExpenseDetail';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';
import './style.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(authService.isAuthenticated());
    checkAuth(); // 首次检查

    // 多窗口同步：监听 storage 事件 + 定时器兜底
    window.addEventListener('storage', checkAuth);
    const interval = setInterval(checkAuth, 5000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      {isAuthenticated ? (
        /* 已登录：左侧固定 Sidebar + 右侧内容区 */
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
            <Sidebar />
          </div>

          <div className="flex-1 overflow-y-auto">
            <Routes>
              {/* 登录/注册页重定向到默认页 */}
              <Route path="/login" element={<Navigate to="/new-expense" replace />} />
              <Route path="/register" element={<Navigate to="/new-expense" replace />} />
              <Route path="/" element={<Navigate to="/new-expense" replace />} />

              {/* 受保护页面 */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-expense"
                element={
                  <ProtectedRoute>
                    <NewExpense />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participants"
                element={
                  <ProtectedRoute>
                    <Participants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expense/:id"
                element={
                  <ProtectedRoute>
                    <ExpenseDetail />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      ) : (
        /* 未登录：仅展示登录/注册页，其余路径全部跳 /login */
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/register" element={<Register onRegister={() => setIsAuthenticated(true)} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;