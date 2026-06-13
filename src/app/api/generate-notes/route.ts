import { SYSTEM_PROMPT, getStyleInstruction } from '@/lib/ai-prompt';
import type { NoteStyle } from '@/lib/ai-prompt';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, style = 'colorful' } = body as {
      content: string;
      style?: NoteStyle;
    };

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

    const styleInstruction = getStyleInstruction(style);
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT + '\n\nSTYLE PREFERENCE: ' + styleInstruction,
        },
        {
          role: 'user',
          content: `Transform the following content into beautiful, structured study notes:\n\n${content}`,
        },
      ],
      temperature: 0.3, // Low temp for consistent, accurate formatting
      max_tokens: 8000,
    });

    const html = completion.choices[0]?.message?.content || '';

    // Strip any accidental markdown code fences the model might add
    const cleanHtml = html
      .replace(/^```html?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    return Response.json({
      html: cleanHtml,
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
