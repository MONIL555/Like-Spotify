'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-slide-up">
      <div className="relative rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center mb-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-[0_0_20px_rgba(29,185,84,0.4)] mb-3 transform transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Welcome Back</h1>
          <p className="text-white/60 text-sm font-medium mt-1">Log in to SpotTunes</p>
        </div>

        {error && (
          <div className="relative z-10 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-xs font-bold text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <label className="block text-xs font-bold text-white/70 ml-1">Email</label>
            <div className="relative group">
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div className="flex justify-between items-center px-1">
              <label className="block text-xs font-bold text-white/70">Password</label>
              <Link href="/forgot-password" className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white h-10 rounded-lg text-sm transition-all"
                required 
              />
            </div>
          </div>
          
          <div className="pt-2 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <Button 
              className={`w-full h-10 rounded-lg text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(29,185,84,0.3)] border-none ${
                isLoading 
                  ? 'bg-white/10 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(29,185,84,0.5)]'
              }`} 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log In'
              )}
            </Button>
          </div>
        </form>

        <p className="relative z-10 text-center text-xs font-medium text-white/50 mt-5 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          Don't have an account?{' '}
          <Link href="/register" className="text-white font-bold hover:text-brand-primary transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
