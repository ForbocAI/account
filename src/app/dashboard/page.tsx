import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/vengeance/Card";
import { Stat } from "@/components/vengeance/Stat";
import { Button } from "@/components/vengeance/Button";
import { Badge } from "@/components/vengeance/Badge";
import { Copy, Trash2, Key, Activity, CreditCard } from "lucide-react";

export default function DashboardPage() {
    const apiKeys = [
        { id: "1", name: "Production Key", key: "fb_live_******************a3f4", status: "active", created: "2024-01-15" },
        { id: "2", name: "Development Scan", key: "fb_test_******************b9c2", status: "active", created: "2024-02-01" },
        { id: "3", name: "CI Pipeline", key: "fb_test_******************e0d1", status: "revoked", created: "2023-11-20" },
    ];

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col gap-2 border-l-4 border-red-900 pl-6 py-2">
                <h1 className="text-4xl font-mono tracking-tighter text-white">System Overview</h1>
                <p className="text-zinc-500 text-sm max-w-2xl font-sans uppercase tracking-[0.1em]">
                    Monitoring real-time neural throughput and security credentials.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Stat
                    label="API Requests (24h)"
                    value="1,248,392"
                    trend="up"
                    description="+12.4% from previous cycle"
                />
                <Stat
                    label="Neural Error Rate"
                    value="0.003%"
                    trend="down"
                    description="Within optimal parameters"
                />
                <Stat
                    label="Current Billing"
                    value="$412.80"
                    description="Next cycle: Feb 15"
                />
            </div>

            {/* Main Graph Placeholder */}
            <Card className="h-64 flex flex-col items-center justify-center space-y-4 border-dashed">
                <div className="flex items-center gap-2 text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                    <Activity className="w-4 h-4" />
                    Neural Request Throughput (24h)
                </div>
                {/* Jagged Line Aesthetic SVG */}
                <svg className="w-full h-32 px-12" viewBox="0 0 1000 100" preserveAspectRatio="none">
                    <path
                        d="M0,50 L50,40 L100,60 L150,30 L200,70 L250,20 L300,50 L350,45 L400,55 L450,25 L500,80 L550,40 L600,60 L650,30 L700,70 L750,20 L800,50 L850,45 L900,55 L950,25 L1000,50"
                        fill="none"
                        stroke="#7f1d1d"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                    />
                    <path
                        d="M0,55 L50,45 L100,65 L150,35 L200,75 L250,25 L300,55 L350,50 L400,60 L450,30 L500,85 L550,45 L600,65 L650,35 L700,75 L750,25 L800,55 L850,50 L900,60 L950,30 L1000,55"
                        fill="none"
                        stroke="#18181b"
                        strokeWidth="1"
                    />
                </svg>
                <div className="text-[8px] text-zinc-800 font-mono">00:00 —————————————————————————————————————————————————————————————————————— 23:59</div>
            </Card>

            {/* API Keys Management Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-mono text-white">Credential Management</h2>
                    </div>
                    <Button variant="outline" size="sm">
                        Generate New Key
                    </Button>
                </div>

                <div className="grid gap-4">
                    {apiKeys.map((key) => (
                        <Card key={key.id} className="group hover:border-zinc-700 transition-colors py-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm text-white">{key.name}</span>
                                        <Badge variant={key.status === 'active' ? 'success' : 'danger'}>
                                            {key.status}
                                        </Badge>
                                    </div>
                                    <code className="text-[10px] text-zinc-500 font-mono tracking-tight">
                                        {key.key}
                                    </code>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="px-2 py-1 h-8">
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                    <Button variant="destructive" size="sm" className="px-2 py-1 h-8">
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
