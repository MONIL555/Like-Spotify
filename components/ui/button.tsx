import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "brand" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  active?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", active, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50",
          // Base clay styling is applied unless it's a ghost button
          variant !== "ghost" && "clay-btn",
          variant === "brand" && "clay-btn-brand",
          variant === "ghost" && "hover:bg-surface-hover hover:text-foreground bg-transparent text-muted-foreground rounded-full transition-colors",
          
          // Sizes
          size === "default" && "h-12 px-6 py-2 text-base",
          size === "sm" && "h-9 px-4 text-sm",
          size === "lg" && "h-14 px-8 text-lg",
          size === "icon" && "h-12 w-12",
          
          // Active state (pressed look)
          active && "clay-btn-active text-brand-primary",
          
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
