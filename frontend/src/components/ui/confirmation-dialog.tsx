import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, CheckCircle, Info, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  disabled?: boolean
  showIcon?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-primary',
    confirmVariant: 'default' as const,
  },
  destructive: {
    icon: Trash2,
    iconColor: 'text-destructive',
    confirmVariant: 'destructive' as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-success',
    confirmVariant: 'default' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    confirmVariant: 'default' as const,
  },
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  showIcon = true,
}) => {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Confirmation action failed:', error)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <DialogHeader className="text-center space-y-4">
            {showIcon && (
              <motion.div
                className="mx-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                  variant === 'destructive' ? 'bg-destructive/10' :
                  variant === 'success' ? 'bg-success/10' :
                  variant === 'warning' ? 'bg-warning/10' :
                  'bg-primary/10'
                }`}>
                  <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
                </div>
              </motion.div>
            )}
            
            <div>
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="hover-lift"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={config.confirmVariant}
              onClick={handleConfirm}
              disabled={disabled || loading}
              loading={loading}
              className="hover-lift"
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export const useConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Partial<ConfirmationDialogProps>>({})

  const confirm = React.useCallback((options: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        onConfirm: async () => {
          await options.onConfirm()
          setIsOpen(false)
          resolve(true)
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel()
          setIsOpen(false)
          resolve(false)
        },
      })
      setIsOpen(true)
    })
  }, [])

  const ConfirmationComponent = React.useMemo(() => {
    if (!isOpen || !config) return null
    
    return (
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={config.title || ''}
        description={config.description || ''}
        {...config}
      />
    )
  }, [isOpen, config])

  return { confirm, ConfirmationComponent }
}

export default ConfirmationDialog