import type { LearningPath, TaxonomyCategory } from "@/lib/training/taxonomy";

export type TaxonomyValidationIssue = {
  severity: "error" | "warning";
  code: string;
  entity: string;
  message: string;
};

export function hasPrerequisiteCycle(
  relations: Array<{ item: string; prerequisite: string }>,
) {
  const graph = new Map<string, string[]>();
  for (const relation of relations) {
    graph.set(relation.item, [
      ...(graph.get(relation.item) ?? []),
      relation.prerequisite,
    ]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...graph.keys()].some(visit);
}

export function validateTaxonomy(
  categories: TaxonomyCategory[],
  paths: LearningPath[],
) {
  const issues: TaxonomyValidationIssue[] = [];
  const slugs = new Set<string>();
  const registerSlug = (slug: string, entity: string) => {
    if (slugs.has(slug))
      issues.push({
        severity: "error",
        code: "DUPLICATE_SLUG",
        entity,
        message: `El slug ${slug} está duplicado.`,
      });
    slugs.add(slug);
  };
  for (const category of categories) {
    registerSlug(category.slug, category.name);
    if (!category.skills.length)
      issues.push({
        severity: "error",
        code: "CATEGORY_WITHOUT_SKILLS",
        entity: category.name,
        message: "La categoría no tiene habilidades.",
      });
    for (const subcategory of category.subcategories) {
      if (!category.skills.some((item) => item.subcategory === subcategory))
        issues.push({
          severity: "warning",
          code: "EMPTY_SUBCATEGORY",
          entity: subcategory,
          message: "La subcategoría aún no tiene una habilidad principal.",
        });
    }
    for (const skill of category.skills) {
      registerSlug(skill.slug, skill.name);
      if (skill.concepts.length < 3)
        issues.push({
          severity: "error",
          code: "SKILL_WITHOUT_CONCEPTS",
          entity: skill.name,
          message: "La habilidad necesita al menos tres conceptos.",
        });
    }
  }
  for (const path of paths) {
    registerSlug(path.slug, path.name);
    if (!path.modules.length)
      issues.push({
        severity: "error",
        code: "PATH_WITHOUT_MODULES",
        entity: path.name,
        message: "La ruta no tiene módulos.",
      });
    if (!categories.some((category) => category.slug === path.categorySlug))
      issues.push({
        severity: "error",
        code: "PATH_WITHOUT_CATEGORY",
        entity: path.name,
        message: "La ruta no está asociada con una categoría válida.",
      });
  }
  return issues;
}
