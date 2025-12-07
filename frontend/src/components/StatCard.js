import React from 'react';

const StatCard = ({ icon: Icon, iconColor, iconBgColor, label, value }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon 
            size={24} 
            style={{ color: iconColor }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;