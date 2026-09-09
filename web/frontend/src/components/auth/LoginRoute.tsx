"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicShell } from "@/components/public/PublicShell";
import { useAuth } from "@/lib/auth/auth-context";

export function LoginRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/member";
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(next);
    }
  }, [isAuthenticated, isLoading, next, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not log you in. Check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <div className="auth-view">
        <div className="site-shell auth-shell">
          <div className="auth-card">
            <Link className="back-link" href="/">
              <ArrowLeft size={15} aria-hidden="true" /> Back to home
            </Link>
            <p className="eyebrow">Member login</p>
            <h1>Welcome back.</h1>
            <p className="auth-lede">
              Log in to open your member platform — education, community,
              contributions, and account support.
            </p>
            <form onSubmit={submit} className="auth-form">
              <div className="form-field">
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-field">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              {error ? (
                <Alert variant="destructive" className="feedback-alert">
                  <AlertTitle>Login failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button
                type="submit"
                className="ap-control ap-control-primary full-button"
                disabled={submitting || isLoading}
              >
                {submitting ? "Logging in…" : "Log in to dashboard"}
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
              <p className="quiet-note auth-hint">
                <LockKeyhole size={14} aria-hidden="true" />
                Mock sign-in for now: use any valid email and an 8+ character
                password.
              </p>
            </form>
            <div className="auth-footer">
              <span>New to AsaPhis?</span>
              <Link className="text-action chocolate-link" href="/join">
                Join the Journey <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
