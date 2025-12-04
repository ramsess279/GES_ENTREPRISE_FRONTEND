import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  size = 'md',
  variant = 'default',
  fullWidth = false,
  ...props
}, ref) => {
  const baseClasses = 'block w-full border-secondary-300 focus:border-primary-500 focus:ring-primary-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:border-secondary-600 dark:focus:border-primary-400 dark:focus:ring-primary-400';

  const variants = {
    default: 'border-secondary-300 bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-700',
    filled: 'border-transparent bg-secondary-100 focus:bg-secondary-50 dark:bg-secondary-600 dark:focus:bg-secondary-700',
    outline: 'border-secondary-300 bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-700',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const inputClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    'rounded-lg',
    error && 'border-accent-500 focus:border-accent-500 focus:ring-accent-500',
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    fullWidth && 'w-full',
    className
  );

  const containerClasses = clsx(
    'relative',
    fullWidth && 'w-full',
    containerClassName
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 dark:text-secondary-100 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;