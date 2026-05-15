import React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = "", ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={`w-full bg-zinc-950 border border-zinc-800 px-4 py-2 text-sm text-white font-sans placeholder:text-zinc-600 focus:outline-none focus:border-red-900/50 transition-colors ${className}`}
            {...props}
        />
    );
});
Input.displayName = "Input";
