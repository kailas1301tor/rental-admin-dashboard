import { useState, useRef, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/theme/theme-toggle';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import {
  apiFailureFieldErrors,
  clearFieldError,
  emptyFieldErrors,
  requireFields,
  scrollToFirstError,
  type FieldErrors,
} from '@/lib/form-errors';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { fieldErrors: next, message } = requireFields(
      { email, password },
      [
        { field: 'email', label: 'Email' },
        { field: 'password', label: 'Password' },
      ],
    );
    if (message) {
      setFieldErrors(next);
      toast(message, 'error');
      scrollToFirstError(next);
      return;
    }
    if (!captchaToken) {
      setFieldErrors(emptyFieldErrors());
      toast('Complete the CAPTCHA to continue.', 'error');
      return;
    }
    setFieldErrors(emptyFieldErrors());
    setLoading(true);
    try {
      await login(email, password, captchaToken);
      navigate('/otp');
    } catch (err) {
      const failure = apiFailureFieldErrors(err);
      setFieldErrors(failure.fieldErrors);
      toast(failure.message, 'error');
      scrollToFirstError(failure.fieldErrors);
      setCaptchaToken(null);
      turnstileRef.current?.reset();
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
            Sign in with email and password, complete CAPTCHA, then verify OTP.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((m) => clearFieldError(m, 'email'));
              }}
              error={fieldErrors.email}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((m) => clearFieldError(m, 'password'));
              }}
              error={fieldErrors.password}
              required
            />
            <div className="flex min-h-11 justify-center rounded-lg border border-border bg-canvas px-3 py-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={import.meta.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                }}
                onExpire={() => {
                  setCaptchaToken(null);
                  toast('CAPTCHA expired. Please solve it again.', 'error');
                }}
                onError={() => {
                  toast(
                    'CAPTCHA failed to load or encountered an error. Please try again.',
                    'error',
                  );
                  setCaptchaToken(null);
                }}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={!email || !password || !captchaToken}
            >
              Continue
            </Button>
          </form>
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
