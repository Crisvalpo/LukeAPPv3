# Flujo Lógico y Requerimientos de Datos: App "Bodega Piping PWA"

Para cerrar el círculo del material y determinar qué es **Fabricable**, la App de Bodega debe transformar el stock de un dato "administrativo" (ej: "tenemos 100 codos") a un dato "físico y asignable" (ej: "hay 12 codos colada X en la caja 4").

## 1. El Flujo Lógico del Material

### Paso A: Recepción y "Enriquecimiento" (La clave de la fabricabilidad)
Cuando el material llega (vía MIR/OC), la App debe capturar los datos que Ingeniería ignora pero Construcción necesita.

*   **Ingeniería pidió:** Tubería 4" SCH40 (Cantidad: 6m).
*   **Bodega recibe:** Un tubo físico.
*   **Dato Crítico a capturar:**
    *   **nº de Colada (Heat Number):** Obligatorio para el Dossier de Calidad.
    *   **Longitud Real:** ¿Llegó un tiro de 6m o dos de 3m? (Crucial para el Nesting/Corte).
    *   **Ubicación:** ¿En qué rack está?

### Paso B: Determinación de "Fabricabilidad" (Cálculo del Sistema)
Esto ocurre en el servidor (Backend), usando los datos que la App de Bodega ingresó.
Un Spool es fabricable si:
1.  **Fittings:** `Stock Libre >= Cantidad Requerida`.
2.  **Pipes:** Existe al menos un `Pipe Stick (Tubo)` en stock cuya `Largo Actual >= Largo de Corte del Spool`.

### Paso C: Picking y Asignación (Acción en la App)
Una vez que el sistema marca un Spool como "Fabricable", la App de Bodega recibe la orden de trabajo.
1.  **Reserva:** El sistema genera un "Ticket de Picking" por Spool.
2.  **Ejecución:** El bodeguero escanea el material y lo "entrega" al taller.
    *   *Al escanear, el sistema descuenta el stock y vincula la Colada (Heat No) al Spool.*

---

## 2. Datos Necesarios en la App (Bodega PWA)

Para que esto funcione, la PWA debe gestionar dos tipos de inventario distintos:

### Tipo 1: Material "A Granel" (Fittings, Flanges, Pernos)
Se gestionan por cantidad (conteo).
*   **Datos Entrada:** `Item Code`, `Cantidad Recibida`, `Colada`, `Ubicación`.
*   **Datos Salida:** `Cantidad Despachada` contra un `Spool ID`.

### Tipo 2: Material "Único" (Cañería / Tubería)
Se gestionan por unidad física (cada tubo es único porque se corta).
*   **Datos Entrada:**
    *   **ID Único (QR):** Cada tubo recibe una etiqueta única (ej: `PIP-001`).
    *   **Largo Inicial:** (ej: 6000mm).
    *   **Colada:** (ej: H12345).
*   **Operación de Corte (Cutting Order):**
    *   La App le dice al bodeguero: *"Toma el tubo `PIP-001`, corta 1500mm para el Spool `SP-05`"*.
    *   **Resultado:** El tubo `PIP-001` ahora mide 4500mm (el remanente).

---

## 3. Resumen de Tablas y Estructura (Existentes y Nuevas)

Revisando tu esquema actual, ya tienes gran parte de la estructura (`0037_pipe_inventory.sql`), solo falta activarla en la UI.

| Entidad | Tabla SQL | Rol de la PWA Bodega |
| :--- | :--- | :--- |
| **Material** | `material_inventory` | Confirmar Stock y Coladas de fittings. |
| **Tubos** | `pipe_sticks` | Crear "Sticks" únicos al recibir. Registrar cortes y remanentes. |
| **Cortes** | `pipe_cutting_orders` | Recibir la instrucción de qué tubo cortar para qué spool. |
| **Despacho** | `workshop_deliveries` | Agrupar varios materiales para enviarlos al taller juntos. |

## Conclusión

Para "cerrar el círculo", la PWA no es solo un visor, es una **Herramienta de Trazabilidad**.
Sin la PWA registrando **Coladas (Heat No)** y **Largos de Tubería**, el sistema nunca sabrá si el Spool es realmente fabricable o si solo tenemos "metros teóricos" que no sirven (ej: puros retazos cortos).
