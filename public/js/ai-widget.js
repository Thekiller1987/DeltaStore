// ==========================================================================
// DELTASTORE LOCAL AI MECHANICAL ASSISTANT CLIENT (OLLAMA ENGINE)
// ==========================================================================

(function() {
    const chatHistory = [];

    // Inyectar HTML del widget
    const widgetHtml = `
    <div class="delta-ai-fab" id="deltaAiFab" title="Consultar con el Asesor Mecánico IA">
        <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18 2.5 2.5 0 0 0 10 15.5 2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5Z"/></svg>
        <div class="delta-ai-badge">IA</div>
    </div>

    <div class="delta-ai-modal" id="deltaAiModal">
        <div class="delta-ai-header">
            <div class="delta-ai-header-info">
                <div class="delta-ai-avatar">🤖</div>
                <div class="delta-ai-title-wrap">
                    <h4>DeltaBot <span>Mecánico</span></h4>
                    <span><div class="delta-ai-status-dot"></div> GPU Local Activa (Ollama)</span>
                </div>
            </div>
            <button class="delta-ai-close-btn" id="deltaAiClose">&times;</button>
        </div>

        <div class="delta-ai-pills">
            <button class="delta-ai-pill-btn" onclick="window.sendDeltaAiQuick('¿Qué aceite le queda a una Pulsar NS 200?')">🏍️ Aceite Pulsar NS</button>
            <button class="delta-ai-pill-btn" onclick="window.sendDeltaAiQuick('¿Tienen pastillas de freno para Boxer 150?')">🛑 Pastillas Boxer</button>
            <button class="delta-ai-pill-btn" onclick="window.sendDeltaAiQuick('¿Cuánto tarda el envío en casco urbano de Juigalpa?')">⚡ Envío Juigalpa</button>
            <button class="delta-ai-pill-btn" onclick="window.sendDeltaAiQuick('¿Cuáles son las formas de pago en DeltaStore?')">💳 Pagos</button>
        </div>

        <div class="delta-ai-messages" id="deltaAiMessages">
            <div class="delta-ai-msg bot">
                ¡Hola! 👋 Soy el <strong>Asesor Mecánico IA</strong> de DeltaStore Juigalpa. ¿Qué repuesto, cilindrada o duda de compatibilidad necesitas consultar hoy?
            </div>
        </div>

        <div class="delta-ai-input-wrap">
            <input type="text" class="delta-ai-input" id="deltaAiInput" placeholder="Pregunta por un repuesto o modelo..." />
            <button class="delta-ai-send-btn" id="deltaAiSend">
                <svg style="width:18px;height:18px;fill:#0c1424" viewBox="0 0 24 24"><path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/></svg>
            </button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHtml);

    const fab = document.getElementById('deltaAiFab');
    const modal = document.getElementById('deltaAiModal');
    const closeBtn = document.getElementById('deltaAiClose');
    const input = document.getElementById('deltaAiInput');
    const sendBtn = document.getElementById('deltaAiSend');
    const messagesBox = document.getElementById('deltaAiMessages');

    fab.addEventListener('click', () => modal.classList.toggle('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    async function sendMessage(text) {
        if (!text || !text.trim()) return;
        const msgText = text.trim();

        // Agregar mensaje de usuario
        appendMessage('user', msgText);
        input.value = '';
        chatHistory.push({ role: 'user', content: msgText });

        // Mensaje temporal de espera
        const tempBotMsg = appendMessage('bot', '<em>Pensando con IA local... ⚡</em>');

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgText, history: chatHistory })
            });
            const data = await res.json();
            if (data.reply) {
                tempBotMsg.innerHTML = formatMarkdown(data.reply);
                chatHistory.push({ role: 'assistant', content: data.reply });
            } else {
                tempBotMsg.innerHTML = data.error || 'No se pudo obtener respuesta del modelo local.';
            }
        } catch (e) {
            tempBotMsg.innerHTML = '⚠️ Error al conectar con el servidor de IA local. Verifica que Ollama esté activo.';
        }
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function appendMessage(sender, htmlContent) {
        const div = document.createElement('div');
        div.className = `delta-ai-msg ${sender}`;
        div.innerHTML = htmlContent;
        messagesBox.appendChild(div);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return div;
    }

    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
    }

    sendBtn.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage(input.value);
    });

    window.sendDeltaAiQuick = function(txt) {
        if (!modal.classList.contains('active')) modal.classList.add('active');
        sendMessage(txt);
    };

    console.log('🤖 Asistente Mecánico IA Local DeltaStore inicializado correctamente.');
})();
