import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import billingContract from "../../../../data/contracts/billing.json";
import {
    defaultBillingPlan,
    findBillingPlan,
    readPlanPriceId,
} from "@/components/billing/billingCatalog";
import { getStripe } from "@/components/billing/stripeClient";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

type BillingRequest = { readonly planKey?: unknown };

const requestedPlan = (body: unknown) => findBillingPlan((Object(body) as BillingRequest).planKey);

const applicationUrl = () => process.env[billingContract.environment.applicationUrl]
    ?? billingContract.environment.defaultApplicationUrl;

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
                                ? NextResponse.json({ error: billingContract.messages.userNotFound }, { status: 404 })
                                : (() => {
                                    const plan = findBillingPlan(user.plan) ?? defaultBillingPlan();
                                    return NextResponse.json({
                                        plan: plan.key,
                                        planName: plan.name,
                                        requestsPerDay: plan.requestsPerDay,
                                        subscription: user.subscription ? {
                                            status: user.subscription.status,
                                            currentPeriodEnd: user.subscription.currentPeriodEnd,
                                            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                                        } : null,
                                    });
                                })()
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
                        : request.json().then(async (body: unknown) => {
                            const plan = requestedPlan(body);
                            const priceId = plan ? readPlanPriceId(plan) : null;
                            return (!plan || !priceId)
                                ? NextResponse.json({ error: billingContract.messages.invalidPlan }, { status: 400 })
                                : prisma.user.findUnique({ where: { id: session.userId } }).then(async user =>
                                    !user
                                        ? NextResponse.json({ error: billingContract.messages.userNotFound }, { status: 404 })
                                        : (user.stripeCustomerId
                                            ? Promise.resolve(user.stripeCustomerId)
                                            : getStripe().customers.create({ email: user.email, metadata: { userId: user.id } }).then(customer =>
                                                prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } }).then(() => customer.id)
                                              )
                                          ).then(customerId =>
                                              getStripe().checkout.sessions.create({
                                                  customer: customerId,
                                                  mode: billingContract.checkout.mode as "subscription",
                                                  line_items: [{ price: priceId, quantity: billingContract.checkout.quantity }],
                                                  success_url: `${applicationUrl()}${billingContract.checkout.successPath}`,
                                                  cancel_url: `${applicationUrl()}${billingContract.checkout.cancelPath}`,
                                                  metadata: { userId: user.id, planKey: plan.key },
                                                  subscription_data: {
                                                      metadata: { userId: user.id, planKey: plan.key },
                                                  },
                                              }).then(checkoutSession => NextResponse.json({ url: checkoutSession.url }))
                                          )
                                )
                        })
                )
        )
        .catch(err => {
            console.error("Billing POST error:", err);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        });
}
