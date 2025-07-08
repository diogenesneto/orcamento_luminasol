// src/components/ui/Input.jsx
import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  prefix,
  suffix,
  required = false,
  fullWidth = true,
  ...props
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200';
  
  const errorClasses = 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500';
  
  const disabledClasses = 'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

  const inputClasses = clsx(
    baseClasses,
    disabledClasses,
    error && errorClasses,
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    prefix && 'pl-12',
    suffix && 'pr-12',
    !fullWidth && 'w-auto',
    className
  );

  return (
    <div className={clsx('relative', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">
              {leftIcon}
            </span>
          </div>
        )}
        
        {/* Prefix */}
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm font-medium">
              {prefix}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
        
        {/* Suffix */}
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm font-medium">
              {suffix}
            </span>
          </div>
        )}
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">
              {rightIcon}
            </span>
          </div>
        )}
        
        {/* Error Icon */}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-danger-500" />
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-danger-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
