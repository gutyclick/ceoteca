# Seguridad editorial

Todas las rutas requieren bearer token y rol activo. Service role permanece en servidor. RLS protege tablas editoriales, las acciones validan permisos y los cambios importantes se auditan. El primer admin se asigna mediante una operación SQL revisada; nunca se siembra en producción.
