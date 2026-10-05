# DeltaStore — Tienda Online de Repuestos de Moto (Tipo Amazon / Juigalpa)

Repositorio oficial del frontend y servicio e-commerce de **DeltaStore**, la plataforma de venta de repuestos y accesorios de motocicletas líder en Juigalpa y el departamento de Chontales, Nicaragua.

* **Repositorio GitHub:** [https://github.com/Thekiller1987/DeltaStore.git](https://github.com/Thekiller1987/DeltaStore.git)
* **Sede Principal:** Juigalpa, Chontales
* **Puerto de Servicio:** `3000` (`http://localhost:3000`)
* **CRM / ERP Asociado:** [DELTA-CRP (Puerto 3005)](https://github.com/Thekiller1987/DELTA-CRP.git)
* **Inteligencia Artificial Local:** Ollama en `http://127.0.0.1:11434` (`deepseek-r1:8b`, `qwen2.5-coder:7b`, `llava:7b`)

---

## Características de la Plataforma

1. **Experiencia de Compra Tipo Amazon:**
   * Mega barra de búsqueda centralizada con sugerencias predictivas y fotos en miniatura.
   * Filtro "Garage DeltaStore": selector de moto por Marca (Bajaj, Yamaha, Honda, Suzuki, TVS), Modelo y Cilindrada.
   * Módulo *"Comprados frecuentemente juntos"* (Frequently Bought Together) en ficha de producto.
   * Drawer lateral deslizable de carrito con barra dinámica de progreso para **Envío GRATIS** en Juigalpa urbano (compras $\ge$ C$ 300).
   * Checkout express en 1 solo paso con selector de barrios de Juigalpa y confirmación automática por WhatsApp.

2. **Asistente Mecánico IA Local Integrado:**
   * Widget flotante en la tienda impulsado por **DeepSeek-R1 8B** y **Qwen 2.5 Coder 7B** ejecutados localmente en GPU.
   * Asesoría técnica en tiempo real para compatibilidad de cilindros, pastillas, discos, lubricantes y empaques.
   * Diagnóstico visual de repuestos dañados mediante fotos analizadas con **LLaVA 7B**.

3. **Diseño y Estética de Vanguardia:**
   * Estilo Cyberpunk Dark Neón con tipografías *Outfit* y *Plus Jakarta Sans*.
   * Microinteracciones, skeleton loaders, badges de autenticidad (*DeltaProtect*) y modo oscuro/claro.

---

## Puesta en Marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar la tienda
npm start
# O mediante el launcher: INICIAR_TIENDA.bat
```
