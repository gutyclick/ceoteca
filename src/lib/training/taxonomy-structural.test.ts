import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { TrainingPlanEligibilityService } from "@/lib/training/taxonomy-services";
import { createTrainingModuleItemSchema, createTrainingPrerequisiteSchema, createTrainingSkillSchema, createTrainingVisualAssetSchema } from "@/lib/training/taxonomy-schemas";
import { validateTaxonomyStructure } from "@/lib/training/taxonomy-validation";

describe("contrato estructural de Training",()=>{
  it("valida dificultad, referencias discriminadas, mastery y assets",()=>{
    expect(createTrainingSkillSchema.parse({slug:"cerrar-con-claridad",name:"Cerrar con claridad",status:"published",minimumPlan:"pro",categoryId:"00000000-0000-4000-8000-000000000001",learningObjectives:[],difficultyStart:"application",difficultyMax:"advanced"}).difficultyMax).toBe("advanced");
    expect(()=>createTrainingModuleItemSchema.parse({moduleId:"00000000-0000-4000-8000-000000000001",itemType:"skill_session",exerciseId:"00000000-0000-4000-8000-000000000002",sortOrder:1,minimumMastery:.5})).toThrow();
    expect(()=>createTrainingPrerequisiteSchema.parse({itemId:"00000000-0000-4000-8000-000000000001",prerequisiteId:"00000000-0000-4000-8000-000000000001",minimumMastery:.6})).toThrow();
    expect(()=>createTrainingVisualAssetSchema.parse({storagePath:"https://signed.example/image",mimeType:"image/webp",width:1,height:1,altText:"Texto alternativo",sourceType:"original",copyrightStatus:"approved"})).toThrow();
  });
  it("resuelve acceso por plan en servidor",()=>{const service=new TrainingPlanEligibilityService();expect(service.canView({status:"published",minimumPlan:"pro"},"free")).toBe(false);expect(service.canView({status:"published",minimumPlan:"pro"},"unlimited")).toBe(true);expect(service.canView({status:"draft",minimumPlan:"free"},"unlimited")).toBe(false);});
  it("detecta fallos estructurales y ciclos",()=>{const issues=validateTaxonomyStructure({categories:[{id:"c",slug:"categoria",subcategoryIds:[],skillIds:[]}],subcategories:[],skills:[],concepts:[],paths:[{id:"p",slug:"ruta",moduleIds:[]}],modules:[],moduleItems:[],exercises:[{id:"e",cognitiveLevel:"invented",formatCount:0,primaryFormatCount:2}],assets:[{id:"a",altText:"",copyrightStatus:"restricted",usedByPublishedContent:true}],bookRelations:[{id:"b",bookExists:false}],skillPrerequisites:[{item:"a",prerequisite:"b"},{item:"b",prerequisite:"a"}],conceptPrerequisites:[]});expect(issues.map(issue=>issue.code)).toEqual(expect.arrayContaining(["CATEGORY_WITHOUT_SUBCATEGORIES","PATH_WITHOUT_MODULES","EXERCISE_WITHOUT_FORMAT","CYCLIC_SKILL_PREREQUISITE"]));});
  it("incluye constraints, RLS y protección de notas privadas en la migración",()=>{const sql=fs.readFileSync(path.join(process.cwd(),"supabase/migrations/0034_training_taxonomy_structural_foundation.sql"),"utf8");expect(sql).toContain("prevent_training_skill_prerequisite_cycle");expect(sql).toContain("is_training_editor");expect(sql).toContain("revoke select on public.training_concept_books from authenticated");expect(sql).toContain("difficulty_start in ('fundamentals','application','advanced','expert')");});
});
