import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/utils/cn"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { generateTooltipText } from "@/utils/tooltip"

function Checkbox({
  className,
  tooltip,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { tooltip?: boolean | string }) {
  const tooltipText =
    typeof tooltip === "string"
      ? tooltip
      : tooltip === false
        ? ""
        : generateTooltipText({
            ariaLabel: (props as any)["aria-label"],
            elementType: "checkbox",
          })

  const element = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <Check className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
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

export { Checkbox }
