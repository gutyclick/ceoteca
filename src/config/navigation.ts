export const publicRoutes = [
  "/",
  "/precios",
  "/pricing",
  "/biblioteca",
  "/registro",
  "/login",
  "/terminos",
  "/privacidad",
] as const;

export const privateRoutes = [
  "/home",
  "/libro",
  "/perfil",
  "/planes",
  "/configuracion",
] as const;

export const apiRoutes = [
  "/api/chat",
  "/api/audio",
  "/api/books",
  "/api/profile",
  "/api/subscription",
] as const;
