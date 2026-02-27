import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLANS } from "@/lib/stripe";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/**
 * GET /api/billing — returns the current user's billing state
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = await verifyToken(token);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { subscription: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const plan = (user.plan as keyof typeof PLANS) || "free";
        const planInfo = PLANS[plan] ?? PLANS.free;

        return NextResponse.json({
            plan,
            planName: planInfo.name,
            requestsPerDay: planInfo.requestsPerDay,
            subscription: user.subscription
                ? {
                    status: user.subscription.status,
                    currentPeriodEnd: user.subscription.currentPeriodEnd,
                    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                }
                : null,
        });
    } catch (err) {
        console.error("Billing GET error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/billing — creates a Stripe Checkout session for upgrading
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = await verifyToken(token);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { planKey } = body as { planKey: string };

        const plan = PLANS[planKey as keyof typeof PLANS];
        if (!plan || !plan.priceId) {
            return NextResponse.json(
                { error: "Invalid plan selected" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://console.forboc.ai";

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{ price: plan.priceId, quantity: 1 }],
            success_url: `${baseUrl}/billing?success=true`,
            cancel_url: `${baseUrl}/billing?canceled=true`,
            metadata: { userId: user.id, planKey },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (err) {
        console.error("Billing POST error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
