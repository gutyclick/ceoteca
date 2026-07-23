import type { PlanKey } from "@/config/plans";

export const chatAttachmentCategories = ["document", "data", "image"] as const;
export type ChatAttachmentCategory = (typeof chatAttachmentCategories)[number];

export const chatAttachmentFormats = {
  pdf: { category: "document", mimeTypes: ["application/pdf"] },
  txt: { category: "document", mimeTypes: ["text/plain"] },
  md: { category: "document", mimeTypes: ["text/markdown", "text/plain"] },
  docx: {
    category: "document",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  csv: { category: "data", mimeTypes: ["text/csv", "application/csv", "text/plain"] },
  png: { category: "image", mimeTypes: ["image/png"] },
  jpg: { category: "image", mimeTypes: ["image/jpeg"] },
  jpeg: { category: "image", mimeTypes: ["image/jpeg"] },
  webp: { category: "image", mimeTypes: ["image/webp"] },
} as const satisfies Record<
  string,
  { category: ChatAttachmentCategory; mimeTypes: readonly string[] }
>;

export type ChatAttachmentExtension = keyof typeof chatAttachmentFormats;

export type ChatAttachmentPolicy = {
  enabled: boolean;
  maxFilesPerMessage: number;
  maxBytesPerFile: number;
  maxBytesPerMessage: number;
  allowedExtensions: readonly ChatAttachmentExtension[];
  allowMultiple: boolean;
  allowVision: boolean;
  allowDocumentProcessing: boolean;
  retentionDays: number;
};

const allExtensions = Object.keys(chatAttachmentFormats) as ChatAttachmentExtension[];

export const chatAttachmentPolicies: Record<PlanKey, ChatAttachmentPolicy> = {
  free: {
    enabled: false,
    maxFilesPerMessage: 0,
    maxBytesPerFile: 0,
    maxBytesPerMessage: 0,
    allowedExtensions: [],
    allowMultiple: false,
    allowVision: false,
    allowDocumentProcessing: false,
    retentionDays: 0,
  },
  pro: {
    enabled: true,
    maxFilesPerMessage: 3,
    maxBytesPerFile: 5 * 1024 * 1024,
    maxBytesPerMessage: 10 * 1024 * 1024,
    allowedExtensions: allExtensions,
    allowMultiple: true,
    allowVision: true,
    allowDocumentProcessing: true,
    retentionDays: 30,
  },
  founder: {
    enabled: true,
    maxFilesPerMessage: 3,
    maxBytesPerFile: 5 * 1024 * 1024,
    maxBytesPerMessage: 10 * 1024 * 1024,
    allowedExtensions: allExtensions,
    allowMultiple: true,
    allowVision: true,
    allowDocumentProcessing: true,
    retentionDays: 30,
  },
  unlimited: {
    enabled: true,
    maxFilesPerMessage: 5,
    maxBytesPerFile: 8 * 1024 * 1024,
    maxBytesPerMessage: 20 * 1024 * 1024,
    allowedExtensions: allExtensions,
    allowMultiple: true,
    allowVision: true,
    allowDocumentProcessing: true,
    retentionDays: 90,
  },
};

export const chatAttachmentProcessingLimits = {
  maxExtractedCharactersPerFile: 18_000,
  maxExtractedCharactersPerMessage: 36_000,
  maxPdfPages: 20,
  maxCsvRows: 200,
  maxCsvColumns: 40,
  maxImageDimension: 1_800,
  signedUrlSeconds: 300,
  temporaryAttachmentHours: 24,
} as const;

export const chatAttachmentAccept = Object.entries(chatAttachmentFormats)
  .flatMap(([extension, definition]) => [
    `.${extension}`,
    ...definition.mimeTypes,
  ])
  .filter((value, index, values) => values.indexOf(value) === index)
  .join(",");

export function getChatAttachmentPolicy(plan: PlanKey) {
  return chatAttachmentPolicies[plan];
}

export function getChatAttachmentExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLocaleLowerCase("en") ?? "";
  return extension in chatAttachmentFormats
    ? (extension as ChatAttachmentExtension)
    : null;
}

export function formatAttachmentBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
