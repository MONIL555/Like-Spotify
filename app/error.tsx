'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          We encountered an unexpected error while trying to render this page. 
          Please try again, or navigate back to the home page.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => reset()} variant="default" className="bg-brand-primary text-white hover:bg-brand-hover">
          Try again
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          Go Home
        </Button>
      </div>
    </div>
  );
}
