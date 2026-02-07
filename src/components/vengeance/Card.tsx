import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    active?: boolean;
}

export const Card = ({ children, className = "", active = false }: CardProps) => {
    return (
        <div
            className={`bg-zinc-950 border ${active ? "border-red-900/50 shadow-[0_0_15px_rgba(127,29,29,0.2)]" : "border-zinc-800"
                } p-6 transition-all duration-300 ${className}`}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`mb-4 border-b border-zinc-800 pb-2 ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <h3 className={`text-sm font-mono tracking-widest text-zinc-400 uppercase ${className}`}>
        {children}
    </h3>
);

export const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
);
