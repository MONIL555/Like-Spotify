'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        email,
        username: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        displayName: name,
        password
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-slide-up">
      <div className="relative rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-bl from-white/10 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center mb-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-bl from-brand-secondary to-brand-primary text-white shadow-[0_0_20px_rgba(29,215,96,0.4)] mb-3 transform transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Create Account</h1>
          <p className="text-white/60 text-sm font-medium mt-1">Join SpotTunes today</p>
        </div>

        {error && (
          <div className="relative z-10 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-xs font-bold text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <label className="block text-xs font-bold text-white/70 ml-1">Display Name</label>
            <div className="relative group">
              <Input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?" 
                className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
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
          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <label className="block text-xs font-bold text-white/70 ml-1">Password</label>
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
          
          <div className="pt-2 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            <Button className="w-full h-10 rounded-lg bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold text-sm hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(29,215,96,0.3)] hover:shadow-[0_0_20px_rgba(29,215,96,0.5)] border-none" type="submit">
              Sign Up
            </Button>
          </div>
        </form>

        <p className="relative z-10 text-center text-xs font-medium text-white/50 mt-5 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          Already have an account?{' '}
          <Link href="/login" className="text-white font-bold hover:text-brand-secondary transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
