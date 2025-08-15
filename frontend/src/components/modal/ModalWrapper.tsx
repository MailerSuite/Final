import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { scaleVariants, slideUpVariants } from '@/lib/animations'

interface ModalWrapperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  showCloseButton?: boolean
  /**
   * Optional size variant controlling the dialog width. Defaults to `lg`,
   * matching the base DialogContent styling.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

export default function ModalWrapper({
  open,
  onOpenChange,
  children,
  showCloseButton = true,
  size = 'lg',
}: ModalWrapperProps) {
  const sizeClasses: Record<NonNullable<ModalWrapperProps['size']>, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
  }

  const widthClass = size ? sizeClasses[size] : ''

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-primary/3 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <motion.div variants={scaleVariants}>
          <DialogContent 
            showCloseButton={showCloseButton} 
            className={`bg-card/90 backdrop-blur-sm border border-muted/20 rounded-xl shadow-2xl relative z-10 ${widthClass}`}
          >
            <motion.div variants={slideUpVariants}>
              {children}
            </motion.div>
          </DialogContent>
        </motion.div>
      </motion.div>
    </Dialog>
  )
}
