import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Rocket, CheckCircle2, Github } from 'lucide-react';
import { authClient } from '@/lib/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  
  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated && user && step !== 'otp') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate, step]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      toast.success('Check your email for the verification code');
      setStep('otp');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrors({ otp: 'Please enter a valid code' });
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const { error } = await authClient.emailOtp.verifyEmail({
        email: formData.email,
        otp: otpCode,
      });

      if (error) {
        throw new Error(error.message || 'Invalid verification code');
      }

      toast.success('Email verified successfully!');
      
      try {
        await authClient.signIn.email({ email: formData.email, password: formData.password });
        window.location.href = '/'; 
      } catch (e) {
        window.location.href = '/login';
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast.error(message);
      setErrors({ otp: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-indigo-500/30 lg:flex-row-reverse">
      {/* Right Form Container (formerly left) */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-white pointer-events-none -z-10" />
        
        <div className="mx-auto w-full max-w-sm relative z-10">
          <div className="mb-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              {step === 'details' ? 'Create an account' : 'Verify your email'}
            </h1>
            <p className="text-base text-slate-500">
              {step === 'details' 
                ? 'Join Invoice Simple to manage your billing automatically.'
                : `We sent a verification code to ${formData.email}.`}
            </p>
          </div>

          {step === 'details' ? (
            <form onSubmit={handleSignup} className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input
                      id="name"
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 font-medium">{errors.confirmPassword}</p>}
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                  <span className="shrink-0 font-bold bg-red-100 rounded-full w-5 h-5 flex items-center justify-center">!</span>
                  <p className="mt-0.5">{errors.submit}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5 transition-all duration-300 group mt-4" 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
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
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
                  Log in
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-semibold text-slate-700">Verification Code</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <ShieldCheck className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    className={`pl-12 h-14 text-center tracking-[0.5em] text-lg font-bold bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 uppercase ${errors.otp ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    disabled={loading}
                  />
                </div>
                {errors.otp && <p className="text-xs text-red-500 mt-2 font-medium">{errors.otp}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all duration-300 group" 
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
                        await authClient.emailOtp.sendVerificationOtp({ email: formData.email, type: 'email-verification' });
                        toast.success('A new code has been sent!');
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to resend code');
                      }
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Resend Code
                  </button>
                </p>
                <p className="text-slate-600">
                  Wrong email?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setStep('details');
                      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(79,70,229,0.1),_transparent_60%)]" />
          <div className="absolute top-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-700" />
          <div className="absolute bottom-1/4 left-1/4 w-[30rem] h-[30rem] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        </div>

        {/* 3D Glassmorphism Composition */}
        <div className="relative z-10 w-full max-w-[480px] perspective-1000">
          <div className="relative rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl p-10 shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2">
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full blur-3xl opacity-30" />
            
            <div className="relative flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Get Started Faster</h3>
                  <p className="text-sm text-indigo-200/60 mt-0.5">Setup in less than 2 minutes</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Create Unlimited Invoices</p>
                  <p className="text-xs text-white/50 mt-1">No caps on your growth</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Automated Reminders</p>
                  <p className="text-xs text-white/50 mt-1">Get paid 3x faster</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
               <p className="text-sm text-indigo-100/90 leading-relaxed relative z-10 font-medium">
                 Join thousands of professionals who trust us with their billing on a daily basis.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
