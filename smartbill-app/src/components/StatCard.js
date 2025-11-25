import React from 'react';
import './StatCard.css';

const StatCard = ({ icon: Icon, iconColor, iconBgColor, label, value }) => {
  return (
    <div className="stat-card">
      <div 
        className="stat-icon-container"
        style={{ backgroundColor: iconBgColor }}
      >
        <Icon size={24} style={{ color: iconColor }} />
      </div>
      
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;