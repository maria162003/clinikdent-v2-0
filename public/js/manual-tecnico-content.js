/**
 * Manual Técnico Dinámico para Clinikdent v2.0
 * Genera contenido autenticado a partir de la estructura real del proyecto.
 */

const breadcrumb = (label) => `
	<div class="breadcrumb-custom">
		<a href="#" onclick="showSection('overview')">Inicio</a> / ${label}
	</div>
`;

function buildRequirementsSection() {
	return `
		${breadcrumb('Requisitos Técnicos')}
		<div class="doc-card">
			<h2><i class="fas fa-check-circle"></i> Requisitos Técnicos</h2>
			<p>Clinikdent v2.0 opera sobre Node.js 18+ con Express 5.1 y PostgreSQL (Supabase) como persistencia principal. El frontend es estático y se sirve desde <code>public/</code>. Las condiciones recomendadas dependen del ambiente.</p>
			<h3>Entorno recomendado</h3>
			<table class="table-custom">
				<thead>
					<tr>
						<th>Componente</th>
						<th>Desarrollo</th>
						<th>Producción</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>CPU</td>
						<td>2 vCPU</td>
						<td>4 vCPU</td>
					</tr>
					<tr>
						<td>Memoria</td>
						<td>4 GB RAM</td>
						<td>8 GB RAM</td>
					</tr>
					<tr>
						<td>Almacenamiento</td>
						<td>20 GB SSD</td>
						<td>40 GB SSD</td>
					</tr>
					<tr>
						<td>Sistema Operativo</td>
						<td>Windows 10/11, macOS, Ubuntu 22.04</td>
						<td>Ubuntu Server 22.04 LTS o equivalente</td>
					</tr>
					<tr>
						<td>Base de Datos</td>
						<td>Supabase (PostgreSQL 15)</td>
						<td>Supabase gestionado o PostgreSQL 15 administrado</td>
					</tr>
				</tbody>
			</table>
			<h3>Dependencias clave</h3>
			<ul>
				<li>Node.js &gt;= 18.20 y npm 10 (ver <code>package.json</code>).</li>
				<li>Acceso a Supabase y variables <code>SUPABASE_*</code> configuradas.</li>
				<li>Credenciales de MercadoPago para <code>mercadoPagoService</code>.</li>
				<li>Cuenta SMTP (Gmail u otro) para <code>services/email-service.js</code>.</li>
				<li>ReCAPTCHA v2 si se habilitan formularios públicos (ver <code>BACKEND_SECURITY_RECAPTCHA_KEY</code>).</li>
			</ul>
			<h3>Comprobación rápida</h3>
			<div class="code-block" data-lang="bash">
node --version
npm --version
psql --version
supabase --version # opcional
			</div>
			<p>El archivo <code>.env</code> debe existir en la raíz del proyecto con todas las variables descritas en la sección Configuración.</p>
		</div>
	`;
}

function buildArchitectureSection() {
	return `
		${breadcrumb('Arquitectura General')}
		<div class="doc-card">
			<h2><i class="fas fa-diagram-project"></i> Arquitectura General</h2>
			<p>El sistema sigue un patrón modular Express + PostgreSQL. <code>app.js</code> expone el servidor HTTP y enruta hacia <code>Backend/serverSecure.js</code> para endurecer cabeceras, sesiones y HTTPS. La lógica de negocio se distribuye en controladores dentro de <code>Backend/controllers/</code>.</p>
			<h3>Capas principales</h3>
			<ul>
				<li><strong>Presentación:</strong> Vistas estáticas en <code>public/</code> con dashboards específicos y scripts en <code>public/js/</code>.</li>
				<li><strong>API REST:</strong> Rutas Express en <code>Backend/routes/</code> que delegan en controladores especializados.</li>
				<li><strong>Servicios externos:</strong> Implementados en <code>Backend/services/</code> (MercadoPago, contenido dinámico) y <code>services/email-service.js</code>.</li>
				<li><strong>Persistencia:</strong> <code>Backend/config/databaseSecure.js</code> define el pool de <code>pg</code>; <code>Backend/config/supabase.js</code> fabrica clientes Supabase.</li>
				<li><strong>Automatizaciones:</strong> Scripts programados en <code>run-recordatorios.js</code> y tareas en <code>scripts/</code> para migraciones.</li>
			</ul>
			<div class="code-block" data-lang="text">
Clinikdent_supabase_1.0/
├── app.js
├── Backend/
│   ├── serverSecure.js
│   ├── config/
│   │   ├── databaseSecure.js
│   │   └── supabase.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── services/
├── public/
│   ├── *.html
│   ├── css/
│   └── js/
└── scripts/
			</div>
			<p>La comunicación cliente-servidor se realiza vía AJAX utilizando JWT y cookies de sesión PostgreSQL. Los historiales clínicos usan directamente Supabase para aprovechar Row Level Security.</p>
		</div>
	`;
}

