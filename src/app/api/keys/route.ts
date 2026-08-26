import { NextRequest } from "next/server";
import { configuredApiKeyRoutes } from "@/components/apiKeys/configuredApiKeyRoutes";

export async function GET(): Promise<Response> {
  return configuredApiKeyRoutes.list();
}

export async function POST(request: NextRequest): Promise<Response> {
  return configuredApiKeyRoutes.create(request);
}
