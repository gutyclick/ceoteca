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
  | "view_costs";
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
  ],
  editor: [
    "read",
    "create",
    "edit",
    "submit_review",
    "archive",
    "ai_generate",
    "ai_review",
  ],
  reviewer: ["read", "review", "ai_review"],
  viewer: ["read"],
};
export function canEditorial(role: EditorialRole, action: EditorialAction) {
  return permissions[role].includes(action);
}
