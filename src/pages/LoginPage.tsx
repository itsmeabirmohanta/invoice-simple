import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, CheckCircle2, Zap, Github } from 'lucide-react';
import { authClient } from '@/lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user && step !== 'otp') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
    } catch (err: any) {
      const message = err.message || 'Login failed';
      if (message.toLowerCase().includes('not verified') || err.code === 'email_not_verified') {
        toast.error('Your email is not verified. Please check your inbox for the code.');
        
        try {
          // @ts-ignore
          await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
          toast.info('A new verification code has been sent to your email.');
        } catch (e) {
          // ignore error if it couldn't resend immediately
        }
        
        setStep('otp');
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // @ts-ignore
      const { error: otpError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode,
      });

      if (otpError) {
        throw new Error(otpError.message || 'Invalid verification code');
      }

      toast.success('Email verified successfully!');
      
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      const message = err.message || 'Verification failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-blue-500/30 lg:flex-row-reverse">
      {/* Right Form Container (formerly left) */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none -z-10" />
        
        <div className="mx-auto w-full max-w-sm relative z-10">
          <div className="mb-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              {step === 'login' ? 'Welcome back' : 'Check your email'}
            </h1>
            <p className="text-base text-slate-500">
              {step === 'login' 
                ? 'Enter your credentials to access your dashboard.'
                : `We sent a verification code to ${email}.`}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                  <span className="shrink-0 font-bold bg-red-100 rounded-full w-5 h-5 flex items-center justify-center">!</span>
                  <p className="mt-0.5">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5 transition-all duration-300 group" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Sign In'}
                {!loading && <LogIn className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>

              <div className="relative my-6 mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline"
                onClick={async () => {
                   await authClient.signIn.social({ provider: 'github', callbackURL: '/' });
                }}
                className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Github className="w-5 h-5 mr-3" />
                GitHub
              </Button>

              <div className="mt-8 text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Create one for free
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-semibold text-slate-700">Verification Code</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <ShieldCheck className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    className="pl-12 h-14 text-center tracking-[0.5em] text-lg font-bold bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 uppercase"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3">
                  <span className="shrink-0 font-bold bg-red-100 rounded-full w-5 h-5 flex items-center justify-center">!</span>
                  <p className="mt-0.5">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-300 group" 
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
                {!loading && <ShieldCheck className="w-5 h-5 ml-2" />}
              </Button>
              
              <div className="mt-8 flex flex-col items-center gap-3 text-sm">
                <p className="text-slate-600">
                  Didn't receive the code?{' '}
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        // @ts-ignore
                        await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
                        toast.success('A new code has been sent!');
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to resend code');
                      }
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Resend Code
                  </button>
                </p>
                <p className="text-slate-600">
                  Want to try another account?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setPassword('');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Go back
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel: Feature Graphic */}
      <div className="relative hidden w-1/2 lg:flex items-center justify-center overflow-hidden bg-[#030712]">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1),_transparent_60%)]" />
          <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000" />
        </div>

        {/* 3D Glassmorphism Composition */}
        <div className="relative z-10 w-full max-w-[480px] perspective-1000">
          <div className="relative rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl p-10 shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-3xl opacity-30" />
            
            <div className="relative flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Invoice Simple</h3>
                  <p className="text-sm text-blue-200/60 mt-0.5">Professional billing platform</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Invoice #0012 Paid</p>
                  <p className="text-xs text-white/50 mt-1">Stripe • $1,250.00</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">New client added</p>
                  <p className="text-xs text-white/50 mt-1">Acme Corporation</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
               <p className="text-sm text-blue-100/90 leading-relaxed relative z-10 font-medium">
                 "This platform has completely transformed how I manage my freelance business. Highly recommended."
               </p>
               <div className="mt-5 flex items-center gap-3 relative z-10">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-white/70 font-bold text-xs shadow-sm">
                   SJ
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-white">Sarah Jenkins</p>
                   <p className="text-[11px] text-white/50 font-medium tracking-wide uppercase mt-0.5">Independent Designer</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

