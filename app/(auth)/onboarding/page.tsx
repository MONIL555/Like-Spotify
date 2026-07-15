'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid setup link');
      router.push('/login');
    } else {
      try {
        const payloadBase64 = token.split('.')[1];
        const decoded = JSON.parse(atob(payloadBase64));
        if (decoded.email) {
          setPrefilledEmail(decoded.email);
          setFormData(prev => ({ ...prev, email: decoded.email }));
        }
      } catch (err) {
        console.error('Failed to decode setup token', err);
      }
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupToken: token,
          ...formData,
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        if (data.details) {
          const firstError = Object.values(data.details)[0];
          throw new Error(Array.isArray(firstError) ? firstError[0] : 'Validation failed');
        }
        throw new Error(data.error || 'Failed to complete registration');
      }
      
      toast.success('Registration complete! Welcome to SpotTunes.');
      // Reload to update auth state context
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!token) return null;

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-slide-up">
      <div className="relative rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-[0_0_20px_rgba(29,185,84,0.4)] mb-3 transform transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Complete Setup</h1>
          <p className="text-white/60 text-sm font-medium mt-1 text-center">
            You're almost there! We just need a few details to finish creating your account.
          </p>
        </div>

        {error && (
          <div className="relative z-10 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-xs font-bold text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
          {!prefilledEmail && (
            <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <label className="block text-xs font-bold text-white/70 ml-1">Email</label>
              <div className="relative group">
                <Input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com" 
                  className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
                  required={!prefilledEmail}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
            <label className="block text-xs font-bold text-white/70 ml-1">Username</label>
            <div className="relative group">
              <Input 
                type="text" 
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="cool_user123" 
                className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
                required
                minLength={3}
                maxLength={30}
              />
            </div>
          </div>

          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <label className="block text-xs font-bold text-white/70 ml-1">Display Name</label>
            <div className="relative group">
              <Input 
                type="text" 
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="John Doe" 
                className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
            <label className="block text-xs font-bold text-white/70 ml-1">Create Password</label>
            <div className="relative group">
              <Input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Must have 8+ chars, 1 uppercase, 1 number"
                className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
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
                  Saving...
                </span>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 text-brand-primary border-t-2 border-brand-primary rounded-full" /></div>}>
      <OnboardingForm />
    </Suspense>
  );
}
