import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden hover:scale-105 active:scale-95 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive  [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        success:
          "border-transparent bg-green-500 text-white [a&]:hover:bg-green-600",
        warning:
          "border-transparent bg-amber-500 text-white [a&]:hover:bg-amber-600",
        info:
          "border-transparent bg-blue-500 text-white [a&]:hover:bg-blue-600",
        premium:
          "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white [a&]:hover:from-purple-600 [a&]:hover:to-pink-600",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        live:
          "border-transparent bg-emerald-500 text-white animate-pulse [a&]:hover:bg-emerald-600",
        beta:
          "border-transparent bg-cyan-500 text-white [a&]:hover:bg-cyan-600",
        pro:
          "border-transparent bg-orange-500 text-white [a&]:hover:bg-orange-600",
        ai:
          "border-transparent bg-gradient-to-r from-cyan-400 to-blue-500 text-white [a&]:hover:from-cyan-500 [a&]:hover:to-blue-600",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-sm",
        xl: "px-6 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
