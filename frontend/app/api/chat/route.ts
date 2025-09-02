import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/chat/route`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error) {
        console.error('Chat API error:', error);

        return NextResponse.json(
            {
                conversation_id: null,
                timestamp: new Date().toISOString(),
                message: 'Sorry, I encountered an error processing your request. Please try again.',
                intent: 'error',
                agent_used: 'orchestrator',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
