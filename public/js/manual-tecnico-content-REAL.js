/**
 * CLINIKDENT v2.0 - MANUAL TÉCNICO COMPLETO
 * Contenido REAL extraído del sistema actual
 * Generado: 24 de Noviembre de 2025
 */

function loadSectionContent() {
    const sections = {
        
        // ==================== REQUISITOS DEL SISTEMA ====================
        'requirements': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Requisitos
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-check-circle"></i> Requisitos del Sistema Clinikdent v2.0</h2>

                <h3>💻 Servidor de Producción</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Componente</th>
                            <th>Mínimo</th>
                            <th>Recomendado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>CPU</td>
                            <td>2 cores @ 2.0 GHz</td>
                            <td>4+ cores @ 2.5+ GHz</td>
                        </tr>
                        <tr>
                            <td>RAM</td>
                            <td>4 GB</td>
                            <td>8-16 GB</td>
                        </tr>
                        <tr>
                            <td>Almacenamiento</td>
                            <td>20 GB SSD</td>
                            <td>50+ GB SSD NVMe</td>
                        </tr>
                        <tr>
                            <td>Conexión</td>
                            <td>100 Mbps</td>
                            <td>500 Mbps - 1 Gbps</td>
                        </tr>
                    </tbody>
                </table>

                <h3>📦 Dependencias Backend (package.json)</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Paquete</th>
                            <th>Versión</th>
                            <th>Propósito</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>@supabase/supabase-js</strong></td>
                            <td>2.81.0</td>
                            <td>Cliente Supabase (Auth + DB)</td>
                        </tr>
                        <tr>
                            <td><strong>express</strong></td>
                            <td>5.1.0</td>
                            <td>Framework web Node.js</td>
                        </tr>
                        <tr>
                            <td><strong>pg</strong></td>
                            <td>8.16.3</td>
                            <td>Cliente PostgreSQL</td>
                        </tr>
                        <tr>
                            <td><strong>bcryptjs</strong></td>
                            <td>3.0.3</td>
                            <td>Hash de contraseñas</td>
                        </tr>
                        <tr>
                            <td><strong>jsonwebtoken</strong></td>
                            <td>9.0.2</td>
                            <td>Tokens JWT para auth</td>
                        </tr>
                        <tr>
                            <td><strong>helmet</strong></td>
                            <td>8.1.0</td>
                            <td>Seguridad HTTP headers</td>
                        </tr>
                        <tr>
                            <td><strong>express-rate-limit</strong></td>
                            <td>8.2.1</td>
                            <td>Limitación de peticiones</td>
                        </tr>
                        <tr>
                            <td><strong>nodemailer</strong></td>
                            <td>7.0.10</td>
                            <td>Envío de emails</td>
                        </tr>
                        <tr>
                            <td><strong>mercadopago</strong></td>
                            <td>2.8.0</td>
                            <td>Integración pagos online</td>
                        </tr>
                        <tr>
                            <td><strong>exceljs</strong></td>
                            <td>4.4.0</td>
                            <td>Generación archivos Excel</td>
                        </tr>
                        <tr>
                            <td><strong>pdfkit</strong></td>
                            <td>0.17.2</td>
                            <td>Generación archivos PDF</td>
                        </tr>
                        <tr>
                            <td><strong>docx</strong></td>
                            <td>9.5.1</td>
                            <td>Generación archivos Word</td>
                        </tr>
                        <tr>
                            <td><strong>node-cron</strong></td>
                            <td>4.2.1</td>
                            <td>Tareas programadas</td>
                        </tr>
                        <tr>
                            <td><strong>multer</strong></td>
                            <td>2.0.2</td>
                            <td>Upload de archivos</td>
                        </tr>
                    </tbody>
                </table>

                <h3>🌐 Software Requerido</h3>
                <ul>
                    <li><strong>Node.js:</strong> v18.x LTS o superior</li>
                    <li><strong>PostgreSQL:</strong> v15.x (hospedado en Supabase)</li>
                    <li><strong>Git:</strong> Para control de versiones</li>
                    <li><strong>PM2:</strong> Para gestión de procesos en producción</li>
                    <li><strong>Nginx:</strong> Reverse proxy (opcional)</li>
                </ul>

                <h3>🌍 Navegadores Soportados</h3>
                <ul>
                    <li>Google Chrome 90+</li>
                    <li>Mozilla Firefox 88+</li>
                    <li>Microsoft Edge 90+</li>
                    <li>Safari 14+</li>
                </ul>
            </div>
        `,

        // ==================== ARQUITECTURA ====================
        'architecture': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Arquitectura
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-sitemap"></i> Arquitectura del Sistema</h2>

                <h3>📐 Patrón Arquitectónico: MVC (Model-View-Controller)</h3>

                <div class="architecture-diagram">
                    <div class="arch-layer" style="background: #EBF8FF;">
                        <h4>📱 Capa de Presentación (Frontend)</h4>
                        <div class="arch-components">
                            <div class="arch-component">
                                <i class="fab fa-html5"></i>
                                <h5>HTML5 Semántico</h5>
                                <p>36 páginas</p>
                            </div>
                            <div class="arch-component">
                                <i class="fab fa-js"></i>
                                <h5>JavaScript ES6+</h5>
                                <p>Lógica del cliente</p>
                            </div>
                            <div class="arch-component">
                                <i class="fab fa-bootstrap"></i>
                                <h5>Bootstrap 5.3</h5>
                                <p>Framework CSS</p>
                            </div>
                        </div>
                    </div>

                    <div class="arch-layer" style="background: #F0FFF4;">
                        <h4>⚙️ Capa de Lógica de Negocio (Backend)</h4>
                        <div class="arch-components">
                            <div class="arch-component">
                                <i class="fab fa-node"></i>
                                <h5>Node.js 18.x</h5>
                                <p>Runtime JavaScript</p>
                            </div>
                            <div class="arch-component">
                                <i class="fas fa-server"></i>
                                <h5>Express 5.1.0</h5>
                                <p>36 archivos de rutas</p>
                            </div>
                            <div class="arch-component">
                                <i class="fas fa-shield-alt"></i>
                                <h5>Middleware</h5>
                                <p>Auth, Seguridad, CORS</p>
                            </div>
                        </div>
                    </div>

                    <div class="arch-layer" style="background: #FFFAF0;">
                        <h4>🗄️ Capa de Datos</h4>
                        <div class="arch-components">
                            <div class="arch-component">
                                <i class="fas fa-database"></i>
                                <h5>PostgreSQL 15.x</h5>
                                <p>Base de datos relacional</p>
                            </div>
                            <div class="arch-component">
                                <i class="fas fa-cloud"></i>
                                <h5>Supabase</h5>
                                <p>BaaS con Auth</p>
                            </div>
                            <div class="arch-component">
                                <i class="fas fa-table"></i>
                                <h5>50+ Tablas</h5>
                                <p>Modelo normalizado</p>
                            </div>
                        </div>
                    </div>
                </div>

                <h3>🔄 Flujo de Datos</h3>
                <div class="timeline">
                    <div class="timeline-item">
                        <h4>1. Cliente (Navegador)</h4>
                        <p>Usuario interactúa con interfaz HTML/JS</p>
                    </div>
                    <div class="timeline-item">
                        <h4>2. Petición HTTP</h4>
                        <p>fetch() con JWT en headers</p>
                    </div>
                    <div class="timeline-item">
                        <h4>3. Middleware</h4>
                        <p>Autenticación, validación, rate limiting</p>
                    </div>
                    <div class="timeline-item">
                        <h4>4. Controlador</h4>
                        <p>Lógica de negocio específica</p>
                    </div>
                    <div class="timeline-item">
                        <h4>5. Base de Datos</h4>
                        <p>Consultas SQL vía pg Pool</p>
                    </div>
                    <div class="timeline-item">
                        <h4>6. Respuesta JSON</h4>
                        <p>Datos procesados al cliente</p>
                    </div>
                </div>

                <h3>📂 Estructura de Directorios REAL</h3>
                <div class="code-block" data-lang="text">
Clinikdent_supabase_1.0/
│
├── Backend/
│   ├── serverSecure.js           → Servidor principal Express
│   ├── config/
│   │   ├── database.js           → Conexión PostgreSQL
│   │   └── databaseSecure.js     → Config Supabase + PG Pool
│   │
│   ├── routes/ (36 archivos)
│   │   ├── authSecureRoutes.js
│   │   ├── citaRoutes.js
│   │   ├── historialRoutes.js
│   │   ├── inventarioRoutes.js
│   │   ├── mercadoPagoRoutes.js
│   │   ├── pagoRoutes.js
│   │   ├── reportesRoutes.js
│   │   ├── reportesAnalyticsRoutes.js
│   │   ├── seguridadRoutes.js
│   │   ├── integracionRoutes.js
│   │   ├── performanceRoutes.js
│   │   ├── comunicacionesRoutes.js
│   │   ├── iaAutomatizacionRoutes.js
│   │   ├── tratamientoRoutes.js
│   │   ├── evaluacionesRoutes.js
│   │   └── ... (y 21 más)
│   │
│   ├── controllers/              → Lógica de negocio
│   ├── middleware/               → Auth, validación
│   └── scripts/                  → Scripts SQL
│
├── public/
│   ├── *.html (36 páginas)
│   ├── css/
│   ├── js/
│   └── images/
│
├── package.json
├── .env
└── app.js
                </div>

                <h3>🔐 Arquitectura de Seguridad</h3>
                <ul>
                    <li><strong>Autenticación:</strong> Supabase Auth + JWT</li>
                    <li><strong>Autorización:</strong> Middleware basado en roles</li>
                    <li><strong>Encriptación:</strong> bcryptjs para passwords</li>
                    <li><strong>Headers Seguros:</strong> Helmet.js</li>
                    <li><strong>Rate Limiting:</strong> express-rate-limit</li>
                    <li><strong>SQL Injection:</strong> Prepared statements (pg)</li>
                    <li><strong>XSS:</strong> Sanitización de inputs</li>
                    <li><strong>CORS:</strong> Orígenes controlados</li>
                </ul>
            </div>
        `,

        // ==================== TECNOLOGÍAS ====================
        'technologies': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Tecnologías
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-laptop-code"></i> Stack Tecnológico Completo</h2>

                <h3>🎨 Frontend</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Tecnología</th>
                            <th>Versión</th>
                            <th>Uso</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-tech">HTML5</span></td>
                            <td>-</td>
                            <td>Estructura de 36 páginas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-tech">CSS3</span></td>
                            <td>-</td>
                            <td>Estilos personalizados + variables</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-tech">JavaScript</span></td>
                            <td>ES6+</td>
                            <td>Fetch API, async/await, módulos</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">Bootstrap</span></td>
                            <td>5.3.0</td>
                            <td>Framework CSS responsivo</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">Font Awesome</span></td>
                            <td>6.4.0</td>
                            <td>Iconografía (1000+ iconos)</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">Chart.js</span></td>
                            <td>Latest</td>
                            <td>Gráficos y visualización</td>
                        </tr>
                    </tbody>
                </table>

                <h3>⚙️ Backend</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Tecnología</th>
                            <th>Versión</th>
                            <th>Uso</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-version">Node.js</span></td>
                            <td>18.x LTS</td>
                            <td>Runtime JavaScript</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-status">Express.js</span></td>
                            <td>5.1.0</td>
                            <td>Framework web, 36 rutas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-tech">pg (node-postgres)</span></td>
                            <td>8.16.3</td>
                            <td>Cliente PostgreSQL</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">bcryptjs</span></td>
                            <td>3.0.3</td>
                            <td>Hash de contraseñas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">jsonwebtoken</span></td>
                            <td>9.0.2</td>
                            <td>Tokens JWT</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">helmet</span></td>
                            <td>8.1.0</td>
                            <td>Seguridad HTTP</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">express-rate-limit</span></td>
                            <td>8.2.1</td>
                            <td>Protección DDoS</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-tech">cors</span></td>
                            <td>2.8.5</td>
                            <td>Cross-Origin Resource Sharing</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-version">nodemailer</span></td>
                            <td>7.0.10</td>
                            <td>Envío de emails</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">node-cron</span></td>
                            <td>4.2.1</td>
                            <td>Tareas programadas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">multer</span></td>
                            <td>2.0.2</td>
                            <td>Upload de archivos</td>
                        </tr>
                    </tbody>
                </table>

                <h3>🗄️ Base de Datos</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Tecnología</th>
                            <th>Versión</th>
                            <th>Uso</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-status">PostgreSQL</span></td>
                            <td>15.x</td>
                            <td>RDBMS principal</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-tech">Supabase</span></td>
                            <td>Cloud</td>
                            <td>BaaS: DB + Auth + Storage</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">@supabase/supabase-js</span></td>
                            <td>2.81.0</td>
                            <td>Cliente JavaScript</td>
                        </tr>
                    </tbody>
                </table>

                <h3>💳 Integraciones Externas</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Versión SDK</th>
                            <th>Propósito</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-success">MercadoPago</span></td>
                            <td>2.8.0</td>
                            <td>Pagos online y webhooks</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">Nodemailer</span></td>
                            <td>7.0.10</td>
                            <td>SMTP para notificaciones</td>
                        </tr>
                    </tbody>
                </table>

                <h3>📄 Generación de Documentos</h3>
                <ul>
                    <li><strong>ExcelJS (4.4.0):</strong> Reportes en formato .xlsx</li>
                    <li><strong>PDFKit (0.17.2):</strong> Facturas, historiales, reportes PDF</li>
                    <li><strong>docx (9.5.1):</strong> Documentos Word editables</li>
                </ul>

                <h3>🔧 Herramientas de Desarrollo</h3>
                <ul>
                    <li><strong>nodemon (3.1.10):</strong> Auto-reload en desarrollo</li>
                    <li><strong>Git:</strong> Control de versiones</li>
                    <li><strong>PM2:</strong> Gestor de procesos en producción</li>
                    <li><strong>VS Code:</strong> Editor de código recomendado</li>
                </ul>
            </div>
        `,
        
    };

    // Inyectar contenido en las secciones
    Object.keys(sections).forEach(sectionId => {
        const sectionElement = document.getElementById('section-' + sectionId);
        if (sectionElement) {
            sectionElement.innerHTML = sections[sectionId];
        }
    });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadSectionContent);