function buildTechnologiesSection() {
	return `
		${breadcrumb('Stack Tecnológico')}
		<div class="doc-card">
			<h2><i class="fas fa-layer-group"></i> Stack Tecnológico</h2>
			<p>Versiones obtenidas de <code>package.json</code> y archivos de configuración actuales.</p>
			<table class="table-custom">
				<thead>
					<tr>
						<th>Capa</th>
						<th>Tecnología</th>
						<th>Versión</th>
						<th>Uso</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Backend</td>
						<td>Express</td>
						<td>5.1.0</td>
						<td>Servidor HTTP principal (<code>app.js</code>, <code>Backend/serverSecure.js</code>).</td>
					</tr>
					<tr>
						<td>Persistencia</td>
						<td>pg</td>
						<td>8.16.3</td>
						<td>Pool y consultas seguras en <code>Backend/config/databaseSecure.js</code>.</td>
					</tr>
					<tr>
						<td>Supabase</td>
						<td>@supabase/supabase-js</td>
						<td>2.81.0</td>
						<td>Historiales y autenticación delegada (<code>supabaseAuthController.js</code>).</td>
					</tr>
					<tr>
						<td>Pagos</td>
						<td>mercadopago</td>
						<td>2.8.0</td>
						<td>Preferencias, webhooks y conciliación (<code>Backend/services/mercadoPagoService.js</code>).</td>
					</tr>
					<tr>
						<td>Reportes</td>
						<td>exceljs / pdfkit / docx</td>
						<td>4.4.0 / 0.17.2 / 9.5.1</td>
						<td>Generación de informes en <code>reportesController.js</code>.</td>
					</tr>
					<tr>
						<td>Correo</td>
						<td>nodemailer</td>
						<td>7.0.10</td>
						<td>Plantillas HTML en <code>services/email-service.js</code>.</td>
					</tr>
					<tr>
						<td>Seguridad</td>
						<td>express-rate-limit</td>
						<td>8.2.1</td>
						<td>Limitadores en <code>middleware/securityAdvanced.js</code>.</td>
					</tr>
					<tr>
						<td>Utilidades</td>
						<td>dayjs, uuid, bcrypt</td>
						<td>1.11.x / 9.x / 5.1.1</td>
						<td>Fechas, identificadores y hashing de credenciales.</td>
					</tr>
				</tbody>
			</table>
		</div>
	`;
}

function buildDatabaseSection() {
	return `
		${breadcrumb('Base de Datos')}
		<div class="doc-card">
			<h2><i class="fas fa-database"></i> Base de Datos</h2>
			<p><code>Backend/config/databaseSecure.js</code> abstrae la conexión a PostgreSQL con un pool configurado contra Supabase. Todas las consultas pasan por <code>secureQuery</code>, que audita eventos para <code>Backend/logs/security.log</code> y bloquea operaciones peligrosas.</p>
			<div class="code-block" data-lang="javascript">
const { Pool } = require('pg');
const pool = new Pool({
	user: process.env.SUPABASE_DB_USER || 'postgres',
	host: process.env.SUPABASE_DB_HOST,
	database: process.env.SUPABASE_DB_NAME || 'postgres',
	password: process.env.SUPABASE_DB_PASSWORD,
	port: process.env.SUPABASE_DB_PORT || 5432,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
	max: 20,
	statement_timeout: 30000
});
			</div>
			<h3>Mecanismos destacados</h3>
			<ul>
				<li><strong>Monitorización:</strong> <code>healthCheck()</code> devuelve estado y métricas de conexión.</li>
				<li><strong>Auditoría:</strong> <code>logSecurityEvent()</code> persiste consultas lentas, errores y cambios masivos.</li>
				<li><strong>Script de soporte:</strong> <code>scripts/crear_tabla_notificaciones.sql</code>, <code>scripts/crear_tabla_configuracion.js</code> y <code>scripts/migracion_agregar_estado_historial.js</code> generan esquemas faltantes.</li>
			</ul>
			<h3>Tablas estratégicas</h3>
			<ul>
				<li><code>usuarios</code>: Roles, estado y metadatos de acceso (ver <code>Backend/controllers/usuarioController.js</code>).</li>
				<li><code>citas</code>, <code>cita_historial_estados</code>: Agenda y trazabilidad (usadas por <code>citaController.js</code>).</li>
				<li><code>inventario</code>, <code>movimientos_inventario</code>: Gestión de stock a nivel sede.</li>
				<li><code>transacciones_mercadopago</code>: Conciliación de pagos.</li>
				<li><code>reportes_generados</code>: Rastrea exportaciones generadas desde <code>reportesController.js</code>.</li>
				<li><code>audit_log</code>: Eventos de seguridad creados desde <code>middleware/securityAdvanced.js</code>.</li>
			</ul>
			<p>Para estructuras completas revise <code>SOLUCION_REPORTES_POSTGRESQL.md</code> y <code>verificar_tablas_reportes.sql</code>.</p>
		</div>
	`;
}

function buildServerSection() {
	return `
		${breadcrumb('Servidor Express')}
		<div class="doc-card">
			<h2><i class="fas fa-cogs"></i> Servidor Express</h2>
			<p><code>app.js</code> prepara el servidor general, mientras que <code>Backend/serverSecure.js</code> añade protecciones avanzadas (Helmet, HTTPS opcional, logging). Las sesiones se almacenan en PostgreSQL mediante <code>connect-pg-simple</code>.</p>
			<div class="code-block" data-lang="javascript">
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '5mb' }));
app.use(session({
	store: new pgSession({ pool }),
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 86400000 }
}));
			</div>
			<h3>Registro de rutas</h3>
			<ul>
				<li><code>app.js</code> registra uno a uno los routers ubicados en <code>Backend/routes/</code> (authRoutes, citaRoutes, inventarioRoutes, etc.).</li>
				<li>Archivos de rutas individuales montan controladores especializados (ver sección API).</li>
				<li>Middleware compartidos en <code>Backend/middleware/</code> validan payloads, tokens y roles.</li>
			</ul>
			<p>En producción, el arranque sugerido se realiza con <code>node Backend/serverSecure.js</code> detrás de un proxy (Nginx o similar).</p>
		</div>
	`;
}

