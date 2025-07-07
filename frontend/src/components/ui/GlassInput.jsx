// 🎯 GlassInput.jsx - Glass-styled Input Component
// Location: components/ui/GlassInput.jsx

import React, { forwardRef } from 'react';

const GlassInput = forwardRef(({ 
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  icon: Icon,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props 
}, ref) => {

  const baseStyles = `
    w-full px-4 py-3 rounded-lg
    bg-white/5 border border-white/10
    text-white placeholder-white/30
    focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20
    transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const errorStyles = error ? `
    border-red-500 focus:border-red-500 focus:ring-red-500/20
    bg-red-500/10
  ` : '';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className={`
          block text-sm font-medium text-white/80
          ${required ? "after:content-['*'] after:ml-0.5 after:text-red-400" : ''}
          ${error ? 'text-red-400' : ''}
        `}>
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Prefix */}
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 text-sm">
            {prefix}
          </div>
        )}

        {/* Icon */}
        {Icon && (
          <div className={`
            absolute ${prefix ? 'left-8' : 'left-3'} top-1/2 transform -translate-y-1/2 
            text-white/40
          `}>
            <Icon size={18} />
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${baseStyles}
            ${errorStyles}
            ${prefix ? 'pl-8' : Icon ? 'pl-10' : 'pl-4'}
            ${suffix ? 'pr-8' : 'pr-4'}
          `}
          {...props}
        />

        {/* Suffix */}
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 text-sm">
            {suffix}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400 flex items-center space-x-1">
          <span className="w-1 h-1 bg-red-400 rounded-full"></span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;