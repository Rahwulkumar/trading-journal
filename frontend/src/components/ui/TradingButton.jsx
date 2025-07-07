// 🚀 TradingButton.jsx - Advanced Button Component
// Location: components/ui/TradingButton.jsx

import React from 'react';

const TradingButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  className = '',
  onClick,
  ...props 
}) => {
  const getVariantStyles = () => {
    const variants = {
      primary: `
        bg-trading-600 hover:bg-trading-700 active:bg-trading-800
        text-white border-trading-600 hover:border-trading-700
        shadow-lg hover:shadow-trading-500/25
      `,
      secondary: `
        bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400
        dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:active:bg-neutral-500
        text-neutral-900 dark:text-neutral-100
        border-neutral-300 dark:border-neutral-600
      `,
      ghost: `
        bg-transparent hover:bg-neutral-100 active:bg-neutral-200
        dark:hover:bg-neutral-800 dark:active:bg-neutral-700
        text-neutral-700 dark:text-neutral-300
        border-transparent hover:border-neutral-300 dark:hover:border-neutral-600
      `,
      profit: `
        bg-profit-600 hover:bg-profit-700 active:bg-profit-800
        text-white border-profit-600 hover:border-profit-700
        shadow-lg hover:shadow-profit-500/25
      `,
      loss: `
        bg-loss-600 hover:bg-loss-700 active:bg-loss-800
        text-white border-loss-600 hover:border-loss-700
        shadow-lg hover:shadow-loss-500/25
      `,
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return sizes[size] || sizes.md;
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg border
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-trading-500 focus:ring-offset-2
        dark:focus:ring-offset-neutral-900
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${disabledStyles}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default TradingButton;