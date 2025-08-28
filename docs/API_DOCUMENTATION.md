# 🔌 Documentación de API - Clinikdent v2.0

## 🚀 API RESTful Documentation

**Version:** 2.0.0  
**Base URL:** `https://api.clinikdent.com/api/v2` o `http://localhost:3000/api`  
**Content-Type:** `application/json`  
**Authentication:** Bearer Token (JWT)

---

## 📖 **TABLA DE CONTENIDOS**

1. [Overview](#overview)
2. [Autenticación](#autenticación)
3. [Endpoints de Usuario](#endpoints-de-usuario)
4. [Endpoints de Pacientes](#endpoints-de-pacientes)
5. [Endpoints de Citas](#endpoints-de-citas)
6. [Endpoints de Tratamientos](#endpoints-de-tratamientos)
7. [Endpoints de Inventario](#endpoints-de-inventario)
8. [Endpoints de Pagos](#endpoints-de-pagos)
9. [Endpoints de Reportes](#endpoints-de-reportes)
10. [Códigos de Error](#códigos-de-error)
11. [Rate Limiting](#rate-limiting)
12. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 **OVERVIEW**

La API de Clinikdent v2.0 es una RESTful API que permite la gestión completa de consultorios odontológicos. Proporciona endpoints para gestionar usuarios, pacientes, citas, tratamientos, inventario y facturación.

### **Características:**
- ✅ **RESTful Design** - Seguir estándares REST
- ✅ **JWT Authentication** - Autenticación segura
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **Input Validation** - Validación robusta de datos
- ✅ **Error Handling** - Manejo consistente de errores
- ✅ **Documentation** - Documentación completa

### **HTTP Methods:**
- **GET** - Obtener recursos
- **POST** - Crear recursos
- **PUT** - Actualizar recursos completos
- **PATCH** - Actualizar recursos parcialmente
- **DELETE** - Eliminar recursos

### **Content Types:**
- **Request:** `application/json`
- **Response:** `application/json`

---

## 🔐 **AUTENTICACIÓN**

### **JWT Token Authentication**

Todos los endpoints (excepto login y registro) requieren un token JWT válido.

#### **Header de Autenticación:**
```http
Authorization: Bearer <your-jwt-token>
```

#### **Login Endpoint:**
```http
POST /api/auth/login
```

**Request Body:**
```json
{
    "correo": "admin@clinikdent.com",
    "password": "admin123",
    "rol": "administrador"
}
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Login exitoso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjbGluaWtkZW50LmNvbSIsInJvbCI6ImFkbWluaXN0cmFkb3IiLCJub21icmUiOiJBZG1pbiIsImFwZWxsaWRvIjoiUHJpbmNpcGFsIiwiaWF0IjoxNjkyMzQ1Njc4LCJleHAiOjE2OTIzNzQ0NzgsImlzcyI6ImNsaW5pa2RlbnQtdjIiLCJhdWQiOiJjbGluaWtkZW50LXVzZXJzIn0.signature",
    "user": {
        "id": 1,
        "nombre": "Admin",
        "apellido": "Principal",
        "correo": "admin@clinikdent.com",
        "rol": "administrador"
    }
}
```

**Error (400):**
```json
{
    "success": false,
    "msg": "Credenciales inválidas.",
    "code": "AUTH_INVALID_CREDENTIALS"
}
```

#### **Recuperar Contraseña:**
```http
POST /api/auth/recuperar
```

**Request Body:**
```json
{
    "correo": "usuario@clinikdent.com",
    "numero_documento": "12345678"
}
```

**Response (200):**
```json
{
    "msg": "Se enviaron las instrucciones de recuperación a tu correo electrónico.",
    "success": true
}
```

#### **Logout:**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Sesión cerrada exitosamente"
}
```

---

## 👤 **ENDPOINTS DE USUARIO**

### **Listar Usuarios**
```http
GET /api/usuarios
Authorization: Bearer <token>
```

**Query Parameters:**
- `rol` (optional) - Filtrar por rol: `administrador`, `odontologo`, `recepcionista`, `paciente`
- `estado` (optional) - Filtrar por estado: `activo`, `inactivo`, `suspendido`
- `page` (optional) - Número de página (default: 1)
- `limit` (optional) - Elementos por página (default: 10)

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nombre": "Admin",
            "apellido": "Principal",
            "correo": "admin@clinikdent.com",
            "telefono": "3001234567",
            "rol": "administrador",
            "estado": "activo",
            "fecha_registro": "2025-08-27T10:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "pages": 3
    }
}
```

### **Crear Usuario**
```http
POST /api/usuarios
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@email.com",
    "password": "Password123!",
    "rol": "paciente",
    "telefono": "3001234567",
    "direccion": "Calle 123 #45-67",
    "fecha_nacimiento": "1990-05-15",
    "tipo_documento": "CC",
    "numero_documento": "98765432"
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Usuario creado exitosamente.",
    "data": {
        "id": 15,
        "nombre": "Juan",
        "apellido": "Pérez",
        "correo": "juan@email.com",
        "rol": "paciente"
    }
}
```

### **Obtener Usuario por ID**
```http
GET /api/usuarios/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": 15,
        "nombre": "Juan",
        "apellido": "Pérez",
        "correo": "juan@email.com",
        "telefono": "3001234567",
        "direccion": "Calle 123 #45-67",
        "rol": "paciente",
        "fecha_nacimiento": "1990-05-15",
        "tipo_documento": "CC",
        "numero_documento": "98765432",
        "estado": "activo",
        "fecha_registro": "2025-08-27T10:00:00.000Z"
    }
}
```

### **Actualizar Usuario**
```http
PUT /api/usuarios/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "nombre": "Juan Carlos",
    "apellido": "Pérez López",
    "telefono": "3009876543",
    "direccion": "Nueva dirección 456"
}
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Usuario actualizado exitosamente.",
    "data": {
        "id": 15,
        "nombre": "Juan Carlos",
        "apellido": "Pérez López"
    }
}
```

### **Eliminar Usuario**
```http
DELETE /api/usuarios/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Usuario eliminado exitosamente."
}
```

---

## 📅 **ENDPOINTS DE CITAS**

### **Listar Citas**
```http
GET /api/citas
Authorization: Bearer <token>
```

**Query Parameters:**
- `fecha` (optional) - Filtrar por fecha: `2025-08-27`
- `odontologo_id` (optional) - Filtrar por odontólogo
- `paciente_id` (optional) - Filtrar por paciente
- `estado` (optional) - `programada`, `confirmada`, `en_proceso`, `completada`, `cancelada`

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "fecha_cita": "2025-08-27T09:00:00.000Z",
            "duracion_minutos": 30,
            "tipo_consulta": "Limpieza dental",
            "estado": "programada",
            "paciente": {
                "id": 3,
                "nombre": "María",
                "apellido": "González",
                "telefono": "3001234569"
            },
            "odontologo": {
                "id": 2,
                "nombre": "Dr. Carlos",
                "apellido": "Rodríguez"
            },
            "notas": "Paciente con sensibilidad dental"
        }
    ]
}
```

### **Crear Cita**
```http
POST /api/citas
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "paciente_id": 3,
    "odontologo_id": 2,
    "fecha_cita": "2025-08-28T10:00:00.000Z",
    "duracion_minutos": 45,
    "tipo_consulta": "Consulta general",
    "notas": "Primera consulta del paciente"
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Cita creada exitosamente.",
    "data": {
        "id": 25,
        "fecha_cita": "2025-08-28T10:00:00.000Z",
        "estado": "programada"
    }
}
```

### **Actualizar Estado de Cita**
```http
PATCH /api/citas/:id/estado
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "estado": "confirmada",
    "notas": "Paciente confirmó asistencia"
}
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Estado de cita actualizado exitosamente."
}
```

### **Cancelar Cita**
```http
DELETE /api/citas/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "motivo": "Emergencia familiar",
    "reprogramar": true
}
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Cita cancelada exitosamente."
}
```

---

## 🦷 **ENDPOINTS DE TRATAMIENTOS**

### **Listar Tratamientos por Paciente**
```http
GET /api/tratamientos/paciente/:paciente_id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "tipo_tratamiento": "Endodoncia",
            "descripcion": "Tratamiento de conducto en molar superior derecho",
            "costo": 250000,
            "estado": "en_progreso",
            "fecha_inicio": "2025-08-15",
            "fecha_finalizacion": null,
            "odontologo": {
                "id": 2,
                "nombre": "Dr. Carlos",
                "apellido": "Rodríguez"
            },
            "sesiones": {
                "completadas": 2,
                "programadas": 4
            }
        }
    ]
}
```

### **Crear Plan de Tratamiento**
```http
POST /api/tratamientos
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "paciente_id": 3,
    "odontologo_id": 2,
    "tipo_tratamiento": "Ortodoncia",
    "descripcion": "Brackets metálicos para corrección de maloclusión",
    "costo": 1200000,
    "sesiones_estimadas": 12,
    "prioridad": "normal"
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Plan de tratamiento creado exitosamente.",
    "data": {
        "id": 45,
        "tipo_tratamiento": "Ortodoncia",
        "estado": "planificado"
    }
}
```

### **Actualizar Progreso de Tratamiento**
```http
PUT /api/tratamientos/:id/progreso
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "estado": "en_progreso",
    "notas_clinicas": "Paciente responde bien al tratamiento. Se observa mejoría en la alineación.",
    "materiales_utilizados": [
        {
            "producto_id": 15,
            "cantidad": 2,
            "descripcion": "Brackets metálicos"
        }
    ],
    "proxima_cita": "2025-09-15T14:00:00.000Z"
}
```

**Response (200):**
```json
{
    "success": true,
    "msg": "Progreso de tratamiento actualizado exitosamente."
}
```

---

## 📦 **ENDPOINTS DE INVENTARIO**

### **Listar Productos**
```http
GET /api/inventario
Authorization: Bearer <token>
```

**Query Parameters:**
- `categoria` (optional) - Filtrar por categoría
- `estado` (optional) - `disponible`, `agotado`, `vencido`
- `stock_bajo` (optional) - `true` para productos con stock bajo

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nombre_producto": "Resina compuesta A2",
            "categoria": "Materiales de restauración",
            "descripcion": "Resina fotopolimerizable color A2",
            "stock_actual": 25,
            "stock_minimo": 10,
            "precio_unitario": 45000,
            "proveedor": {
                "id": 5,
                "nombre": "Dental Supply Co.",
                "contacto": "ventas@dentalsupply.com"
            },
            "fecha_vencimiento": "2026-12-31",
            "ubicacion": "Estante A, Nivel 2",
            "estado": "disponible"
        }
    ],
    "resumen": {
        "total_productos": 150,
        "productos_stock_bajo": 12,
        "productos_vencidos": 3,
        "valor_total_inventario": 15750000
    }
}
```

