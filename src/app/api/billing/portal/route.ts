import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import billingContract from "../../../../../data/contracts/billing.json";
import { getStripe } from "@/components/billing/stripeClient";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const applicationUrl = () => process.env[billingContract.environment.applicationUrl]
  ?? billingContract.environment.defaultApplicationUrl;

export async function POST(request: NextRequest) {
  return Promise.resolve(request.cookies.get(COOKIE_NAME)?.value)
    .then(async token => 
      !token
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : verifyToken(token).then(async session =>
            !session
              ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
              : prisma.user.findUnique({ where: { id: session.userId } }).then(async user =>
                  (!user || !user.stripeCustomerId)
                    ? NextResponse.json({ error: billingContract.messages.billingAccountNotFound }, { status: 404 })
                    : getStripe().billingPortal.sessions.create({
                        customer: user.stripeCustomerId,
                        return_url: `${applicationUrl()}${billingContract.checkout.portalReturnPath}`,
                      }).then(portalSession => NextResponse.json({ url: portalSession.url }))
                )
          )
    )
    .catch(err => {
        console.error("Portal error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    });
}
