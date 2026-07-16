"use client";

import { editorialRequest } from "@/lib/training/editorial-api";
import type { EditorialResourceType } from "@/lib/training/editorial-content-schemas";

export type EditorialListItem = {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  status: string;
  minimum_plan?: string;
  updated_at?: string;
};

export type EditorialDetail = {
  id: string;
  sourceStatus: string;
  draft: Record<string, unknown>;
  version: { id: string; version: number; status: string } | null;
  history: Array<{
    id: string;
    version: number;
    status: string;
    change_reason?: string | null;
    created_at: string;
    published_at?: string | null;
  }>;
  role: string;
};

export type EditorialMetadata = {
  categories: Array<{ id: string; name: string; slug: string }>;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    category_id: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    slug: string;
    category_id: string;
  }>;
  concepts: Array<{ id: string; name: string; slug: string; skill_id: string }>;
  formats: Array<{ id: string; name: string; slug: string }>;
  exercises: Array<{
    id: string;
    title: string;
    minimum_plan: string;
    cognitive_level: string;
  }>;
  templates: Array<{ id: string; name: string; minimum_plan: string }>;
  scenarios: Array<{
    id: string;
    public_title: string;
    minimum_plan: string;
    level: string;
  }>;
  books: Array<{ id: string; title: string; author: string }>;
};

const base = (resource: EditorialResourceType) =>
  `/api/admin/training/editorial/${resource}`;

export const listEditorial = (resource: EditorialResourceType) =>
  editorialRequest<{ items: EditorialListItem[]; role: string }>(
    base(resource),
  );
export const getEditorial = (resource: EditorialResourceType, id: string) =>
  editorialRequest<EditorialDetail>(`${base(resource)}/${id}`);
export const createEditorial = (
  resource: EditorialResourceType,
  body: unknown,
) =>
  editorialRequest<{ id: string }>(base(resource), {
    method: "POST",
    body: JSON.stringify(body),
  });
export const saveEditorial = (
  resource: EditorialResourceType,
  id: string,
  body: unknown,
) =>
  editorialRequest<{ id: string; version: number; status: string }>(
    `${base(resource)}/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
export const actEditorial = (
  resource: EditorialResourceType,
  id: string,
  body: { action: string; versionId?: string; reason?: string },
) =>
  editorialRequest<Record<string, unknown>>(`${base(resource)}/${id}/actions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const validateEditorial = () =>
  editorialRequest<{
    issues: Array<{
      severity: "error" | "warning" | "info";
      code: string;
      entityType?: string;
      entityId?: string;
      message: string;
    }>;
    summary: { errors: number; warnings: number; info: number };
  }>("/api/admin/training/editorial/validation");
export const getEditorialMetadata = () =>
  editorialRequest<EditorialMetadata>("/api/admin/training/metadata");
