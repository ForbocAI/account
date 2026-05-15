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
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
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
    });

    return NextResponse.json({ keys });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Key name is required" },
        { status: 400 }
      );
    }

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 8) + "******************" + rawKey.slice(-4);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        status: "active",
      },
    });

    return NextResponse.json(
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
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
