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
    throw new Error("OpenAI no estÃ¡ configurado para modo real.");
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

  return `${value.slice(0, MAX_CONTEXT_CHARACTERS)}\n\n[Contexto recortado por lÃ­mite tÃ©cnico.]`;
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
        `- ${point.number}. ${point.title}: ${point.explanation} AcciÃ³n sugerida: ${point.action} LimitaciÃ³n: ${point.limitation}`,
    )
    .join("\n");
  const activities = book.activities
    .map((activity) => `- ${activity.title}: ${activity.prompt}`)
    .join("\n");

  return truncateContext(`Contexto de libro autorizado por Ceoteca.

Libro: ${book.title}
Autor: ${book.author}
CategorÃ­a: ${book.category}
Dificultad: ${book.difficulty}
DescripciÃ³n editorial: ${book.description}
Etiquetas: ${book.tags.join(", ")}

Secciones del anÃ¡lisis editorial:
${sections}

Ideas clave:
${keyPoints}

Ejercicios disponibles:
${activities}

ConclusiÃ³n editorial:
${book.conclusion}`);
}

function formatSiteContext(books: Book[]) {
  const catalog = books
    .map(
      (book) => `- ${book.title} (${book.author})
  Categoría: ${book.category}
  Descripción: ${book.description}
  Etiquetas: ${book.tags.join(", ")}
  Ideas clave: ${book.keyPoints.map((point) => point.title).join("; ")}
  Compra legal: ${book.purchaseUrl ?? "No disponible en Ceoteca"}`,
    )
    .join("\n\n");

  return truncateContext(`Catálogo autorizado de Ceoteca. Solo recomienda como parte de Ceoteca los libros de esta lista.

${catalog}`);
}

function baseInstructions() {
  return `Tu nombre es CEO. Eres la IA de Ceoteca, una plataforma educativa en espaÃ±ol con anÃ¡lisis editoriales propios de libros.

Reglas obligatorias:
- Responde siempre en espaÃ±ol claro, profesional y prÃ¡ctico.
- PresÃ©ntate como CEO si el usuario pregunta tu nombre.
- Formatea las respuestas con encabezados breves, listas numeradas o bullets cuando ayuden a leer mejor.
- No digas que Ceoteca reemplaza libros completos.
- Presenta Ceoteca como complemento de lectura y aplicaciÃ³n prÃ¡ctica.
- No reproduzcas capÃ­tulos, textos extensos, citas largas ni contenido protegido de libros.
- No inventes citas textuales ni atribuyas frases exactas a autores.
- Si recomiendas comprar un libro, recomienda hacerlo mediante librerÃ­as reconocidas, editoriales oficiales o tiendas legales.
- Si la pregunta sale de Ceoteca, lectura, productividad, hÃ¡bitos, mentalidad, desarrollo personal, liderazgo, finanzas personales o recomendaciones del catÃ¡logo, redirige con amabilidad al alcance permitido.
- SÃ© concreto: ofrece prÃ³ximos pasos, ejercicios, rutas o criterios de decisiÃ³n.
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

Alcance especÃ­fico:
- Responde solo con base en el anÃ¡lisis editorial proporcionado.
- Puedes explicar ideas clave, limitaciones, ejercicios y aplicaciÃ³n prÃ¡ctica.
- Puedes convertir el contenido en un plan, checklist, reflexiÃ³n, pregunta de quiz o siguiente paso.
- Si el usuario pregunta algo no cubierto por este anÃ¡lisis, dilo con claridad y ofrece una forma de conectarlo con el contenido disponible.
- Si el usuario pide un resumen largo o contenido que sustituya la obra, ofrece una orientaciÃ³n breve y recomienda leer el libro completo.

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
        "No pude generar una respuesta Ãºtil en este momento.",
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

Alcance especÃ­fico:
- Puedes recomendar anÃ¡lisis del catÃ¡logo de Ceoteca.
- Puedes sugerir rutas de lectura, hÃ¡bitos de lectura, productividad general, mentalidad y desarrollo personal.
- Puedes orientar sobre dÃ³nde comprar libros completos de forma legal.
- No afirmes que un libro existe en Ceoteca si no aparece en el catÃ¡logo autorizado.
- Si recomiendas un libro fuera de Ceoteca, aclara que no forma parte del catÃ¡logo actual y sugiere buscarlo en tiendas o bibliotecas legales.
- Prioriza respuestas accionables: criterio de elecciÃ³n, ruta de lectura, ejercicio o siguiente paso.

CatÃ¡logo autorizado:
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
        "No pude generar una respuesta Ãºtil en este momento.",
    };
  }

  async *streamBookQuestion(input: BookChatInput, signal?: AbortSignal): AsyncIterable<string> {
    const { model } = requireOpenAIConfig();
    const stream = await this.getClient().responses.create({
      model,
      stream: true,
      input: [
        {
          role: "developer",
          content: `${baseInstructions()}

Alcance específico:
- Responde solo con base en el análisis editorial proporcionado.
- Puedes explicar ideas clave, limitaciones, ejercicios y aplicación práctica.
- Puedes convertir el contenido en un plan, checklist, reflexión, pregunta de quiz o siguiente paso.
- Si el usuario pregunta algo no cubierto por este análisis, dilo con claridad y ofrece una forma de conectarlo con el contenido disponible.
- Si el usuario pide un resumen largo o contenido que sustituya la obra, ofrece una orientación breve y recomienda leer el libro completo.

Contexto autorizado:
${formatBookContext(input.book)}`,
        },
        ...formatConversation(input.conversation),
        { role: "user", content: input.message },
      ],
      max_output_tokens: 700,
    }, { signal });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") yield event.delta;
    }
  }

  async *streamSiteQuestion(input: SiteChatInput, signal?: AbortSignal): AsyncIterable<string> {
    const { model } = requireOpenAIConfig();
    const stream = await this.getClient().responses.create({
      model,
      stream: true,
      input: [
        {
          role: "developer",
          content: `${baseInstructions()}

Alcance específico:
- Puedes recomendar análisis del catálogo de Ceoteca.
- Puedes sugerir rutas de lectura, hábitos de lectura, productividad general, mentalidad y desarrollo personal.
- Puedes orientar sobre dónde comprar libros completos de forma legal.
- No afirmes que un libro existe en Ceoteca si no aparece en el catálogo autorizado.
- Si recomiendas un libro fuera de Ceoteca, aclara que no forma parte del catálogo actual y sugiere buscarlo en tiendas o bibliotecas legales.
- Prioriza respuestas accionables: criterio de elección, ruta de lectura, ejercicio o siguiente paso.

Catálogo autorizado:
${formatSiteContext(input.books)}`,
        },
        ...formatConversation(input.conversation),
        { role: "user", content: input.message },
      ],
      max_output_tokens: 700,
    }, { signal });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") yield event.delta;
    }
  }
}

export function createAIProvider(): AIProvider {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockAIProvider();
  }

  return new OpenAIProvider();
}

