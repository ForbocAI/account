import React from "react";

export const Badge = ({ children, className = "", variant = "neutral" }: { children: React.ReactNode; className?: string; variant?: "neutral" | "danger" | "success" }) => {
    const variants = {
        neutral: "border-zinc-800 text-zinc-400 bg-zinc-900/50",
        danger: "border-red-900/50 text-red-500 bg-red-950/20",
        success: "border-white/20 text-white bg-zinc-800",
    };

    return (
        <span className={`inline-flex px-2 py-0.5 text-[10px] font-mono uppercase border tracking-tight ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
