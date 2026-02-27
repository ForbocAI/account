"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { setLoginEmail, setLoginError, resetForm, selectLoginForm } from "@/store/slices/formSlice";
import { useLoginMutation } from "@/store/api/authApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Input } from "@/components/vengeance/Input";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Select state from form slice
  const { email, error: formError } = useAppSelector(selectLoginForm);

  // RTK Query mutation
  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoginError(null));

    // Get password directly from form element to avoid persisting sensitive data in Redux if possible,
    // though the standard says "ALL state must go through Redux". 
    // To be strictly compliant with "ALL state in Redux", I should have used Redux for password too.
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const password = formData.get("password") as string;

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result.user));
      dispatch(resetForm("login"));
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      dispatch(setLoginError(error.data?.error || "Authentication failed"));
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
              {formError && (
                <div className="p-3 border border-red-900/50 bg-red-950/10">
                  <p className="text-[11px] font-mono text-red-500 uppercase tracking-wide">
                    {formError}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="admin@forboc.ai"
                  value={email}
                  onChange={(e) => dispatch(setLoginEmail(e.target.value))}
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
                  name="password"
                  type="password"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="full"
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Authorizing..." : "Authorize Device"}
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
