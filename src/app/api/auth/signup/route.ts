import { NextRequest, NextResponse } from 'next/server';
import authContract from '../../../../../data/contracts/auth.json';
import authRateLimitContract from '../../../../../data/contracts/auth-rate-limit.json';
import httpContract from '../../../../../data/contracts/http.json';
import type { AuthRateLimitPolicyName } from '@/entities/auth/authRateLimitTypes';
import { createToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { configuredAuthRateLimitGate } from '@/systems/auth/authRateLimit';

type AuthBody = { readonly email?: unknown; readonly password?: unknown };

const readCredentials = (body: unknown) => {
    const candidate = Object(body) as AuthBody;
    return {
        email: typeof candidate.email === 'string' ? candidate.email : '',
        password: typeof candidate.password === 'string' ? candidate.password : '',
    };
};

const emailPattern = new RegExp(authContract.email.pattern);

export async function POST(request: NextRequest): Promise<Response> {
    const limited = await configuredAuthRateLimitGate(
        request,
        authRateLimitContract.policies.signup.scope as AuthRateLimitPolicyName,
    );
    return limited ?? request.json()
        .then(async (body: unknown) => {
            const { email, password } = readCredentials(body);
            if (!email || !password) {
                return NextResponse.json(
                    { error: authContract.messages.credentialsRequired },
                    { status: httpContract.status.badRequest },
                );
            }
            if (password.length < authContract.password.minimumLength) {
                return NextResponse.json(
                    { error: authContract.messages.passwordTooShort },
                    { status: httpContract.status.badRequest },
                );
            }
            if (!emailPattern.test(email)) {
                return NextResponse.json(
                    { error: authContract.messages.invalidEmail },
                    { status: httpContract.status.badRequest },
                );
            }

            const normalizedEmail = email.toLowerCase();
            const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (existing) {
                return NextResponse.json(
                    { error: authContract.messages.identityExists },
                    { status: httpContract.status.conflict },
                );
            }

            const passwordHash = await hashPassword(password);
            const user = await prisma.user.create({
                data: { email: normalizedEmail, passwordHash },
            });
            const token = await createToken(user.id);
            const response = NextResponse.json(
                { user: { id: user.id, email: user.email } },
                { status: httpContract.status.created },
            );
            setAuthCookie(response, token);
            return response;
        })
        .catch((error) => {
            console.error(authContract.messages.internalServer, error);
            return NextResponse.json(
                { error: authContract.messages.internalServer },
                { status: httpContract.status.internalServerError },
            );
        });
}