### **Crear Producto**
```http
POST /api/inventario
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "nombre_producto": "Anestésico Lidocaína 2%",
    "categoria": "Medicamentos",
    "descripcion": "Anestésico local para procedimientos odontológicos",
    "stock_actual": 50,
    "stock_minimo": 15,
    "precio_unitario": 8500,
    "proveedor_id": 3,
    "fecha_vencimiento": "2026-06-30",
    "ubicacion": "Refrigerador principal",
    "lote": "LOT123456"
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Producto agregado al inventario exitosamente.",
    "data": {
        "id": 156,
        "nombre_producto": "Anestésico Lidocaína 2%",
        "stock_actual": 50
    }
}
```

### **Registrar Movimiento de Inventario**
```http
POST /api/inventario/movimientos
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "producto_id": 1,
    "tipo_movimiento": "salida",
    "cantidad": 3,
    "motivo": "Uso en tratamiento",
    "referencia_tipo": "tratamiento",
    "referencia_id": 45,
    "notas": "Usado en endodoncia paciente María González"
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Movimiento de inventario registrado exitosamente.",
    "data": {
        "stock_anterior": 25,
        "stock_actual": 22,
        "movimiento_id": 789
    }
}
```

### **Alertas de Inventario**
```http
GET /api/inventario/alertas
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "stock_bajo": [
            {
                "id": 23,
                "nombre_producto": "Guantes de nitrilo",
                "stock_actual": 8,
                "stock_minimo": 25,
                "dias_restantes": null
            }
        ],
        "proximos_vencer": [
            {
                "id": 45,
                "nombre_producto": "Anestésico Articaína",
                "fecha_vencimiento": "2025-09-15",
                "dias_restantes": 19
            }
        ],
        "vencidos": [
            {
                "id": 12,
                "nombre_producto": "Amalgama dental",
                "fecha_vencimiento": "2025-08-10",
                "dias_vencido": 17
            }
        ]
    }
}
```