function buildApiSection() {
	return `
		${breadcrumb('API REST')}
		<div class="doc-card">
			<h2><i class="fas fa-plug"></i> API REST</h2>
			<p>Más de 200 endpoints organizados por dominio. Cada ruta aplica validaciones y limitadores definidos en <code>middleware/securityAdvanced.js</code>.</p>
			<h3>Routers principales</h3>
			<table class="table-custom">
				<thead>
					<tr>
						<th>Base Path</th>
						<th>Archivo</th>
						<th>Controlador</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>/api/auth</code></td>
						<td><code>Backend/routes/authSecureRoutes.js</code></td>
						<td><code>authSecureController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/usuarios</code></td>
						<td><code>Backend/routes/usuarioRoutes.js</code></td>
						<td><code>usuarioController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/citas</code></td>
						<td><code>Backend/routes/citaRoutes.js</code></td>
						<td><code>citaController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/historial</code></td>
						<td><code>Backend/routes/historialRoutes.js</code></td>
						<td><code>historialController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/inventario</code></td>
						<td><code>Backend/routes/inventarioRoutes.js</code></td>
						<td><code>inventarioController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/pagos</code></td>
						<td><code>Backend/routes/pagoRoutes.js</code></td>
						<td><code>pagoController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/mercadopago</code></td>
						<td><code>Backend/routes/mercadoPagoRoutes.js</code></td>
						<td><code>mercadoPagoController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/reportes</code></td>
						<td><code>Backend/routes/reportesRoutes.js</code></td>
						<td><code>reportesController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/comunicaciones</code></td>
						<td><code>Backend/routes/comunicacionesRoutes.js</code></td>
						<td><code>comunicacionesController.js</code></td>
					</tr>
					<tr>
						<td><code>/api/performance</code></td>
						<td><code>Backend/routes/performanceRoutes.js</code></td>
						<td><code>performanceController.js</code></td>
					</tr>
				</tbody>
			</table>
			<h3>Convenciones</h3>
			<ul>
				<li>Todos los endpoints retornan objetos JSON con campos <code>success</code>, <code>message</code> y <code>data</code>.</li>
				<li>El header <code>Authorization</code> porta <code>Bearer &lt;token&gt;</code> para rutas protegidas.</li>
				<li>Se usan validaciones con <code>express-validator</code> y sanitización básica.</li>
				<li>Los controladores manejan errores con respuestas 4xx/5xx uniformes y logueo automático.</li>
			</ul>
		</div>
	`;
}

function buildAuthenticationSection() {
	return `
		${breadcrumb('Autenticación y Sesiones')}
		<div class="doc-card">
			<h2><i class="fas fa-lock"></i> Autenticación y Sesiones</h2>
			<p><code>Backend/routes/authSecureRoutes.js</code> y <code>Backend/controllers/authSecureController.js</code> implementan el flujo completo basado en JWT de corta duración, refresh tokens y reCAPTCHA opcional.</p>
			<h3>Flujo</h3>
			<ol>
				<li>Registro <code>/api/auth/register</code> valida password, ejecuta <code>bcrypt.hash</code> y dispara email de confirmación.</li>
				<li>Login <code>/api/auth/login</code> devuelve <code>accessToken</code> (15 minutos) y <code>refreshToken</code> (7 días).</li>
				<li>Renovación <code>/api/auth/refresh</code> revisa blacklists administradas por <code>tokenBlacklist</code>.</li>
				<li>Cierre de sesión invalida tokens activos y limpia sesiones de PostgreSQL.</li>
			</ol>
			<h3>Middleware clave</h3>
			<ul>
				<li><code>authenticateToken</code>: verifica JWT y adjunta el usuario al request.</li>
				<li><code>authorizeRoles</code>: matchea roles contra la acción requerida.</li>
				<li><code>authLimiter</code>, <code>registrationLimiter</code>, <code>passwordResetLimiter</code>: protegen endpoints de fuerza bruta.</li>
			</ul>
			<p>Los cambios se registran en <code>audit_log</code> y en <code>Backend/logs/security.log</code>.</p>
		</div>
	`;
}

function buildSecuritySection() {
	return `
		${breadcrumb('Seguridad')}
		<div class="doc-card">
			<h2><i class="fas fa-shield-alt"></i> Seguridad</h2>
			<ul>
				<li><strong>Rate limiting:</strong> <code>authLimiter</code>, <code>speedLimiter</code> y <code>registrationLimiter</code> previenen abuso.</li>
				<li><strong>CSP y cabeceras:</strong> Helmet con política relajada pero configurable.</li>
				<li><strong>Sanitización:</strong> Validaciones con <code>express-validator</code> en la mayoría de rutas sensibles.</li>
				<li><strong>Logs:</strong> <code>logSecurityEvent</code> escribe en <code>Backend/logs/security.log</code> con timestamp y severidad.</li>
				<li><strong>Supabase RLS:</strong> Las tablas manejadas via Supabase (historial clínico) usan políticas RLS configuradas directamente en la plataforma.</li>
				<li><strong>Backups de tokens:</strong> <code>services/email-service.js</code> cifra identificadores sensibles antes de enviarlos.</li>
			</ul>
			<div class="alert-custom alert-warning">
				<i class="fas fa-triangle-exclamation" style="font-size: 24px;"></i>
				<div>
					Mantenga <code>SESSION_SECRET</code> y claves de Supabase fuera del repositorio. Use variables de entorno o gestores secretos.
				</div>
			</div>
		</div>
	`;
}

function buildInstallationSection() {
	return `
		${breadcrumb('Instalación')}
		<div class="doc-card">
			<h2><i class="fas fa-download"></i> Instalación Local</h2>
			<ol>
				<li>Clonar el repositorio y entrar a <code>Clinikdent_supabase_1.0</code>.</li>
				<li>Crear <code>.env</code> tomando como referencia <code>GUIA_CONFIGURACION_SUPABASE_EMAIL.md</code>.</li>
				<li>Instalar dependencias con <code>npm install</code>.</li>
				<li>Ejecutar scripts de verificación: <code>node scripts/consultar_inventario.js</code> o <code>node scripts/test_reportes_sistema.js</code>.</li>
				<li>Correr el servidor: <code>npm run dev</code> (usa <code>nodemon</code>) o <code>node Backend/serverSecure.js</code>.</li>
				<li>Servir la carpeta <code>public/</code> en un puerto disponible (ej. <code>npx serve public</code>).</li>
			</ol>
			<p>En Windows se incluye <code>ARRANCAR_CLINIKDENT.bat</code> con exportación de variables y arranque del backend.</p>
		</div>
	`;
}

