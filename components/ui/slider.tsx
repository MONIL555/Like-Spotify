import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
  activeColor?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, max = 100, step = 1, onChange, onValueCommit, activeColor = "var(--brand-primary)", ...props }, ref) => {
    
    const percentage = max > 0 ? (value / max) * 100 : 0;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    };
    
    const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
      if (onValueCommit) onValueCommit(parseFloat((e.target as HTMLInputElement).value));
    };
    
    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (onValueCommit && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        onValueCommit(parseFloat((e.target as HTMLInputElement).value));
      }
    };

    return (
      <div className={cn("relative flex w-full h-4 touch-none select-none items-center group cursor-pointer", className)}>
        {/* Track Background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 w-full rounded-full bg-surface overflow-hidden">
          {/* Active Fill */}
          <div 
            className="absolute h-full left-0 top-0 transition-colors duration-100 bg-white group-hover:bg-brand-primary"
            style={{ 
              width: `${percentage}%`
            }}
          />
        </div>
        
        {/* Native Range Input (Invisible overlay for interaction) */}
        <input
          type="range"
          ref={ref}
          value={value ?? 0}
          max={max}
          step={step}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          onTouchEnd={() => { if(onValueCommit) onValueCommit(value) }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          {...props}
        />
        
        {/* Custom Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md z-0 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
          style={{ 
            left: `calc(${percentage}% - 6px)`
          }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
