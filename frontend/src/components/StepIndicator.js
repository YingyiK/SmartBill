import React from 'react';
import Step from './Step';

const StepIndicator = ({ steps, activeStep }) => (
  <div className="flex items-center justify-between mb-12">
    {steps.map((step, index) => (
      <React.Fragment key={step.number}>
        <Step step={step} activeStep={activeStep} />
        {index < steps.length - 1 && (
          <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default StepIndicator;