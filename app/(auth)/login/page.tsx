'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useConfigStore } from '@/store/configStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

// Firebase imports
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const { phoneAuthEnabled, isLoading: configLoading, fetchConfig } = useConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Force email tab if phone auth gets disabled while user is on phone tab
  useEffect(() => {
    if (!phoneAuthEnabled && loginMethod === 'phone') {
      setLoginMethod('email');
    }
  }, [phoneAuthEnabled, loginMethod]);
  
  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);



  const handleFirebaseToken = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to authenticate');
      }
      
      if (data.data.isNewUser) {
        // Redirect to onboarding with setupToken
        router.push(`/onboarding?token=${data.data.setupToken}`);
      } else {
        // Existing user logged in, reload to update auth context
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Server authentication failed');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await handleFirebaseToken(idToken);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google login failed');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid OTP');
      }
      
      if (data.data.isNewUser) {
        // Redirect to onboarding with setupToken
        router.push(`/onboarding?token=${data.data.setupToken}`);
      } else {
        // Existing user logged in, reload to update auth context
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-slide-up">
      <div className="relative rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-[0_0_20px_rgba(29,185,84,0.4)] mb-3 transform transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Welcome Back</h1>
          <p className="text-white/60 text-sm font-medium mt-1">Log in to MoniStream</p>
        </div>

        {/* Google Login Button */}
        <div className="relative z-10 mb-4 animate-fade-in" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold flex items-center justify-center gap-3 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative z-10 flex items-center justify-center my-4 animate-fade-in" style={{ animationDelay: '75ms', animationFillMode: 'both' }}>
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="px-3 text-xs text-white/40 font-medium uppercase tracking-wider">Or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {!configLoading && phoneAuthEnabled && (
          <div className="relative z-10 flex mb-6 bg-white/5 rounded-lg p-1 w-full max-w-[240px] mx-auto backdrop-blur-md border border-white/5">
            <button
              onClick={() => { setLoginMethod('email'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMethod === 'email' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              Email
            </button>
            <button
              onClick={() => { setLoginMethod('phone'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMethod === 'phone' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              Phone Number
            </button>
          </div>
        )}

        {error && (
          <div className="relative z-10 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-xs font-bold text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="relative z-10 space-y-3">
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
                    Processing...
                  </span>
                ) : (
                  'Log In'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="relative z-10 space-y-3">
            {!otpSent ? (
              <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <label className="block text-xs font-bold text-white/70 ml-1">Phone Number</label>
                <div className="relative group">
                  <Input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900" 
                    className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <label className="block text-xs font-bold text-white/70 ml-1">6-Digit OTP</label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456" 
                    maxLength={6}
                    className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg text-sm transition-all tracking-widest text-center"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="pt-2 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
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
                    Processing...
                  </span>
                ) : otpSent ? (
                  'Verify OTP'
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          </form>
        )}

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
