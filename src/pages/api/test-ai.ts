import type { APIRoute } from 'astro';
import { getChatCompletion, isOpenAIConfigured } from '../../lib/openai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { message } = body;

    console.log('OpenAI configured:', isOpenAIConfigured());
    
    if (!isOpenAIConfigured()) {
      return new Response(
        JSON.stringify({ error: 'OpenAI not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reply = await getChatCompletion([
      { role: 'user', content: message }
    ]);

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Test AI error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

