// UserProfile.js
import React from 'react';

const UserProfile = () => (
  <div className="p-4 border-t border-gray-200">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 font-medium flex items-center justify-center">
        U
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">User</p>
        <p className="text-xs text-gray-500 truncate">user@example.com</p>
      </div>
    </div>
  </div>
);

export default UserProfile;