---

## 💰 **ENDPOINTS DE PAGOS**

### **Generar Factura**
```http
POST /api/pagos/facturas
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "paciente_id": 3,
    "tratamiento_ids": [45, 46],
    "servicios_adicionales": [
        {
            "descripcion": "Consulta de diagnóstico",
            "costo": 50000
        }
    ],
    "descuento_porcentaje": 10,
    "notas": "Paciente con plan de descuento corporativo"
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Factura generada exitosamente.",
    "data": {
        "factura_id": "FACT-2025-001234",
        "paciente": "María González",
        "subtotal": 300000,
        "descuento": 30000,
        "total": 270000,
        "estado": "pendiente",
        "fecha_vencimiento": "2025-09-27",
        "pdf_url": "/facturas/FACT-2025-001234.pdf"
    }
}
```

### **Registrar Pago**
```http
POST /api/pagos
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "factura_id": "FACT-2025-001234",
    "monto": 270000,
    "metodo_pago": "tarjeta_credito",
    "referencia": "TXN789456123",
    "notas": "Pago completo en una sola cuota",
    "recibido_por": 1
}
```

**Response (201):**
```json
{
    "success": true,
    "msg": "Pago registrado exitosamente.",
    "data": {
        "pago_id": "PAY-2025-005678",
        "monto": 270000,
        "saldo_pendiente": 0,
        "recibo_url": "/recibos/PAY-2025-005678.pdf"
    }
}
```

