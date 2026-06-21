import OpenAI from "openai";

import { clientEnv, serverEnv } from "@/lib/env";
import { MockAIProvider } from "@/lib/openai/mock";
import type {
  AIProvider,
  BookChatInput,
  BookChatResult,
  SiteChatInput,
} from "@/lib/openai/types";
import type { Book } from "@/types";

const MAX_CONTEXT_CHARACTERS = 11_000;

function requireOpenAIConfig() {
  if (!serverEnv.OPENAI_API_KEY || !serverEnv.OPENAI_CHAT_MODEL) {
    throw new Error("OpenAI no está configurado para modo real.");
  }

  return {
    apiKey: serverEnv.OPENAI_API_KEY,
    model: serverEnv.OPENAI_CHAT_MODEL,
  };
}

function truncateContext(value: string) {
  if (value.length <= MAX_CONTEXT_CHARACTERS) {
    return value;
  }

  return `${value.slice(0, MAX_CONTEXT_CHARACTERS)}\n\n[Contexto recortado por límite técnico.]`;
}

function formatConversation(conversation: BookChatInput["conversation"]) {
  return conversation.slice(-8).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function formatBookContext(book: Book) {
  const sections = book.analysis
    .map((section) => `- ${section.title}: ${section.content}`)
    .join("\n");
  const keyPoints = book.keyPoints
    .map(
      (point) =>
        `- ${point.number}. ${point.title}: ${point.explanation} Acción sugerida: ${point.action} Limitación: ${point.limitation}`,
    )
    .join("\n");
  const activities = book.activities
    .map((activity) => `- ${activity.title}: ${activity.prompt}`)
    .join("\n");

  return truncateContext(`Libro: ${book.title}
Autor: ${book.author}
Categoría: ${book.category}
Dificultad: ${book.difficulty}
Descripción editorial: ${book.description}
Etiquetas: ${book.tags.join(", ")}

Secciones del análisis editorial:
${sections}

Ideas clave:
${keyPoints}

Ejercicios disponibles:
${activities}

Conclusión editorial:
${book.conclusion}`);
}

function formatSiteContext(books: Book[]) {
  return truncateContext(
    books
      .map(
        (book) => `- ${book.title} (${book.author})
  Categoría: ${book.category}
  Descripción: ${book.description}
  Etiquetas: ${book.tags.join(", ")}
  Ideas clave: ${book.keyPoints.map((point) => point.title).join("; ")}
  Compra legal: ${book.purchaseUrl ?? "No disponible en Ceoteca"}`,
      )
      .join("\n\n"),
  );
}

function baseInstructions() {
  return `Tu nombre es CEO. Eres la IA de Ceoteca, una plataforma educativa en español con análisis editoriales propios de libros.

Reglas obligatorias:
- Responde siempre en español claro, profesional y práctico.
- Preséntate como CEO si el usuario pregunta tu nombre.
- Formatea las respuestas con encabezados breves, listas numeradas o bullets cuando ayuden a leer mejor.
- No digas que Ceoteca reemplaza libros completos.
- Presenta Ceoteca como complemento de lectura y aplicación práctica.
- No reproduzcas capítulos, textos extensos, citas largas ni contenido protegido de libros.
- No inventes citas textuales ni atribuyas frases exactas a autores.
- Si recomiendas comprar un libro, recomienda hacerlo mediante librerías reconocidas, editoriales oficiales o tiendas legales.
- Si la pregunta sale de Ceoteca, lectura, productividad, hábitos, mentalidad, desarrollo personal, liderazgo, finanzas personales o recomendaciones del catálogo, redirige con amabilidad al alcance permitido.
- Sé concreto: ofrece próximos pasos, ejercicios, rutas o criterios de decisión.
- Si no tienes suficiente contexto, dilo y sugiere una pregunta mejor.`;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;

  private getClient() {
    const { apiKey } = requireOpenAIConfig();

    this.client ??= new OpenAI({ apiKey });

    return this.client;
  }

  async answerBookQuestion(input: BookChatInput): Promise<BookChatResult> {
    const { model } = requireOpenAIConfig();
    const client = this.getClient();
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "developer",
          content: `${baseInstructions()}

Alcance específico:
- Responde solo con base en el análisis editorial proporcionado.
- Puedes explicar ideas clave, limitaciones, ejercicios y aplicación práctica.
- Si el usuario pide un resumen largo o contenido que sustituya la obra, ofrece una orientación breve y recomienda leer el libro completo.

Contexto autorizado:
${formatBookContext(input.book)}`,
        },
        ...formatConversation(input.conversation),
        {
          role: "user",
          content: input.message,
        },
      ],
      max_output_tokens: 700,
    });

    return {
      message:
        response.output_text.trim() ||
        "No pude generar una respuesta útil en este momento.",
    };
  }

  async answerSiteQuestion(input: SiteChatInput): Promise<BookChatResult> {
    const { model } = requireOpenAIConfig();
    const client = this.getClient();
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "developer",
          content: `${baseInstructions()}

Alcance específico:
- Puedes recomendar análisis del catálogo de Ceoteca.
- Puedes sugerir rutas de lectura, hábitos de lectura, productividad general, mentalidad y desarrollo personal.
- Puedes orientar sobre dónde comprar libros completos de forma legal.
- No afirmes que un libro existe en Ceoteca si no aparece en el catálogo autorizado.

Catálogo autorizado:
${formatSiteContext(input.books)}`,
        },
        ...formatConversation(input.conversation),
        {
          role: "user",
          content: input.message,
        },
      ],
      max_output_tokens: 700,
    });

    return {
      message:
        response.output_text.trim() ||
        "No pude generar una respuesta útil en este momento.",
    };
  }
}

export function createAIProvider(): AIProvider {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockAIProvider();
  }

  return new OpenAIProvider();
}
