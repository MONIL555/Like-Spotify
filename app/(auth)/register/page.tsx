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
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="clay-panel p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl clay-btn flex items-center justify-center bg-brand-secondary text-white shadow-brand mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground font-semibold mt-2">Join SpotTunes today</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-xl mb-6 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Display Name</label>
            <Input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Email</label>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2 ml-1">Password</label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <Button className="w-full mt-6 bg-brand-secondary text-white" type="submit">
            Sign Up
          </Button>
        </form>

        <p className="text-center text-sm font-semibold text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-secondary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
