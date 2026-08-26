import { NextRequest, NextResponse } from 'next/server';
import authContract from '../../../../../data/contracts/auth.json';
import authRateLimitContract from '../../../../../data/contracts/auth-rate-limit.json';
import httpContract from '../../../../../data/contracts/http.json';
import type { AuthRateLimitPolicyName } from '@/entities/auth/authRateLimitTypes';
import { createToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { configuredAuthRateLimitGate } from '@/systems/auth/authRateLimit';

type AuthBody = { readonly email?: unknown; readonly password?: unknown };

const readCredentials = (body: unknown) => {
    const candidate = Object(body) as AuthBody;
    return {
        email: typeof candidate.email === 'string' ? candidate.email : '',
        password: typeof candidate.password === 'string' ? candidate.password : '',
    };
};

export async function POST(request: NextRequest): Promise<Response> {
    const limited = await configuredAuthRateLimitGate(
        request,
        authRateLimitContract.policies.login.scope as AuthRateLimitPolicyName,
    );
    return limited ?? request.json()
        .then(async (body: unknown) => {
            const { email, password } = readCredentials(body);
            return (!email || !password)
                ? NextResponse.json(
                    { error: authContract.messages.credentialsRequired },
                    { status: httpContract.status.badRequest },
                )
                : prisma.user.findUnique({ where: { email: email.toLowerCase() } })
                    .then(async (user) => !user
                        ? NextResponse.json(
                            { error: authContract.messages.invalidCredentials },
                            { status: httpContract.status.unauthorized },
                        )
                        : verifyPassword(password, user.passwordHash).then(async (valid) => {
                            if (!valid) {
                                return NextResponse.json(
                                    { error: authContract.messages.invalidCredentials },
                                    { status: httpContract.status.unauthorized },
                                );
                            }

                            const token = await createToken(user.id);
                            const response = NextResponse.json({
                                user: { id: user.id, email: user.email },
                            });
                            setAuthCookie(response, token);
                            return response;
                        }));
        })
        .catch((error) => {
            console.error(authContract.messages.internalServer, error);
            return NextResponse.json(
                { error: authContract.messages.internalServer },
                { status: httpContract.status.internalServerError },
            );
        });
}
