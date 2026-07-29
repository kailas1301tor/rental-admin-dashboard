import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/theme/theme-toggle';
import { getErrorMessage } from '@/api/axios-client';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('super@platform.admin');
  const [password, setPassword] = useState('password');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!captchaChecked) {
      setError('Complete the CAPTCHA checkbox to continue.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/otp');
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
          <p className="font-display text-xl text-accent">Rental</p>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Username/password, CAPTCHA, then OTP — Super Admin, General Admin,
            or Department Admin.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={captchaChecked}
                onChange={(e) => setCaptchaChecked(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span>I am not a robot (CAPTCHA placeholder)</span>
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" isLoading={loading}>
              Continue
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-text-muted">
            Mock auth · any OTP with 4+ digits works after login
          </p>
          <div className="mt-3 rounded-lg border border-border bg-canvas px-3 py-2.5 text-left text-[11px] text-text-muted">
            <p className="font-medium text-text-secondary">Demo accounts</p>
            <ul className="mt-1.5 space-y-1">
              <li>
                <span className="text-text-primary">super@platform.admin</span>{' '}
                — Super Admin (full access)
              </li>
              <li>
                <span className="text-text-primary">ananya.k@platform.admin</span>{' '}
                — General Admin (manage ops modules)
              </li>
              <li>
                <span className="text-text-primary">rahul.d@platform.admin</span>{' '}
                — General Admin (view-only subset)
              </li>
              <li>
                <span className="text-text-primary">meera.j@platform.admin</span>{' '}
                — Department Admin (HOD)
              </li>
            </ul>
          </div>
          <p className="mt-2 text-center text-xs">
            <Link className="text-accent hover:underline" to="/otp">
              Already have an OTP challenge?
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