### **Consultar Estado de Pagos**
```http
GET /api/pagos/estado
Authorization: Bearer <token>
```

**Query Parameters:**
- `paciente_id` (optional) - Filtrar por paciente
- `estado` (optional) - `pendiente`, `parcial`, `pagado`, `vencido`
- `fecha_desde` (optional) - Fecha inicio
- `fecha_hasta` (optional) - Fecha fin

**Response (200):**
```json
{
    "success": true,
    "data": {
        "resumen": {
            "total_facturado": 5750000,
            "total_cobrado": 4200000,
            "saldo_pendiente": 1550000,
            "facturas_vencidas": 8
        },
        "facturas": [
            {
                "factura_id": "FACT-2025-001234",
                "paciente": "María González",
                "total": 270000,
                "pagado": 270000,
                "saldo": 0,
                "estado": "pagado",
                "fecha_factura": "2025-08-27",
                "fecha_vencimiento": "2025-09-27"
            }
        ]
    }
}
```

---

## 📊 **ENDPOINTS DE REPORTES**

### **Reporte Financiero**
```http
GET /api/reportes/financiero
Authorization: Bearer <token>
```

**Query Parameters:**
- `fecha_inicio` (required) - Fecha de inicio: `2025-08-01`
- `fecha_fin` (required) - Fecha de fin: `2025-08-31`
- `formato` (optional) - `json`, `pdf`, `excel` (default: json)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "periodo": {
            "inicio": "2025-08-01",
            "fin": "2025-08-31"
        },
        "ingresos": {
            "total_facturado": 8750000,
            "total_cobrado": 7200000,
            "pendiente_cobro": 1550000,
            "por_metodo_pago": {
                "efectivo": 2100000,
                "tarjeta_credito": 3800000,
                "tarjeta_debito": 1300000
            }
        },
        "gastos": {
            "inventario": 1200000,
            "servicios": 450000,
            "nomina": 2800000,
            "total": 4450000
        },
        "utilidad_bruta": 2750000,
        "top_tratamientos": [
            {
                "tratamiento": "Limpieza dental",
                "cantidad": 45,
                "ingresos": 1350000
            }
        ]
    }
}
```

### **Reporte de Productividad**
```http
GET /api/reportes/productividad
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "odontologos": [
            {
                "id": 2,
                "nombre": "Dr. Carlos Rodríguez",
                "citas_programadas": 85,
                "citas_completadas": 78,
                "tasa_cumplimiento": 91.8,
                "tiempo_promedio_cita": 42,
                "ingresos_generados": 2850000,
                "satisfaccion_promedio": 4.7
            }
        ],
        "estadisticas_generales": {
            "total_pacientes_atendidos": 156,
            "tiempo_espera_promedio": 8.5,
            "cancelaciones": {
                "total": 12,
                "porcentaje": 4.2
            }
        }
    }
}
```

### **Reporte de Inventario**
```http
GET /api/reportes/inventario
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "resumen": {
            "valor_total": 15750000,
            "productos_activos": 147,
            "productos_stock_bajo": 12,
            "productos_vencidos": 3
        },
        "rotacion_productos": [
            {
                "nombre_producto": "Resina compuesta",
                "uso_mensual": 15,
                "stock_actual": 25,
                "meses_inventario": 1.7
            }
        ],
        "alertas": {
            "reabastecer": 12,
            "proximos_vencer": 8,
            "vencidos": 3
        }
    }
}
```

---

## ⚠️ **CÓDIGOS DE ERROR**

### **Códigos de Estado HTTP:**

| Código | Descripción | Uso |
|--------|-------------|-----|
| **200** | OK | Solicitud exitosa |
| **201** | Created | Recurso creado exitosamente |
| **400** | Bad Request | Datos de entrada inválidos |
| **401** | Unauthorized | No autenticado |
| **403** | Forbidden | Sin permisos |
| **404** | Not Found | Recurso no encontrado |
| **409** | Conflict | Conflicto (ej: email duplicado) |
| **422** | Unprocessable Entity | Errores de validación |
| **429** | Too Many Requests | Rate limit excedido |
| **500** | Internal Server Error | Error del servidor |

### **Estructura de Errores:**
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Los datos enviados no son válidos",
        "details": [
            {
                "field": "email",
                "message": "Debe ser un email válido",
                "received": "invalid-email"
            }
        ]
    },
    "timestamp": "2025-08-27T10:00:00.000Z"
}
```

