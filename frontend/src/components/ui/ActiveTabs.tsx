import { TabsTrigger } from "./tabs"
import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

export function ActiveTabsTrigger({ className, ...props }: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "border-b-2 border-transparent font-medium data-[state=active]:border-primary data-[state=active]:font-semibold",
        className
      )}
      {...props}
    />
  )
}

export default ActiveTabsTrigger

