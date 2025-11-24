import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Clock, Settings, Plus } from 'lucide-react';
import Logo from './Logo';
import MenuItem from './MenuItem';
import UserProfile from './UserProfile';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
    { id: 'new-expense', icon: Plus, label: 'New Expense', path: '/new-expense' },
    { id: 'participants', icon: Users, label: 'Participants', path: '/participants' },
    { id: 'history', icon: Clock, label: 'History', path: '/history' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <Logo />
      
      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map(item => (
            <MenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
            />
          ))}
        </ul>
      </nav>

      <UserProfile />
    </div>
  );
};

export default Sidebar;