// 🎨 TradingInput.jsx - Advanced Input Component
// Location: components/ui/TradingInput.jsx

import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, DollarSign, Percent, TrendingUp, TrendingDown } from 'lucide-react';

const TradingInput = forwardRef(({ 
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon: Icon,
  suffix,
  prefix,
  variant = 'default',
  size = 'md',
  className = '',
  onFocus,
  onBlur,
  ...props 
}, ref) => {
  
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    const variants = {
      default: `
        border-gray-300 dark:border-gray-600 
        focus:border-blue-500 focus:ring-blue-500/20
        bg-white dark:bg-gray-800
      `,
      profit: `
        border-green-300 dark:border-green-600
        focus:border-green-500 focus:ring-green-500/20
        bg-green-50 dark:bg-green-900/20
      `,
      loss: `
        border-red-300 dark:border-red-600
        focus:border-red-500 focus:ring-red-500/20
        bg-red-50 dark:bg-red-900/20
      `,
      currency: `
        border-amber-300 dark:border-amber-600
        focus:border-amber-500 focus:ring-amber-500/20
        bg-amber-50 dark:bg-amber-900/20
      `,
      percentage: `
        border-purple-300 dark:border-purple-600
        focus:border-purple-500 focus:ring-purple-500/20
        bg-purple-50 dark:bg-purple-900/20
      `
    };
    return variants[variant] || variants.default;
  };

  // Get size styles
  const getSizeStyles = () => {
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg'
    };
    return sizes[size] || sizes.md;
  };

  // Get trading-specific icons
  const getTradingIcon = () => {
    if (Icon) return Icon;
    
    const tradingIcons = {
      currency: DollarSign,
      percentage: Percent,
      profit: TrendingUp,
      loss: TrendingDown
    };
    
    return tradingIcons[variant];
  };

  const TradingIcon = getTradingIcon();

  // Base input styles
  const baseStyles = `
    w-full rounded-lg border transition-all duration-300
    text-gray-900 dark:text-gray-100
    placeholder:text-gray-500 dark:placeholder:text-gray-400
    focus:outline-none focus:ring-2
    disabled:bg-gray-100 dark:disabled:bg-gray-700 
    disabled:cursor-not-allowed disabled:opacity-50
  `;

  // Error styles
  const errorStyles = error ? `
    border-red-500 focus:border-red-500 focus:ring-red-500/20
    bg-red-50 dark:bg-red-900/20
  ` : '';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className={`
          block text-sm font-medium
          ${error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
          ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}
        `}>
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Prefix */}
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {prefix}
          </div>
        )}

        {/* Icon */}
        {TradingIcon && (
          <div className={`
            absolute left-3 top-1/2 transform -translate-y-1/2 
            ${prefix ? 'left-8' : 'left-3'}
            ${isFocused ? 'text-blue-500' : 'text-gray-400'}
            transition-colors duration-300
          `}>
            <TradingIcon size={18} />
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${baseStyles}
            ${getVariantStyles()}
            ${getSizeStyles()}
            ${errorStyles}
            ${TradingIcon || prefix ? 'pl-10' : ''}
            ${suffix || type === 'password' ? 'pr-10' : ''}
          `}
          {...props}
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Suffix */}
        {suffix && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {suffix}
          </div>
        )}

        {/* Focus Ring Animation */}
        <div className={`
          absolute inset-0 rounded-lg border-2 border-transparent
          ${isFocused ? 'border-blue-500/30 animate-pulse' : ''}
          pointer-events-none transition-all duration-300
        `} />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
          <span>{error}</span>
        </p>
      )}

      {/* Success Animation */}
      {value && !error && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
});

TradingInput.displayName = 'TradingInput';

export default TradingInput;