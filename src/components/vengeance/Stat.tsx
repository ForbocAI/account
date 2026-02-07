import React from "react";
import { Card } from "./Card";

interface StatProps {
    label: string;
    value: string;
    description?: string;
    trend?: "up" | "down" | "neutral";
}

export const Stat = ({ label, value, description, trend }: StatProps) => {
    return (
        <Card className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono text-white tracking-widest leading-none">{value}</span>
                {trend && (
                    <span className={`text-[10px] ${trend === 'up' ? 'text-red-500' : 'text-zinc-500'}`}>
                        {trend === 'up' ? '▲' : '▼'}
                    </span>
                )}
            </div>
            {description && <p className="text-[10px] text-zinc-600 mt-1">{description}</p>}
        </Card>
    );
};
