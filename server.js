require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./src/config/db');

// -------------------------------------------------------------
// DELTASTORE Global Safety Shield (Crash Protection)
// -------------------------------------------------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('🛡️ [DELTASTORE Safety Shield] Unhandled Rejection intercepted:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🛡️ [DELTASTORE Safety Shield] Uncaught Exception intercepted:', err);
});

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware con límite de 50MB para Base64
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos del frontend (Storefront y CRM)
app.use(express.static(path.join(__dirname, 'public')));

// 1. Módulos Core RESTful
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/products', require('./src/routes/products.routes'));
app.use('/api/orders', require('./src/routes/orders.routes'));
app.use('/api/stats', require('./src/routes/stats.routes'));
app.use('/api/crm', require('./src/routes/crm.routes'));
app.use('/api', require('./src/routes/categories_brands.routes'));
app.use('/api', require('./src/routes/store.routes'));
try {
    app.use('/api/ai', require('./src/routes/ai.routes'));
} catch (e) {
    // ai.routes es opcional
}

// 2. Diagnóstico y Salud de la API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        name: 'DeltaStore Core Unified API (Web + CRM ERP)',
        store_city: process.env.STORE_CITY || 'Juigalpa, Chontales',
        port: PORT,
        free_shipping: 'Juigalpa Urbano C$ 0.00 en compras >= C$ 300',
        timestamp: new Date().toISOString()
    });
});

// 3. Rutas SPA / Vistas Directas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/crm', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

app.get('/rastreo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. Iniciar Servidor
app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`🏍️  DELTASTORE SERVIDOR UNIFICADO ACTIVO EN PUERTO: ${PORT}`);
    console.log(`🌐  Tienda Web Amazon-Style: http://localhost:${PORT}`);
    console.log(`📊  Panel CRM ERP & RBAC:   http://localhost:${PORT}/crm`);
    console.log('====================================================');
    await testConnection();
});
