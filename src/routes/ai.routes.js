const express = require('express');
const router = express.Router();
const http = require('http');
const { pool } = require('../config/db');

// System prompt base con contexto de Juigalpa y repuestos de motocicletas
const SYSTEM_PROMPT = `Eres el "Asesor Mecánico IA" oficial de DeltaStore en Juigalpa, Chontales.
Tu función es ayudar a motociclistas, mecánicos y clientes a encontrar el repuesto correcto, verificar compatibilidades de piezas mecánicas (cilindros, pistones, pastillas de freno, kits de arrastre, bujías, aceites, retenedores) para marcas como Bajaj (Pulsar, Boxer, Platina, Discover), Yamaha (YBR, FZ, XTZ), Honda (Crux, CB, CG, Navi, XR), Suzuki (GN125, Gixxer, AX4) y TVS (Apache, HLX).
Políticas clave de DeltaStore:
- Ubicación: Juigalpa, Chontales (Atención rápida).
- Envío DeltaExpress: 100% GRATIS en casco urbano de Juigalpa para compras mayores a C$ 300.
- Garantía DeltaProtect: 30 días en piezas mecánicas, 60 días en sistemas eléctricos.
- Métodos de pago: Efectivo contra entrega, Transferencias directas (BAC, Banpro, Lafise) y Tarjetas de crédito/débito.
Responde siempre de forma amable, técnica, precisa y en español. Si recomiendas un repuesto, menciona precios estimados en Córdobas (C$) y cómo pedirlo en la tienda.`;

// POST /api/ai/chat — Chat interactivo con Ollama local
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], model = 'qwen2.5-coder:7b' } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'El mensaje es obligatorio' });
        }

        // Obtener un resumen de productos activos en stock para inyectar en el contexto RAG
        let catalogSummary = '';
        try {
            const [products] = await pool.query('SELECT nombre, precio, stock, categoria_id FROM productos WHERE activo = 1 LIMIT 25');
            catalogSummary = '\nCatálogo destacado en bodega:\n' + products.map(p => `- ${p.nombre}: C$ ${p.precio} (Stock: ${p.stock})`).join('\n');
        } catch (e) {
            catalogSummary = '';
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT + catalogSummary },
            ...history.slice(-6),
            { role: 'user', content: message }
        ];

        const postData = JSON.stringify({
            model: model, // 'qwen2.5-coder:7b' o 'deepseek-r1:8b'
            messages: messages,
            stream: false
        });

        const options = {
            hostname: '127.0.0.1',
            port: 11434,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 45000
        };

        const ollamaReq = http.request(options, (ollamaRes) => {
            let responseBody = '';
            ollamaRes.on('data', chunk => responseBody += chunk);
            ollamaRes.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    let reply = parsed.message ? parsed.message.content : 'No se pudo obtener respuesta del modelo local.';
                    // Limpiar tags de razonamiento si se usa DeepSeek R1 para presentación limpia
                    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    res.json({ success: true, reply, model: parsed.model || model });
                } catch (err) {
                    res.json({ success: true, reply: 'Asistente DeltaStore: ' + responseBody, model });
                }
            });
        });

        ollamaReq.on('error', (e) => {
            console.error('Error conectando a Ollama:', e.message);
            res.status(503).json({
                error: 'El servidor local de IA (Ollama) no responde en el puerto 11434.',
                hint: 'Asegúrate de que Ollama esté iniciado en segundo plano.'
            });
        });

        ollamaReq.write(postData);
        ollamaReq.end();

    } catch (error) {
        console.error('Error en /api/ai/chat:', error);
        res.status(500).json({ error: 'Error procesando consulta de IA' });
    }
});

// POST /api/ai/vision — Diagnóstico de repuesto por imagen con LLaVA 7B
router.post('/vision', async (req, res) => {
    try {
        const { imageBase64, prompt = 'Identifica qué repuesto o parte de motocicleta es esta imagen y qué fallas o desgaste visual presenta.' } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ error: 'Se requiere la imagen en base64' });
        }

        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const postData = JSON.stringify({
            model: 'llava:7b',
            prompt: prompt + ' Responde en español conciso enfocado en repuestos de motocicletas.',
            images: [cleanBase64],
            stream: false
        });

        const options = {
            hostname: '127.0.0.1',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 60000
        };

        const ollamaReq = http.request(options, (ollamaRes) => {
            let responseBody = '';
            ollamaRes.on('data', chunk => responseBody += chunk);
            ollamaRes.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    res.json({ success: true, analysis: parsed.response, model: 'llava:7b' });
                } catch (err) {
                    res.status(500).json({ error: 'Error procesando respuesta visual' });
                }
            });
        });

        ollamaReq.on('error', (e) => {
            res.status(503).json({ error: 'Servidor Ollama no disponible para análisis de visión' });
        });

        ollamaReq.write(postData);
        ollamaReq.end();

    } catch (error) {
        res.status(500).json({ error: 'Error procesando análisis visual' });
    }
});

module.exports = router;
