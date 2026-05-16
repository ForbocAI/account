import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLANS } from "@/lib/stripe";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
    return Promise.resolve(request.cookies.get(COOKIE_NAME)?.value)
        .then(async token => 
            !token
                ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                : verifyToken(token).then(async session =>
                    !session
                        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                        : prisma.user.findUnique({
                            where: { id: session.userId },
                            include: { subscription: true },
                        }).then(user =>
                            !user
                                ? NextResponse.json({ error: "User not found" }, { status: 404 })
                                : NextResponse.json({
                                    plan: (user.plan as keyof typeof PLANS) || "free",
                                    planName: (PLANS[(user.plan as keyof typeof PLANS) || "free"] ?? PLANS.free).name,
                                    requestsPerDay: (PLANS[(user.plan as keyof typeof PLANS) || "free"] ?? PLANS.free).requestsPerDay,
                                    subscription: user.subscription ? {
                                        status: user.subscription.status,
                                        currentPeriodEnd: user.subscription.currentPeriodEnd,
                                        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                                    } : null,
                                })
                        )
                )
        )
        .catch(err => {
            console.error("Billing GET error:", err);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        });
}

export async function POST(request: NextRequest) {
    return Promise.resolve(request.cookies.get(COOKIE_NAME)?.value)
        .then(async token => 
            !token
                ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                : verifyToken(token).then(async session =>
                    !session
                        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                        : request.json().then(async (body: any) =>
                            (!PLANS[body.planKey as keyof typeof PLANS] || !PLANS[body.planKey as keyof typeof PLANS].priceId)
                                ? NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
                                : prisma.user.findUnique({ where: { id: session.userId } }).then(async user =>
                                    !user
                                        ? NextResponse.json({ error: "User not found" }, { status: 404 })
                                        : (user.stripeCustomerId
                                            ? Promise.resolve(user.stripeCustomerId)
                                            : stripe.customers.create({ email: user.email, metadata: { userId: user.id } }).then(customer =>
                                                prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } }).then(() => customer.id)
                                              )
                                          ).then(customerId =>
                                              stripe.checkout.sessions.create({
                                                  customer: customerId,
                                                  mode: "subscription",
                                                  line_items: [{ price: PLANS[body.planKey as keyof typeof PLANS].priceId as string, quantity: 1 }],
                                                  success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://console.forboc.ai"}/billing?success=true`,
                                                  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://console.forboc.ai"}/billing?canceled=true`,
                                                  metadata: { userId: user.id, planKey: body.planKey },
                                              }).then(checkoutSession => NextResponse.json({ url: checkoutSession.url }))
                                          )
                                )
                        )
                )
        )
        .catch(err => {
            console.error("Billing POST error:", err);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        });
}