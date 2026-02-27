"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

const AUTH_ROUTES = ["/", "/signup"];

export const Header = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const pathname = usePathname();
    const router = useRouter();
    const isAuth = AUTH_ROUTES.includes(pathname);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        dispatch(logout());
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Image src="/logo.png" alt="Forboc AI" width={32} height={32} className="logo-theme object-contain" />
                    <div className="flex flex-col">
                        <span className="font-mono text-sm tracking-[0.3em] uppercase">Forboc Console</span>
                        {user && <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest leading-none">{user.email}</span>}
                    </div>
                </div>
                {!isAuth && (
                    <nav className="flex items-center gap-8">
                        <a href="/dashboard" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Dashboard</a>
                        <a href="/keys" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">API Keys</a>
                        <a href="/billing" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Billing</a>
                        <button
                            onClick={handleLogout}
                            className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-red-500 transition-colors flex items-center gap-1.5"
                        >
                            <LogOut className="w-3 h-3" />
                            Logout
                        </button>
                    </nav>
                )}
            </div>
        </header>
    );
};
