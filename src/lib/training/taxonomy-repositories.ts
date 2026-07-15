import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TrainingCategory, TrainingConcept, TrainingFormat, TrainingLearningPath,
  TrainingLearningPathModule, TrainingLearningPathWithModules, TrainingModuleItem,
  TrainingPathFilters, TrainingSkill, TrainingSkillFilters, TrainingSubcategory,
  TrainingTaxonomyTree, TrainingVisualAsset,
} from "@/lib/training/taxonomy-model";

type Row = Record<string, unknown>;
const stringValue = (row: Row, key: string) => String(row[key] ?? "");
const nullableString = (row: Row, key: string) => row[key] == null ? null : String(row[key]);
const numberValue = (row: Row, key: string) => Number(row[key] ?? 0);
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];

function assertQuery(error: { message: string } | null) {
  if (error) throw new Error(`TRAINING_REPOSITORY_ERROR: ${error.message}`);
}

const mapCategory = (row: Row): TrainingCategory => ({
  id: stringValue(row,"id"), slug: stringValue(row,"slug"), name: stringValue(row,"name"),
  shortDescription: nullableString(row,"short_description"), description: nullableString(row,"description"), icon: nullableString(row,"icon"),
  sortOrder: numberValue(row,"sort_order"), status: stringValue(row,"status") as TrainingCategory["status"], minimumPlan: stringValue(row,"minimum_plan") as TrainingCategory["minimumPlan"],
  createdAt: stringValue(row,"created_at"), updatedAt: stringValue(row,"updated_at"),
});
const mapSubcategory = (row: Row): TrainingSubcategory => ({
  id:stringValue(row,"id"),categoryId:stringValue(row,"category_id"),slug:stringValue(row,"slug"),name:stringValue(row,"name"),description:nullableString(row,"description"),sortOrder:numberValue(row,"sort_order"),status:stringValue(row,"status") as TrainingSubcategory["status"],createdAt:stringValue(row,"created_at"),updatedAt:stringValue(row,"updated_at"),
});
const mapSkill = (row: Row): TrainingSkill => ({
  id:stringValue(row,"id"),categoryId:stringValue(row,"category_id"),subcategoryId:nullableString(row,"subcategory_id"),slug:stringValue(row,"slug"),name:stringValue(row,"name"),description:nullableString(row,"description"),learningObjectives:Array.isArray(row.learning_objectives) ? row.learning_objectives.map(String) : [],difficultyStart:stringValue(row,"difficulty_start") as TrainingSkill["difficultyStart"],difficultyMax:stringValue(row,"difficulty_max") as TrainingSkill["difficultyMax"],status:stringValue(row,"status") as TrainingSkill["status"],minimumPlan:stringValue(row,"minimum_plan") as TrainingSkill["minimumPlan"],createdAt:stringValue(row,"created_at"),updatedAt:stringValue(row,"updated_at"),
});
const mapConcept = (row: Row): TrainingConcept => ({
  id:stringValue(row,"id"),skillId:stringValue(row,"skill_id"),slug:stringValue(row,"slug"),name:stringValue(row,"name"),description:nullableString(row,"description"),editorialSummary:nullableString(row,"editorial_summary"),explanation:nullableString(row,"explanation"),recommendedCognitiveLevel:stringValue(row,"recommended_cognitive_level") as TrainingConcept["recommendedCognitiveLevel"],status:stringValue(row,"status") as TrainingConcept["status"],minimumPlan:stringValue(row,"minimum_plan") as TrainingConcept["minimumPlan"],createdAt:stringValue(row,"created_at"),updatedAt:stringValue(row,"updated_at"),
});
const mapFormat = (row: Row): TrainingFormat => ({ id:stringValue(row,"id"),slug:stringValue(row,"slug"),name:stringValue(row,"name"),description:stringValue(row,"description"),icon:nullableString(row,"icon"),status:stringValue(row,"status") as TrainingFormat["status"],createdAt:stringValue(row,"created_at"),updatedAt:stringValue(row,"updated_at") || stringValue(row,"created_at") });
const mapPath = (row: Row): TrainingLearningPath => ({ id:stringValue(row,"id"),slug:stringValue(row,"slug"),name:stringValue(row,"name"),promise:stringValue(row,"promise"),description:stringValue(row,"description"),estimatedMinutes:numberValue(row,"estimated_minutes"),difficulty:stringValue(row,"difficulty").replace("beginner","fundamentals").replace("intermediate","application") as TrainingLearningPath["difficulty"],minimumPlan:stringValue(row,"minimum_plan") as TrainingLearningPath["minimumPlan"],status:stringValue(row,"status") as TrainingLearningPath["status"],createdAt:stringValue(row,"created_at"),updatedAt:stringValue(row,"updated_at") });
const mapModule = (row: Row): TrainingLearningPathModule => ({ id:stringValue(row,"id"),pathId:stringValue(row,"path_id"),slug:stringValue(row,"slug"),title:stringValue(row,"title"),description:nullableString(row,"description"),sortOrder:numberValue(row,"sort_order"),estimatedMinutes:row.estimated_minutes == null ? null : numberValue(row,"estimated_minutes"),minimumPlan:stringValue(row,"minimum_plan") as TrainingLearningPathModule["minimumPlan"],status:stringValue(row,"status") as TrainingLearningPathModule["status"],createdAt:stringValue(row,"created_at"),updatedAt:stringValue(row,"updated_at") });

