// Animation utilities for smooth, performant animations

export const animations = {
  fadeIn: 'animate-in fade-in duration-500',
  fadeOut: 'animate-out fade-out duration-300',
  slideInFromTop: 'animate-in slide-in-from-top duration-500',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-500',
  slideInFromLeft: 'animate-in slide-in-from-left duration-500',
  slideInFromRight: 'animate-in slide-in-from-right duration-500',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-200',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};

export const transitions = {
  all: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-300 ease-in-out',
  opacity: 'transition-opacity duration-300 ease-in-out',
};

export const staggerChildren = (index: number, baseDelay = 50) => ({
  style: {
    animationDelay: `${index * baseDelay}ms`,
  },
});

export const microInteractions = {
  hover: 'hover:scale-105 hover:shadow-lg transition-all duration-200',
  press: 'active:scale-95 transition-transform duration-100',
  glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-shadow duration-300',
  lift: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-200',
};
