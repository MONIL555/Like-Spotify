import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string
  defaultValue?: number[]
  value?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
  onValueChange?: (value: number[]) => void
  onValueCommitted?: (value: number[]) => void
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = "horizontal",
  onValueChange,
  onValueCommitted,
  ...props
}: SliderProps) {
  const _values = value ?? defaultValue ?? [min]

  return (
    <SliderPrimitive.Root
      className={cn(
        orientation === "horizontal" ? "w-full" : "h-full",
        className
      )}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      orientation={orientation}
      onValueChange={(val, _details) => {
        // base-ui passes number for single-value, number[] for multi
        // We normalize to always pass number[]
        const arr = Array.isArray(val) ? [...val] : [val]
        onValueChange?.(arr)
      }}
      onValueCommitted={(val, _details) => {
        const arr = Array.isArray(val) ? [...val] : [val]
        onValueCommitted?.(arr)
      }}
    >
      <SliderPrimitive.Control className={cn(
        "relative flex touch-none items-center select-none data-[disabled]:opacity-50",
        orientation === "horizontal" ? "w-full" : "h-full min-h-40 w-auto flex-col"
      )}>
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full bg-black/20 dark:bg-white/20 select-none",
            orientation === "horizontal" ? "h-1.5 w-full" : "h-full w-1.5"
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "bg-primary select-none",
              orientation === "horizontal" ? "h-full" : "w-full"
            )}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-4 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-4 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
