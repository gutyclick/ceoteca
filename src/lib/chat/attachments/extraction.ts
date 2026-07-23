import "server-only";

import mammoth from "mammoth";
import sharp from "sharp";
import { getDocumentProxy } from "unpdf";

import { chatAttachmentProcessingLimits } from "@/config/chat-attachments";
import { AttachmentError } from "@/lib/chat/attachments/errors";
import type { ChatAttachmentExtension } from "@/config/chat-attachments";
import type { Json } from "@/lib/supabase/database.types";

export type AttachmentProcessingResult = {
  storageBuffer: Buffer;
  storageMimeType: string;
  extractedContent: string;
  truncated: boolean;
  extractionStatus: "ready" | "failed" | "not_applicable";
  metadata: Json;
};

function truncate(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
  const maximum = chatAttachmentProcessingLimits.maxExtractedCharactersPerFile;
  return {
    value: normalized.slice(0, maximum),
    truncated: normalized.length > maximum,
  };
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function extractCsv(buffer: Buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiters = [",", ";", "\t"];
  const delimiter = delimiters
    .map((candidate) => ({
      candidate,
      count: parseCsvLine(firstLine, candidate).length,
    }))
    .sort((left, right) => right.count - left.count)[0]?.candidate ?? ",";
  const allLines = source.split(/\r?\n/).filter(Boolean);
  const selected = allLines.slice(0, chatAttachmentProcessingLimits.maxCsvRows);
  const rows = selected.map((line) =>
    parseCsvLine(line, delimiter)
      .slice(0, chatAttachmentProcessingLimits.maxCsvColumns)
      .map((cell) => cell.replace(/\s+/g, " ")),
  );
  const rendered = rows
    .map((row, index) => `${index === 0 ? "Columnas" : `Fila ${index}`}: ${row.join(" | ")}`)
    .join("\n");
  const result = truncate(rendered);
  return {
    ...result,
    metadata: {
      delimiter: delimiter === "\t" ? "tab" : delimiter,
      rowsProcessed: rows.length,
      rowsTotal: allLines.length,
      sampled: allLines.length > rows.length,
    },
  };
}

export async function processAttachment(
  buffer: Buffer,
  extension: ChatAttachmentExtension,
): Promise<AttachmentProcessingResult> {
  if (extension === "png" || extension === "jpg" || extension === "jpeg" || extension === "webp") {
    try {
      const image = sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
      const metadata = await image.metadata();
      const storageBuffer = await image
        .resize({
          width: chatAttachmentProcessingLimits.maxImageDimension,
          height: chatAttachmentProcessingLimits.maxImageDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 84 })
        .toBuffer();
      return {
        storageBuffer,
        storageMimeType: "image/webp",
        extractedContent: "",
        truncated: false,
        extractionStatus: "not_applicable",
        metadata: {
          originalWidth: metadata.width ?? null,
          originalHeight: metadata.height ?? null,
          optimized: true,
          exifRemoved: true,
        },
      };
    } catch {
      throw new AttachmentError("CORRUPT_FILE");
    }
  }

  if (extension === "pdf") {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const pageLimit = Math.min(pdf.numPages, chatAttachmentProcessingLimits.maxPdfPages);
      const pages: string[] = [];
      for (let page = 1; page <= pageLimit; page += 1) {
        const pageProxy = await pdf.getPage(page);
        const content = await pageProxy.getTextContent();
        pages.push(
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .filter(Boolean)
            .join(" "),
        );
      }
      const result = truncate(pages.join("\n\n"));
      return {
        storageBuffer: buffer,
        storageMimeType: "application/pdf",
        extractedContent: result.value,
        truncated: result.truncated || pdf.numPages > pageLimit,
        extractionStatus: result.value ? "ready" : "failed",
        metadata: {
          pagesProcessed: pageLimit,
          pagesTotal: pdf.numPages,
          partial: result.truncated || pdf.numPages > pageLimit,
          noExtractableText: !result.value,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message.toLocaleLowerCase("en") : "";
      if (message.includes("password")) throw new AttachmentError("PROTECTED_DOCUMENT");
      throw new AttachmentError("CORRUPT_FILE");
    }
  }

  if (extension === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const content = truncate(result.value);
      return {
        storageBuffer: buffer,
        storageMimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extractedContent: content.value,
        truncated: content.truncated,
        extractionStatus: content.value ? "ready" : "failed",
        metadata: {
          warnings: result.messages.length,
          partial: content.truncated,
          noExtractableText: !content.value,
        },
      };
    } catch {
      throw new AttachmentError("CORRUPT_FILE");
    }
  }

  if (extension === "csv") {
    const csv = extractCsv(buffer);
    return {
      storageBuffer: buffer,
      storageMimeType: "text/csv",
      extractedContent: csv.value,
      truncated: csv.truncated || Boolean(csv.metadata.sampled),
      extractionStatus: csv.value ? "ready" : "failed",
      metadata: { ...csv.metadata, partial: csv.truncated || Boolean(csv.metadata.sampled) },
    };
  }

  const content = truncate(buffer.toString("utf8"));
  return {
    storageBuffer: buffer,
    storageMimeType: extension === "md" ? "text/markdown" : "text/plain",
    extractedContent: content.value,
    truncated: content.truncated,
    extractionStatus: content.value ? "ready" : "failed",
    metadata: { partial: content.truncated, noExtractableText: !content.value },
  };
}
