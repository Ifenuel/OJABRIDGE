import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  const hasKey = !!apiKey;
  const keyPrefix = apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET';
  let openaiTest = 'not tested';
  if (hasKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      openaiTest = res.ok ? 'API key valid' : 'API key invalid (' + res.status + ')';
    } catch (e) {
      openaiTest = 'Network error: ' + e.message;
    }
  }
  return NextResponse.json({ hasOpenAIKey: hasKey, keyPrefix, openaiTest });
}
