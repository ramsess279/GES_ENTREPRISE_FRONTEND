import React from 'react';
import { clsx } from 'clsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl dark:bg-primary-500 dark:hover:bg-primary-400',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500 dark:bg-secondary-500 dark:hover:bg-secondary-400',
    outline: 'border border-secondary-300 bg-white hover:bg-secondary-50 text-secondary-700 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800 dark:hover:bg-secondary-700 dark:text-secondary-200',
    ghost: 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:ring-secondary-500 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-700',
    danger: 'bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent-500 dark:bg-accent-500 dark:hover:bg-accent-400',
    glass: 'glass-button text-secondary-700 hover:text-secondary-900 dark:text-secondary-200 dark:hover:text-secondary-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    loading && 'cursor-wait',
    className
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;