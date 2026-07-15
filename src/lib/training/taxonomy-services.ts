import type { SupabaseClient } from "@supabase/supabase-js";

import { hasPrerequisiteCycle } from "@/lib/training/taxonomy-validation";
import type { TrainingPlan, TrainingTaxonomyStatus, TrainingVisualAsset } from "@/lib/training/taxonomy-model";
import type { TrainingLearningPathRepository, TrainingTaxonomyRepository, TrainingVisualAssetRepository } from "@/lib/training/taxonomy-repositories";
import { createTrainingPrerequisiteSchema, createTrainingVisualAssetSchema, taxonomySlugSchema } from "@/lib/training/taxonomy-schemas";

const planRank:Record<TrainingPlan,number>={free:0,pro:1,unlimited:2};
export class TrainingPlanEligibilityService {
  canView(resource:{status:TrainingTaxonomyStatus;minimumPlan:TrainingPlan},plan:TrainingPlan){return resource.status==="published" && planRank[plan]>=planRank[resource.minimumPlan];}
  requiredPlan(resource:{minimumPlan:TrainingPlan}){return resource.minimumPlan;}
}
export class TrainingTaxonomyService {
  constructor(private readonly repository:TrainingTaxonomyRepository){}
  getTree(){return this.repository.getTaxonomyTree();}
  getCategory(slug:string){return this.repository.getCategoryBySlug(taxonomySlugSchema.parse(slug));}
}
export class TrainingPathService {
  constructor(private readonly repository:TrainingLearningPathRepository){}
  getPath(slug:string){return this.repository.getPathBySlug(taxonomySlugSchema.parse(slug));}
}
export class TrainingPrerequisiteService {
  constructor(private readonly db:SupabaseClient){}
  assertAcyclic(relations:Array<{item:string;prerequisite:string}>){if(hasPrerequisiteCycle(relations))throw new Error("TRAINING_PREREQUISITE_CYCLE");}
  async addSkillPrerequisite(input:{itemId:string;prerequisiteId:string;minimumMastery:number}){const value=createTrainingPrerequisiteSchema.parse(input);const {data:cycle,error:cycleError}=await this.db.rpc("training_skill_prerequisite_has_cycle",{p_skill_id:value.itemId,p_prerequisite_id:value.prerequisiteId});if(cycleError)throw new Error(cycleError.message);if(cycle)throw new Error("TRAINING_PREREQUISITE_CYCLE");const {error}=await this.db.from("training_skill_prerequisites").upsert({skill_id:value.itemId,prerequisite_skill_id:value.prerequisiteId,minimum_mastery:value.minimumMastery});if(error)throw new Error(error.message);}
}
export class TrainingVisualAssetService {
  constructor(private readonly repository:TrainingVisualAssetRepository,private readonly db:SupabaseClient){}
  getApprovedAssets(){return this.repository.getApprovedAssets();}
  async create(input:Omit<TrainingVisualAsset,"id"|"createdAt"|"createdBy">){const value=createTrainingVisualAssetSchema.parse(input);const {data,error}=await this.db.from("training_visual_assets").insert({storage_path:value.storagePath,mime_type:value.mimeType,width:value.width,height:value.height,alt_text:value.altText,source_type:value.sourceType,copyright_status:value.copyrightStatus}).select("id").single();if(error)throw new Error(error.message);return String(data.id);}
}

