import React from 'react';

const Logo = () => (
  <div className="p-6 border-b border-gray-200">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
        <span className="text-white font-bold text-lg">S</span>
      </div>
      <div>
        <h1 className="font-bold text-lg text-gray-900">SmartBill</h1>
        <p className="text-xs text-gray-500">AI Expense Splitting</p>
      </div>
    </div>
  </div>
);

export default Logo;