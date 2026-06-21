import type {
  AIProvider,
  BookChatInput,
  BookChatResult,
  SiteChatInput,
} from "@/lib/openai/types";

export class MockAIProvider implements AIProvider {
  async answerBookQuestion(input: BookChatInput): Promise<BookChatResult> {
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
          "Puedo ayudarte con recomendaciones de Ceoteca, hábitos de lectura, productividad, mentalidad y desarrollo personal.",
      };
    }

    const alternatives = books
      .filter((book) => book.id !== matchingBook.id)
      .slice(0, 2)
      .map((book) => book.title)
      .join(" y ");

    return {
      message: `Te recomiendo empezar por ${matchingBook.title}, porque conecta con ${matchingBook.category.toLowerCase()}. Úsalo como complemento: revisa sus ideas clave, elige un ejercicio y aplícalo durante 7 días. ${alternatives ? `También podrías explorar ${alternatives}. ` : ""}Si quieres comprar el libro completo, busca una edición legal en librerías reconocidas o en la tienda oficial de tu país.`,
    };
  }
}
