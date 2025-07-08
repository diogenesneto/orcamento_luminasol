// src/components/ui/Modal.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  className,
  overlayClassName,
  contentClassName,
  ...props
}) => {
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc, false);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc, false);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (typeof window === 'undefined') {
    return null;
  }

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={clsx(
                'fixed inset-0 bg-black bg-opacity-75 transition-opacity',
                overlayClassName
              )}
              onClick={handleOverlayClick}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className={clsx(
                'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full',
                sizes[size],
                className
              )}
              {...props}
            >
              <div className={clsx('bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4', contentClassName)}>
                {/* Header */}
                {(title || showClose) && (
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {title && (
                        <h3 className="text-lg font-semibold leading-6 text-gray-900">
                          {title}
                        </h3>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {description}
                        </p>
                      )}
                    </div>
                    {showClose && (
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-4"
                        onClick={onClose}
                      >
                        <span className="sr-only">Fechar</span>
                        <X className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="mt-2">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// Modal sub-components
const ModalHeader = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'border-b border-gray-200 pb-4 mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const ModalBody = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx('py-2', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const ModalFooter = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'border-t border-gray-200 pt-4 mt-6 flex items-center justify-end space-x-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
