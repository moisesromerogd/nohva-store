# Nohva · Plataforma v12 (dividida en archivos)

Abre **index.html** con doble clic (necesita internet para cargar Tailwind, iconos y fuentes, igual que antes).
Mantén la carpeta completa: `index.html`, `css/` y `js/` deben estar juntos.

## Dónde está cada cosa

| Archivo | Qué contiene |
|---|---|
| `index.html` | Solo la estructura: menú, pestañas y ventanas emergentes |
| `css/estilos.css` | Colores y estilos (modo claro y oscuro) |
| `js/datos.js` | Datos (productos, ventas…), guardado, tasa BCV, respaldo y ajustes |
| `js/ui.js` | Ventanas de aviso, confirmación y entrada de datos con el estilo de la plataforma |
| `js/dashboard.js` | Indicadores del dashboard, alerta de stock y refresco general |
| `js/ventas.js` | Ventas con varios productos, saldo pendiente, abonos, referencias de pago, tasa/Bs por pago e historial de pagos |
| `js/factura.js` | Ticket de factura imprimible de cada venta |
| `js/inventario.js` | Inventario en lista o mosaico, agregar/editar productos |
| `js/finanzas.js` | Clientes, gastos y ganancia |
| `js/marketing.js` | Anuncios, programación e inbox |
| `js/diseno.js` | Estudio de diseño, galería y publicaciones |
| `js/ia.js` | Conexión con IA, diseñador con IA y asistente |
| `js/app.js` | Cambio de pestañas, tema claro/oscuro y arranque |

El orden en que `index.html` carga los archivos importa: `datos.js` primero, `ui.js` justo después y `app.js` al final.

## Datos y respaldo
Tus datos viven en el navegador (localStorage). Si cambias la carpeta de sitio o abres la plataforma
desde otra dirección, puede que no veas tus datos: antes de mover algo usa **Ajustes → Exportar respaldo**
y luego **Importar** en la nueva ubicación.

## Pagos: referencia, tasa y historial (nuevo en v10)
- Al registrar una venta o un abono puedes escribir la **referencia** (opcional) del pago móvil, Zelle, Binance, etc.
- Si el método es **Pago Móvil** o **Efectivo Bs** aparecen la **tasa del día** (viene con la tasa BCV actual, puedes cambiarla) y el **monto en Bs**.
  Puedes escribir los dólares y se calculan los Bs, o escribir los Bs que recibiste y se calculan los dólares.
- La deuda siempre se lleva en USD. Cada pago guarda su propia tasa y sus Bs, así que un abono hecho 15 días después con otra tasa no altera el anterior.
- Botón **Historial** en cada venta: lista de pagos (fecha, método, USD, tasa, Bs, referencia), total recibido en Bs, tasa promedio y cuánto equivale el saldo hoy.
- Si repites una referencia ya registrada, la plataforma te avisa. El buscador de ventas también encuentra por referencia.
- Las ventas anteriores a esta versión siguen funcionando: su historial dice que el cobro quedó "sin detalle".

## Factura imprimible (nuevo en v11)
- En cada venta, el icono de impresora abre el diálogo de impresión con un ticket angosto (50 mm de contenido, cabe en rollo de 58 mm o en una hoja carta).
- Muestra logo, nombre y ubicación del negocio, N° de factura, fecha, cliente, productos, total, cada pago y el saldo pendiente (si hay).
- Pagos en dólares salen en $; pagos en bolívares salen en Bs con su equivalente en $ y la tasa oficial del día en que se pagó.
- Nombre, ubicación, RIF y mensaje de agradecimiento se cambian en **Ajustes → Datos de la factura**.
- Las ventas nuevas guardan fecha y hora exactas; las anteriores usan la fecha de su primer pago.
- Los botones de acciones de la tabla de ventas ahora son iconos (pasa el mouse para ver su nombre).

## Novedades v12
- **Clientes que deben**: en Ventas, el botón *Clientes que deben* (o tocar la tarjeta "Por cobrar") muestra a todos los clientes con saldo, agrupados, con el total que debe cada uno,
  su equivalente en Bs hoy, cuántas ventas están vencidas y botones para abonar, ver historial o imprimir factura. El buscador también filtra esta lista.
- **Avisos con el estilo de la plataforma**: ya no salen los pop-ups del navegador. Venta registrada, abono y venta saldada muestran un check verde animado
  (con opción de imprimir la factura al instante); las confirmaciones (borrar, quitar pago, stock insuficiente…) y los datos que se piden (tasa manual, reabastecer, referencia) usan ventanas propias.
- **Editar venta** abre una ventana: cliente, canal, método, cantidad y precio de cada producto (el stock se ajusta solo) y fecha límite del saldo.
  No permite dejar un total menor a lo ya cobrado.
- **Buscador de productos** al registrar una venta: escribe parte del nombre, ID o categoría (sin importar acentos), usa las flechas y Enter o haz clic.
