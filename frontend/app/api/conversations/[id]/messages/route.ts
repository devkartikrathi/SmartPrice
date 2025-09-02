import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        const messages = await prisma.message.findMany({ where: { conversationId: params.id }, orderBy: { createdAt: 'asc' } });
        return new Response(JSON.stringify({ messages }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        const body = await req.json();
        const { content, type, intent, agent_used, data, actions, status } = body || {};
        const message = await prisma.message.create({
            data: {
                conversationId: params.id,
                content: content ?? '',
                type: type ?? 'user',
                intent: intent ?? null,
                agentUsed: agent_used ?? null,
                data: data ?? null,
                actions: actions ?? null,
                status: status ?? 'success',
            },
        });
        await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });
        return new Response(JSON.stringify({ message }), { status: 201 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}