### **Códigos de Error Personalizados:**

| Código | Descripción |
|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Credenciales incorrectas |
| `AUTH_TOKEN_EXPIRED` | Token expirado |
| `AUTH_TOKEN_INVALID` | Token inválido |
| `AUTH_INSUFFICIENT_PERMISSIONS` | Permisos insuficientes |
| `VALIDATION_ERROR` | Error de validación de datos |
| `RESOURCE_NOT_FOUND` | Recurso no encontrado |
| `RESOURCE_ALREADY_EXISTS` | Recurso ya existe |
| `BUSINESS_RULE_VIOLATION` | Violación de regla de negocio |
| `EXTERNAL_SERVICE_ERROR` | Error en servicio externo |

---

## 🚦 **RATE LIMITING**

### **Límites Configurados:**

| Endpoint | Límite | Ventana de Tiempo |
|----------|--------|-------------------|
| **General** | 100 requests | 15 minutos |
| **Autenticación** | 5 intentos | 15 minutos |
| **Reportes** | 20 requests | 60 minutos |
| **Creación de recursos** | 30 requests | 60 minutos |

### **Headers de Rate Limit:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1692374478
```

### **Response cuando se excede:**
```json
{
    "success": false,
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Demasiadas solicitudes desde esta IP. Intenta más tarde.",
        "retryAfter": 900
    }
}
```

---

## 💡 **EJEMPLOS DE USO**

### **JavaScript/Fetch:**
```javascript
// Login y obtener token
async function login() {
    const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            correo: 'admin@clinikdent.com',
            password: 'admin123',
            rol: 'administrador'
        })
    });
    
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('token', data.token);
        return data.token;
    }
    throw new Error(data.error.message);
}

