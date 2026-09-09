"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuth } from "@/lib/admin-auth";
import { adminRoleLabels, type AdminRole } from "@/lib/admin-types";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("super");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password, role);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log you in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-view">
      <div className="admin-login-card">
        <p className="eyebrow">AsaPhis admin</p>
        <h1>Control center login.</h1>
        <p className="admin-login-lede">
          Internal access only. Every action is logged against your admin role.
        </p>
        <form onSubmit={submit} className="admin-login-form">
          <div className="form-field">
            <Label htmlFor="admin-email">Work email</Label>
            <Input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@asaphis.org" />
          </div>
          <div className="form-field">
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="form-field">
            <Label htmlFor="admin-role">Sign in as</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger id="admin-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(adminRoleLabels) as AdminRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{adminRoleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <Alert variant="destructive"><AlertTitle>Login failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : null}
          <Button type="submit" className="admin-primary" disabled={busy || isLoading} style={{ width: "100%", marginTop: 12 }}>
            {busy ? "Verifying…" : "Open control center"}
          </Button>
          <p className="admin-secret-note">
            <ShieldCheck size={15} aria-hidden="true" />
            <span><LockKeyhole size={12} aria-hidden="true" /> Development sign-in: any work email + 8-character password. Production uses the secure backend session.</span>
          </p>
        </form>
      </div>
    </div>
  );
}
