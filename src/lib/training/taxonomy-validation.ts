import type { LearningPath, TaxonomyCategory } from "@/lib/training/taxonomy";

export type TaxonomyValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  entity: string;
  entityType?: string;
  entityId?: string;
  message: string;
  suggestedFix?: string;
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

export type StructuralTaxonomyInput = {
  categories: Array<{ id: string; slug: string; subcategoryIds: string[]; skillIds: string[] }>;
  subcategories: Array<{ id: string; slug: string; categoryId: string; skillIds: string[] }>;
  skills: Array<{ id: string; slug: string; categoryId: string; conceptIds: string[]; minimumPlan: string }>;
  concepts: Array<{ id: string; slug: string; skillId: string; cognitiveLevel: string }>;
  paths: Array<{ id: string; slug: string; moduleIds: string[] }>;
  modules: Array<{ id: string; pathId: string; itemIds: string[] }>;
  moduleItems: Array<{ id: string; moduleId: string; itemType: string; referenceCount: number }>;
  exercises: Array<{ id: string; cognitiveLevel: string; primaryFormatCount: number; formatCount: number }>;
  assets: Array<{ id: string; altText: string; copyrightStatus: string; usedByPublishedContent: boolean }>;
  bookRelations: Array<{ id: string; bookExists: boolean }>;
  skillPrerequisites: Array<{ item: string; prerequisite: string }>;
  conceptPrerequisites: Array<{ item: string; prerequisite: string }>;
};

const validPlans = new Set(["free", "pro", "unlimited"]);
const validLevels = new Set(["recognition", "understanding", "application", "analysis", "transfer", "synthesis"]);

export function validateTaxonomyStructure(input: StructuralTaxonomyInput) {
  const issues: TaxonomyValidationIssue[] = [];
  const add = (code: string, entityType: string, entityId: string, message: string, suggestedFix?: string) =>
    issues.push({ severity: "error", code, entity: entityId, entityType, entityId, message, suggestedFix });
  const seen = new Map<string,string>();
  const register = (type:string,id:string,slug:string) => { const previous=seen.get(`${type}:${slug}`); if(previous)add("DUPLICATE_SLUG",type,id,`El slug ${slug} está duplicado con ${previous}.`);else seen.set(`${type}:${slug}`,id); };
  input.categories.forEach(item=>{register("category",item.id,item.slug);if(!item.subcategoryIds.length)add("CATEGORY_WITHOUT_SUBCATEGORIES","category",item.id,"La categoría no tiene subcategorías.");if(!item.skillIds.length)add("CATEGORY_WITHOUT_SKILLS","category",item.id,"La categoría no tiene habilidades.");});
  input.subcategories.forEach(item=>{register("subcategory",item.id,item.slug);if(!item.skillIds.length)add("EMPTY_SUBCATEGORY","subcategory",item.id,"La subcategoría no tiene habilidades.");if(!input.categories.some(category=>category.id===item.categoryId))add("ORPHAN_SUBCATEGORY","subcategory",item.id,"La categoría asociada no existe.");});
  input.skills.forEach(item=>{register("skill",item.id,item.slug);if(!item.conceptIds.length)add("SKILL_WITHOUT_CONCEPTS","skill",item.id,"La habilidad no tiene conceptos.");if(!validPlans.has(item.minimumPlan))add("INVALID_PLAN","skill",item.id,"El plan mínimo no es válido.");});
  input.concepts.forEach(item=>{register("concept",item.id,item.slug);if(!input.skills.some(skill=>skill.id===item.skillId))add("CONCEPT_WITHOUT_SKILL","concept",item.id,"La habilidad asociada no existe.");if(!validLevels.has(item.cognitiveLevel))add("INVALID_COGNITIVE_LEVEL","concept",item.id,"El nivel cognitivo no es válido.");});
  input.paths.forEach(item=>{register("path",item.id,item.slug);if(!item.moduleIds.length)add("PATH_WITHOUT_MODULES","path",item.id,"La ruta no tiene módulos.");});
  input.modules.forEach(item=>{if(!item.itemIds.length)add("EMPTY_MODULE","module",item.id,"El módulo no tiene items.");if(!input.paths.some(path=>path.id===item.pathId))add("ORPHAN_MODULE","module",item.id,"La ruta asociada no existe.");});
  input.moduleItems.forEach(item=>{if(item.referenceCount!==1)add("INCONSISTENT_MODULE_ITEM","module_item",item.id,"El item debe tener exactamente una referencia compatible con su tipo.");if(!input.modules.some(module=>module.id===item.moduleId))add("ORPHAN_MODULE_ITEM","module_item",item.id,"El módulo asociado no existe.");});
  input.exercises.forEach(item=>{if(!item.formatCount)add("EXERCISE_WITHOUT_FORMAT","exercise",item.id,"El ejercicio no tiene formato.");if(item.primaryFormatCount>1)add("MULTIPLE_PRIMARY_FORMATS","exercise",item.id,"El ejercicio tiene más de un formato principal.");if(!validLevels.has(item.cognitiveLevel))add("INVALID_COGNITIVE_LEVEL","exercise",item.id,"El nivel cognitivo no es válido.");});
  input.assets.forEach(item=>{if(!item.altText.trim())add("ASSET_WITHOUT_ALT","asset",item.id,"El asset no tiene texto alternativo.");if(item.usedByPublishedContent&&item.copyrightStatus!=="approved")add("UNAPPROVED_PUBLISHED_ASSET","asset",item.id,"Contenido publicado usa un asset no aprobado.");});
  input.bookRelations.forEach(item=>{if(!item.bookExists)add("MISSING_BOOK_RELATION","book_relation",item.id,"La relación apunta a un libro inexistente.");});
  if(hasPrerequisiteCycle(input.skillPrerequisites))add("CYCLIC_SKILL_PREREQUISITE","skill_prerequisite","graph","Los prerrequisitos de habilidades contienen un ciclo.");
  if(hasPrerequisiteCycle(input.conceptPrerequisites))add("CYCLIC_CONCEPT_PREREQUISITE","concept_prerequisite","graph","Los prerrequisitos de conceptos contienen un ciclo.");
  return issues;
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
