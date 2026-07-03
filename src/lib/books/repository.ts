import { catalogBooks, filterBooks, getBookBySlug } from "@/data/books";
import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  Book,
  BookActivity,
  BookCategory,
  BookSection,
  CoverConfig,
  KeyPoint,
} from "@/types";

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
    return filterBooks(catalogBooks, filters.q ?? "", filters.category ?? "Todos");
  }

  async getBySlug(slug: string): Promise<Book | null> {
    return getBookBySlug(slug);
  }
}

type SupabaseBookRow = Database["public"]["Tables"]["books"]["Row"] & {
  book_sections?: Array<Database["public"]["Tables"]["book_sections"]["Row"]>;
};
type SupabaseBookSectionRow =
  Database["public"]["Tables"]["book_sections"]["Row"];

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

  const sections = [...(row.book_sections ?? [])].sort(
    (first, second) => first.position - second.position,
  );
  const analysis = sections
    .filter((section) => section.section_type === "analysis")
    .map((section): BookSection => ({
      title: section.title,
      content:
        typeof section.content === "object" &&
        section.content !== null &&
        !Array.isArray(section.content) &&
        typeof section.content.content === "string"
          ? section.content.content
          : "",
    }));
  const keyPoints = sections
    .filter((section) => section.section_type === "key_point")
    .map((section, index): KeyPoint => {
      const content =
        typeof section.content === "object" &&
        section.content !== null &&
        !Array.isArray(section.content)
          ? section.content
          : {};

      return {
        number:
          typeof content.number === "number" ? content.number : index + 1,
        title: section.title,
        explanation:
          typeof content.explanation === "string" ? content.explanation : "",
        example: typeof content.example === "string" ? content.example : "",
        action: typeof content.action === "string" ? content.action : "",
        limitation:
          typeof content.limitation === "string" ? content.limitation : "",
      };
    });
  const activities = sections
    .filter((section) => section.section_type === "activity")
    .map((section): BookActivity => {
      const content =
        typeof section.content === "object" &&
        section.content !== null &&
        !Array.isArray(section.content)
          ? section.content
          : {};
      const type =
        content.type === "checklist" ||
        content.type === "scenario" ||
        content.type === "reflection"
          ? content.type
          : "reflection";

      return {
        title: section.title,
        prompt: typeof content.prompt === "string" ? content.prompt : "",
        type,
        options: Array.isArray(content.options)
          ? content.options.filter(
              (option): option is string => typeof option === "string",
            )
          : undefined,
      };
    });
  const conclusionSection = sections.find(
    (section) => section.section_type === "conclusion",
  );
  const conclusionContent =
    conclusionSection &&
    typeof conclusionSection.content === "object" &&
    conclusionSection.content !== null &&
    !Array.isArray(conclusionSection.content) &&
    typeof conclusionSection.content.content === "string"
      ? conclusionSection.content.content
      : "";

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
    analysis,
    keyPoints,
    activities,
    conclusion: conclusionContent,
  };
}

export class SupabaseBookRepository implements BookRepository {
  private async listSectionsByBookIds(
    bookIds: string[],
  ): Promise<Map<string, SupabaseBookSectionRow[]>> {
    const sectionsByBookId = new Map<string, SupabaseBookSectionRow[]>();

    if (bookIds.length === 0) {
      return sectionsByBookId;
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("book_sections")
      .select("*")
      .in("book_id", bookIds)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    for (const section of data ?? []) {
      const currentSections = sectionsByBookId.get(section.book_id) ?? [];
      currentSections.push(section);
      sectionsByBookId.set(section.book_id, currentSections);
    }

    return sectionsByBookId;
  }

  async list(filters: BookFilters = {}): Promise<Book[]> {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("books")
      .select("*")
      .eq("is_published", true);

    if (filters.category && filters.category !== "Todos") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const books = data ?? [];
    const sectionsByBookId = await this.listSectionsByBookIds(
      books.map((book) => book.id),
    );

    return filterBooks(
      books.map((book) =>
        mapBook({
          ...book,
          book_sections: sectionsByBookId.get(book.id) ?? [],
        }),
      ),
      filters.q ?? "",
      "Todos",
    );
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

    if (!data) {
      return null;
    }

    const sectionsByBookId = await this.listSectionsByBookIds([data.id]);

    return mapBook({
      ...data,
      book_sections: sectionsByBookId.get(data.id) ?? [],
    });
  }
}

export function createBookRepository(): BookRepository {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockBookRepository();
  }

  return new SupabaseBookRepository();
}
