import 'dotenv/config';
import { prisma } from '@/lib/db';
import { beforeAll, beforeEach, afterAll } from 'vitest';

beforeAll(async () => {
    // Ensure we can connect
    await prisma.$connect();
});

beforeEach(async () => {
    // Clear all data to ensure isolation
    // We use the proxy prisma from lib/db
    await prisma.stripeWebhookEvent.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

export { prisma };
