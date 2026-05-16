import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  return request.json()
    .then(async ({ email, password }) => 
      (!email || !password)
        ? NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        : prisma.user.findUnique({ where: { email: email.toLowerCase() } }).then(async user =>
            !user
              ? NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
              : verifyPassword(password, user.passwordHash).then(async valid =>
                  !valid
                    ? NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
                    : createToken(user.id).then(token => {
                        const response = NextResponse.json({ user: { id: user.id, email: user.email } });
                        setAuthCookie(response, token);
                        return response;
                      })
                )
          )
    )
    .catch(err => {
      console.error("Login error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    });
}