'use client';
import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ trigger, children, align = 'end', onOpenChange }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const handleSetOpen = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handleSetOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => handleSetOpen(!open)} className="cursor-pointer inline-flex">
        {trigger}
      </div>
      
      {open && (
        <div 
          className={cn(
            "absolute z-[100] mt-2 min-w-[200px] rounded-xl bg-surface/95 backdrop-blur-xl border border-border/50 p-2 shadow-2xl animate-slide-up",
            align === 'end' ? 'right-0 origin-top-right' : 
            align === 'start' ? 'left-0 origin-top-left' : 
            'left-1/2 -translate-x-1/2 origin-top'
          )}
          onClick={() => handleSetOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({ className, children, onClick }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-surface-hover hover:text-brand-primary",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("-mx-2 my-1 h-px bg-border/50", className)} {...props} />
  )
}

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)} {...props} />
  )
}
