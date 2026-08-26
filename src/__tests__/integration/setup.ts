import 'dotenv/config';
import authContract from '../../../data/contracts/auth.json';
import authRateLimitContract from '../../../data/contracts/auth-rate-limit.json';
import authFixture from '../../../data/tests/auth.json';
import { prisma } from '@/lib/db';
import { beforeAll, beforeEach, afterAll } from 'vitest';

process.env[authContract.jwt.secretEnvironment] = authFixture.jwtSecret;
process.env[authRateLimitContract.provider.environment] = authFixture.provider;
process.env[authRateLimitContract.identity.hashSecretEnvironment] = authFixture.hashSecret;

beforeAll(async () => {
    // Ensure we can connect
    await prisma.$connect();
});

beforeEach(async () => {
    // Clear all data to ensure isolation
    // We use the proxy prisma from lib/db
    await prisma.authRateLimitBucket.deleteMany();
    await prisma.stripeWebhookEvent.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

export { prisma };
