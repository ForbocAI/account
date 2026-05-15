import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey || apiKey.userId !== session.userId) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    if (apiKey.status === "revoked") {
      return NextResponse.json(
        { error: "Key is already revoked" },
        { status: 400 }
      );
    }

    await prisma.apiKey.update({
      where: { id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
