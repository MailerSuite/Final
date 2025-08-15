import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent } from './animations'

interface AnimatedModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    className?: string
    overlayClassName?: string
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
    isOpen,
    onClose,
    children,
    className = '',
    overlayClassName = ''
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClassName}`}
                    variants={modalBackdrop}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className={`relative bg-background border border-border rounded-lg shadow-2xl max-w-md w-full mx-4 ${className}`}
                        variants={modalContent}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Enhanced modal with header and footer
interface AnimatedModalWithHeaderProps extends AnimatedModalProps {
    title?: React.ReactNode
    footer?: React.ReactNode
    showCloseButton?: boolean
}

export const AnimatedModalWithHeader: React.FC<AnimatedModalWithHeaderProps> = ({
    isOpen,
    onClose,
    children,
    title,
    footer,
    showCloseButton = true,
    className = '',
    overlayClassName = ''
}) => {
    return (
        <AnimatedModal
            isOpen={isOpen}
            onClose={onClose}
            className={`max-w-lg ${className}`}
            overlayClassName={overlayClassName}
        >
            {/* Header */}
            {title && (
                <motion.div
                    className="flex items-center justify-between p-6 border-b border-border"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                >
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    {showCloseButton && (
                        <motion.button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    )}
                </motion.div>
            )}

            {/* Content */}
            <motion.div
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.2 }}
            >
                {children}
            </motion.div>

            {/* Footer */}
            {footer && (
                <motion.div
                    className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                >
                    {footer}
                </motion.div>
            )}
        </AnimatedModal>
    )
}
