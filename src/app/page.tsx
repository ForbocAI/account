"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Input } from "@/components/vengeance/Input";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-900 z-10" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-900 z-10" />

        <Card className="relative overflow-hidden pt-12 pb-8 px-8">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-24 h-24 text-red-500" />
          </div>

          <CardHeader className="text-center mb-10 border-none">
            <CardTitle className="text-2xl text-white mb-2">Access Portal</CardTitle>
            <p className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
              Identify yourself to the Forboc Neural Network
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-3 border border-red-900/50 bg-red-950/10">
                  <p className="text-[11px] font-mono text-red-500 uppercase tracking-wide">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="admin@forboc.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    Access Key
                  </label>
                  <a href="#" className="text-[8px] font-mono text-zinc-600 hover:text-red-500 transition-colors uppercase">
                    Forgot?
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="full"
                className="mt-4"
                disabled={loading}
              >
                {loading ? "Authorizing..." : "Authorize Device"}
              </Button>

              <div className="pt-6 border-t border-zinc-900 flex flex-col items-center gap-4">
                <Link href="/signup" className="auth-link text-[12px] font-mono uppercase tracking-widest">
                  New operative? Request access
                </Link>
                <div className="w-full flex justify-between items-center text-[8px] font-mono text-zinc-700">
                  <span>FORBOC_PROTOCOL_V4.2</span>
                  <span>EST_SYNC_2026</span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
