import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const openaiKey = import.meta.env.OPENAI_API_KEY;
  
  return new Response(
    JSON.stringify({
      supabase: supabaseUrl ? '✅ Configured' : '❌ Missing',
      openai: openaiKey ? '✅ Configured' : '❌ Missing',
      openaiKeyStart: openaiKey ? openaiKey.substring(0, 15) + '...' : 'N/A'
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};

