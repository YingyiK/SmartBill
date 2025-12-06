// Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Receipt, Plus, Users, History, Settings, LogOut } from 'lucide-react';
import authService from '../services/authService';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout();
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: Receipt, label: 'Dashboard' },
    { path: '/new-expense', icon: Plus, label: 'New Expense' },
    { path: '/participants', icon: Users, label: 'Contacts' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <Receipt className="text-blue-600" size={24} />
        <div>
          <div className="font-bold text-gray-900">SmartBill</div>
          <div className="text-xs text-gray-500">AI Expense Splitting</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.email?.split('@')[0]}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-500 text-sm font-medium transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}