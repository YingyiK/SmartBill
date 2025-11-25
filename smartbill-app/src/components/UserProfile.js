import React from 'react';
import './UserProfile.css';

const UserProfile = () => (
  <div className="user-profile-container">
    <div className="user-profile-content">
      <div className="user-avatar">
        <span className="user-initial">U</span>
      </div>
      <div className="user-info">
        <p className="user-name">User</p>
        <p className="user-email">user@example.com</p>
      </div>
    </div>
  </div>
);

export default UserProfile;