function mapModuleItem(row: Row): TrainingModuleItem {
  const base = { id:stringValue(row,"id"),moduleId:stringValue(row,"module_id"),sortOrder:numberValue(row,"sort_order"),isRequired:Boolean(row.is_required),unlockRule:(row.unlock_rule ?? null) as Record<string,unknown>|null,minimumMastery:numberValue(row,"minimum_mastery") };
  const itemType=stringValue(row,"item_type");
  if(itemType==="skill_session") return {...base,itemType,skillId:stringValue(row,"skill_id")};
  if(itemType==="concept_session") return {...base,itemType,conceptId:stringValue(row,"concept_id")};
  if(itemType==="template") return {...base,itemType,templateId:stringValue(row,"template_id")};
  if(itemType==="roleplay") return {...base,itemType,roleplayScenarioId:stringValue(row,"roleplay_scenario_id")};
  return {...base,itemType:itemType==="review" ? "review" : "exercise",exerciseId:stringValue(row,"exercise_id")};
}

export interface TrainingTaxonomyRepository {
  getCategories(): Promise<TrainingCategory[]>;
  getCategoryBySlug(slug:string): Promise<TrainingCategory|null>;
  getSubcategories(categoryId:string): Promise<TrainingSubcategory[]>;
  getSkills(filters:TrainingSkillFilters): Promise<TrainingSkill[]>;
  getSkillBySlug(slug:string): Promise<TrainingSkill|null>;
  getConcepts(skillId:string): Promise<TrainingConcept[]>;
  getConceptById(id:string): Promise<TrainingConcept|null>;
  getTaxonomyTree(): Promise<TrainingTaxonomyTree>;
}
export interface TrainingLearningPathRepository {
  getPaths(filters:TrainingPathFilters): Promise<TrainingLearningPath[]>;
  getPathBySlug(slug:string): Promise<TrainingLearningPathWithModules|null>;
  getModules(pathId:string): Promise<TrainingLearningPathModule[]>;
  getModuleItems(moduleId:string): Promise<TrainingModuleItem[]>;
}
export interface TrainingFormatRepository { getFormats():Promise<TrainingFormat[]>; getExerciseFormats(exerciseId:string):Promise<TrainingFormat[]>; }
export interface TrainingVisualAssetRepository { getAsset(id:string):Promise<TrainingVisualAsset|null>; getApprovedAssets():Promise<TrainingVisualAsset[]>; }

