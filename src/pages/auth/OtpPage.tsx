import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/theme/theme-toggle';
import { getErrorMessage } from '@/api/axios-client';

export function OtpPage() {
  const { isAuthenticated, pendingEmail, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!pendingEmail) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(otp);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-text-primary">Enter OTP</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Dynamic SMS/Email OTP sent to{' '}
            <span className="font-medium text-text-primary">{pendingEmail}</span>
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              label="One-time password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              hint="Use any 4+ digit code in mock mode"
              required
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" isLoading={loading}>
              Verify & enter dashboard
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link className="text-accent hover:underline" to="/login">
              Back to login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
