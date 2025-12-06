import React from 'react';

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-16 px-8 max-w-sm mx-auto">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
      <Icon size={64} />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
  </div>
);

export default EmptyState;