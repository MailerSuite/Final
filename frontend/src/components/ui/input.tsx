import * as React from "react"

import { cn } from "@/utils/cn"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { generateTooltipText } from "@/utils/tooltip"

function Input({ className, type, tooltip, ...props }: React.ComponentProps<"input"> & { tooltip?: boolean | string }) {
  const tooltipText =
    typeof tooltip === "string"
      ? tooltip
      : tooltip === false
        ? ""
        : generateTooltipText({
            placeholder: props.placeholder,
            ariaLabel: (props as any)["aria-label"],
            elementType: "input",
          })

  const element = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-11 w-full min-w-0 rounded-full border bg-card/50 backdrop-blur-sm px-4 py-2 text-base shadow-sm transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:shadow-md",
        "focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-4 focus-visible:shadow-md",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )

  return tooltipText ? (
    <Tooltip>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  ) : (
    element
  )
}

export { Input }