// Hacer request autenticado
async function getUsuarios() {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/usuarios', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    return await response.json();
}
```

### **cURL:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "admin@clinikdent.com",
    "password": "admin123",
    "rol": "administrador"
  }'

# Obtener usuarios (reemplazar <TOKEN> con el token real)
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"

# Crear cita
curl -X POST http://localhost:3000/api/citas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente_id": 3,
    "odontologo_id": 2,
    "fecha_cita": "2025-08-28T10:00:00.000Z",
    "tipo_consulta": "Consulta general"
  }'
```

### **Python/Requests:**
```python
import requests
import json

# Configuración
base_url = "http://localhost:3000/api"
headers = {"Content-Type": "application/json"}

# Login
login_data = {
    "correo": "admin@clinikdent.com",
    "password": "admin123",
    "rol": "administrador"
}

response = requests.post(f"{base_url}/auth/login", 
                        headers=headers, 
                        json=login_data)
token = response.json()["token"]

# Headers con autenticación
auth_headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

# Obtener usuarios
usuarios = requests.get(f"{base_url}/usuarios", headers=auth_headers)
print(usuarios.json())

# Crear paciente
nuevo_paciente = {
    "nombre": "Ana",
    "apellido": "García",
    "correo": "ana@email.com",
    "password": "Password123!",
    "rol": "paciente",
    "telefono": "3009876543"
}

response = requests.post(f"{base_url}/usuarios", 
                        headers=auth_headers, 
                        json=nuevo_paciente)
print(response.json())
```

---

## 🔄 **VERSIONADO DE API**

### **Estrategia de Versionado:**
- **URL Versioning:** `/api/v1/`, `/api/v2/`
- **Versión Actual:** `v2`
- **Compatibilidad:** Se mantiene soporte para `v1` hasta diciembre 2025

### **Header de Versión:**
```http
API-Version: 2.0
```

### **Deprecation Notice:**
```json
{
    "success": true,
    "data": [...],
    "warnings": [
        {
            "code": "DEPRECATION_WARNING",
            "message": "Esta versión de la API será obsoleta el 31/12/2025. Migre a v2.",
            "url": "https://docs.clinikdent.com/migration-guide"
        }
    ]
}
```

---

## 📈 **ROADMAP DE API**

### **Próximas Funcionalidades (v2.1):**
- 📱 Push notifications para móviles
- 🔗 Webhooks para integraciones
- 📊 GraphQL endpoint
- 🏥 Multi-sede management
- 🤖 IA para sugerencias de tratamientos

### **Funcionalidades Futuras (v3.0):**
- 🌍 Soporte multi-idioma
- 🔍 Búsqueda avanzada con Elasticsearch
- 📱 API móvil optimizada
- 🎯 Personalización por región

---

## 🆘 **SOPORTE**

### **Recursos de Ayuda:**
- 📚 **Documentación completa:** https://docs.clinikdent.com/api
- 🎮 **API Playground:** https://api.clinikdent.com/playground
- 🐛 **Reportar bugs:** https://github.com/maria162003/clinikdent-v2-0/issues
- 💬 **Discord Community:** https://discord.gg/clinikdent

### **Contacto:**
- **Email:** api-support@clinikdent.com
- **Slack:** #api-support en nuestro workspace
- **Office Hours:** Lunes a Viernes, 9AM - 6PM (COT)

---

*Documentación de API Clinikdent v2.0 - Agosto 2025*
*© 2025 Clinikdent Development Team. Todos los derechos reservados.*
