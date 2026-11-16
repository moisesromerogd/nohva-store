# Puesta en marcha segura de Nohva Platform

Esta guía acompaña la rama `feature/nohva-platform-security`.

## Situación actual
- El ZIP v12 fue inspeccionado: sus datos de aplicación son de demostración y se guardan en `localStorage` con la clave `nohva_v2`.
- Se confirmó que se puede comenzar con datos operativos vacíos.
- El catálogo público actual sigue usando el proyecto Supabase existente. Por eso esta integración es aditiva: no se borran ni reemplazan tablas actuales del catálogo.
- La migración `20261116000100_platform_core.sql` crea tablas nuevas aisladas. Aún NO se ha ejecutado.
- `login.html` y `v12/js/supabase-auth.js` son la primera base de autenticación; todavía no protegen el antiguo `index.html` de v12 hasta que se complete su adaptación.

## Antes de ejecutar SQL
1. En Supabase, confirma que estás en el proyecto correcto.
2. Descarga un backup de la base de datos y exporta las tablas actuales `products`, `categories`, `banner_config`, `inventory` y `sales_history`.
3. Comprueba que Auth está habilitado y que el registro público no está habilitado para la plataforma.
4. No compartas claves `service_role`, contraseñas ni tokens privados en el chat.
5. No ejecutes aún cambios sobre las políticas actuales de `inventory` o `sales_history`: requieren una migración coordinada para no romper el panel/catalogo que ya existe.

## Alta inicial de usuarios
- Crear las dos cuentas de propietarios desde Supabase Auth (o un flujo administrativo seguro).
- Crear los perfiles por defecto como `employee` y luego promover únicamente los dos UUID verificados a `owner` desde SQL Editor:
  `update public.platform_profiles set role = 'owner' where user_id in ('UUID_PROPIETARIO_1','UUID_PROPIETARIO_2');`
- Nunca promover cuentas por email sin verificar el UUID exacto.
- Crear empleados desde un endpoint/Edge Function autenticado que valide que quien invita es owner. No implementar alta pública desde el navegador.

## Pruebas requeridas antes de producción
- Dos propietarios pueden consultar ventas y pagos de ambos empleados.
- Empleado A solo puede consultar ventas y pagos con su propio `seller_id`.
- Empleado B no puede leer ni modificar ventas o pagos de A.
- Empleados no pueden actualizar o borrar ventas/pagos.
- Un empleado no puede modificar `seller_id` ni `recorded_by` para suplantar a otro usuario.
- Empleados no pueden leer costos, gastos, ganancias ni datos financieros por API directa.
- El catálogo público sigue leyendo productos/categorías/banner.
- El panel administrativo actual sigue funcionando con las cuentas de propietarios.

## No publicar todavía
La rama contiene el primer esqueleto de Auth y la migración base. No desplegar hasta terminar la adaptación del frontend v12, la capa de inventario seguro, las funciones de invitación y las pruebas RLS.