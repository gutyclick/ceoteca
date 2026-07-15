# Interfaz de categorías

`TrainingCategoriesExplorer` muestra únicamente categorías publicadas devueltas por `TrainingNavigationService`. Cada tarjeta comunica habilidades, ejercicios publicados, progreso, plan mínimo y estado: disponible, acceso parcial, bloqueado o próximamente.

Para añadir una categoría a la UI se crea y publica en la taxonomía, con al menos una habilidad publicada. No se modifica el componente. Una categoría sin habilidades se marca como próxima y no recibe conteos ficticios.
