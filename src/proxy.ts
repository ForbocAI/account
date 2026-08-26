import { NextRequest, NextResponse } from 'next/server';
import authContract from '../data/contracts/auth.json';
import { getSession } from '@/lib/auth';

const protectedRoutes = [
    authContract.routes.dashboard,
    authContract.routes.keys,
    authContract.routes.billing,
];

const authRoutes = [authContract.routes.home, authContract.routes.signupPage];

const routeContains = (pathname: string, route: string): boolean =>
    pathname === route || pathname.startsWith(`${route}/`);

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = await getSession(request);
    const isProtected = protectedRoutes.some((route) => routeContains(pathname, route));
    const isAuthRoute = authRoutes.includes(pathname);

    return isProtected && !session
        ? NextResponse.redirect(new URL(authContract.routes.home, request.url))
        : isAuthRoute && session
            ? NextResponse.redirect(new URL(authContract.routes.dashboard, request.url))
            : NextResponse.next();
}

export const config = {
    // Next statically parses this mirror; the data guard binds it to auth.json.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.svg$).*)'],
};
