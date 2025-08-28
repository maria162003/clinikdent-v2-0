// Script para cerrar forzadamente el servidor si se queda colgado
const axios = require('axios');

const killServer = async () => {
  try {
    console.log('🔄 Intentando cerrar servidor de forma graceful...');
    
    // Intentar cierre graceful primero
    const response = await axios.post('http://localhost:3001/api/server/shutdown', {}, {
      timeout: 2000
    });
    
    console.log('✅ Servidor cerrado exitosamente:', response.data.message);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✅ El servidor ya no está corriendo');
      return;
    }
    
    console.log('⚠️ No se pudo cerrar el servidor de forma graceful');
    console.log('🔄 Buscando procesos de Node.js para cerrar...');
    
    // En Windows, usar tasklist y taskkill
    const { spawn } = require('child_process');
    
    // Buscar procesos de node que contengan "app.js"
    const findProcess = spawn('powershell', [
      '-Command', 
      'Get-Process | Where-Object {$_.ProcessName -eq "node"} | Select-Object Id,ProcessName,Path | Format-Table'
    ]);
    
    findProcess.stdout.on('data', (data) => {
      console.log('Procesos de Node encontrados:');
      console.log(data.toString());
    });
    
    findProcess.on('close', (code) => {
      console.log('⚠️ Para cerrar manualmente, usa:');
      console.log('   Ctrl+C en la terminal donde corre el servidor');
      console.log('   O usa: taskkill /F /IM node.exe');
      console.log('   O cierra la ventana de PowerShell/CMD');
    });
  }
};

killServer();
