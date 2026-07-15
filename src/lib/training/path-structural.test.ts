import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/0035_training_learning_paths_progress.sql",
  ),
  "utf8",
);

describe("arquitectura de progreso de rutas", () => {
  it("mantiene progreso por item, módulo y ruta bajo propiedad del usuario", () => {
    expect(migration).toContain("user_training_path_item_progress");
    expect(migration).toContain("user_id=auth.uid()");
    expect(migration).toContain("user_training_path_module_progress");
    expect(migration).toContain("user_training_path_progress");
  });

  it("desbloquea según items obligatorios y no cuenta opcionales", () => {
    expect(migration).toContain("and item.is_required");
    expect(migration).toContain(
      "v_module_total=0 or v_module_done>=v_module_total",
    );
    expect(migration).toContain("minimum_mastery");
  });

  it("solo completa desde fuentes verificables e idempotentes", () => {
    expect(migration).toContain("sync_training_path_item_from_completed_session");
    expect(migration).toContain("not exists(");
    expect(migration).toContain("on conflict(user_id,item_id) do update");
    expect(migration).toContain(
      "sync_training_path_item_from_completed_roleplay_evaluation",
    );
  });

  it("impide iniciar o completar módulos con RPC heredadas desde el cliente", () => {
    expect(migration).toContain(
      "revoke all on function public.start_training_learning_path(uuid,uuid) from authenticated",
    );
    expect(migration).toContain(
      "revoke all on function public.complete_training_learning_path_module(uuid,uuid) from authenticated",
    );
    expect(migration).toContain("to service_role");
  });
});