export class SupabaseTrainingTaxonomyRepository implements TrainingTaxonomyRepository {
  constructor(private readonly db:SupabaseClient) {}
  async getCategories(){const {data,error}=await this.db.from("training_categories").select("*").eq("status","published").order("sort_order");assertQuery(error);return rows(data).map(mapCategory);}
  async getCategoryBySlug(slug:string){const {data,error}=await this.db.from("training_categories").select("*").eq("slug",slug).eq("status","published").maybeSingle();assertQuery(error);return data ? mapCategory(data as Row) : null;}
  async getSubcategories(categoryId:string){const {data,error}=await this.db.from("training_subcategories").select("*").eq("category_id",categoryId).eq("status","published").order("sort_order");assertQuery(error);return rows(data).map(mapSubcategory);}
  async getSkills(filters:TrainingSkillFilters){let query=this.db.from("training_skills").select("*");if(filters.categoryId)query=query.eq("category_id",filters.categoryId);if(filters.subcategoryId)query=query.eq("subcategory_id",filters.subcategoryId);query=query.eq("status",filters.status??"published");if(filters.minimumPlan)query=query.eq("minimum_plan",filters.minimumPlan);const {data,error}=await query.order("name");assertQuery(error);return rows(data).map(mapSkill);}
  async getSkillBySlug(slug:string){const {data,error}=await this.db.from("training_skills").select("*").eq("slug",slug).eq("status","published").maybeSingle();assertQuery(error);return data ? mapSkill(data as Row) : null;}
  async getConcepts(skillId:string){const {data,error}=await this.db.from("training_concepts").select("*").eq("skill_id",skillId).eq("status","published").order("name");assertQuery(error);return rows(data).map(mapConcept);}
  async getConceptById(id:string){const {data,error}=await this.db.from("training_concepts").select("*").eq("id",id).eq("status","published").maybeSingle();assertQuery(error);return data ? mapConcept(data as Row) : null;}
  async getTaxonomyTree(){
    const categories=await this.getCategories();
    return {categories:await Promise.all(categories.map(async category=>{
      const [subcategories,skills]=await Promise.all([
        this.getSubcategories(category.id),
        this.getSkills({categoryId:category.id}),
      ]);
      const skillsWithConcepts=await Promise.all(
        skills.map(async skill=>({...skill,concepts:await this.getConcepts(skill.id)})),
      );
      return {...category,subcategories,skills:skillsWithConcepts};
    }))};
  }
}

export class SupabaseTrainingLearningPathRepository implements TrainingLearningPathRepository {
  constructor(private readonly db:SupabaseClient) {}
  async getPaths(filters:TrainingPathFilters){let query=this.db.from("training_learning_paths").select("*").eq("status",filters.status??"published");if(filters.minimumPlan)query=query.eq("minimum_plan",filters.minimumPlan);const {data,error}=await query.order("name");assertQuery(error);return rows(data).map(mapPath);}
  async getPathBySlug(slug:string){const {data,error}=await this.db.from("training_learning_paths").select("*").eq("slug",slug).eq("status","published").maybeSingle();assertQuery(error);if(!data)return null;const path=mapPath(data as Row);const modules=await this.getModules(path.id);return {...path,modules:await Promise.all(modules.map(async module=>({...module,items:await this.getModuleItems(module.id)})))};}
  async getModules(pathId:string){const {data,error}=await this.db.from("training_learning_path_modules").select("*").eq("path_id",pathId).eq("status","published").order("sort_order");assertQuery(error);return rows(data).map(mapModule);}
  async getModuleItems(moduleId:string){const {data,error}=await this.db.from("training_learning_path_module_items").select("*").eq("module_id",moduleId).order("sort_order");assertQuery(error);return rows(data).map(mapModuleItem);}
}

export class SupabaseTrainingFormatRepository implements TrainingFormatRepository {
  constructor(private readonly db:SupabaseClient) {}
  async getFormats(){const {data,error}=await this.db.from("training_formats").select("*").eq("status","published").order("name");assertQuery(error);return rows(data).map(mapFormat);}
  async getExerciseFormats(exerciseId:string){const {data,error}=await this.db.from("training_exercise_formats").select("training_formats(*)").eq("exercise_id",exerciseId);assertQuery(error);return rows(data).flatMap(row=>row.training_formats ? [mapFormat(row.training_formats as Row)] : []);}
}

const mapAsset=(row:Row):TrainingVisualAsset=>({id:stringValue(row,"id"),storagePath:stringValue(row,"storage_path"),mimeType:stringValue(row,"mime_type") as TrainingVisualAsset["mimeType"],width:numberValue(row,"width"),height:numberValue(row,"height"),altText:stringValue(row,"alt_text"),sourceType:stringValue(row,"source_type") as TrainingVisualAsset["sourceType"],copyrightStatus:stringValue(row,"copyright_status") as TrainingVisualAsset["copyrightStatus"],createdBy:nullableString(row,"created_by"),createdAt:stringValue(row,"created_at")});
export class SupabaseTrainingVisualAssetRepository implements TrainingVisualAssetRepository {
  constructor(private readonly db:SupabaseClient) {}
  async getAsset(id:string){const {data,error}=await this.db.from("training_visual_assets").select("*").eq("id",id).eq("copyright_status","approved").maybeSingle();assertQuery(error);return data ? mapAsset(data as Row) : null;}
  async getApprovedAssets(){const {data,error}=await this.db.from("training_visual_assets").select("*").eq("copyright_status","approved").order("created_at",{ascending:false});assertQuery(error);return rows(data).map(mapAsset);}
}
