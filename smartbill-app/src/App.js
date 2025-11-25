import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NewExpense from './pages/NewExpense';
import Participants from './pages/Participants';
import History from './pages/History';  // ← 添加这行
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/new-expense" replace />} />
            <Route path="/dashboard" element={<div className="content-wrapper"><h1>Dashboard - Coming Soon</h1></div>} />
            <Route path="/new-expense" element={<NewExpense />} />
            <Route path="/participants" element={<Participants />} />
            <Route path="/history" element={<History />} />  {/* ← 修改这行 */}
            <Route path="/settings" element={<div className="content-wrapper"><h1>Settings - Coming Soon</h1></div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;