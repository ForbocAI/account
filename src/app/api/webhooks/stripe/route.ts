import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) =>
    (session.metadata?.userId && session.metadata?.planKey && session.subscription)
        ? getStripe().subscriptions.retrieve(session.subscription as string).then(async sub =>
            prisma.user.update({
                where: { id: session.metadata!.userId },
                data: { plan: session.metadata!.planKey, stripeCustomerId: session.customer as string },
            }).then(() => prisma.subscription.upsert({
                where: { userId: session.metadata!.userId },
                create: {
                    userId: session.metadata!.userId,
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
            }))
        )
        : Promise.resolve();

const handleSubscriptionUpdated = async (sub: Stripe.Subscription) =>
    prisma.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } }).then(async existingSub =>
        existingSub
            ? prisma.subscription.update({
                where: { stripeSubscriptionId: sub.id },
                data: {
                    status: sub.status,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    currentPeriodStart: new Date((sub as any).current_period_start * 1000),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                    cancelAtPeriodEnd: sub.cancel_at_period_end,
                },
            })
            : Promise.resolve()
    );

const handleSubscriptionDeleted = async (sub: Stripe.Subscription) =>
    prisma.subscription.findUnique({ where: { stripeSubscriptionId: sub.id }, include: { user: true } }).then(async existingSub =>
        existingSub
            ? prisma.subscription.delete({ where: { stripeSubscriptionId: sub.id } })
                .then(() => prisma.user.update({ where: { id: existingSub.userId }, data: { plan: "free" } }))
            : Promise.resolve()
    );

export async function POST(request: NextRequest) {
    return request.text().then(async body =>
        Promise.resolve(request.headers.get("stripe-signature")).then(async sig =>
            (!sig || !process.env.STRIPE_WEBHOOK_SECRET)
                ? NextResponse.json({ error: "Missing signature" }, { status: 400 })
                : Promise.resolve().then(() => {
                    try {
                        return getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
                    } catch (err) {
                        return null;
                    }
                }).then(async event =>
                    !event
                        ? NextResponse.json({ error: "Invalid signature" }, { status: 400 })
                        : (
                            event.type === "checkout.session.completed"
                                ? handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
                                : event.type === "customer.subscription.updated"
                                    ? handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
                                    : event.type === "customer.subscription.deleted"
                                        ? handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
                                        : Promise.resolve()
                        ).then(() => NextResponse.json({ received: true }))
                )
        )
    ).catch(err => {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    });
}
