"use client";

import React from "react";
import { Card } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Badge } from "@/components/vengeance/Badge";
import { Stat } from "@/components/vengeance/Stat";
import { CreditCard, Zap, Shield, ArrowUpRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectBillingForm, setBillingUpgrading, setBillingPortalLoading, setBillingError } from "@/store/slices/formSlice";
import {
    useGetBillingQuery,
    useCreateCheckoutMutation,
    useOpenPortalMutation
} from "@/store/api/billingApi";
import billingContract from "../../../data/contracts/billing.json";

const PLAN_TIERS = billingContract.plans;

export default function BillingPage() {
    const dispatch = useAppDispatch();

    const { upgrading, portalLoading, error: formError } = useAppSelector(selectBillingForm);

    const { data: billing, isLoading: loading, error: queryError } = useGetBillingQuery(undefined);
    const [createCheckout] = useCreateCheckoutMutation();
    const [openPortal] = useOpenPortalMutation();

    const error = formError || (queryError as { data?: { error?: string } } | undefined)?.data?.error;

    const handleUpgrade = async (planKey: string) => {
        dispatch(setBillingUpgrading(planKey));
        dispatch(setBillingError(null));

        return createCheckout({ planKey }).unwrap()
            .then((result) => result.url
                ? window.location.assign(result.url)
                : (() => {
                    dispatch(setBillingError(billingContract.messages.checkoutFailed));
                    dispatch(setBillingUpgrading(null));
                })())
            .catch((err: unknown) => {
                const e = err as { data?: { error?: string } };
                dispatch(setBillingError(e.data?.error || billingContract.messages.checkoutFailed));
                dispatch(setBillingUpgrading(null));
            });
    };

    const handleManageBilling = async () => {
        dispatch(setBillingPortalLoading(true));
        dispatch(setBillingError(null));

        return openPortal(undefined).unwrap()
            .then((result) => result.url
                ? window.location.assign(result.url)
                : (() => {
                    dispatch(setBillingError(billingContract.messages.portalFailed));
                    dispatch(setBillingPortalLoading(false));
                })())
            .catch((err: unknown) => {
                const e = err as { data?: { error?: string } };
                dispatch(setBillingError(e.data?.error || billingContract.messages.portalFailed));
                dispatch(setBillingPortalLoading(false));
            });
    };

    return loading
        ? (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
        )
        : !billing
        ? (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-[11px] font-mono text-red-500 uppercase tracking-wide">
                    {error || billingContract.messages.billingLoadFailed}
                </p>
            </div>
        )
        : (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col gap-2 border-l-4 border-red-900 pl-6 py-2">
                <h1 className="text-4xl font-mono tracking-tighter text-white">Billing & Usage</h1>
                <p className="text-zinc-500 text-sm max-w-2xl font-sans uppercase tracking-widest">
                    Manage your subscription tier and monitor neural-link resource allocation.
                </p>
            </div>

            {error && (
                <div className="p-3 border border-red-900/50 bg-red-950/10">
                    <p className="text-[11px] font-mono text-red-500 uppercase tracking-wide">{error}</p>
                </div>
            )}

            {/* Current Plan Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Stat
                    label="Current Plan"
                    value={billing.planName}
                    description={`Tier: ${billing.plan.toUpperCase()}`}
                />
                <Stat
                    label="Daily Request Quota"
                    value={billing.requestsPerDay === -1 ? "∞" : billing.requestsPerDay.toLocaleString()}
                    description="Neural throughput limit"
                />
                <Stat
                    label="Billing Cycle"
                    value={
                        billing.subscription
                            ? new Date(billing.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })
                            : "—"
                    }
                    description={
                        billing.subscription?.cancelAtPeriodEnd
                            ? "Cancels at period end"
                            : billing.subscription
                                ? "Auto-renews"
                                : "No active subscription"
                    }
                />
            </div>

            {/* Manage Billing Button (for existing subscribers) */}
            {billing.subscription && (
                <div className="flex items-center justify-between border border-zinc-800 p-6 bg-zinc-950">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-red-500" />
                            <span className="font-mono text-sm text-white uppercase tracking-widest">
                                Payment & Invoices
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-8">
                            Update payment method, download invoices, or cancel subscription
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManageBilling}
                        disabled={portalLoading}
                    >
                        {portalLoading ? "Opening..." : "Manage Billing"}
                    </Button>
                </div>
            )}

            {/* Plan Tiers */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                    <Zap className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-mono text-white uppercase tracking-widest">Available Tiers</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLAN_TIERS.map((tier) => {
                        const isCurrent = tier.key === billing.plan;
                        return (
                            <Card
                                key={tier.key}
                                active={tier.highlighted}
                                className={`flex flex-col justify-between ${isCurrent ? "border-red-900/50 shadow-[0_0_20px_rgba(127,29,29,0.15)]" : ""
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-mono text-lg text-white tracking-widest uppercase">
                                                {tier.name}
                                            </h3>
                                            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mt-1">
                                                {tier.requestsLabel} requests
                                            </p>
                                        </div>
                                        {isCurrent && <Badge variant="success">Active</Badge>}
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-3xl font-mono text-white tracking-tighter">{tier.price}</span>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {tier.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 uppercase tracking-wide"
                                            >
                                                <Shield className="w-3 h-3 text-red-900 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {isCurrent ? (
                                    <div className="pt-4 border-t border-zinc-900 text-center">
                                        <span className="text-[8px] font-mono text-zinc-700 tracking-widest">
                                            CURRENT_TIER // ACTIVE
                                        </span>
                                    </div>
                                ) : tier.key === "free" ? (
                                    <div className="pt-4 border-t border-zinc-900 text-center">
                                        <span className="text-[8px] font-mono text-zinc-700 tracking-widest">
                                            DEFAULT_TIER
                                        </span>
                                    </div>
                                ) : (
                                    <Button
                                        variant="primary"
                                        size="full"
                                        onClick={() => handleUpgrade(tier.key)}
                                        disabled={upgrading === tier.key}
                                    >
                                        {upgrading === tier.key ? (
                                            "Redirecting..."
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Upgrade <ArrowUpRight className="w-3 h-3" />
                                            </span>
                                        )}
                                    </Button>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Footer Protocol Stamp */}
            <div className="flex justify-between items-center text-[8px] font-mono text-zinc-800 pt-6 border-t border-zinc-900">
                <span>BILLING_PROTOCOL_V1.0</span>
                <span>STRIPE_SECURE_CHANNEL</span>
            </div>
        </div>
    );
}
