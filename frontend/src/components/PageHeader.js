import React from 'react';

const PageHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-base text-gray-500">{subtitle}</p>
  </div>
);

export default PageHeader;