function buildConfigurationSection() {
	return `
		${breadcrumb('Configuración')}
		<div class="doc-card">
			<h2><i class="fas fa-sliders-h"></i> Variables de Configuración</h2>
			<p>Defina las siguientes variables en <code>.env</code> según la guía <code>GUIA_CONFIGURACION_SUPABASE_EMAIL.md</code>.</p>
			<table class="table-custom">
				<thead>
					<tr>
						<th>Variable</th>
						<th>Descripción</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>PORT</code></td>
						<td>Puesto de escucha HTTP (default 3000).</td>
					</tr>
					<tr>
						<td><code>SESSION_SECRET</code></td>
						<td>Clave para firmar sesiones Express.</td>
					</tr>
					<tr>
						<td><code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE</code></td>
						<td>Credenciales para cliente Supabase.</td>
					</tr>
					<tr>
						<td><code>SUPABASE_DB_HOST</code>, <code>SUPABASE_DB_USER</code>, <code>SUPABASE_DB_PASSWORD</code></td>
						<td>Datos de conexión directa a PostgreSQL.</td>
					</tr>
					<tr>
						<td><code>MERCADOPAGO_ACCESS_TOKEN</code></td>
						<td>Token productivo o sandbox para pagos.</td>
					</tr>
					<tr>
						<td><code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code></td>
						<td>Envío de correos desde <code>services/email-service.js</code>.</td>
					</tr>
					<tr>
						<td><code>ALLOWED_ORIGINS</code></td>
						<td>Lista separada por comas para CORS.</td>
					</tr>
					<tr>
						<td><code>BACKUP_BUCKET</code> (opcional)</td>
						<td>Storage en Supabase o S3 para respaldos.</td>
					</tr>
				</tbody>
			</table>
			<p>Guarde un archivo <code>.env.example</code> con valores dummy para facilitar despliegues futuros.</p>
		</div>
	`;
}

function buildDeploymentSection() {
	return `
		${breadcrumb('Despliegue en Producción')}
		<div class="doc-card">
			<h2><i class="fas fa-cloud-upload-alt"></i> Producción</h2>
			<h3>Checklist</h3>
			<ul>
				<li>Configurar proxy inverso (Nginx/Traefik) para TLS y compresión.</li>
				<li>Crear servicio del sistema (systemd o PM2) que ejecute <code>node Backend/serverSecure.js</code>.</li>
				<li>Habilitar <code>SESSION_COOKIE_SECURE</code> estableciendo <code>NODE_ENV=production</code>.</li>
				<li>Configurar <code>ALLOWED_ORIGINS</code> con dominio final y clientes confiables.</li>
				<li>Activar alertas desde Supabase para monitorear consumo de base de datos.</li>
			</ul>
			<h3>Comandos útiles</h3>
			<div class="code-block" data-lang="bash">
npm run build # opcional si se agregan procesos de minificación
NODE_ENV=production node Backend/serverSecure.js
pm2 start Backend/serverSecure.js --name clinikdent
pm2 save
			</div>
			<p>Para desplegar en contenedores, basee su imagen en Node 18-alpine, copie <code>public/</code> y exponga el puerto configurado.</p>
		</div>
	`;
}

function buildBackupSection() {
	return `
		${breadcrumb('Respaldos y Recuperación')}
		<div class="doc-card">
			<h2><i class="fas fa-hdd"></i> Respaldos</h2>
			<ul>
				<li><strong>Base de datos:</strong> Use los <em>backups</em> automáticos de Supabase y exportaciones manuales con <code>pg_dump</code>.</li>
				<li><strong>Configuración:</strong> Versionar <code>.env.example</code> y documentar credenciales en gestor seguro.</li>
				<li><strong>Scripts:</strong> <code>scripts/consultar_estructura_inventario.js</code> y <code>scripts/tmpListPacienteTables.js</code> ayudan a validar integridad tras restauraciones.</li>
				<li><strong>Documentación:</strong> Revise <code>ANALISIS_RECUPERACION_PASSWORD.md</code> y <code>SOLUCION_RECUPERACION_IMPLEMENTADA.md</code> para el plan de recuperación de cuentas.</li>
			</ul>
			<p>Recomendación: programar un cron externo que ejecute <code>pg_dump</code> diario y sincronice con almacenamiento seguro.</p>
		</div>
	`;
}

function buildMonitoringSection() {
	return `
		${breadcrumb('Monitoreo y Observabilidad')}
		<div class="doc-card">
			<h2><i class="fas fa-heartbeat"></i> Monitoreo</h2>
			<ul>
				<li><strong>Logs:</strong> <code>Backend/logs/</code> almacena <code>security.log</code> y <code>app.log</code> mediante utilidades en <code>logger.js</code>.</li>
				<li><strong>Salud:</strong> <code>Backend/routes/seguridadRoutes.js</code> expone endpoints internos para revisar estado del sistema.</li>
				<li><strong>Métricas:</strong> <code>reportesAnalyticsController.js</code> alimenta dashboards de <code>public/dashboard-performance.html</code>.</li>
				<li><strong>Alertas:</strong> Utilice triggers de Supabase para enviar notificaciones ante errores críticos (ver <code>SISTEMA_NOTIFICACIONES_EMAIL.md</code>).</li>
				<li><strong>Registro de actividad:</strong> <code>public/registro-actividad.html</code> consume endpoints de <code>actividadRoutes.js</code>.</li>
			</ul>
			<p>Para escalar, integre servicios como Grafana o herramientas APM conectando al pool de PostgreSQL y a un agregador de logs.</p>
		</div>
	`;
}

