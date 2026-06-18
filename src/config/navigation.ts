export const publicRoutes = [
  "/",
  "/pricing",
  "/biblioteca",
  "/registro",
  "/login",
  "/terminos",
  "/privacidad",
] as const;

export const privateRoutes = ["/home", "/libro", "/perfil", "/planes"] as const;

export const apiRoutes = [
  "/api/chat",
  "/api/audio",
  "/api/books",
  "/api/profile",
  "/api/subscription",
] as const;
