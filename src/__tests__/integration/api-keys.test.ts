import { describe, it, expect } from 'vitest';
import { prisma } from './setup';
import crypto from 'crypto';

describe('API Key Management Integration', () => {
    it('should create and verify an API key for a user', async () => {
        // 1. Setup user
        const user = await prisma.user.create({
            data: { email: 'keys@forboc.ai', passwordHash: 'hash' },
        });

        // 2. Simulate key generation logic
        const rawKey = `fb_${crypto.randomBytes(32).toString('hex')}`;
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
        const keyPrefix = rawKey.slice(0, 6);

        const apiKey = await prisma.apiKey.create({
            data: {
                userId: user.id,
                name: 'Production Key',
                keyHash: keyHash,
                keyPrefix: keyPrefix,
            },
        });

        // 3. Verify persistence
        expect(apiKey.userId).toBe(user.id);
        expect(apiKey.keyPrefix.startsWith('fb_')).toBe(true);
        expect(apiKey.status).toBe('active');

        // 4. Verify lookup by hash
        const found = await prisma.apiKey.findUnique({
            where: { keyHash },
        });
        expect(found?.id).toBe(apiKey.id);
    });

    it('should revoke an API key', async () => {
        const user = await prisma.user.create({
            data: { email: 'revoke@forboc.ai', passwordHash: 'hash' },
        });

        const apiKey = await prisma.apiKey.create({
            data: {
                userId: user.id,
                name: 'Temp Key',
                keyHash: 'some-hash',
                keyPrefix: 'fb_tmp',
            },
        });

        const revoked = await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { status: 'revoked', revokedAt: new Date() },
        });

        expect(revoked.status).toBe('revoked');
        expect(revoked.revokedAt).toBeDefined();
    });
});
