// import React from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Home, Users, Clock, Settings, Plus } from 'lucide-react';
// import Logo from './Logo';
// import MenuItem from './MenuItem';
// import UserProfile from './UserProfile';
// import './Sidebar.css';

// const Sidebar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const menuItems = [
//     { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
//     { id: 'new-expense', icon: Plus, label: 'New Expense', path: '/new-expense' },
//     { id: 'participants', icon: Users, label: 'Participants', path: '/participants' },
//     { id: 'history', icon: Clock, label: 'History', path: '/history' },
//     { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
//   ];

//   const handleMenuClick = (path) => {
//     navigate(path);
//   };

//   return (
//     <div className="sidebar">
//       <Logo />
      
//       <nav className="sidebar-nav">
//         <ul className="menu-list">
//           {menuItems.map(item => (
//             <MenuItem
//               key={item.id}
//               icon={item.icon}
//               label={item.label}
//               active={location.pathname === item.path}
//               onClick={() => handleMenuClick(item.path)}
//             />
//           ))}
//         </ul>
//       </nav>

//       <UserProfile />
//     </div>
//   );
// };

// export default Sidebar;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Receipt, Plus, Users, History, Settings } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="logo">
        <Receipt size={24} color="#2563eb" />
        <div>
          SmartBill<br />
          <span>AI Expense Splitting</span>
        </div>
      </div>

      <nav className="nav">
        <Link 
          to="/dashboard" 
          className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}
        >
          <Receipt size={18} />
          Dashboard
        </Link>
        <Link 
          to="/new-expense" 
          className={`nav-item ${location.pathname === '/new-expense' ? 'active' : ''}`}
        >
          <Plus size={18} />
          New Expense
        </Link>
        <Link 
          to="/participants" 
          className={`nav-item ${location.pathname === '/participants' ? 'active' : ''}`}
        >
          <Users size={18} />
          Participants
        </Link>
        <Link 
          to="/history" 
          className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
        >
          <History size={18} />
          History
        </Link>
        <Link 
          to="/settings" 
          className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          Settings
        </Link>
      </nav>

      <div className="user-info">
        <div className="user-circle">U</div>
        <div>
          <div className="user-name">User</div>
          <div className="user-email">user@example.com</div>
        </div>
      </div>
    </aside>
  );
}