function buildTroubleshootingSection() {
	return `
		${breadcrumb('Solución de Problemas')}
		<div class="doc-card">
			<h2><i class="fas fa-bug"></i> Solución de Problemas</h2>
			<h3>Incidencias comunes</h3>
			<ul>
				<li><strong>Error "Unterminated template literal":</strong> revisar <code>public/js/manual-tecnico-content.js</code> en busca de comillas sin cerrar.</li>
				<li><strong>401 No autorizado:</strong> validar expiración del <code>accessToken</code> y refresh mediante <code>/api/auth/refresh</code>.</li>
				<li><strong>Conexión a Supabase fallida:</strong> confirmar IP permitida y credenciales en <code>SUPABASE_DB_HOST</code>.</li>
				<li><strong>Reportes sin datos:</strong> ejecutar <code>scripts/verificar_tablas_reportes.sql</code> y revisar permisos en tablas materializadas.</li>
				<li><strong>Emails no llegan:</strong> activar <code>less secure app</code> o App Passwords si se usa Gmail según <code>SISTEMA_NOTIFICACIONES_EMAIL.md</code>.</li>
			</ul>
			<h3>Logs recomendados</h3>
			<ul>
				<li><code>Backend/logs/security.log</code> para eventos de autenticación y base de datos.</li>
				<li><code>Backend/logs/app.log</code> para errores de controladores.</li>
				<li><code>Backend/logs/mercadopago.log</code> para conciliación de pagos.</li>
			</ul>
		</div>
	`;
}

function buildModuleCitasSection() {
	return `
		${breadcrumb('Módulo de Citas')}
		<div class="doc-card">
			<h2><i class="fas fa-calendar-check"></i> Gestión de Citas</h2>
			<p><code>Backend/routes/citaRoutes.js</code> y <code>Backend/controllers/citaController.js</code> administran la agenda clínica, integrándose con historiales, inventario y notificaciones.</p>
			<h3>Funciones principales</h3>
			<ul>
				<li>Creación y reasignación de citas con validaciones de disponibilidad.</li>
				<li>Estados trazables (<code>pendiente</code>, <code>confirmada</code>, <code>en_curso</code>, <code>completada</code>, etc.).</li>
				<li>Historial de cambios en <code>cita_historial_estados</code>.</li>
				<li>Recordatorios automáticos via <code>run-recordatorios.js</code> y <code>services/email-service.js</code>.</li>
			</ul>
			<div class="code-block" data-lang="javascript">
// Backend/routes/citaRoutes.js (fragmento)
router.post('/', authenticateToken, authorizeRoles('admin', 'maestro', 'odontologo'), citaController.crearCita);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'maestro'), citaController.actualizarCita);
router.get('/agenda/odontologo/:id', authenticateToken, citaController.obtenerAgendaOdontologo);
			</div>
			<p>El frontend consume estos endpoints desde <code>public/js/citas.js</code> y vistas <code>citas.html</code>, <code>agenda.html</code>.</p>
		</div>
	`;
}

function buildModulePacientesSection() {
	return `
		${breadcrumb('Módulo de Pacientes')}
		<div class="doc-card">
			<h2><i class="fas fa-user-injured"></i> Pacientes</h2>
			<p>El alta y mantenimiento de pacientes se gestionan mediante <code>Backend/routes/usuarioRoutes.js</code> y <code>usuarioController.js</code>. Complementan la información con historiales y citas.</p>
			<h3>Componentes</h3>
			<ul>
				<li><strong>Registro:</strong> Validaciones de datos personales, contacto y asignación de rol <code>paciente</code>.</li>
				<li><strong>Búsqueda:</strong> Endpoints para filtros por documento, teléfono o estado.</li>
				<li><strong>Scripts de soporte:</strong> <code>scripts/tmpInspectPacientes.js</code>, <code>scripts/tmpCountPacientes.js</code> para auditorías.</li>
				<li><strong>Dashboard:</strong> <code>public/dashboard-paciente.html</code> muestra la información consolidada.</li>
			</ul>
			<p>Los pacientes se asocian con historiales clínicos y planes de tratamiento usando <code>paciente_id</code> como clave foránea.</p>
		</div>
	`;
}

function buildModuleHistorialesSection() {
	return `
		${breadcrumb('Módulo de Historiales Clínicos')}
		<div class="doc-card">
			<h2><i class="fas fa-file-medical"></i> Historiales Clínicos</h2>
			<p><code>Backend/routes/historialRoutes.js</code> y <code>Backend/controllers/historialController.js</code> se integran con Supabase para aprovechar funciones de almacenamiento seguro y RLS.</p>
			<h3>Características</h3>
			<ul>
				<li>Estados: <code>borrador</code>, <code>finalizado</code>, <code>cancelado</code>.</li>
				<li>Registro de tratamientos, diagnósticos, prescripciones y firma digital.</li>
				<li>Soporte de adjuntos en <code>historial_documentos</code>.</li>
				<li>Acceso limitado según rol (odontólogos y usuarios autorizados).</li>
			</ul>
			<p>Vistas relacionadas: <code>public/diagnostico-dashboard.html</code> y <code>public/historiales.html</code>.</p>
		</div>
	`;
}

function buildModuleTratamientosSection() {
	return `
		${breadcrumb('Módulo de Tratamientos')}
		<div class="doc-card">
			<h2><i class="fas fa-tooth"></i> Tratamientos</h2>
			<p>Administrado por <code>Backend/routes/tratamientoRoutes.js</code> y <code>tratamientoController.js</code>. Coordina catálogos de procedimientos, planes y seguimiento de progreso.</p>
			<h3>Elementos clave</h3>
			<ul>
				<li>Catálogo de tratamientos enlazado a costos y duración estimada.</li>
				<li>Planes complejos gestionados desde <code>planesRoutes.js</code> y <code>planesController.js</code>.</li>
				<li>Integración con inventario para controlar materiales asignados.</li>
				<li>Reportes de progreso en <code>reportesController.js</code>.</li>
			</ul>
			<p>El dashboard maestro permite ver tratamientos activos por paciente (<code>dashboard-maestro.html</code>).</p>
		</div>
	`;
}

