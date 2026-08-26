import { NextRequest, NextResponse } from 'next/server';
import authContract from '../../../../../data/contracts/auth.json';
import authRateLimitContract from '../../../../../data/contracts/auth-rate-limit.json';
import httpContract from '../../../../../data/contracts/http.json';
import type { AuthRateLimitPolicyName } from '@/entities/auth/authRateLimitTypes';
import { matchNullable } from '@/components/fp/result';
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

type CredentialFailure = {
    readonly message: string;
    readonly status: number;
};

const credentialFailure = (email: string, password: string): CredentialFailure | null => [
    {
        rejected: !email || !password,
        message: authContract.messages.credentialsRequired,
        status: httpContract.status.badRequest,
    },
    {
        rejected: password.length < authContract.password.minimumLength,
        message: authContract.messages.passwordTooShort,
        status: httpContract.status.badRequest,
    },
    {
        rejected: !emailPattern.test(email),
        message: authContract.messages.invalidEmail,
        status: httpContract.status.badRequest,
    },
].find((candidate) => candidate.rejected) ?? null;

const createIdentity = async (email: string, password: string): Promise<Response> => {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = await createToken(user.id);
    const response = NextResponse.json(
        { user: { id: user.id, email: user.email } },
        { status: httpContract.status.created },
    );
    setAuthCookie(response, token);
    return response;
};

const registerIdentity = async (email: string, password: string): Promise<Response> => {
    const normalizedEmail = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    return matchNullable(existing, {
        present: () => Promise.resolve(NextResponse.json(
            { error: authContract.messages.identityExists },
            { status: httpContract.status.conflict },
        )),
        nothing: () => createIdentity(normalizedEmail, password),
    });
};

export async function POST(request: NextRequest): Promise<Response> {
    const limited = await configuredAuthRateLimitGate(
        request,
        authRateLimitContract.policies.signup.scope as AuthRateLimitPolicyName,
    );
    return limited ?? request.json()
        .then(async (body: unknown) => {
            const { email, password } = readCredentials(body);
            return matchNullable(credentialFailure(email, password), {
                present: (failure) => Promise.resolve(NextResponse.json(
                    { error: failure.message },
                    { status: failure.status },
                )),
                nothing: () => registerIdentity(email, password),
            });
        })
        .catch((error) => {
            console.error(authContract.messages.internalServer, error);
            return NextResponse.json(
                { error: authContract.messages.internalServer },
                { status: httpContract.status.internalServerError },
            );
        });
}
