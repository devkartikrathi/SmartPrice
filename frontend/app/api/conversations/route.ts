import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) user = await prisma.user.create({ data: { clerkId: userId, email: `${userId}@example.local` } });

        const conversations = await prisma.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
        return new Response(JSON.stringify({ conversations }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        const body = await req.json();
        const title: string = body?.title || 'New Chat';

        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) user = await prisma.user.create({ data: { clerkId: userId, email: `${userId}@example.local` } });

        const conversation = await prisma.conversation.create({ data: { userId: user.id, title } });
        return new Response(JSON.stringify({ conversation }), { status: 201 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}
