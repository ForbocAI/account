import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * POST /api/webhooks/stripe — handles Stripe webhook events
 * All billing logic lives in account, not the api repo.
 */
export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const planKey = session.metadata?.planKey;

                if (userId && planKey && session.subscription) {
                    const sub = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    );

                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            plan: planKey,
                            stripeCustomerId: session.customer as string,
                        },
                    });

                    await prisma.subscription.upsert({
                        where: { userId },
                        create: {
                            userId,
                            stripeSubscriptionId: sub.id,
                            stripePriceId: sub.items.data[0].price.id,
                            status: sub.status,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                        },
                        update: {
                            stripeSubscriptionId: sub.id,
                            stripePriceId: sub.items.data[0].price.id,
                            status: sub.status,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                        },
                    });
                }
                break;
            }

            case "customer.subscription.updated": {
                const sub = event.data.object as Stripe.Subscription;
                const existingSub = await prisma.subscription.findUnique({
                    where: { stripeSubscriptionId: sub.id },
                });

                if (existingSub) {
                    await prisma.subscription.update({
                        where: { stripeSubscriptionId: sub.id },
                        data: {
                            status: sub.status,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                            cancelAtPeriodEnd: sub.cancel_at_period_end,
                        },
                    });
                }
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                const existingSub = await prisma.subscription.findUnique({
                    where: { stripeSubscriptionId: sub.id },
                    include: { user: true },
                });

                if (existingSub) {
                    await prisma.subscription.delete({
                        where: { stripeSubscriptionId: sub.id },
                    });
                    await prisma.user.update({
                        where: { id: existingSub.userId },
                        data: { plan: "free" },
                    });
                }
                break;
            }

            default:
                break;
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Webhook processing error:", err);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
