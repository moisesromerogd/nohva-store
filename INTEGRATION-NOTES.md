# Nohva Platform v12 — paquete restaurado para rama de trabajo

Este paquete conserva los archivos originales del ZIP v12 y añade la base de conexión Supabase/IA.

## Importante
- Es una versión de integración/pruebas, NO lista para producción.
- El acceso exige autenticación Supabase y perfil activo.
- El asistente empresarial permanece deshabilitado: sus herramientas originales consultan datos desde localStorage y no deben exponerse.
- El frontend original sigue usando localStorage para sus módulos operativos; no debe utilizarse con empleados ni con datos reales hasta completar la migración de ventas, inventario, abonos y permisos a Supabase.
- Las claves de OpenAI/Gemini viven exclusivamente en Supabase Edge Function Secrets.
- El valor `NOHVA_SUPABASE_ANON_KEY` en `js/supabase-auth.js` debe reemplazarse por la clave pública anon exacta del proyecto antes de probar. No utilizar service_role.
