// src/components/ui/Button.jsx
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow focus:ring-primary-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow focus:ring-success-500',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow focus:ring-warning-500',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white shadow focus:ring-danger-500',
    solar: 'bg-gradient-to-r from-primary-400 to-solar-500 hover:from-primary-500 hover:to-solar-600 text-white shadow-solar focus:ring-primary-500',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-5 h-5',
  };

  return (
    <button
      ref={ref}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className={clsx('animate-spin', iconSizes[size], children && 'mr-2')} />
      )}
      
      {!loading && leftIcon && (
        <span className={clsx(iconSizes[size], children && 'mr-2')}>
          {leftIcon}
        </span>
      )}
      
      {children}
      
      {!loading && rightIcon && (
        <span className={clsx(iconSizes[size], children && 'ml-2')}>
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
