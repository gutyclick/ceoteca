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
  | "manage_roles";
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
  ],
  editor: ["read", "create", "edit", "submit_review", "archive"],
  reviewer: ["read", "review", "publish"],
  viewer: ["read"],
};
export function canEditorial(role: EditorialRole, action: EditorialAction) {
  return permissions[role].includes(action);
}
