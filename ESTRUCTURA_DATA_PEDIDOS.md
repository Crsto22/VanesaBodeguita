# Estructura de Datos del Pedido (JSON)

Este documento detalla cómo se estructura la información de un pedido en la base de datos (Firestore), específicamente enfocándose en la lógica de **Sustitución de Productos** y **Estados de Ítems**.

## Resumen del Flujo
1.  **Pedido Original**: El cliente crea un pedido con una lista de `items`.
2.  **Gestión (Bodega)**: El bodeguero revisa el pedido.
    *   Si un producto no tiene stock, lo marca como `sin_stock`.
    *   Puede agregar propuestas alternativas (sustitutos) vinculadas a ese producto.
3.  **Confirmación (Cliente)**: La App del cliente recibe la lista actualizada.
    *   Detecta los ítems `sin_stock`.
    *   Busca los sustitutos usando el campo `sustituye_a` que coincide con el ID del ítem original.

---

## Estructura del Array `items`

La lista de productos es plana (un solo array), pero contiene relaciones lógicas mediante IDs.

### 1. Ítem Normal (Disponible)
Un producto que tiene stock y se atenderá normalmente.

```json
{
  "itemId": "item-1766269642103-0",   // ID único de este ítem en el pedido
  "id": "PROD_001",                   // ID del Producto (SKU/Firestore)
  "nombre": "Leche Gloria Azul",
  "cantidad_solicitada": 2,
  "cantidad_final": 2,                // Cantidad real a despachar
  "precio_final": 8.00,               // Precio total (2 * 4.00)
  "estado_item": "disponible",        // Estado normal
  "es_sustituto": false,              // No es un sustituto
  "requiere_confirmacion": false
}
```

### 2. Ítem Sin Stock (Padre)
Un producto que el cliente pidió pero no hay. Se marca como `sin_stock` y su precio final se vuelve 0 para no cobrarlo.

```json
{
  "itemId": "item-1766269642103-3",   // ID del ítem original
  "id": "PROD_005",
  "nombre": "Avena Santa Catalina",
  "cantidad_solicitada": 1,
  "cantidad_final": 0,                // Se despachan 0 unidades
  "precio_final": 0,                  // No se cobra
  "estado_item": "sin_stock",         // MARCA: No hay stock
  "es_sustituto": false,
  "requiere_confirmacion": true       // Requiere que el cliente acepte el cambio
}
```

### 3. Ítem Sustituto (Propuesta)
Una propuesta agregada por el bodeguero para reemplazar al ítem anterior.

```json
{
  "itemId": "sub-1766270005555",      // ID único de este ítem sustituto
  "id": "PROD_006",                   // ID del producto real (Avena 3 Ositos)
  "nombre": "Avena 3 Ositos Quinua",
  "cantidad_final": 1,                // Cantidad propuesta
  "precio_base": 2.00,                // Precio unitario
  "precio_final": 2.00,               // Precio total propuesto
  "estado_item": "disponible",
  "es_sustituto": true,               // MARCA: Es una propuesta
  "sustituye_a": "item-1766269642103-3", // VINCULACIÓN: ID del ítem "Sin Stock" de arriba
  "mostrar_precio_web": true
}
```

### 4. Ítem "Por Consultar" (Peso Variable)
Productos como frutas, verduras o quesos que se venden por peso o unidad pero cuyo precio final no es exacto al momento de pedir.

**Antes de la gestión (Pedido inicial):**
```json
{
  "itemId": "item-C",
  "nombre": "Tomate (Aprox 1kg)",
  "tipo_unidad": "kilogramo",
  "precio_base": 0,                   // Precio no definido aún
  "precio_final": 0,                  // Total 0
  "detalle": "1kg aprox",
  "requiere_confirmacion": true,      // FLAG: Indica que el bodeguero debe poner precio
  "es_sustituto": false
}
```

**Después de la gestión (Bodeguero lo pesa y pone precio):**
```json
{
  "itemId": "item-C",
  "nombre": "Tomate (Aprox 1kg)",
  "tipo_unidad": "kilogramo",
  "precio_base": 4.50,                // Precio por Kg actualizado (opcional)
  "peso_final": 1.200,                // Peso real pesado en balanza (1.2 kg)
  "precio_final": 5.40,               // Precio Final calculado (4.50 * 1.2) o ingresado manualmente
  "requiere_confirmacion": true,      // Sigue true para avisar al cliente que el precio cambió
  "estado_item": "disponible"
}
```

