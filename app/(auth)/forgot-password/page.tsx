'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="clay-panel p-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground font-semibold mt-2 text-center">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Email</label>
            <Input type="email" placeholder="name@example.com" required />
          </div>
          
          <Button variant="brand" className="w-full mt-6" type="submit">
            Send Link
          </Button>
        </form>

        <p className="text-center text-sm font-semibold text-muted-foreground mt-8">
          Remember your password?{' '}
          <Link href="/login" className="text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
