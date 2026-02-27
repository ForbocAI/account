import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/billing/portal — creates a Stripe Customer Portal session
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

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user || !user.stripeCustomerId) {
            return NextResponse.json(
                { error: "No billing account found" },
                { status: 404 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://console.forboc.ai";

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${baseUrl}/billing`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (err) {
        console.error("Portal error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
