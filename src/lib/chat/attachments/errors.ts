export type AttachmentErrorCode =
  | "ACCESS_DENIED"
  | "CORRUPT_FILE"
  | "EMPTY_FILE"
  | "EXTRACTION_FAILED"
  | "FILE_TOO_LARGE"
  | "FORMAT_NOT_ALLOWED"
  | "LIMIT_EXCEEDED"
  | "NOT_FOUND"
  | "NOT_READY"
  | "PROTECTED_DOCUMENT"
  | "STORAGE_UNAVAILABLE"
  | "TOTAL_SIZE_EXCEEDED";

const messages: Record<AttachmentErrorCode, string> = {
  ACCESS_DENIED: "No tienes acceso a este archivo.",
  CORRUPT_FILE: "Este archivo parece estar dañado.",
  EMPTY_FILE: "El archivo está vacío.",
  EXTRACTION_FAILED: "No pudimos leer el contenido del documento.",
  FILE_TOO_LARGE: "El archivo supera el tamaño permitido.",
  FORMAT_NOT_ALLOWED: "Este tipo de archivo no es compatible.",
  LIMIT_EXCEEDED: "Has alcanzado el máximo de archivos por mensaje.",
  NOT_FOUND: "No encontramos este archivo.",
  NOT_READY: "Espera a que el archivo termine de procesarse.",
  PROTECTED_DOCUMENT: "Este documento está protegido y no puede procesarse.",
  STORAGE_UNAVAILABLE: "El almacenamiento no está disponible en este momento.",
  TOTAL_SIZE_EXCEEDED: "Los archivos seleccionados superan el límite permitido.",
};

export class AttachmentError extends Error {
  constructor(
    public readonly code: AttachmentErrorCode,
    public readonly status = 400,
    message = messages[code],
  ) {
    super(message);
    this.name = "AttachmentError";
  }
}
