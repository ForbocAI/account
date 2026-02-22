import React from "react";
import { Card } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Badge } from "@/components/vengeance/Badge";
import { Copy, Trash2, Key } from "lucide-react";

export default function KeysPage() {
    const apiKeys = [
        { id: "1", name: "Production Key", key: "fb_live_******************a3f4", status: "active", created: "2024-01-15" },
        { id: "2", name: "Development Scan", key: "fb_test_******************b9c2", status: "active", created: "2024-02-01" },
        { id: "3", name: "CI Pipeline", key: "fb_test_******************e0d1", status: "revoked", created: "2023-11-20" },
    ];

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col gap-2 border-l-4 border-red-900 pl-6 py-2">
                <h1 className="text-4xl font-mono tracking-tighter text-white">Credential Management</h1>
                <p className="text-zinc-500 text-sm max-w-2xl font-sans uppercase tracking-[0.1em]">
                    Neural-link credentials for the Forboc Grid. Generate, inspect, and revoke access keys.
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-mono text-white">Active Credentials</h2>
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
