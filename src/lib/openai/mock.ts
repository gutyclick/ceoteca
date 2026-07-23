import type {
  AIProvider,
  BookChatInput,
  BookChatResult,
  SiteChatInput,
} from "@/lib/openai/types";

export class MockAIProvider implements AIProvider {
  async answerBookQuestion(input: BookChatInput): Promise<BookChatResult> {
    if (input.attachments?.length) {
      return {
        message: `Recibí ${input.attachments.length} ${input.attachments.length === 1 ? "adjunto" : "adjuntos"} en modo demo. La previsualización funciona, pero el contenido no se procesa ni se envía a un modelo real en este modo.`,
      };
    }
    const firstPoint = input.book.keyPoints[0];
    const relatedText = [
      input.book.title,
      input.book.author,
      input.book.category,
      ...input.book.tags,
      ...input.book.analysis.map((section) => section.title),
      ...input.book.keyPoints.map((point) => point.title),
    ]
      .join(" ")
      .toLowerCase();

    const isRelated = input.message
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 3 && relatedText.includes(word));

    if (!isRelated) {
      return {
        message:
          "Solo puedo ayudarte con ideas relacionadas con este análisis de Ceoteca.",
      };
    }

    return {
      message: `Basado en el análisis demo de ${input.book.title}, empieza por "${firstPoint.title.toLowerCase()}". ${firstPoint.action} Si lo aplicas hoy, mantén la acción pequeña y revisa qué fricción aparece antes de aumentar dificultad.`,
    };
  }

  async answerSiteQuestion(input: SiteChatInput): Promise<BookChatResult> {
    if (input.attachments?.length) {
      return {
        message: `Recibí ${input.attachments.length} ${input.attachments.length === 1 ? "adjunto" : "adjuntos"} en modo demo. Puedes probar el flujo de selección y envío, pero el contenido no fue analizado.`,
      };
    }
    const normalizedMessage = input.message.toLowerCase();
    const books = input.books.slice(0, 4);
    const matchingBook =
      input.books.find((book) =>
        [book.title, book.author, book.category, ...book.tags]
          .join(" ")
          .toLowerCase()
          .split(/\s+/)
          .some((word) => word.length > 3 && normalizedMessage.includes(word)),
      ) ?? books[0];

    if (!matchingBook) {
      return {
        message:
          "Soy CEO. Puedo ayudarte con recomendaciones de Ceoteca, hábitos de lectura, productividad, mentalidad y desarrollo personal.",
      };
    }

    const alternatives = books
      .filter((book) => book.id !== matchingBook.id)
      .slice(0, 2)
      .map((book) => book.title)
      .join(" y ");

    return {
      message: `### Ruta sugerida\n1. Empieza por **${matchingBook.title}**, porque conecta con ${matchingBook.category.toLowerCase()}.\n2. Revisa sus ideas clave y elige un ejercicio concreto.\n3. Aplícalo durante 7 días y vuelve a ajustar.\n${alternatives ? `\nTambién podrías explorar **${alternatives}**.` : ""}\n\nSi quieres comprar el libro completo, busca una edición legal en librerías reconocidas o en la tienda oficial de tu país.`,
    };
  }

  async *streamBookQuestion(input: BookChatInput): AsyncIterable<string> {
    const result = await this.answerBookQuestion(input);
    yield* streamMockText(result.message);
  }

  async *streamSiteQuestion(input: SiteChatInput): AsyncIterable<string> {
    const result = await this.answerSiteQuestion(input);
    yield* streamMockText(result.message);
  }
}

async function* streamMockText(message: string) {
  const chunks = message.match(/.{1,48}(?:\s|$)/g) ?? [message];
  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    yield chunk;
  }
}
