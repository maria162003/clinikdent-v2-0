# Clinikdent React Native Webhook Demo

UI renovada (tema oscuro) con 4 acciones: resumen, citas, reporte financiero y PQRS, consumiendo los webhooks del backend Clinikdent.

## Preparación
1. Backend arriba en `http://localhost:3001` (o expuesto con ngrok).
2. Instala dependencias en esta carpeta:
   ```powershell
   npm install
   ```
3. Arranca Expo:
   ```powershell
   npm start
   ```
   Usa Expo Go, emulador o `w` para web.

> Si usas ngrok, cambia `API_BASE` en `App.js` a la URL pública (`https://tu-ngrok.ngrok-free.app/api`).

## Flujo
- Selecciona paciente desde el modal (listado cargado desde `/api/pacientes`).
- Opcional: agrega email para pruebas de envío.
- Ejecuta cualquiera de las 4 acciones. El modal de resultado muestra datos reales y, en reporte, permite descargar Excel.

## Consejos de demo
- Inserta un paciente real con citas en PostgreSQL/Supabase.
- Observa la consola del backend para los logs de cada endpoint.
- Para descargar Excel en web, asegúrate de abrir vía Expo web (la descarga usa `window`).
