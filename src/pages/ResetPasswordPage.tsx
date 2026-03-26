import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authClient } from '@/lib/auth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(emailParam || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailParam && !email) {
      toast.error('Missing email parameter. Please start from the forgot password page again.');
      navigate('/forgot-password');
    }
  }, [emailParam, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email,
        otp: otpCode,
        password: newPassword,
      });

      if (resetError) {
        throw new Error(resetError.message || 'Failed to reset password');
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Auto redirect after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      let message = err.message || 'Failed to reset password';
      if (message.toLowerCase().includes('otp') || message.toLowerCase().includes('token')) {
        message = 'Invalid or expired verification code';
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans selection:bg-blue-500/30 px-6 py-12">
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Create new password
          </h1>
          <p className="text-base text-slate-500">
            Enter the verification code sent to <span className="font-semibold text-slate-800">{email}</span> and your new password below.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {success ? (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Password reset</h3>
                <p className="text-slate-600">
                  Your password has been successfully reset. Redirecting to login...
                </p>
              </div>
              <Button 
                type="button" 
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2 text-left">
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">New Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
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
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-slate-900/20 transition-all duration-300" 
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
              
              <div className="mt-6 text-center text-sm">
                 <button 
                  type="button"
                  onClick={async () => {
                    try {
                      // @ts-ignore
                      await authClient.emailOtp.sendVerificationOtp({ email, type: 'forget-password' });
                      toast.success('A new code has been sent!');
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to resend code');
                    }
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
