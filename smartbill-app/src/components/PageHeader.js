import React from 'react';
import './PageHeader.css';

const PageHeader = ({ title, subtitle }) => (
  <div className="page-header">
    <h2 className="page-title">{title}</h2>
    <p className="page-subtitle">{subtitle}</p>
  </div>
);

export default PageHeader;