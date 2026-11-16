# Nohva Platform v12 — revisión e integración segura

## Estado de la revisión
- El ZIP v12 es una aplicación frontend dividida en HTML, CSS y JavaScript.
- La persistencia actual está en `localStorage` mediante la clave `nohva_v2`; `save()` guarda el estado completo en el navegador.
- Los datos iniciales de productos y ventas en `js/datos.js` son datos de demostración.
- Los módulos de ventas, pagos, clientes, gastos, inventario, anuncios, diseño e IA operan sobre el estado local.
- La configuración de IA contempla proveedor/URL/clave en `cfg`; no se debe desplegar una clave privada en el navegador.
- El proyecto todavía no contiene una capa de autenticación Supabase ni repositorio de datos remoto.

## Decisiones confirmadas
- Dos propietarios con acceso completo.
- Empleado: registrar ventas y abonos, consultar productos/stock, consultar dashboard operativo y herramientas de IA autorizadas.
- Empleado no puede ver costos, ganancias, gastos, finanzas ni administrar usuarios/configuración global.
- Cada venta y abono registra el usuario autenticado.
- Empleado solo puede ver ventas y pagos/abonos de ventas que él mismo registró.
- No hay registro público; las cuentas deben ser creadas por propietarios mediante un flujo seguro.

## Migración aditiva preparada
`migrations/20261116000100_platform_core.sql` crea tablas aisladas para perfiles, ventas, líneas y pagos, con RLS por propietario/vendedor. No elimina ni modifica las tablas existentes del catálogo.

## Pendiente antes de desplegar
1. Conectar el frontend v12 a Supabase Auth y sustituir `localStorage` como fuente de verdad por repositorios remotos.
2. Implementar creación/invitación de usuarios solo desde propietarios (Edge Function con secretos en servidor).
3. Migrar los datos existentes desde el respaldo JSON/localStorage, con validación y deduplicación.
4. Crear vistas/RPC de inventario para empleados que expongan solo nombre, categoría, código y existencias, nunca costo.
5. Coordinar la sustitución de las políticas actuales de `inventory` y `sales_history`: las políticas compartidas anteriormente permiten acceso amplio a cualquier autenticado. No se deben habilitar empleados hasta cerrar ese acceso.
6. Revisar el modelo de gastos/ganancias y bloquear las tablas/funciones correspondientes para empleados.
7. Añadir pruebas RLS con dos propietarios y dos empleados diferentes, incluyendo intentos de lectura directa por API.
8. Probar el catálogo y el panel administrativo actual en staging antes de cualquier cambio de producción.

## Seguridad / despliegue
- La migración preparada es un borrador versionado para revisión; todavía no se ha ejecutado en Supabase.
- No se han cambiado las políticas actuales, no se ha modificado la rama `main` y no se ha desplegado nada.
- No copiar `service_role` ni claves privadas al frontend.
- La rama de trabajo es `feature/nohva-platform-security`.
