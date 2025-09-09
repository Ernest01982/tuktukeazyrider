import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'px-4 py-3 border-2 rounded-lg text-base transition-colors duration-200 min-h-[44px]';
  const stateClasses = error 
    ? 'border-secondary focus:border-secondary focus:ring-2 focus:ring-secondary/20' 
    : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${baseClasses}
            ${stateClasses}
            ${widthClass}
            ${icon ? 'pl-10' : ''}
            ${className}
            focus:outline-none
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-secondary">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';