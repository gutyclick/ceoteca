export const editorialRoles = [
  "admin",
  "editor",
  "reviewer",
  "viewer",
] as const;
export type EditorialRole = (typeof editorialRoles)[number];
export type EditorialAction =
  | "read"
  | "create"
  | "edit"
  | "submit_review"
  | "review"
  | "publish"
  | "archive"
  | "audit"
  | "manage_roles"
  | "ai_generate"
  | "ai_review"
  | "view_costs"
  | "analytics_read"
  | "quality_alert_manage"
  | "experiment_create"
  | "experiment_review"
  | "experiment_manage"
  | "analytics_settings";
const permissions: Record<EditorialRole, EditorialAction[]> = {
  admin: [
    "read",
    "create",
    "edit",
    "submit_review",
    "review",
    "publish",
    "archive",
    "audit",
    "manage_roles",
    "ai_generate",
    "ai_review",
    "view_costs",
    "analytics_read",
    "quality_alert_manage",
    "experiment_create",
    "experiment_review",
    "experiment_manage",
    "analytics_settings",
  ],
  editor: [
    "read",
    "create",
    "edit",
    "submit_review",
    "archive",
    "ai_generate",
    "ai_review",
    "analytics_read",
    "quality_alert_manage",
    "experiment_create",
  ],
  reviewer: [
    "read",
    "review",
    "ai_review",
    "analytics_read",
    "quality_alert_manage",
    "experiment_review",
  ],
  viewer: ["read", "analytics_read"],
};
export function canEditorial(role: EditorialRole, action: EditorialAction) {
  return permissions[role].includes(action);
}
