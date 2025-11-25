import React from 'react';
import './Step.css';

const Step = ({ step, activeStep }) => {
  const getStepClass = () => {
    if (step.number === activeStep) return 'step-circle step-active';
    if (step.number < activeStep) return 'step-circle step-completed';
    return 'step-circle step-inactive';
  };

  const getLabelClass = () => {
    return step.number === activeStep ? 'step-label step-label-active' : 'step-label';
  };

  return (
    <div className="step-container">
      <div className={getStepClass()}>
        {step.number}
      </div>
      <span className={getLabelClass()}>
        {step.label}
      </span>
    </div>
  );
};

export default Step;