import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={64} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
    </div>
  );
};

export default EmptyState;