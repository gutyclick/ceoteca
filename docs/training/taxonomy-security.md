# Seguridad de la taxonomía

El cliente nunca decide plan, acceso, progreso ni publicación. Las rutas de inicio derivan usuario y suscripción en servidor y las funciones SQL vuelven a comprobar `auth.uid()`.

RLS expone únicamente catálogos publicados, assets aprobados y progreso propio. La edición requiere los roles de `training_editorial_users`; el acceso al panel no concede por sí mismo permisos de escritura en la base.

Las banderas son controles de entrega, no controles de autorización. Desactivar una función oculta su interfaz, pero las API mantienen validación de sesión, plan, estado y propiedad.
