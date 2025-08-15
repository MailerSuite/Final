import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { scaleVariants, slideUpVariants, fadeInVariants } from '@/lib/animations'

interface UniversalModalProps {
  title: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  footerActions?: ReactNode
  icon?: ReactNode
  children: ReactNode
}

export default function UniversalModal({
  title,
  description,
  isOpen,
  onClose,
  footerActions,
  icon,
  children,
}: UniversalModalProps) {
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

  const pulseVariants = {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black/60 backdrop-blur-md" />
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
            className="bg-card/90 backdrop-blur-sm border border-muted/20 rounded-xl shadow-2xl p-0 max-w-lg w-full relative z-10"
            showCloseButton={false}
          >
            <motion.div 
              variants={slideUpVariants}
              className="bg-muted/30 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-muted/20"
            >
              <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                {icon && (
                  <motion.div
                    variants={pulseVariants}
                    animate="animate"
                    className="text-primary"
                  >
                    {icon}
                  </motion.div>
                )}
                {title}
              </DialogTitle>
              <DialogClose asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="opacity-70 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary rounded-sm p-1"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </motion.button>
              </DialogClose>
            </motion.div>
            
            <motion.div 
              variants={slideUpVariants}
              className="p-6 space-y-4"
            >
              {description && (
                <motion.div variants={fadeInVariants}>
                  <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </DialogDescription>
                </motion.div>
              )}
              <motion.div variants={fadeInVariants}>
                {children}
              </motion.div>
            </motion.div>
            
            <motion.div 
              variants={slideUpVariants}
              className="flex justify-end px-6 py-4 bg-muted/20 backdrop-blur-sm border-t border-muted/20"
            >
              <DialogFooter>
                {footerActions || (
                  <DialogClose asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Close
                      </Button>
                    </motion.div>
                  </DialogClose>
                )}
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </motion.div>
      </motion.div>
    </Dialog>
  )
}
