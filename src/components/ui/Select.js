import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Sélectionnez une option',
  className = '',
  containerClassName = '',
  size = 'md',
  variant = 'default',
  fullWidth = false,
  ...props
}, ref) => {
  const baseClasses = 'block w-full border-secondary-300 focus:border-primary-500 focus:ring-primary-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white dark:border-secondary-600 dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:bg-secondary-800';

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

  const selectClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    'rounded-lg pr-10',
    error && 'border-accent-500 focus:border-accent-500 focus:ring-accent-500',
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
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-100 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          {placeholder && !props.children && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.length > 0 ? options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )) : props.children}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-secondary-400 dark:text-secondary-500" />
        </div>
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

Select.displayName = 'Select';

export default Select;