function buildModuleInventarioSection() {
	return `
		${breadcrumb('Módulo de Inventario')}
		<div class="doc-card">
			<h2><i class="fas fa-boxes"></i> Inventario</h2>
			<p><code>Backend/routes/inventarioRoutes.js</code> y <code>inventarioController.js</code> administran materiales, proveedores y movimientos. Existen scripts de diagnóstico en <code>scripts/consultar_inventario.js</code>.</p>
			<h3>Funciones</h3>
			<ul>
				<li>ABC de productos odontológicos con stock por sede.</li>
				<li>Movimientos de entrada/salida y ajustes.</li>
				<li>Alertas de stock mínimo integradas a <code>services/email-service.js</code>.</li>
				<li>Reportes de consumo cruzado con tratamientos y citas.</li>
			</ul>
			<p>Pantalla relacionada: <code>public/inventario.html</code>.</p>
		</div>
	`;
}

function buildModulePagosSection() {
	return `
		${breadcrumb('Módulo de Pagos')}
		<div class="doc-card">
			<h2><i class="fas fa-money-bill-wave"></i> Pagos</h2>
			<p>Contempla pagos internos y externos. Los archivos principales son <code>Backend/routes/pagoRoutes.js</code>, <code>Backend/routes/pagosExtendidoRoutes.js</code>, <code>pagoController.js</code> y <code>pagosExtendidoController.js</code>.</p>
			<h3>Capacidades</h3>
			<ul>
				<li>Registro de ingresos/egresos y conciliación con tratamientos.</li>
				<li>Integración con MercadoPago (ver sección Integraciones).</li>
				<li>Reportes financieros en <code>reportesAnalyticsController.js</code>.</li>
				<li>Paneles en <code>public/pagos.html</code> y <code>public/pagos-facturacion.html</code>.</li>
			</ul>
			<p>El servicio <code>Backend/services/mercadoPagoService.js</code> centraliza la comunicación con la pasarela.</p>
		</div>
	`;
}

function buildModuleReportesSection() {
	return `
		${breadcrumb('Módulo de Reportes')}
		<div class="doc-card">
			<h2><i class="fas fa-chart-bar"></i> Reportes y Analytics</h2>
			<p><code>Backend/routes/reportesRoutes.js</code> y <code>reportesController.js</code> generan Excel, PDF y Word usando ExcelJS, PDFKit y docx. Para analíticas interactivas se usa <code>reportesAnalyticsController.js</code>.</p>
			<h3>Tipos de reportes</h3>
			<ul>
				<li>Productividad (citas, tratamientos, ingresos).</li>
				<li>Inventario y consumo por sede.</li>
				<li>Finanzas: cuentas por cobrar, pagos pendientes.</li>
				<li>Historial clínico: seguimientos y planes activos.</li>
			</ul>
			<p>Documentación complementaria: <code>GUIA_SISTEMA_REPORTES.md</code>, <code>IMPLEMENTACION_REPORTES_COMPLETA.md</code>, <code>SOLUCION_REPORTES_POSTGRESQL.md</code>.</p>
		</div>
	`;
}

function buildModuleComunicacionesSection() {
	return `
		${breadcrumb('Módulo de Comunicaciones')}
		<div class="doc-card">
			<h2><i class="fas fa-comments"></i> Comunicaciones</h2>
			<p>Incluye notificaciones, chat interno y recordatorios. El enrutador definido en <code>Backend/routes/comunicacionesRoutes.js</code> puede habilitarse desde <code>app.js</code> (actualmente comentado para pruebas) y se apoya en <code>comunicacionesController.js</code> más el servicio <code>services/email-service.js</code>.</p>
			<h3>Componentes</h3>
			<ul>
				<li><strong>Email:</strong> Plantillas HTML para recordatorios, confirmaciones y alertas (ver <code>SISTEMA_NOTIFICACIONES_EMAIL.md</code>).</li>
				<li><strong>Chat:</strong> <code>Backend/routes/chatRoutes.js</code> gestiona conversaciones en tiempo real con sockets.</li>
				<li><strong>Notificaciones de seguridad:</strong> <code>routes/security-notifications.js</code> en la raíz expone endpoints dedicados.</li>
				<li><strong>Automatización:</strong> <code>run-recordatorios.js</code> orquesta envíos programados.</li>
			</ul>
			<p>Frontends: <code>public/chat-soporte.html</code>, <code>public/noticias.html</code>, <code>public/registro-actividad.html</code>.</p>
		</div>
	`;
}

function buildFrontendStructureSection() {
	return `
		${breadcrumb('Frontend - Estructura')}
		<div class="doc-card">
			<h2><i class="fas fa-folder-tree"></i> Frontend: Estructura</h2>
			<div class="code-block" data-lang="text">
public/
├── agenda.html
├── citas.html
├── dashboard-admin.html
├── dashboard-maestro.html
├── dashboard-odontologo.html
├── dashboard-paciente.html
├── js/
│   ├── dashboard-admin.js
│   ├── dashboard-odontologo.js
│   ├── manual-tecnico-content.js
│   ├── reportes-dashboard.js
│   └── site-content.js
├── css/
└── images/
			</div>
			<p>Los dashboards consumen la API vía <code>fetch</code> y almacenan tokens en <code>localStorage</code>. Cada vista HTML tiene un script dedicado dentro de <code>public/js/</code>.</p>
			<h3>Buenas prácticas</h3>
			<ul>
				<li>Centralizar constantes en <code>public/js/app-config.js</code> y <code>public/js/index.js</code>.</li>
				<li>Mantener estilos coherentes aprovechando las hojas en <code>public/css/</code>.</li>
				<li>Organizar assets multimedia dentro de <code>public/images/</code>, <code>public/video/</code> y subcarpetas específicas.</li>
			</ul>
		</div>
	`;
}

