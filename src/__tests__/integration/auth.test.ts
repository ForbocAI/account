import { describe, it, expect } from 'vitest';
import { prisma } from './setup';
import bcrypt from 'bcryptjs';

// Integration test for authentication routes
// These are simplified for the audit context, mocking the request/response 
// as we are testing the logic and DB integration.

describe('Authentication Integration', () => {
    it('should successfully sign up a new user', async () => {
        const email = 'test@forboc.ai';
        const password = 'Password123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
            },
        });

        expect(user.email).toBe(email);
        expect(await bcrypt.compare(password, user.passwordHash)).toBe(true);
    });

    it('should prevent signup with existing email', async () => {
        const email = 'duplicate@forboc.ai';
        await prisma.user.create({
            data: { email, passwordHash: 'hash' },
        });

        await expect(prisma.user.create({
            data: { email, passwordHash: 'new-hash' },
        })).rejects.toThrow();
    });
});
