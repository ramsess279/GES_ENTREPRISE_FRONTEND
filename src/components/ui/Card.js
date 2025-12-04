import React from 'react';
import { clsx } from 'clsx';

const Card = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  variant = 'default',
  hover = false,
  ...props
}) => {
  const baseClasses = 'bg-white border border-secondary-200 transition-all duration-200 dark:bg-secondary-800 dark:border-secondary-700';

  const variants = {
    default: 'bg-white dark:bg-secondary-800',
    secondary: 'bg-secondary-50 dark:bg-secondary-700',
    glass: 'glass-card',
    gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900 dark:to-secondary-900',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadows = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const roundeds = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    shadows[shadow],
    roundeds[rounded],
    hover && 'hover:shadow-lg hover:-translate-y-1',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={clsx('mb-4', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={clsx('text-lg font-semibold text-secondary-900 dark:text-secondary-100', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={clsx('text-sm text-secondary-600 dark:text-secondary-400 mt-1', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={clsx('mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700', className)} {...props}>
    {children}
  </div>
);

// Attach sub-components to Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;