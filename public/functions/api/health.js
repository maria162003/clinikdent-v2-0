// Cloudflare Pages Function - Health Check
export async function onRequest(context) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ClinikDent API',
    version: '1.9.0',
    environment: env.NODE_ENV || 'production'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
