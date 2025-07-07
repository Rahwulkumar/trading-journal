export const theme = {
  colors: {
    background: {
      primary: '#0a0a0f',
      secondary: '#11111a',
      tertiary: '#181825',
      elevated: '#1e1e2e',
      overlay: 'rgba(10, 10, 15, 0.8)'
    },
    
    surface: {
      primary: 'rgba(255, 255, 255, 0.02)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      tertiary: 'rgba(255, 255, 255, 0.08)',
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.15)'
    },
    
    profit: {
      primary: '#00ff88',
      secondary: '#00cc6e',
      tertiary: '#00a058',
      glow: 'rgba(0, 255, 136, 0.4)',
      gradient: 'linear-gradient(135deg, #00ff88 0%, #00cc6e 100%)',
      neon: '0 0 30px rgba(0, 255, 136, 0.6)',
      text: '#00ff88'
    },
    
    loss: {
      primary: '#ff3366',
      secondary: '#e6294d',
      tertiary: '#cc2442',
      glow: 'rgba(255, 51, 102, 0.4)',
      gradient: 'linear-gradient(135deg, #ff3366 0%, #e6294d 100%)',
      neon: '0 0 30px rgba(255, 51, 102, 0.6)',
      text: '#ff3366'
    },
    
    accent: {
      blue: '#3b82f6',
      purple: '#8b5cf6',
      cyan: '#06b6d4',
      amber: '#f59e0b',
      pink: '#ec4899',
      indigo: '#6366f1'
    },
    
    sessions: {
      sydney: { primary: '#ff6b6b', secondary: 'rgba(255, 107, 107, 0.2)' },
      tokyo: { primary: '#ff9f43', secondary: 'rgba(255, 159, 67, 0.2)' },
      london: { primary: '#48dbfb', secondary: 'rgba(72, 219, 251, 0.2)' },
      newyork: { primary: '#a29bfe', secondary: 'rgba(162, 155, 254, 0.2)' }
    },
    
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      quaternary: 'rgba(255, 255, 255, 0.4)',
      inverse: '#0a0a0f'
    },
    
    border: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      active: 'rgba(255, 255, 255, 0.2)',
      profit: 'rgba(0, 255, 136, 0.5)',
      loss: 'rgba(255, 51, 102, 0.5)'
    },
    
    glass: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.1)',
      heavy: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(0, 0, 0, 0.3)'
    }
  },
  
  gradients: {
    profit: 'linear-gradient(135deg, #00ff88 0%, #00cc6e 100%)',
    loss: 'linear-gradient(135deg, #ff3366 0%, #e6294d 100%)',
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    aurora: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
    midnight: 'linear-gradient(135deg, #0a0a0f 0%, #1e1e2e 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    neon: 'linear-gradient(135deg, #00ff88 0%, #3b82f6 50%, #ec4899 100%)',
    heatmap: {
      cold: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      warm: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
      hot: 'linear-gradient(135deg, #ff3366 0%, #f59e0b 100%)'
    }
  },
  
  typography: {
    fontFamily: {
      display: '"Bebas Neue", sans-serif',
      heading: '"Space Grotesk", sans-serif',
      body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
      trading: '"Orbitron", monospace'
    },
    
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      display: 'clamp(2rem, 5vw, 4rem)'
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    
    lineHeight: {
      tight: '1.1',
      snug: '1.2',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2'
    }
  },
  
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem'
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    full: '9999px'
  },
  
  effects: {
    glass: {
      light: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      
      medium: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      
      heavy: {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
    
    glow: {
      profit: {
        boxShadow: '0 0 30px rgba(0, 255, 136, 0.6), inset 0 0 20px rgba(0, 255, 136, 0.2)'
      },
      loss: {
        boxShadow: '0 0 30px rgba(255, 51, 102, 0.6), inset 0 0 20px rgba(255, 51, 102, 0.2)'
      },
      primary: {
        boxShadow: '0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.2)'
      }
    },
    
    neon: {
      profit: {
        textShadow: '0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.6), 0 0 30px rgba(0, 255, 136, 0.4)'
      },
      loss: {
        textShadow: '0 0 10px rgba(255, 51, 102, 0.8), 0 0 20px rgba(255, 51, 102, 0.6), 0 0 30px rgba(255, 51, 102, 0.4)'
      }
    },
    
    elevation: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.6)',
      DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.6)',
      md: '0 6px 12px rgba(0, 0, 0, 0.6)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.6)',
      xl: '0 12px 48px rgba(0, 0, 0, 0.6)'
    }
  },
  
  animation: {
    duration: {
      instant: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms'
    },
    
    timing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    
    keyframes: {
      fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 }
      },
      
      slideUp: {
        from: { transform: 'translateY(100%)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 }
      },
      
      slideDown: {
        from: { transform: 'translateY(-100%)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 }
      },
      
      scaleIn: {
        from: { transform: 'scale(0.9)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 }
      },
      
      pulse: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 }
      },
      
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' }
      },
      
      glow: {
        '0%, 100%': { opacity: 0.5 },
        '50%': { opacity: 1 }
      },
      
      float: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' }
      }
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px'
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    notification: 80
  }
};

export const createGlassEffect = (variant = 'medium') => {
  const effect = theme.effects.glass[variant];
  return `
    background: ${effect.background};
    backdrop-filter: ${effect.backdropFilter};
    -webkit-backdrop-filter: ${effect.backdropFilter};
    border: ${effect.border};
    box-shadow: ${effect.boxShadow};
  `;
};

export const createNeonText = (color = 'profit') => {
  return theme.effects.neon[color]?.textShadow || '';
};

export const createGradientText = (gradient = 'primary') => {
  return `
    background: ${theme.gradients[gradient]};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `;
};

export const getSessionColor = (hour) => {
  if (hour >= 22 || hour < 7) return theme.colors.sessions.sydney;
  if (hour >= 7 && hour < 9) return theme.colors.sessions.tokyo;
  if (hour >= 9 && hour < 17) return theme.colors.sessions.london;
  return theme.colors.sessions.newyork;
};

export default theme;