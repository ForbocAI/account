import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Input } from "@/components/vengeance/Input";
import { UserPlus } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md relative">
        {/* Decorative corner accents */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-900 z-10" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-900 z-10" />

        <Card className="relative overflow-hidden pt-12 pb-8 px-8">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <UserPlus className="w-24 h-24 text-red-500" />
          </div>

          <CardHeader className="text-center mb-10 border-none">
            <CardTitle className="text-2xl text-white mb-2">Register Soul</CardTitle>
            <p className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
              Initialize a new identity on the Forboc Neural Grid
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Email Address</label>
              <Input type="email" placeholder="operative@forboc.ai" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Access Key</label>
              <Input type="password" placeholder="••••••••••••••••" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Confirm Access Key</label>
              <Input type="password" placeholder="••••••••••••••••" />
            </div>

            <Button variant="primary" size="full" className="mt-4">
              Initialize Account
            </Button>

            <div className="pt-6 border-t border-zinc-900 flex flex-col items-center gap-4">
              <a href="/" className="auth-link text-[9px] font-mono uppercase tracking-widest">
                Already registered? Authorize device
              </a>
              <div className="w-full flex justify-between items-center text-[8px] font-mono text-zinc-700">
                <span>FORBOC_PROTOCOL_V4.2</span>
                <span>EST_SYNC_2026</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
