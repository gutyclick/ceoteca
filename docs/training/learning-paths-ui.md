# Interfaz de rutas

La vista usa componentes pequeños: filtros, tarjeta de ruta, cabecera, progreso, lista de módulos, módulo e item. Los estados visibles son disponible, bloqueado, en progreso, completado y próximamente.

En escritorio los filtros forman una barra compacta y los módulos una columna vertical. En tablet y móvil los controles se apilan, el CTA ocupa el ancho disponible y ningún bloqueo depende solo del color. Los estados de carga, error y vacío conservan la misma estructura para evitar saltos de layout.
