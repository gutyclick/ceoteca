import type { AIProvider, BookChatInput, BookChatResult } from "@/lib/openai/types";

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
}
