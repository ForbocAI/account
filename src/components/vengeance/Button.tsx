import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "destructive";
    size?: "sm" | "md" | "lg" | "full";
}

export const Button = ({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}: ButtonProps) => {
    const baseStyles = "inline-flex items-center justify-center font-mono text-xs uppercase tracking-widest transition-all duration-200 active:scale-[0.98]";

    const variants = {
        primary: "bg-white text-black hover:bg-zinc-200 border border-white",
        outline: "bg-transparent text-white border border-zinc-800 hover:border-red-900/50 hover:bg-red-900/5",
        destructive: "bg-red-950 text-red-500 border border-red-900/50 hover:bg-red-900 hover:text-white",
    };

    const sizes = {
        sm: "px-3 py-1.5",
        md: "px-6 py-3",
        lg: "px-8 py-4 text-sm",
        full: "w-full py-4 text-sm",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
