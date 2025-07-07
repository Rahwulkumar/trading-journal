// 📊 TradingCard.jsx - Professional Trading Data Card
// Location: components/ui/TradingCard.jsx

import React from 'react';

const TradingCard = ({ 
  children, 
  title, 
  subtitle, 
  variant = 'default',
  hoverable = false,
  className = '',
  badge,
  status,
  pnl,
  winRate,
  rMultiple,
  ...props 
}) => {
  const getVariantStyles = () => {
    const variants = {
      default: `
        bg-white dark:bg-neutral-800 
        border border-neutral-200 dark:border-neutral-700
        shadow-lg hover:shadow-xl
      `,
      profit: `
        bg-gradient-to-br from-profit-50 to-white dark:from-profit-900/20 dark:to-neutral-800
        border border-profit-200 dark:border-profit-700/50
        shadow-lg hover:shadow-profit-500/20
      `,
      loss: `
        bg-gradient-to-br from-loss-50 to-white dark:from-loss-900/20 dark:to-neutral-800
        border border-loss-200 dark:border-loss-700/50
        shadow-lg hover:shadow-loss-500/20
      `,
      warning: `
        bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-neutral-800
        border border-amber-200 dark:border-amber-700/50
        shadow-lg hover:shadow-amber-500/20
      `,
      auto: getAutoVariant()
    };
    return variants[variant] || variants.default;
  };

  const getAutoVariant = () => {
    if (pnl !== undefined) {
      return pnl > 0 ? 
        `bg-gradient-to-br from-profit-50 to-white dark:from-profit-900/20 dark:to-neutral-800
         border border-profit-200 dark:border-profit-700/50 shadow-lg hover:shadow-profit-500/20` : 
        pnl < 0 ? 
        `bg-gradient-to-br from-loss-50 to-white dark:from-loss-900/20 dark:to-neutral-800
         border border-loss-200 dark:border-loss-700/50 shadow-lg hover:shadow-loss-500/20` : 
        `bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl`;
    }
    return `bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl`;
  };

  const getStatusBadge = () => {
    if (!badge && !status) return null;
    
    const statusColors = {
      success: 'bg-profit-100 text-profit-700 dark:bg-profit-900/30 dark:text-profit-400',
      error: 'bg-loss-100 text-loss-700 dark:bg-loss-900/30 dark:text-loss-400',
      warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      info: 'bg-trading-100 text-trading-700 dark:bg-trading-900/30 dark:text-trading-400',
    };

    return (
      <span className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${statusColors[status] || statusColors.info}
      `}>
        {badge || status}
      </span>
    );
  };

  const hoverStyles = hoverable ? `
    transition-all duration-300 ease-in-out 
    hover:scale-[1.02] hover:-translate-y-1 
    cursor-pointer transform-gpu
  ` : 'transition-all duration-200 ease-in-out';

  return (
    <div 
      className={`
        rounded-xl p-6 relative overflow-hidden
        ${getVariantStyles()}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute inset-0 bg-gradient-to-br from-trading-500 via-transparent to-profit-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        {(title || subtitle || badge || status) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {subtitle}
                </p>
              )}
            </div>
            {getStatusBadge()}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-3">
          {children}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      {hoverable && (
        <div className="absolute inset-0 bg-gradient-to-r from-trading-500/0 via-trading-500/5 to-profit-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </div>
  );
};

export default TradingCard;