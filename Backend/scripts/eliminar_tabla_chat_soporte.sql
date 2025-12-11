-- Script para eliminar tabla chat_soporte
-- Fecha: 26 de agosto de 2025
-- Razón: Chat de soporte público no requiere persistencia en base de datos

USE clinikdent_db;

-- Eliminar la tabla chat_soporte
DROP TABLE IF EXISTS chat_soporte;

-- Confirmar eliminación
SELECT 'Tabla chat_soporte eliminada exitosamente' as mensaje;
