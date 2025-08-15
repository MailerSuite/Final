import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col rounded-lg border transition-all duration-200 relative overflow-hidden focus-within:ring-2 focus-within:ring-primary/20",
  {
    variants: {
      variant: {
        default: "border-border shadow-sm gap-4 p-6",
        elevated: "border-border shadow-md gap-4 p-6 hover:shadow-lg hover:-translate-y-0.5",
        glass: "bg-card/80 backdrop-blur-sm border-border/50 shadow-sm gap-4 p-6",
        outline: "bg-transparent border border-border gap-4 p-6 hover:bg-card/30",
        premium: "bg-card border-primary/20 shadow-lg gap-6 p-8 hover:shadow-xl hover:-translate-y-1",
        interactive: "border-border shadow-sm gap-4 p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        compact: "border-border shadow-sm gap-3 p-4",
        spacious: "border-border shadow-sm gap-8 p-8",
      },
      size: {
        sm: "gap-3 p-4",
        default: "gap-4 p-6",
        lg: "gap-6 p-8",
        xl: "gap-8 p-10",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  animated?: boolean
  loading?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, animated = false, loading = false, children, ...props }, ref) => {
    const Component = animated ? motion.div : "div"

    const animationProps = animated ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, ease: "easeOut" },
    } : {}

    return (
      <Component
        ref={ref}
        data-slot="card"
        className={cn(cardVariants({ variant, size }), className)}
        {...animationProps}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}
        {children}
        {variant === "premium" && (
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          </div>
        )}
      </Component>
    )
  }
)
Card.displayName = "Card"

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-tight font-semibold text-lg", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center [.border-t]:pt-4", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