function buildFrontendDashboardsSection() {
	return `
		${breadcrumb('Frontend - Dashboards')}
		<div class="doc-card">
			<h2><i class="fas fa-th-large"></i> Dashboards</h2>
			<p>Se proveen dashboards segmentados por rol, cada uno con widgets específicos alimentados por endpoints dedicados.</p>
			<ul>
				<li><code>dashboard-admin.html</code> + <code>public/js/dashboard-admin.js</code>: resumen operativo, métricas globales, configuraciones.</li>
				<li><code>dashboard-maestro.html</code> + <code>public/js/dashboard-admin.js</code> (modo maestro): visión multi-sede y asignación de odontólogos.</li>
				<li><code>dashboard-odontologo.html</code> + <code>public/js/dashboard-odontologo.js</code>: agenda diaria, tratamientos activos.</li>
				<li><code>dashboard-paciente.html</code> + <code>public/js/dashboard-paciente.js</code>: citas próximas, historial y pagos.</li>
				<li><code>dashboard-performance.html</code> + <code>public/js/reportes-dashboard.js</code>: datos de <code>Backend/routes/performanceRoutes.js</code>.</li>
			</ul>
			<p>Los scripts asociados residen en <code>public/js/</code> y comparten helpers de autenticación.</p>
		</div>
	`;
}

function buildFrontendComponentsSection() {
	return `
		${breadcrumb('Frontend - Componentes')}
		<div class="doc-card">
			<h2><i class="fas fa-cubes"></i> Componentes Compartidos</h2>
			<p>Elementos reutilizables implementados como utilidades en <code>public/js/</code>:</p>
			<ul>
				<li><code>breadcrumbs.js</code> y <code>alerts-init.js</code> para navegación y mensajes consistentes.</li>
				<li><code>pagination-system.js</code> para tablas con listados extensos.</li>
				<li><code>app-config.js</code> y <code>config.js</code> con endpoints base y helpers de autenticación.</li>
				<li>Validadores de formularios compartidos en <code>password-validator.js</code> y <code>security-system.js</code>.</li>
			</ul>
			<p>El manual técnico usa esta misma filosofía al componer contenido dinámico.</p>
		</div>
	`;
}

function buildSupabaseSection() {
	return `
		${breadcrumb('Integración con Supabase')}
		<div class="doc-card">
			<h2><i class="fas fa-cloud"></i> Supabase</h2>
			<p><code>Backend/config/supabase.js</code> centraliza la creación del cliente mediante <code>createClient</code> y variables de entorno. Se usa en <code>supabaseAuthController.js</code>, <code>historialController.js</code> y scripts de migración.</p>
			<h3>Uso destacado</h3>
			<ul>
				<li>Autenticación delegada (registro, verificación de email, MFA).</li>
				<li>Tablas con RLS para historiales clínicos y archivos asociados.</li>
				<li>Storage para documentos y radiografías.</li>
			</ul>
			<div class="code-block" data-lang="javascript">
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
	auth: {
		persistSession: false,
		detectSessionInUrl: false
	}
});
			</div>
			<p>Consulte <code>SOLUCION_SUPABASE_AUTH_FINAL.md</code> para la implementación detallada.</p>
		</div>
	`;
}

function buildMercadoPagoSection() {
	return `
		${breadcrumb('Integración con MercadoPago')}
		<div class="doc-card">
			<h2><i class="fas fa-credit-card"></i> MercadoPago</h2>
			<p><code>Backend/services/mercadoPagoService.js</code> abstrae la creación de preferencias y validación de webhooks. Los controladores <code>mercadoPagoController.js</code> y <code>pagoController.js</code> consumen el servicio.</p>
			<h3>Flujo</h3>
			<ol>
				<li>El frontend pide un pago a <code>/api/mercadopago/create-preference</code>.</li>
				<li>MercadoPago redirige al usuario y responde a <code>/api/mercadopago/webhook</code>.</li>
				<li>Se registra la transacción en <code>transacciones_mercadopago</code> y se sincroniza con la cuenta interna.</li>
			</ol>
			<p>Variables necesarias: <code>MERCADOPAGO_ACCESS_TOKEN</code>, <code>MERCADOPAGO_PUBLIC_KEY</code>.</p>
		</div>
	`;
}

function buildEmailSection() {
	return `
		${breadcrumb('Integración con Email')}
		<div class="doc-card">
			<h2><i class="fas fa-envelope"></i> Notificaciones por Email</h2>
			<p><code>services/email-service.js</code> utiliza Nodemailer con plantillas HTML para confirmaciones, recordatorios y alertas. Los controladores <code>notificacionController.js</code> y <code>recuperacionController.js</code> lo usan ampliamente.</p>
			<h3>Características</h3>
			<ul>
				<li>Envío transaccional (registro, recuperación, alertas de inventario).</li>
				<li>Plantillas modulares documentadas en <code>RESUMEN_NOTIFICACIONES_IMPLEMENTADAS.md</code>.</li>
				<li>Cola simple basada en promesas y reintentos básicos.</li>
			</ul>
			<p>Configurar <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> y remitente predeterminado.</p>
		</div>
	`;
}

function buildApiReferenceSection() {
	return `
		${breadcrumb('Referencia de API')}
		<div class="doc-card">
			<h2><i class="fas fa-code"></i> Referencia de API</h2>
			<p>Resumen de endpoints agrupados por módulo. Consulte los archivos en <code>Backend/routes/</code> para detalles completos.</p>
			<table class="table-custom">
				<thead>
					<tr>
						<th>Módulo</th>
						<th>Métodos</th>
						<th>Descripción</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Auth</td>
						<td>POST / register, login, refresh, logout</td>
						<td>Gestión de credenciales y tokens.</td>
					</tr>
					<tr>
						<td>Citas</td>
						<td>GET /, POST /, PUT /:id, DELETE /:id</td>
						<td>Agenda completa con filtros y estados.</td>
					</tr>
					<tr>
						<td>Pacientes</td>
						<td>GET /buscar, POST /, PUT /:id</td>
						<td>Administración de pacientes y roles.</td>
					</tr>
					<tr>
						<td>Inventario</td>
						<td>GET /, POST /, PATCH /:id</td>
						<td>Control de stock y movimientos.</td>
					</tr>
					<tr>
						<td>Reportes</td>
						<td>POST /generar, GET /descargar/:id</td>
						<td>Generación y descarga de informes.</td>
					</tr>
					<tr>
						<td>Pagos</td>
						<td>POST /crear, POST /confirmar</td>
						<td>Pagos internos y externos.</td>
					</tr>
					<tr>
						<td>Comunicaciones</td>
						<td>POST /email, GET /noticias</td>
						<td>Mensajería interna y push.</td>
					</tr>
				</tbody>
			</table>
			<p>Para un detalle endpoint por endpoint, habilite Swagger o consulte <code>TEST_REPORTES_COMPLETO.js</code> como referencia de uso masivo.</p>
		</div>
	`;
}

