import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"
import { Button, buttonVariants } from "./button"
import { type VariantProps } from "class-variance-authority"

interface FloatingActionButtonProps 
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof buttonVariants> {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  offset?: string
  tooltip?: string
  showOnScroll?: boolean
  scrollThreshold?: number
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  className,
  position = "bottom-right",
  offset = "24px",
  tooltip,
  showOnScroll = false,
  scrollThreshold = 100,
  size = "icon-lg",
  variant = "gradient",
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(!showOnScroll)

  React.useEffect(() => {
    if (!showOnScroll) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsVisible(scrollY > scrollThreshold)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [showOnScroll, scrollThreshold])

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6", 
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  }

  return (
    <motion.div
      className={cn(
        "fixed z-50",
        positionClasses[position]
      )}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0,
      }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      style={{
        [position.includes("bottom") ? "bottom" : "top"]: offset,
        [position.includes("right") ? "right" : "left"]: offset,
      }}
    >
      <Button
        size={size}
        variant={variant}
        className={cn(
          "shadow-xl hover:shadow-2xl rounded-full",
          "transition-all duration-300 ease-out",
          "hover:scale-110 active:scale-95",
          className
        )}
        tooltip={tooltip}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}

export default FloatingActionButton