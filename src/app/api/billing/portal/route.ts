import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

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
                    ? NextResponse.json({ error: "No billing account found" }, { status: 404 })
                    : stripe.billingPortal.sessions.create({
                        customer: user.stripeCustomerId,
                        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://console.forboc.ai"}/billing`,
                      }).then(portalSession => NextResponse.json({ url: portalSession.url }))
                )
          )
    )
    .catch(err => {
        console.error("Portal error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    });
}