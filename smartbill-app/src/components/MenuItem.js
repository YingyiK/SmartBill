import React from 'react';

const MenuItem = ({ icon: Icon, label, active, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left
                 ${active
                   ? 'text-blue-600 bg-blue-50 font-medium'
                   : 'text-gray-700 hover:bg-gray-100'
                 }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  </li>
);

export default MenuItem;