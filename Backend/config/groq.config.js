// Configuración de Groq AI (Llama 3.2)
module.exports = {
    // API Key de Groq - Obtener en https://console.groq.com/keys
    apiKey: process.env.GROQ_API_KEY,
    
    // Modelo a usar (Llama 3.3 70B es el mejor balance calidad/velocidad)
    model: 'llama-3.3-70b-versatile',
    
    // Tokens máximos por respuesta (500 = ~350 palabras)
    maxTokens: 500,
    
    // Temperatura: 0.7 = balance entre creatividad y coherencia
    temperature: 0.7,
    
    // Configuración de reintentos
    maxRetries: 3,
    
    // Timeout por request (10 segundos)
    timeout: 10000
};
