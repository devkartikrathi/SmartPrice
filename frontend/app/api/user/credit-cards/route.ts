import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return new Response(JSON.stringify({ selected: [] }), { status: 200 });

        const cards = await prisma.creditCard.findMany({ where: { userId: user.id, isActive: true } });
        const selected = cards.map(c => c.cardName);
        return new Response(JSON.stringify({ selected }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        const body = await req.json();
        const selected: string[] = Array.isArray(body?.selected) ? body.selected : [];

        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            user = await prisma.user.create({ data: { clerkId: userId, email: `${userId}@example.local` } });
        }

        // Replace the user's current selection entirely: remove all, then insert the posted list
        await prisma.creditCard.deleteMany({ where: { userId: user.id } });
        if (selected.length > 0) {
            await prisma.creditCard.createMany({
                data: selected.map(name => ({
                    userId: user.id,
                    cardName: name,
                    bankName: name.split(' ')[0] || 'Unknown',
                    cardType: 'credit',
                    isActive: true,
                })),
            });
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}
