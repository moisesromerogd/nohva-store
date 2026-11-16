# Nohva Platform — integración segura

Esta carpeta es el espacio de trabajo para integrar Nohva Platform v12 como ruta independiente del catálogo público. La implementación se trabaja en la rama `feature/nohva-platform-security`; no se modifica `main` ni se ejecutan cambios en Supabase desde este repositorio.

## Hallazgos confirmados en el ZIP v12

- La plataforma v12 está dividida en `index.html`, `css/estilos.css` y módulos JavaScript.
- La persistencia de productos, ventas, anuncios, gastos, tasa, ajustes y otros datos se hace en `localStorage` bajo la clave `nohva_v2`; existe guardado periódico cada 1,5 segundos.
- Las ventas son objetos locales con líneas de productos, total, pagos, saldo, vencimiento y referencias. Los abonos se agregan al arreglo `payments` de cada venta.
- Los módulos de inventario y finanzas calculan costos, márgenes y ganancias directamente en el navegador.
- La integración de IA usa una URL y una clave configuradas en Ajustes y enviadas desde el navegador como cabecera `x-nohva-key`.
- El ZIP no incluye una capa de autenticación ni persistencia remota funcional para los datos operativos. El cliente Supabase no está integrado en el flujo de v12.

## Hallazgos confirmados en el repositorio actual

- El catálogo público usa Supabase para leer `products`, `categories` y `banner_config`.
- `admin.html` ya usa Supabase Auth para iniciar sesión y consulta `products`, `inventory`, `sales_history`, `categories` y `banner_config`.
- El panel actual identifica el nombre visible con metadatos/correo y lo guarda en `localStorage`; ese valor no debe usarse como identidad ni autoridad de seguridad.
- La rama de trabajo se mantiene separada de `main` para evitar afectar el catálogo publicado.

## Modelo de acceso acordado

### Propietarios
Dos cuentas con rol `owner`: acceso completo a ventas, abonos, inventario, costos, ganancias, gastos, configuración, usuarios e IA.

### Empleado
Rol `employee`: puede registrar ventas y abonos; consultar únicamente ventas registradas por su propio usuario; consultar productos y existencias mediante una superficie que no exponga costos; usar el dashboard operativo y las herramientas de IA que autoricen los propietarios. No puede editar/eliminar ventas ni modificar/eliminar inventario o productos, consultar costos, ganancias, gastos o finanzas, ni administrar usuarios o configuración global.

### Auditoría
El identificador del usuario debe obtenerse del JWT de Supabase Auth en el servidor/base de datos. Cada venta y cada pago/abono debe guardar `created_by` / `recorded_by` como UUID, no como texto editable del navegador. Las políticas RLS deben filtrar ventas y pagos por ese UUID.

## Plan de implementación

1. Copiar la versión v12 sin cambios a esta ruta y conservar su interfaz como línea base.
2. Añadir sesión Supabase Auth, perfiles y comprobación de rol; desactivar el acceso a la aplicación si no hay sesión válida.
3. Diseñar un modelo persistente normalizado para ventas, líneas y pagos, manteniendo las tablas actuales del catálogo y los registros históricos.
4. Crear políticas RLS y permisos de columnas/vistas para impedir que el empleado lea costos y datos financieros. Las restricciones visuales no son una medida de seguridad.
5. Migrar las operaciones de ventas, abonos y stock a operaciones seguras del servidor/base de datos con transacciones y auditoría.
6. Migrar inventario, finanzas, dashboard, ajustes e IA; los secretos de proveedores de IA deben permanecer en funciones del servidor.
7. Probar con dos propietarios y dos empleados de prueba: aislamiento de ventas, acceso a abonos, columnas sensibles, intentos de escritura no autorizados, concurrencia y recuperación de errores.
8. Abrir una solicitud de revisión antes de integrar a `main` o publicar.

## Bloqueos y precauciones

- No ejecutar todavía migraciones ni reemplazar las políticas RLS actuales: hace falta contrastar el esquema real, las restricciones, los datos existentes y las relaciones entre `products`, `inventory` y `sales_history`.
- No eliminar ni sobrescribir `sales_history` ni datos del catálogo.
- No usar `localStorage` para permisos, roles o autoría.
- No incluir claves `service_role`, secretos de IA ni credenciales en archivos del navegador.
- Las ventas y pagos históricos sin UUID de autor deben conservarse como legado; no se debe inventar un propietario para ellos.
