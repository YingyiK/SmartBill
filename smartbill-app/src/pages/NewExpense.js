import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import StepIndicator from '../components/StepIndicator';
import UploadArea from '../components/UploadArea';
import { STEPS } from '../constants';
import './NewExpense.css';

const NewExpense = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log('Selected file:', file);
    }
  };

  return (
    <div className="content-wrapper">
      <PageHeader
        title="Create New Expense"
        subtitle="Upload a bill and use voice to describe the split"
      />
      
      <StepIndicator steps={STEPS} activeStep={activeStep} />
      
      <UploadArea
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
      />
    </div>
  );
};

export default NewExpense;