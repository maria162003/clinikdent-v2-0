// Cloudflare Worker entry point - adapta Express app
import app from './app.js';

export default {
  async fetch(request, env, ctx) {
    // Inyectar env en el contexto de Express
    app.locals.env = env;
    
    // Convertir Request de Cloudflare a request compatible con Express
    return handleRequest(request, app, env);
  }
};

async function handleRequest(request, app, env) {
  // Convertir Cloudflare Request a formato Express-compatible
  const url = new URL(request.url);
  
  return new Promise((resolve) => {
    const mockReq = {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers),
      body: request.body,
      query: Object.fromEntries(url.searchParams),
      path: url.pathname,
      get: (header) => request.headers.get(header),
      cloudflare: { env } // Variables de entorno
    };
    
    const mockRes = {
      statusCode: 200,
      headers: {},
      body: '',
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      setHeader: function(key, value) {
        this.headers[key] = value;
        return this;
      },
      json: function(data) {
        this.headers['Content-Type'] = 'application/json';
        this.body = JSON.stringify(data);
        resolve(new Response(this.body, {
          status: this.statusCode,
          headers: this.headers
        }));
        return this;
      },
      send: function(data) {
        this.body = data;
        resolve(new Response(this.body, {
          status: this.statusCode,
          headers: this.headers
        }));
        return this;
      },
      sendFile: function(filePath) {
        // Para archivos estáticos, sirve desde public
        this.headers['Content-Type'] = 'text/html';
        this.status(200).send('Servir archivo estático: ' + filePath);
        return this;
      }
    };
    
    // Ejecutar la app de Express
    try {
      app(mockReq, mockRes, () => {
        resolve(new Response('Not Found', { status: 404 }));
      });
    } catch (error) {
      resolve(new Response('Internal Server Error: ' + error.message, { 
        status: 500 
      }));
    }
  });
}