---

## Ejemplo Completo del JSON


Así se ve el array `items` cuando hay una sustitución en proceso:

```json
"items": [
  {
    "itemId": "item-A",
    "nombre": "Tomate",
    "estado_item": "disponible"
    // ... datos normales
  },
  {
    "itemId": "item-B",
    "nombre": "Avena Original (Agotada)",
    "estado_item": "sin_stock",
    "cantidad_final": 0,
    "precio_final": 0
  },
  {
    "itemId": "sub-1",
    "nombre": "Avena Propuesta 1",
    "es_sustituto": true,
    "sustituye_a": "item-B",  // <--- Se muestra debajo de "Avena Original"
    "precio_final": 2.50
  },
  {
    "itemId": "sub-2",
    "nombre": "Avena Propuesta 2",
    "es_sustituto": true,
    "sustituye_a": "item-B",  // <--- También es opción para "Avena Original"
    "precio_final": 3.00
  }
]
```

## Lógica para el Frontend (App Cliente)

Al renderizar la lista de confirmación:

1.  Recorrer el array `items`.
2.  Si `es_sustituto` es `false`, renderizar el producto principal.
3.  Si el producto principal tiene `estado_item: "sin_stock"`, mostrar alerta visual (Rojo/Tachado).
4.  **Buscar sustitutos**: Filtrar el array buscando ítems donde:
    `item.es_sustituto === true` Y `item.sustituye_a === itemPrincipal.itemId`

---

# Flujo de Estados: "Esperando Confirmación"

Este es el ciclo de vida detallado cuando un pedido entra en el estado `esperando_confirmacion`.

## 1. El Detonante (Bodega)
El bodeguero termina de revisar el pedido y nota cambios críticos:
*   Marcó productos como "Sin Stock".
*   Agregó propuestas de sustitución.
*   Modificó precios de productos variables (ej. pesables).

Al hacer clic en **"Solicitar Confirmación"**:
1.  El sistema valida que todos los precios sean correctos (no vacíos, no cero).
2.  Actualiza el pedido en Firestore:
    *   `estado`: `"esperando_confirmacion"`
    *   `revision.requiere_accion`: `true`
    *   `revision.motivo`: `"sustitutos"` o `"stock"`

## 2. La Experiencia del Bodeguero (Web Admin)
Una vez enviado:
*   El pedido se bloquea para edición en el panel del bodeguero.
*   Aparece un banner naranja: **"Esperando respuesta del cliente..."**.
*   Las acciones de "Confirmar" o "Cancelar" desaparecen para evitar conflictos.
*   El bodeguero debe esperar a que el cliente actúe desde su App.

## 3. La Experiencia del Cliente (App Móvil)
El cliente recibe una notificación push (opcional) o ve su pedido actualizado.

**En la pantalla "Detalle del Pedido":**
1.  El pedido muestra un estado de **"Revisión Necesaria"**.
2.  Se muestra la lista de productos:
    *   **Productos Aceptados**: Se muestran normales.
    *   **Productos Modificados**: Se resaltan (ej. "Precio actualizado").
    *   **Productos Sin Stock**: Se muestran tachados o en rojo.
    *   **Propuestas**: Aparecen debajo de los productos sin stock.

**Interacción con Sustitutos:**
El cliente ve el producto original agotado y debajo las opciones que el bodeguero agregó.
*   Debe seleccionar **una** de las opciones (o ninguna).
*   Si elige una, ese `item` sustituto pasa a ser el definitivo.
*   Si rechaza todas, el producto original se queda en cantidad 0 (no se despacha).

## 4. Resolución y Cierre
Cuando el cliente presiona **"Aceptar Cambios"** en su App:

1.  La App recalcula el total final basado en las elecciones.
2.  Actualiza el pedido en Firestore:
    *   `estado`: `"preparando"` (El pedido regresa al flujo operativo).
    *   `items`: Se limpia la lista (se eliminan sustitutos no elegidos, se consolidan los elegidos).
3.  **En la Web Admin**: El banner naranja desaparece. El pedido aparece ahora como **"Preparando"**, listo para ser empaquetado y enviado.
