import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { authClient } from '@/lib/auth'; // Import the client for emailOtp

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
    // If user is authenticated and not waiting for OTP, redirect
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
      // Wait to see if user session is established. Neon Auth with "Verify at Sign-up" 
      // sends an OTP and might not create a session immediately.
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
      // @ts-ignore: emailOtp injected via plugin
      const { error } = await authClient.emailOtp.verifyEmail({
        email: formData.email,
        otp: otpCode,
      });

      if (error) {
        throw new Error(error.message || 'Invalid verification code');
      }

      toast.success('Email verified successfully!');
      
      // Attempt to sign in again after verification to establish session
      try {
        await signup(formData.email, formData.password, formData.name); // Using useAuth's signup method to establish context. Wait, Better Auth requires signIn since they are already signed up. 
        // We will just use standard authClient then update window location.
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
    <div className="flex min-h-screen bg-white">
      {/* Left Panel: Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 animate-fade-in-up flex flex-col items-center sm:items-start text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {step === 'details' ? 'Create your account' : 'Verify your email'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'details' 
                ? 'Join Invoice Simple to manage your billing automatically.'
                : `We sent a code to ${formData.email}. Please enter it below.`}
            </p>
          </div>

          {step === 'details' ? (
            <form onSubmit={handleSignup} className="space-y-5 animate-fade-in-up animation-delay-100">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">Full name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700">Email address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <span className="shrink-0 leading-5">⚠️</span>
                  <p>{errors.submit}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 group" 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>

              <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                  Log in
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
                    className="pl-12 h-14 text-center text tracking-[0.5em] text-lg font-bold bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    disabled={loading}
                  />
                </div>
                {errors.otp && <p className="text-xs text-red-500 mt-2">{errors.otp}</p>}
              </div>

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
                        await authClient.emailOtp.sendVerificationOtp({ email: formData.email, type: 'email-verification' });
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
                  Wrong email?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setStep('details');
                      // Clear password since they need to re-verify creation intent
                      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/40 z-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12 z-20 object-cover">
           <div className="max-w-md text-white text-center">
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mx-auto mb-8 shadow-2xl">
               <ShieldCheck className="w-8 h-8 text-blue-300" />
             </div>
             <h2 className="text-3xl font-bold tracking-tight mb-4">Streamline Your Invoicing</h2>
             <p className="text-blue-100/80 text-lg leading-relaxed">
                Send professional invoices, track payments, and manage your clients seamlessly in one unified platform.
             </p>
           </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
    </div>
  );
}
