import React from 'react';
import Step from './Step';
import './StepIndicator.css';

const StepIndicator = ({ steps, activeStep }) => (
  <div className="step-indicator">
    {steps.map((step, index) => (
      <React.Fragment key={step.number}>
        <Step step={step} activeStep={activeStep} />
        {index < steps.length - 1 && (
          <div className="step-line" />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default StepIndicator;