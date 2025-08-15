import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

import { generateTooltipText } from "@/utils/tooltip"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary",

  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 shadow-sm",

        destructive:
          "bg-destructive text-white hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5 shadow-sm",

        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:-translate-y-0.5",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5 shadow-sm",

        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        link:
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-green-500 text-white hover:bg-green-600 hover:shadow-md hover:-translate-y-0.5 shadow-sm",

        warning:
          "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 shadow-sm",

        premium:
          "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:-translate-y-1 shadow-md",

        soft:
          "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-sm",
      },
      size: {
        xs: "h-8 px-3 text-xs gap-1.5",
        sm: "h-9 gap-2 px-4 text-sm has-[>svg]:px-3",
        default: "h-10 px-6 text-sm has-[>svg]:px-5",
        lg: "h-12 px-8 text-base has-[>svg]:px-7",
        xl: "h-14 px-10 text-lg has-[>svg]:px-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  tooltip?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, tooltip, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Comp
            className={cn(buttonVariants({ variant, size }), className)}
            ref={ref}
            {...props}
          >
            {children}
          </Comp>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            {generateTooltipText(tooltip)}
          </TooltipContent>
        )}
      </Tooltip>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
