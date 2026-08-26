import { NextRequest } from 'next/server';
import { configuredApiKeyRoutes } from '@/components/apiKeys/configuredApiKeyRoutes';

type DeleteContext = {
    readonly params: Promise<{ readonly id: string }>;
};

export async function DELETE(
    _request: NextRequest,
    { params }: DeleteContext,
): Promise<Response> {
    const { id } = await params;
    return configuredApiKeyRoutes.revoke(id);
}
