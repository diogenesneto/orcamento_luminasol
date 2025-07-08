// src/components/ui/Card.jsx
import React from 'react';
import { clsx } from 'clsx';

const Card = ({ 
  children, 
  className,
  hover = false,
  padding = 'md',
  shadow = 'sm',
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200',
        paddingClasses[padding],
        shadowClasses[shadow],
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'border-b border-gray-200 pb-4 mb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className, as: Component = 'h3', ...props }) => {
  return (
    <Component
      className={clsx(
        'text-lg font-semibold text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

const CardDescription = ({ children, className, ...props }) => {
  return (
    <p
      className={clsx(
        'text-sm text-gray-600 mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

const CardContent = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'border-t border-gray-200 pt-4 mt-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Attach sub-components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
