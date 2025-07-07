import React from 'react';
import { theme, createGlassEffect } from '../../theme/theme';

const GlassCard = ({ 
  children, 
  variant = 'medium',
  className = '', 
  hoverable = true,
  clickable = false,
  onClick,
  neon = null,
  gradient = null,
  title,
  subtitle,
  icon: Icon,
  action,
  ...props 
}) => {
  const glassStyles = createGlassEffect(variant);
  
  const getNeonEffect = () => {
    if (!neon) return '';
    const neonEffects = {
      profit: theme.effects.glow.profit.boxShadow,
      loss: theme.effects.glow.loss.boxShadow,
      primary: theme.effects.glow.primary.boxShadow
    };
    return neonEffects[neon] || '';
  };
  
  const baseClasses = `
    relative overflow-hidden rounded-xl
    transition-all duration-300 ease-out
    ${hoverable ? 'hover:transform hover:scale-[1.02] hover:-translate-y-1' : ''}
    ${clickable ? 'cursor-pointer active:scale-[0.98]' : ''}
  `;
  
  const glassClasses = `
    ${glassStyles}
    ${getNeonEffect() ? `shadow-[${getNeonEffect()}]` : ''}
  `;

  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={clickable ? onClick : undefined}
      style={{
        ...props.style,
        background: gradient ? theme.gradients[gradient] : glassStyles.background,
        backdropFilter: glassStyles.backdropFilter,
        WebkitBackdropFilter: glassStyles.backdropFilter,
        border: glassStyles.border,
        boxShadow: `${glassStyles.boxShadow}${neon ? `, ${getNeonEffect()}` : ''}`
      }}
      {...props}
    >
      {gradient && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: theme.gradients[gradient],
            mixBlendMode: 'overlay' 
          }}
        />
      )}
      
      {(title || subtitle || Icon || action) && (
        <div className="flex items-start justify-between p-6 relative z-10">
          <div className="flex items-start space-x-4">
            {Icon && (
              <div className="p-3 rounded-lg bg-white/10">
                <Icon size={24} className="text-white" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-white mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-white/60">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
      
      {hoverable && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </div>
  );
};

export default GlassCard;