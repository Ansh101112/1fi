'use client';

import { isAuthApiError, isAuthError } from '@neondatabase/auth/next';
import Link from 'next/link';
import { useState } from 'react';

import { signIn, signUp } from '@/lib/auth-client';

// Email/password and Google sign-in. Sign-in and sign-up share this because
// they only differ by which client method they call and what the copy says.

type Mode = 'sign-in' | 'sign-up';

const COPY = {
  'sign-in': {
    title: 'Welcome back',
    subtitle: 'Sign in to track your EMI applications.',
    submit: 'Sign in',
    switchPrompt: 'New to 1Fi?',
    switchLabel: 'Create an account',
    switchHref: '/sign-up',
  },
  'sign-up': {
    title: 'Create your account',
    subtitle: 'One account to apply for EMI against your mutual funds.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
    switchHref: '/sign-in',
  },
} as const;

/** Neon Auth's minimum. Checked here so the error is inline. */
const MIN_PASSWORD_LENGTH = 8;

/** Same-origin paths only, so ?next= cannot bounce anyone off-site. */
function safeRedirect(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

const GENERIC_ERROR = 'Could not reach the authentication service. Please try again.';

/**
 * Neon Auth throws a typed error instead of returning { error } the way plain
 * Better Auth does. Without this, "User already exists" showed up as a
 * network failure and told the user nothing.
 */
function describeAuthError(error: unknown): string {
  if (isAuthApiError(error) || isAuthError(error)) {
    return error.message || GENERIC_ERROR;
  }
  return GENERIC_ERROR;
}

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const copy = COPY[mode];
  const destination = safeRedirect(next);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<null | 'email' | 'google'>(null);
  const [error, setError] = useState<string | null>(null);

  function finish() {
    // Full navigation, not router.push. The header lives in the root layout,
    // which stays mounted across client navigation, so a push would land on
    // the destination still showing a signed-out header.
    window.location.assign(destination);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === 'sign-up' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setPending('email');
    try {
      const result =
        mode === 'sign-in'
          ? await signIn.email({ email, password })
          : await signUp.email({ email, password, name: name.trim() || email.split('@')[0] });

      if (result.error) {
        setError(result.error.message ?? GENERIC_ERROR);
        return;
      }

      finish();
    } catch (caught) {
      setError(describeAuthError(caught));
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setPending('google');
    try {
      // Redirects the browser away, so nothing after this runs when it works.
      await signIn.social({ provider: 'google', callbackURL: destination });
    } catch (caught) {
      setError(describeAuthError(caught));
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="w-full max-w-sm rounded-panel border border-line bg-surface p-7">
      <h1 className="text-xl font-semibold tracking-tight text-ink">{copy.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{copy.subtitle}</p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-card border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-line-strong disabled:opacity-60"
      >
        <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-faint">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {mode === 'sign-up' ? (
          <Field
            id="name"
            label="Full name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={setName}
            placeholder="Ansh Tiwari"
          />
        ) : null}

        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />

        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'sign-up' ? MIN_PASSWORD_LENGTH : undefined}
          value={password}
          onChange={setPassword}
          placeholder={mode === 'sign-up' ? `At least ${MIN_PASSWORD_LENGTH} characters` : '••••••••'}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-card border border-flag/25 bg-flag/5 px-3 py-2 text-sm text-flag"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-card bg-ink px-4 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90 disabled:opacity-60"
        >
          {pending === 'email' ? 'Please wait…' : copy.submit}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        {copy.switchPrompt}{' '}
        <Link
          href={next ? `${copy.switchHref}?next=${encodeURIComponent(destination)}` : copy.switchHref}
          className="font-medium text-brand-strong hover:underline"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  ...input
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
      </label>
      <input
        {...input}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition placeholder:text-ink-faint focus:border-brand focus:outline-none"
      />
    </div>
  );
}
