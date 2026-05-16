import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

function generateApiKey(): string {
  const hex = randomBytes(16).toString("hex");
  return `fb_live_${hex}`;
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function GET() {
  return getSessionFromCookies()
    .then(session =>
      !session
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : prisma.apiKey.findMany({
            where: { userId: session.userId },
            select: {
              id: true,
              name: true,
              keyPrefix: true,
              status: true,
              createdAt: true,
              revokedAt: true,
            },
            orderBy: { createdAt: "desc" },
          }).then(keys => NextResponse.json({ keys }))
    )
    .catch(() => NextResponse.json({ error: "Internal server error" }, { status: 500 }));
}

export async function POST(request: NextRequest) {
  return getSessionFromCookies()
    .then(async session =>
      !session
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : request.json().then(async ({ name }) =>
            (!name || !name.trim())
              ? NextResponse.json({ error: "Key name is required" }, { status: 400 })
              : Promise.resolve(generateApiKey()).then(rawKey =>
                  prisma.apiKey.create({
                    data: {
                      userId: session.userId,
                      name: name.trim(),
                      keyHash: hashApiKey(rawKey),
                      keyPrefix: rawKey.slice(0, 8) + "******************" + rawKey.slice(-4),
                      status: "active",
                    },
                  }).then(apiKey => NextResponse.json(
                    {
                      key: {
                        id: apiKey.id,
                        name: apiKey.name,
                        rawKey,
                        keyPrefix: apiKey.keyPrefix,
                        status: apiKey.status,
                        createdAt: apiKey.createdAt,
                      },
                    },
                    { status: 201 }
                  ))
                )
          )
    )
    .catch(() => NextResponse.json({ error: "Internal server error" }, { status: 500 }));
}