import { hash, compare } from "bcryptjs";
import authContract from "../../data/contracts/auth.json";

export async function hashPassword(password: string): Promise<string> {
    return hash(password, authContract.password.hashRounds);
}

export async function verifyPassword(
    password: string,
    passwordHash: string
): Promise<boolean> {
    return compare(password, passwordHash);
}
