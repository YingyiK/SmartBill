import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(authService.isAuthenticated());
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    window.addEventListener('storage', checkAuth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Sidebar />}
        <Routes>
          {/* 公开路由 */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/new-expense" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/new-expense" replace /> : <Register onRegister={() => setIsAuthenticated(true)} />}
          />

          {/* 受保护路由 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/new-expense" replace />
              </ProtectedRoute>
            }
          />
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
    </Router>
  );
}

export default App;