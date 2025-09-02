import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            user = await prisma.user.create({ data: { clerkId: userId, email: `${userId}@example.local` } });
        }

        const onboarding = await prisma.onboardingData.findUnique({ where: { userId: user.id } });
        return new Response(
            JSON.stringify({ isOnboarded: !!user.isOnboarded, onboarding }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const body = await request.json();
        const {
            firstName,
            lastName,
            email,
            occupation,
            monthlySpending,
            shoppingFrequency,
            preferredPlatforms,
            selectedCardIds = [],
        } = body || {};

        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            user = await prisma.user.create({ data: { clerkId: userId, email: email || `${userId}@example.local`, firstName, lastName } });
        } else {
            await prisma.user.update({ where: { id: user.id }, data: { firstName, lastName, email: email || user.email } });
        }

        await prisma.onboardingData.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                occupation: occupation || 'Unknown',
                primarySpendingCategory: 'shopping',
                shoppingFrequency: shoppingFrequency || 'weekly',
                preferredPlatforms: Array.isArray(preferredPlatforms) ? preferredPlatforms : [],
                monthlySpending: monthlySpending || '0-10k',
            },
            update: {
                occupation: occupation || 'Unknown',
                shoppingFrequency: shoppingFrequency || 'weekly',
                preferredPlatforms: Array.isArray(preferredPlatforms) ? preferredPlatforms : [],
                monthlySpending: monthlySpending || '0-10k',
            },
        });

        if (Array.isArray(selectedCardIds) && selectedCardIds.length > 0) {
            await prisma.creditCard.updateMany({ where: { userId: user.id }, data: { isActive: false } });
            const toCreate = selectedCardIds.map((name: string) => ({ userId: user.id, cardName: name, cardType: 'credit', bankName: name.split(' ')[0] || 'Unknown', isActive: true }));
            await prisma.creditCard.createMany({ data: toCreate });
        }

        await prisma.user.update({ where: { id: user.id }, data: { isOnboarded: true } });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 });
    }
}
