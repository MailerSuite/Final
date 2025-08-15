import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ReactNode } from 'react'

// Animation variants for consistent timing
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2
    }
  }
}

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.2
    }
  }
}

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.98,
    transition: {
      duration: 0.2
    }
  }
}

export const slideInFromTop: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
}

export const slideInFromBottom: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
}

export const modalBackdrop: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15
    }
  }
}

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Reusable animated components
export const FadeInUp: React.FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className
}) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
)

export const FadeInLeft: React.FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className
}) => (
  <motion.div
    variants={fadeInLeft}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
)

export const FadeInRight: React.FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className
}) => (
  <motion.div
    variants={fadeInRight}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
)

export const SlideInFromTop: React.FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className
}) => (
  <motion.div
    variants={slideInFromTop}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
)

export const SlideInFromBottom: React.FC<{ children: ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className
}) => (
  <motion.div
    variants={slideInFromBottom}
    initial="hidden"
    animate="visible"
    exit="exit"
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerContainer: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerItem: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <motion.div
    variants={staggerItem}
    className={className}
  >
    {children}
  </motion.div>
)

// Page transition wrapper
export const PageTransition: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// Hover animations
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 }
}

export const hoverLift = {
  y: -2,
  transition: { duration: 0.2 }
}

export const hoverGlow = {
  boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
  transition: { duration: 0.2 }
}
