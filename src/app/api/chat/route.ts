import { NextResponse } from 'next/server';
import { z } from 'zod';
import { demoBooks } from '@/data/books';
import { createOpenAIClient, openAIConfig } from '@/lib/openai/client';
import { canAccessFeature } from '@/lib/permissions';

const chatRequestSchema = z.object({
  bookId: z.string().min(1),
  message: z.string().min(1).max(600),
  conversation: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(1000),
      }),
    )
    .max(20),
});

function buildSystemPrompt(bookTitle: string, authorizedContent: string) {
  return `Eres un asistente especializado únicamente en el análisis editorial suministrado para este libro. Responde solamente con información disponible en el contenido autorizado de Ceoteca. Si la pregunta no se relaciona con ese contenido, explica que solo puedes ayudar con las ideas de este análisis. No inventes citas, páginas, capítulos ni afirmaciones atribuidas al autor. Responde siempre en español de manera clara, útil y aplicada. Libro: ${bookTitle}. Contenido autorizado: ${authorizedContent}`;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Entrada inválida.' }, { status: 400 });
  }

  const book = demoBooks.find((item) => item.id === parsed.data.bookId);

  if (!book) {
    return NextResponse.json({ error: 'Libro no encontrado.' }, { status: 404 });
  }

  // TODO: reemplazar por perfil real de Supabase; nunca confiar en un plan enviado por el cliente.
  const currentPlan = 'pro' as const;

  if (!canAccessFeature(currentPlan, 'chat')) {
    return NextResponse.json({ error: 'Tu plan no incluye chat.' }, { status: 403 });
  }

  const authorizedContent = [book.description, ...book.sections.map((section) => section.content)].join('\n');
  const systemPrompt = buildSystemPrompt(book.title, authorizedContent);
  const openai = createOpenAIClient();

  if (!openai) {
    return NextResponse.json({
      message: `Respuesta demo sobre ${book.title}: toma una idea principal del análisis, conviértela en una acción de dos minutos y revísala al final del día. No puedo citar páginas ni capítulos porque este MVP usa contenido editorial propio.`,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: openAIConfig.chatModel,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        ...parsed.data.conversation,
        { role: 'user', content: parsed.data.message },
      ],
    });

    return NextResponse.json({
      message: completion.choices[0]?.message.content ?? 'No pude generar una respuesta.',
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo generar la respuesta en este momento.' },
      { status: 502 },
    );
  }
}
