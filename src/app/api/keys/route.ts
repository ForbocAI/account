import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import apiKeyContract from "../../../../data/contracts/api-keys.json";
import { apiKeyPersistence } from "@/components/apiKeys/apiKeyPersistence";
import { getSessionFromCookies } from "@/lib/auth";
import { createApiKeyRoutes } from "@/systems/apiKeys/apiKeyRoutes";

const routes = createApiKeyRoutes({
  readSession: getSessionFromCookies,
  persistence: apiKeyPersistence,
  randomHex: (byteCount) => randomBytes(byteCount).toString(
    apiKeyContract.generation.encoding as 'hex',
  ),
  hash: (value) => createHash(apiKeyContract.generation.hashAlgorithm)
    .update(value)
    .digest(apiKeyContract.generation.encoding as 'hex'),
});

export async function GET(): Promise<Response> {
  return routes.list();
}

export async function POST(request: NextRequest): Promise<Response> {
  return routes.create(request);
}
