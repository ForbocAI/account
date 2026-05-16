import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  return request.json()
    .then(async ({ email, password }) => 
      (!email || !password)
        ? NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        : (password.length < 8)
          ? NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
          : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            ? NextResponse.json({ error: "Invalid email address" }, { status: 400 })
            : prisma.user.findUnique({ where: { email: email.toLowerCase() } }).then(async existing =>
                existing
                  ? NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
                  : hashPassword(password).then(passwordHash =>
                      prisma.user.create({
                        data: { email: email.toLowerCase(), passwordHash },
                      }).then(async user =>
                        createToken(user.id).then(token => {
                          const response = NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
                          setAuthCookie(response, token);
                          return response;
                        })
                      )
                    )
              )
    )
    .catch(err => {
      console.error("Signup error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    });
}