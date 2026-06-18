import { demoBooks, filterBooks, getBookBySlug } from "@/data/books";
import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { Book, BookCategory, CoverConfig } from "@/types";

export type BookFilters = {
  q?: string;
  category?: "Todos" | BookCategory;
};

export interface BookRepository {
  list(filters?: BookFilters): Promise<Book[]>;
  getBySlug(slug: string): Promise<Book | null>;
}

export class MockBookRepository implements BookRepository {
  async list(filters: BookFilters = {}): Promise<Book[]> {
    return filterBooks(demoBooks, filters.q ?? "", filters.category ?? "Todos");
  }

  async getBySlug(slug: string): Promise<Book | null> {
    return getBookBySlug(slug);
  }
}

type SupabaseBookRow = Database["public"]["Tables"]["books"]["Row"] & {
  book_sections?: Array<Database["public"]["Tables"]["book_sections"]["Row"]>;
};

function isCoverConfig(value: Json): value is CoverConfig {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.variant === "string" &&
    ["orb", "steps", "bolt", "growth", "people", "grid"].includes(
      candidate.variant,
    ) &&
    typeof candidate.gradient === "string" &&
    typeof candidate.accent === "string"
  );
}

function mapBook(row: SupabaseBookRow): Book {
  const fallbackCover: CoverConfig = {
    variant: "orb",
    gradient: "from-brand-blue via-brand-purple to-brand-pink",
    accent: "text-brand-purple",
  };
  const cover = isCoverConfig(row.cover_config)
    ? row.cover_config
    : fallbackCover;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    category: row.category as BookCategory,
    description: row.description,
    readingTime: row.reading_time,
    difficulty: row.difficulty as Book["difficulty"],
    tags: row.tags,
    cover,
    isPublished: row.is_published,
    isDemoContent: false,
    purchaseUrl: row.purchase_url ?? undefined,
    analysis: [],
    keyPoints: [],
    activities: [],
    conclusion: "",
  };
}

export class SupabaseBookRepository implements BookRepository {
  async list(filters: BookFilters = {}): Promise<Book[]> {
    const supabase = createServerSupabaseClient();
    let query = supabase.from("books").select("*").eq("is_published", true);

    if (filters.category && filters.category !== "Todos") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return filterBooks((data ?? []).map(mapBook), filters.q ?? "", "Todos");
  }

  async getBySlug(slug: string): Promise<Book | null> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapBook(data) : null;
  }
}

export function createBookRepository(): BookRepository {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockBookRepository();
  }

  return new SupabaseBookRepository();
}
