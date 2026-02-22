"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/", "/signup"];

export const Header = () => {
    const pathname = usePathname();
    const isAuth = AUTH_ROUTES.includes(pathname);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Image src="/logo.png" alt="Forboc AI" width={32} height={32} className="logo-theme object-contain" />
                    <span className="font-mono text-sm tracking-[0.3em] uppercase">Forboc Console</span>
                </div>
                {!isAuth && (
                    <nav className="flex items-center gap-8">
                        <a href="/dashboard" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Dashboard</a>
                        <a href="/keys" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">API Keys</a>
                        <a href="/billing" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Billing</a>
                    </nav>
                )}
            </div>
        </header>
    );
};
