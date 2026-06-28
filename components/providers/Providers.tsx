'use client';

import * as React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
