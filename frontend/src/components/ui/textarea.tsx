import * as React from "react"

import { cn } from "@/utils/cn"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { generateTooltipText } from "@/utils/tooltip"

function Textarea({ className, tooltip, ...props }: React.ComponentProps<"textarea"> & { tooltip?: boolean | string }) {
  const tooltipText =
    typeof tooltip === "string"
      ? tooltip
      : tooltip === false
        ? ""
        : generateTooltipText({
            placeholder: props.placeholder,
            ariaLabel: (props as any)["aria-label"],
            elementType: "textarea",
          })

  const element = (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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

export { Textarea }
