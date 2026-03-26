import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authClient } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Send OTP for password reset
      // @ts-ignore
      const { error: resetError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'forget-password',
      });

      if (resetError) {
        throw new Error(resetError.message || 'Failed to send reset email');
      }

      toast.success('Verification code sent to your email.');
      // Redirect to reset password page with email as parameter
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      
    } catch (err: any) {
      const message = err.message || 'Failed to send reset email';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans selection:bg-blue-500/30 px-6 py-12">
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Reset your password
          </h1>
          <p className="text-base text-slate-500">
            Enter your email and we'll send you a verification code to reset your password.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
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
              {loading ? 'Sending code...' : 'Send Reset Code'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
