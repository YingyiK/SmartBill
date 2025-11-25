import React from 'react';
import './MenuItem.css';

const MenuItem = ({ icon: Icon, label, active, onClick }) => (
  <li>
    <button 
      className={`menu-item ${active ? 'menu-item-active' : ''}`}
      onClick={onClick}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  </li>
);

export default MenuItem;