function buildDatabaseSchemaSection() {
	return `
		${breadcrumb('Esquema de Base de Datos')}
		<div class="doc-card">
			<h2><i class="fas fa-table"></i> Esquema de Base de Datos</h2>
			<p>El esquema se documenta en <code>SOLUCION_REPORTES_POSTGRESQL.md</code> y scripts SQL dentro de <code>scripts/</code>. A continuación se listan tablas principales y relaciones.</p>
			<ul>
				<li><strong>usuarios</strong> &rarr; relaciona con <code>citas</code>, <code>historiales_clinicos</code>, <code>transacciones_mercadopago</code>.</li>
				<li><strong>citas</strong> &rarr; FK hacia <code>usuarios</code> (paciente, odontólogo), <code>servicios</code>, <code>sedes</code>.</li>
				<li><strong>inventario</strong> &rarr; combina <code>proveedores</code>, <code>categorias_inventario</code>.</li>
				<li><strong>reportes_generados</strong> &rarr; enlaza usuarios que crean reportes.</li>
				<li><strong>metricas_sistema</strong> &rarr; alimenta dashboards de performance.</li>
			</ul>
			<p>Use <code>scripts/consultar_estructura_inventario.js</code> y <code>scripts/verificar_esquema_historial.js</code> para auditorías puntuales.</p>
		</div>
	`;
}

function buildChangelogSection() {
	return `
		${breadcrumb('Historial de Cambios')}
		<div class="doc-card">
			<h2><i class="fas fa-history"></i> Changelog</h2>
			<ul>
				<li><strong>v2.0</strong>: Integración completa con Supabase y migración de reportes a PostgreSQL (ver <code>SOLUCION_SUPABASE_AUTH_FINAL.md</code>, <code>SOLUCION_REPORTES_POSTGRESQL.md</code>).</li>
				<li><strong>v1.9</strong>: Reescritura de notificaciones y recuperación segura (<code>SOLUCION_RECUPERACION_IMPLEMENTADA.md</code>).</li>
				<li><strong>v1.8</strong>: Implementación de dashboards y métricas de rendimiento.</li>
				<li><strong>v1.7</strong>: Consolidación del módulo de inventario y proveedores.</li>
			</ul>
			<p>Consulte <code>SOLUCION_FINAL.md</code> para un resumen ejecutivo de los hitos.</p>
		</div>
	`;
}

function buildGlossarySection() {
	return `
		${breadcrumb('Glosario')}
		<div class="doc-card">
			<h2><i class="fas fa-spell-check"></i> Glosario</h2>
			<ul>
				<li><strong>RLS:</strong> Row Level Security, políticas de seguridad por fila en Supabase.</li>
				<li><strong>JWT:</strong> JSON Web Token utilizado para sesiones.</li>
				<li><strong>Preferencia:</strong> Objeto de pago generado en MercadoPago.</li>
				<li><strong>Pool:</strong> Grupo de conexiones reutilizables hacia PostgreSQL.</li>
				<li><strong>Supabase Service Role:</strong> Clave con privilegios administrativos para ejecutar operaciones server-side.</li>
			</ul>
		</div>
	`;
}

const sectionBuilders = {
	requirements: buildRequirementsSection,
	architecture: buildArchitectureSection,
	technologies: buildTechnologiesSection,
	database: buildDatabaseSection,
	server: buildServerSection,
	api: buildApiSection,
	authentication: buildAuthenticationSection,
	security: buildSecuritySection,
	installation: buildInstallationSection,
	configuration: buildConfigurationSection,
	deployment: buildDeploymentSection,
	backup: buildBackupSection,
	monitoring: buildMonitoringSection,
	troubleshooting: buildTroubleshootingSection,
	supabase: buildSupabaseSection,
	mercadopago: buildMercadoPagoSection,
	email: buildEmailSection,
	'module-citas': buildModuleCitasSection,
	'module-pacientes': buildModulePacientesSection,
	'module-historiales': buildModuleHistorialesSection,
	'module-tratamientos': buildModuleTratamientosSection,
	'module-inventario': buildModuleInventarioSection,
	'module-pagos': buildModulePagosSection,
	'module-reportes': buildModuleReportesSection,
	'module-comunicaciones': buildModuleComunicacionesSection,
	'frontend-structure': buildFrontendStructureSection,
	'frontend-dashboards': buildFrontendDashboardsSection,
	'frontend-components': buildFrontendComponentsSection,
	'api-reference': buildApiReferenceSection,
	'database-schema': buildDatabaseSchemaSection,
	changelog: buildChangelogSection,
	glossary: buildGlossarySection
};

function ensureSectionElement(sectionId) {
	const elementId = `section-${sectionId}`;
	let sectionElement = document.getElementById(elementId);

	if (!sectionElement) {
		sectionElement = document.createElement('div');
		sectionElement.id = elementId;
		sectionElement.className = 'content-section';
		document.querySelector('.main-content').appendChild(sectionElement);
	} else if (!sectionElement.classList.contains('content-section')) {
		sectionElement.classList.add('content-section');
	}

	if (sectionElement.classList.contains('section-content')) {
		sectionElement.classList.remove('section-content');
	}

	return sectionElement;
}

function renderManualSections() {
	Object.entries(sectionBuilders).forEach(([sectionId, builder]) => {
		const target = ensureSectionElement(sectionId);
		target.innerHTML = builder();
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', renderManualSections);
} else {
	renderManualSections();
}
