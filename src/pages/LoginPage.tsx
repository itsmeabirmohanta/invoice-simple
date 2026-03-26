import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { authClient } from '@/lib/auth'; // Import the client for emailOtp

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [error, setError] = useState('');

  // If user is already authenticated, redirect to dashboard
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
      // Login uses standard useAuth loop and automatically redirects via useEffect
      toast.success('Logged in successfully!');
    } catch (err: any) {
      const message = err.message || 'Login failed';
      // Handle the case where email verification is required
      if (message.toLowerCase().includes('not verified') || err.code === 'email_not_verified') {
        toast.error('Your email is not verified. Please check your inbox for the code.');
        
        // Optionally request a new code if their previous one expired
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
      // @ts-ignore: emailOtp injected via plugin
      const { error: otpError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode,
      });

      if (otpError) {
        throw new Error(otpError.message || 'Invalid verification code');
      }

      toast.success('Email verified successfully!');
      
      // Re-run standard login flow now that verification is complete
      await login(email, password);
      // Force navigation to dashboard
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
    <div className="flex min-h-screen bg-white">
      {/* Left Panel: Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 animate-fade-in-up flex flex-col items-center sm:items-start text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {step === 'login' ? 'Welcome Back' : 'Verify your email'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'login' 
                ? 'Login to manage your professional invoices.'
                : `We sent a code to ${email}. Please enter it below.`}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up animation-delay-100">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <a href="#" className="text-sm font-medium text-blue-600 hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
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
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <span className="shrink-0 leading-5">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 group" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Sign In'}
                {!loading && <LogIn className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>

              <p className="mt-8 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                  Create one now
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6 animate-fade-in-up">
              <div>
                <Label htmlFor="otp" className="text-gray-700">Verification Code</Label>
                <div className="relative mt-1">
                  <ShieldCheck className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    className="pl-12 h-14 text-center tracking-[0.5em] text-lg font-bold bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <span className="shrink-0 leading-5">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all group" 
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
                {!loading && <ShieldCheck className="w-5 h-5 ml-2" />}
              </Button>
              
              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <p className="text-gray-600">
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
                    className="font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Resend Code
                  </button>
                </p>
                <p className="text-gray-600">
                  Want to try another account?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setPassword('');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-500"
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
      <div className="relative hidden w-1/2 lg:block overflow-hidden bg-slate-900 border-l border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-blue-900/60 z-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12 z-20">
           <div className="max-w-md text-white text-center">
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mx-auto mb-8 shadow-2xl">
               <LogIn className="w-8 h-8 text-blue-300" />
             </div>
             <h2 className="text-3xl font-bold tracking-tight mb-4">Welcome Back</h2>
             <p className="text-blue-100/80 text-lg leading-relaxed">
                Log in to handle your billing, see your analytics, and manage your clients seamlessly in one unified platform.
             </p>
           </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
    </div>
  );
}
