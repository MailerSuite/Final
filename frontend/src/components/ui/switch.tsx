"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { generateTooltipText } from "@/utils/tooltip"

function Switch({
  className,
  checkedIcon = <Check className="size-3" />,
  uncheckedIcon = <X className="size-3" />,
  tooltip,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  checkedIcon?: React.ReactNode
  uncheckedIcon?: React.ReactNode
  tooltip?: boolean | string
}) {
  const [internalChecked, setInternalChecked] = React.useState(
    props.defaultChecked ?? false
  )

  const controlled = props.checked !== undefined
  const checked = controlled ? props.checked : internalChecked

  const tooltipText =
    typeof tooltip === "string"
      ? tooltip
      : tooltip === false
        ? ""
        : generateTooltipText({
            ariaLabel: (props as any)["aria-label"],
            elementType: "switch",
          })

  const element = (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      onCheckedChange={(value) => {
        if (!controlled) {
          setInternalChecked(value)
        }
        props.onCheckedChange?.(value)
      }}
      className={cn(
        "peer relative data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <motion.span
        className="pointer-events-none absolute left-0 flex h-full w-full items-center justify-start pl-0.5"
        initial={false}
        animate={{ opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        {checkedIcon}
      </motion.span>
      <motion.span
        className="pointer-events-none absolute right-0 flex h-full w-full items-center justify-end pr-0.5"
        initial={false}
        animate={{ opacity: checked ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {uncheckedIcon}
      </motion.span>
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          layout
          data-slot="switch-thumb"
          className={cn(
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
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

export { Switch }
