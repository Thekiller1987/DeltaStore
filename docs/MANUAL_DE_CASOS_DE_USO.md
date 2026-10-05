# 📋 MANUAL DE CASOS DE USO Y OPERACIÓN — DELTASTORE
**Plataforma:** Tienda Online PWA & Backoffice CRM Integrado  
**Municipio:** Juigalpa, Chontales, Nicaragua  
**Motor de Base de Datos:** MySQL 8.0+ (`deltastore_db`)  

---

## 1. ACTORES DEL SISTEMA

| Actor | Descripción | Responsabilidad |
| :--- | :--- | :--- |
| **Cliente Final** | Propietario de moto o mecánico de taller en Juigalpa | Consulta catálogo, filtra repuestos, agrega al carrito y genera pedido con entrega local. |
| **Administrador (Waskar)** | Director general de DeltaStore | Supervisa KPIs de ventas, autoriza pedidos con transferencia y gestiona el inventario. |
| **Vendedor / Empacador** | Personal de tienda física en Juigalpa | Alista los repuestos del almacén, verifica compatibilidad y actualiza el pedido a "En Empaque". |
| **Motorizado Repartidor** | Piloto de entrega express urbana | Recibe la ruta, traslada el repuesto a la dirección en Juigalpa, cobra efectivo o verifica pago. |

---

## 2. MATRIZ DE CASOS DE USO

```
  +----------------------------------------------------------------------------+
  |                           SISTEMA DELTASTORE                              |
  |                                                                            |
  |   [Cliente] ----> (CU-01: Búsqueda y Filtrado de Repuestos)                |
  |             ----> (CU-02: Gestión de Carrito de Compras)                   |
  |             ----> (CU-03: Checkout Juigalpa con Envío Gratis)              |
  |             ----> (CU-04: Subida de Comprobante Bancario en Base64)        |
  |             ----> (CU-05: Notificación Inmediata por WhatsApp)             |
  |                                                                            |
  |   [Admin /  ----> (CU-06: Pipeline Kanban de Pedidos en Tiempo Real)       |
  |    Ventas]  ----> (CU-07: Verificación de Voucher Bancario en Base64)      |
  |             ----> (CU-08: Despacho y Asignación de Motorizado)             |
  |             ----> (CU-09: Alta de Producto con Foto Base64 a MySQL)        |
  |             ----> (CU-10: Ajuste de Stock y Auditoría de Movimientos)      |
  +----------------------------------------------------------------------------+
```

---

## 3. ESPECIFICACIÓN DETALLADA DE CASOS DE USO CLAVE

### CU-03: Checkout Juigalpa con Envío Gratis
- **Precondición:** El cliente cuenta con al menos un repuesto en el carrito con stock disponible en MySQL.
- **Flujo Principal:**
  1. El cliente pulsa el botón *"Continuar al Checkout Juigalpa"*.
  2. El sistema valida el municipio. Si la dirección es en Juigalpa, el costo de entrega se fija automáticamente en `C$ 0.00 (GRATIS)`.
  3. El cliente ingresa su nombre, teléfono y dirección exacta con punto de referencia (ej. *"Del Parque Central 2c al Norte, frente a Farmacia"*).
  4. El cliente selecciona su forma de pago preferida:
     - **Efectivo Contra Entrega:** Especifica billete para cambio.
     - **Transferencia Bancaria:** Elige BAC o Banpro y sube captura del voucher.
     - **Tarjeta / PayPal:** Procesamiento en línea seguro.
  5. El cliente pulsa *"Confirmar Pedido Juigalpa"*.
  6. El sistema inicia una transacción MySQL (`BEGIN TRANSACTION`), descuenta el stock de cada repuesto, registra la orden y confirma la transacción (`COMMIT`).
  7. El sistema genera el código de orden (ej: `ORD-2026-JUIG-9041-3849`).

### CU-04: Subida de Comprobante Bancario en Base64
- **Propósito:** Almacenar de forma inmutable la evidencia de pago sin requerir almacenamiento externo de archivos.
- **Flujo:**
  1. El cliente selecciona la opción *"Transferencia Bancaria"*.
  2. Se visualizan las cuentas oficiales de DeltaStore Juigalpa (BAC y Banpro).
  3. El cliente pulsa la zona de carga de comprobante y selecciona la captura desde su celular o PC.
  4. La función JavaScript `FileReader.readAsDataURL()` convierte instantáneamente el archivo en un string Base64 (`data:image/jpeg;base64,...`).
  5. Se despliega una vista previa inmediata.
  6. Al confirmar, el string Base64 se guarda en el campo `comprobante_pago_base64 LONGTEXT` de la tabla `pedidos`.

### CU-06: Gestión del Pipeline de Pedidos en CRM
- **Flujo de Estados:**
  1. **Nuevo:** Pedido recién generado por el cliente. Requiere confirmación de disponibilidad física.
  2. **Confirmado:** El vendedor valida el pedido y verifica el comprobante (si fue transferencia).
  3. **En Empaque:** El personal de almacén embala el repuesto y lo rotula con la dirección del cliente.
  4. **En Ruta Juigalpa:** Se asigna el motorizado de turno. Se activa el botón de WhatsApp directo para avisar al cliente: *"¡Tu repuesto va en camino!"*.
  5. **Entregado:** El motorizado entrega el repuesto, cobra el saldo (si era efectivo) y finaliza el ciclo en el CRM.

### CU-09: Alta de Repuesto con Conversión a Base64
- **Actor:** Administrador (Waskar).
- **Flujo:**
  1. En el CRM, abrir pestaña *"Inventario"* y pulsar *"Nuevo Repuesto (Base64)"*.
  2. Ingresar código (ej. `MOT-CIL-NS200`), nombre, categoría, marca de moto, precio y stock.
  3. Seleccionar la foto del repuesto. El sistema la convierte al vuelo a Base64.
  4. Al guardar, se ejecuta un `INSERT` en la tabla `productos` y se crea una entrada en `auditorias_inventario` con `tipo_movimiento = 'entrada'`.

---

## 4. POLÍTICAS DE DESPACHO Y GARANTÍA LOCAL
1. **Perímetro de Cobertura Gratuita:** Todo el casco urbano de Juigalpa (Barrio Sandino, Palo Solo, Zona Central, Salida a Managua, Salida a Rama, etc.).
2. **Tiempo de Entrega:** Entre 25 y 45 minutos una vez confirmado el pedido.
3. **Garantía:** Todo repuesto eléctrico y de motor cuenta con garantía de cambio inmediato por defecto de fábrica en mostrador o con el motorizado.
