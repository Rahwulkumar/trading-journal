import React from 'react';
import { theme } from '../../theme/theme';

const NeonButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props 
}) => {
  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: theme.gradients.primary,
        color: theme.colors.text.primary,
        glow: theme.effects.glow.primary.boxShadow,
        border: `1px solid ${theme.colors.accent.blue}`
      },
      profit: {
        background: theme.gradients.profit,
        color: theme.colors.background.primary,
        glow: theme.effects.glow.profit.boxShadow,
        border: `1px solid ${theme.colors.profit.primary}`
      },
      loss: {
        background: theme.gradients.loss,
        color: theme.colors.text.primary,
        glow: theme.effects.glow.loss.boxShadow,
        border: `1px solid ${theme.colors.loss.primary}`
      },
      ghost: {
        background: 'transparent',
        color: theme.colors.text.secondary,
        glow: 'none',
        border: `1px solid ${theme.colors.border.primary}`
      },
      glass: {
        background: theme.colors.glass.medium,
        color: theme.colors.text.primary,
        glow: 'none',
        border: `1px solid ${theme.colors.border.primary}`,
        backdropFilter: 'blur(10px)'
      }
    };
    return variants[variant] || variants.primary;
  };
  
  const getSizeStyles = () => {
    const sizes = {
      sm: {
        padding: '0.5rem 1rem',
        fontSize: theme.typography.fontSize.sm,
        height: '2rem'
      },
      md: {
        padding: '0.75rem 1.5rem',
        fontSize: theme.typography.fontSize.base,
        height: '2.75rem'
      },
      lg: {
        padding: '1rem 2rem',
        fontSize: theme.typography.fontSize.lg,
        height: '3.5rem'
      }
    };
    return sizes[size] || sizes.md;
  };
  
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  const baseClasses = `
    relative overflow-hidden rounded-lg font-medium
    inline-flex items-center justify-center gap-2
    transition-all duration-300 ease-out
    transform hover:scale-105 active:scale-95
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  return (
    <button
      className={`${baseClasses} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        background: variantStyles.background,
        color: variantStyles.color,
        border: variantStyles.border,
        boxShadow: !disabled ? variantStyles.glow : 'none',
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        height: sizeStyles.height,
        backdropFilter: variantStyles.backdropFilter || 'none',
        WebkitBackdropFilter: variantStyles.backdropFilter || 'none'
      }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={18} />}
        </>
      )}
      
      {!disabled && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"
          style={{ transform: 'skewX(-20deg)' }}
        />
      )}
    </button>
  );
};

export default NeonButton;