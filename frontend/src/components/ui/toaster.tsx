"use client"

import { useToast } from "@/hooks/useToast"
import {
  SignalSlashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  const icons = {
    critical: SignalSlashIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon,
  }

  return (
    <ToastProvider>
      {toasts.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          {toasts.slice(0, 1).map(function ({
            id,
            title,
            description,
            action,
            severity = "info",
            ...props
          }) {
            const Icon = icons[severity]
            return (
              <Toast key={id} severity={severity} {...props} role="alert" aria-live="assertive">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <div className="grid gap-1">
                    {title && <ToastTitle className="font-medium">{title}</ToastTitle>}
                    {description && <ToastDescription>{description}</ToastDescription>}
                  </div>
                </div>
                {action}
                <ToastClose className="absolute top-2 right-2 p-1" aria-label="Close notification" />
                <div className="h-1 mt-2 overflow-hidden rounded bg-foreground/20">
                  <div
                    className="h-full bg-foreground/50 animate-progress"
                    style={{
                      animationDuration: `${props.duration ?? 5000}ms`,
                      '--progress-duration': `${props.duration ?? 5000}ms`,
                    } as React.CSSProperties}
                  />
                </div>
              </Toast>
            )
          })}
        </div>
      )}
      {/* Hide the default ToastViewport */}
      {/* <ToastViewport /> */}
    </ToastProvider>
  )
}
