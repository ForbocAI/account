"use client";

import React, { useState } from "react";
import { Card } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Badge } from "@/components/vengeance/Badge";
import { Input } from "@/components/vengeance/Input";
import { Copy, Trash2, Key, X, AlertTriangle, Check } from "lucide-react";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    status: string;
    created: string;
}

function generateFullKey(): string {
    const hex = (len: number) => {
        let result = "";
        for (let i = 0; i < len; i++) result += Math.random().toString(16).slice(2, 6);
        return result.slice(0, len);
    };
    return `fb_live_${hex(32)}`;
}

function maskKey(fullKey: string): string {
    return fullKey.slice(0, 8) + "******************" + fullKey.slice(-4);
}

const SEED_KEYS: ApiKey[] = [
    { id: "1", name: "Production Key", key: "fb_live_******************a3f4", status: "active", created: "2024-01-15" },
    { id: "2", name: "Development Scan", key: "fb_test_******************b9c2", status: "active", created: "2024-02-01" },
    { id: "3", name: "CI Pipeline", key: "fb_test_******************e0d1", status: "revoked", created: "2023-11-20" },
];

export default function KeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(SEED_KEYS);
    const [showModal, setShowModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = () => {
        if (!newKeyName.trim()) return;

        const fullKey = generateFullKey();
        const today = new Date().toISOString().split("T")[0];
        const newKey: ApiKey = {
            id: crypto.randomUUID(),
            name: newKeyName.trim(),
            key: maskKey(fullKey),
            status: "active",
            created: today,
        };

        setApiKeys((prev) => [newKey, ...prev]);
        setRevealedKey(fullKey);
    };

    const handleClose = () => {
        setNewKeyName("");
        setRevealedKey(null);
        setCopied(false);
        setShowModal(false);
    };

    const handleCopyKey = async () => {
        if (!revealedKey) return;
        await navigator.clipboard.writeText(revealedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                    <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
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

            {/* Modal Overlay */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={!revealedKey ? handleClose : undefined}
                >
                    <div className="w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-900 z-10" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-900 z-10" />

                        <Card className="relative overflow-hidden pt-10 pb-8 px-8">
                            {!revealedKey && (
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            {!revealedKey ? (
                                <>
                                    <div className="text-center mb-8">
                                        <h3 className="text-lg font-mono text-white tracking-widest uppercase mb-2">
                                            Initialize New Credential
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
                                            Assign a designation to this neural-link key
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
                                                Key Designation
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="e.g. Production Gateway"
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="primary"
                                                size="md"
                                                className="flex-1"
                                                disabled={!newKeyName.trim()}
                                                onClick={handleCreate}
                                            >
                                                Create API Key
                                            </Button>
                                            <Button variant="outline" size="md" onClick={handleClose}>
                                                Abort
                                            </Button>
                                        </div>

                                        <div className="pt-4 border-t border-zinc-900 text-center">
                                            <span className="text-[8px] font-mono text-zinc-700 tracking-widest">
                                                CREDENTIAL_INIT // SECURE_CHANNEL
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-8">
                                        <h3 className="text-lg font-mono text-white tracking-widest uppercase mb-2">
                                            Credential Generated
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
                                            {newKeyName}
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 p-3 border border-red-900/50 bg-red-950/10">
                                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                            <p className="text-[10px] font-mono text-red-500 uppercase tracking-wide">
                                                This key will not be shown again. Copy it now or lose it forever.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
                                                Your API Key
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-xs text-white font-mono break-all select-all">
                                                    {revealedKey}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="px-2 py-2 h-10 shrink-0"
                                                    onClick={handleCopyKey}
                                                >
                                                    {copied
                                                        ? <Check className="w-4 h-4 text-green-500" />
                                                        : <Copy className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </div>
                                        </div>

                                        <Button variant="primary" size="full" onClick={handleClose}>
                                            I Have Saved My Key
                                        </Button>

                                        <div className="pt-4 border-t border-zinc-900 text-center">
                                            <span className="text-[8px] font-mono text-zinc-700 tracking-widest">
                                                KEY_REVEAL // ONE_TIME_DISPLAY
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
