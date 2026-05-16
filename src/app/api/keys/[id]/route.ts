import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return getSessionFromCookies()
    .then(async session =>
      !session
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : params.then(async ({ id }) =>
            prisma.apiKey.findUnique({ where: { id } }).then(async apiKey =>
              (!apiKey || apiKey.userId !== session.userId)
                ? NextResponse.json({ error: "Key not found" }, { status: 404 })
                : (apiKey.status === "revoked")
                  ? NextResponse.json({ error: "Key is already revoked" }, { status: 400 })
                  : prisma.apiKey.update({
                      where: { id },
                      data: { status: "revoked", revokedAt: new Date() },
                    }).then(() => NextResponse.json({ success: true }))
            )
          )
    )
    .catch(() => NextResponse.json({ error: "Internal server error" }, { status: 500 }));
}