import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOpenAIClient, openAIConfig } from '@/lib/openai/client';

const audioRequestSchema = z.object({
  bookId: z.string().min(1),
  text: z.string().min(1).max(3000),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = audioRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Entrada inválida.' }, { status: 400 });
  }

  const openai = createOpenAIClient();

  if (!openai) {
    return NextResponse.json({
      status: 'demo',
      audioUrl: '',
      message: 'OpenAI TTS preparado; configura OPENAI_API_KEY, OPENAI_TTS_MODEL y OPENAI_TTS_VOICE.',
    });
  }

  // El MVP deja TTS preparado sin persistir archivos hasta definir almacenamiento/CDN.
  return NextResponse.json({
    status: 'pending-storage',
    model: openAIConfig.ttsModel,
    voice: openAIConfig.ttsVoice,
    message: 'Cliente OpenAI disponible. Falta conectar generación a Supabase Storage o CDN.',
  });
}
