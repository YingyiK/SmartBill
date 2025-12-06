import React from 'react';

const Step = ({ step, activeStep }) => {
  const circleClass =
    step.number === activeStep
      ? 'bg-blue-600 text-white'
      : step.number < activeStep
      ? 'bg-blue-100 text-blue-600'
      : 'bg-gray-200 text-gray-400';

  const labelClass =
    step.number === activeStep ? 'text-gray-900 font-medium' : 'text-gray-500';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold mb-2 transition ${circleClass}`}
      >
        {step.number}
      </div>
      <span className={`text-sm ${labelClass}`}>{step.label}</span>
    </div>
  );
};

export default Step;