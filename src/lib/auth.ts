import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import authContract from "../../data/contracts/auth.json";

const COOKIE_NAME = authContract.cookie.name;

function getJwtSecret(): Uint8Array {
  const secret = process.env[authContract.jwt.secretEnvironment];
  return secret
    ? new TextEncoder().encode(secret)
    : (() => { throw new Error(`${authContract.jwt.secretEnvironment} is not set`); })();
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: authContract.jwt.algorithm })
    .setIssuedAt()
    .setExpirationTime(authContract.jwt.expiry)
    .sign(getJwtSecret());
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: authContract.cookie.sameSite as "lax",
    path: authContract.cookie.path,
    maxAge: authContract.cookie.maxAgeSeconds,
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: authContract.cookie.sameSite as "lax",
    path: authContract.cookie.path,
    maxAge: 0,
  });
}

export async function getSession(
  request: NextRequest
): Promise<{ userId: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export async function getSessionFromCookies(): Promise<{
  userId: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export { COOKIE_NAME };
