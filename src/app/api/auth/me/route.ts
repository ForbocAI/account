import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  return getSessionFromCookies()
    .then(session =>
      !session
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, createdAt: true },
          }).then(user =>
            !user
              ? NextResponse.json({ error: "User not found" }, { status: 404 })
              : NextResponse.json({ user })
          )
    )
    .catch(() =>
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
}