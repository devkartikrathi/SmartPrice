import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
        if (!convo) return new Response(JSON.stringify({ ok: true }), { status: 200 });

        // Optional: validate belongs to current user
        await prisma.message.deleteMany({ where: { conversationId: params.id } });
        await prisma.conversation.delete({ where: { id: params.id } });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        const body = await req.json();
        const title: string | undefined = body?.title;
        const updates: any = { updatedAt: new Date() };
        if (typeof title === 'string' && title.trim()) updates.title = title.trim();
        const conversation = await prisma.conversation.update({ where: { id: params.id }, data: updates });
        return new Response(JSON.stringify({ conversation }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}
