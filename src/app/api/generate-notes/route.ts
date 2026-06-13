import { EXTRACTION_PROMPT, LAYOUT_PROMPT } from '@/lib/ai-prompt';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function callAgent(systemPrompt: string, userMessage: string): Promise<object> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2, // Very low — we want reliable, structured output
    max_tokens: 8000,
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(raw);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 50000) {
      return Response.json(
        { error: 'Content too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // AGENT 1: THE COPYWRITER — Extract & Structure
    // Takes raw user text → outputs rich semantic JSON
    // ─────────────────────────────────────────────────────────
    console.log('[StudyOS] Agent 1 (Copywriter): Extracting structure...');
    const semanticData = await callAgent(
      EXTRACTION_PROMPT,
      `Analyze and extract ALL information from this text into the required JSON format:\n\n${content}`
    );

    // ─────────────────────────────────────────────────────────
    // AGENT 2: THE ARCHITECT — Layout Selection
    // Takes the semantic JSON → outputs layout strategy + visual props
    // ─────────────────────────────────────────────────────────
    console.log('[StudyOS] Agent 2 (Architect): Selecting layout strategy...');
    const enhancedData = await callAgent(
      LAYOUT_PROMPT,
      `Apply your layout and visual design expertise to this semantic JSON. Choose the optimal layout strategy and assign colors/sizes to every block:\n\n${JSON.stringify(semanticData, null, 2)}`
    );

    console.log('[StudyOS] Pipeline complete. Layout:', (enhancedData as any).layout_strategy);

    return Response.json({
      success: true,
      data: enhancedData,
    });

  } catch (error: unknown) {
    console.error('[StudyOS] Pipeline error:', error);

    const errMsg = error instanceof Error ? error.message : 'Unknown error occurred';

    if (errMsg.includes('401') || errMsg.includes('Incorrect API key')) {
      return Response.json({ error: 'Invalid API key. Check your .env.local file.' }, { status: 401 });
    }
    if (errMsg.includes('429')) {
      return Response.json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 });
    }

    return Response.json({ error: `Failed to generate notes: ${errMsg}` }, { status: 500 });
  }
}
