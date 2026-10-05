require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./src/config/db');
// -------------------------------------------------------------
// DELTASTORE Global Safety Shield (Crash Protection)
// -------------------------------------------------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('🛡️ [DELTASTORE Safety Shield] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🛡️ [DELTASTORE Safety Shield] Uncaught Exception:', err);
});


const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos de la Tienda Web
app.use(express.static(path.join(__dirname, 'public')));

// Módulos RESTful de la Tienda
app.use('/api/products', require('./src/routes/products.routes'));
app.use('/api/orders', require('./src/routes/orders.routes'));
app.use('/api', require('./src/routes/categories_brands.routes'));
app.use('/api', require('./src/routes/store.routes'));
app.use('/api/ai', require('./src/routes/ai.routes'));

// Diagnóstico y Salud de la Tienda Web
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        service: 'DeltaStore Web E-Commerce (Tipo Amazon)',
        sede: process.env.STORE_CITY || 'Juigalpa, Chontales',
        port: PORT,
        free_shipping: 'Juigalpa Urbano C$ 0.00 en compras >= C$ 300',
        ai_local: 'Ollama (DeepSeek-R1 8B, Qwen 2.5 Coder 7B, LLaVA 7B) en puerto 11434',
        timestamp: new Date().toISOString()
    });
});

// Ruta principal SPA
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar Servidor Tienda Web
app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`🏍️  DELTASTORE TIENDA WEB ACTIVA EN PUERTO: ${PORT}`);
    console.log(`🌐  Acceso Storefront:  http://localhost:${PORT}`);
    console.log(`🤖  Asistente IA Local: http://localhost:${PORT}/api/ai/chat`);
    console.log(`📦  CRM ERP Asociado:  http://localhost:3005`);
    console.log('====================================================');
    await testConnection();
});
