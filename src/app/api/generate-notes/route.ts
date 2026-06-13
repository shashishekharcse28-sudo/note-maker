import { SYSTEM_PROMPT } from '@/lib/ai-prompt';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return Response.json(
        { error: 'Content too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Transform the following content into a structured whiteboard JSON object:\n\n${content}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temp for consistent, accurate formatting
      max_tokens: 8000,
    });

    const jsonString = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(jsonString);

    return Response.json({
      success: true,
      data: parsedData,
      usage: completion.usage,
    });
  } catch (error: unknown) {
    console.error('Generate notes error:', error);

    const errMsg =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific OpenAI errors
    if (errMsg.includes('401') || errMsg.includes('Incorrect API key')) {
      return Response.json(
        { error: 'Invalid API key. Check your .env.local file.' },
        { status: 401 }
      );
    }

    if (errMsg.includes('429')) {
      return Response.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    return Response.json(
      { error: `Failed to generate notes: ${errMsg}` },
      { status: 500 }
    );
  }
}
