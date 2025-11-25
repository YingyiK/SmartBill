import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewExpense from './pages/NewExpense';
import Participants from './pages/Participants';
import History from './pages/History';
import Settings from './pages/Settings';
import './style.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-expense" element={<NewExpense />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;