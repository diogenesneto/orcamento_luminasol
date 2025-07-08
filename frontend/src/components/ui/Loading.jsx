// src/components/ui/Loading.jsx
import React from 'react';
import { clsx } from 'clsx';
import { Sun, Loader2 } from 'lucide-react';

// Main Loading Component
const Loading = ({ 
  size = 'md', 
  variant = 'spinner',
  color = 'primary',
  fullScreen = false,
  overlay = false,
  text,
  className 
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    primary: 'text-primary-500',
    secondary: 'text-gray-500',
    white: 'text-white',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  const renderSpinner = () => {
    if (variant === 'solar') {
      return (
        <Sun className={clsx(
          'animate-spin',
          sizes[size],
          colors[color]
        )} />
      );
    }

    return (
      <Loader2 className={clsx(
        'animate-spin',
        sizes[size],
        colors[color]
      )} />
    );
  };

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'rounded-full bg-current animate-pulse',
            size === 'xs' && 'w-1 h-1',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3',
            size === 'xl' && 'w-4 h-4',
            colors[color]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={clsx(
      'rounded-full bg-current animate-pulse',
      sizes[size],
      colors[color]
    )} />
  );

  const renderContent = () => {
    const content = (
      <div className={clsx(
        'flex flex-col items-center justify-center',
        text && 'space-y-3',
        className
      )}>
        {variant === 'dots' && renderDots()}
        {variant === 'pulse' && renderPulse()}
        {(variant === 'spinner' || variant === 'solar') && renderSpinner()}
        
        {text && (
          <p className={clsx(
            'text-sm font-medium',
            colors[color]
          )}>
            {text}
          </p>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div className={clsx(
          'fixed inset-0 z-50 flex items-center justify-center',
          overlay && 'bg-white bg-opacity-75 backdrop-blur-sm'
        )}>
          {content}
        </div>
      );
    }

    return content;
  };

  return renderContent();
};

// Skeleton Loading Component
const Skeleton = ({ 
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  ...props 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              baseClasses,
              'h-4',
              index === lines - 1 && lines > 1 && 'w-3/4', // Last line shorter
              className
            )}
            style={{ width, height }}
            {...props}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={clsx(
          baseClasses,
          'rounded-full',
          className
        )}
        style={{ 
          width: width || height || '40px', 
          height: height || width || '40px' 
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={clsx(baseClasses, className)}
      style={{ width, height }}
      {...props}
    />
  );
};

// Card Skeleton
const CardSkeleton = ({ className, ...props }) => {
  return (
    <div className={clsx('p-6 bg-white rounded-lg shadow-md', className)} {...props}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width="48px" height="48px" />
        <div className="flex-1">
          <Skeleton variant="text" className="h-4 w-3/4 mb-2" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="mt-4 flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

// Table Skeleton
const TableSkeleton = ({ rows = 5, columns = 4, className, ...props }) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow-md overflow-hidden', className)} {...props}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={clsx(
                    'h-4',
                    colIndex === 0 && 'w-32', // First column wider
                    colIndex === 1 && 'w-24',
                    colIndex === 2 && 'w-20',
                    colIndex >= 3 && 'w-16'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard Skeleton
const DashboardSkeleton = ({ className, ...props }) => {
  return (
    <div className={clsx('space-y-6', className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton variant="circular" width="48px" height="48px" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={6} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Skeleton variant="circular" width="32px" height="32px" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Page Loading Component
const PageLoading = ({ message = 'Carregando...', className }) => {
  return (
    <div className={clsx(
      'min-h-screen flex items-center justify-center bg-gray-50',
      className
    )}>
      <div className="text-center">
        <Loading variant="solar" size="xl" color="primary" />
        <p className="mt-4 text-lg text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Attach sub-components
Loading.Skeleton = Skeleton;
Loading.Card = CardSkeleton;
Loading.Table = TableSkeleton;
Loading.Dashboard = DashboardSkeleton;
Loading.Page = PageLoading;

export default Loading;
