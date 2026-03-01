# Guía de Replicación: Validador de Billetes Bolivianos

Esta guía contiene toda la información necesaria para replicar la lógica y el funcionamiento de esta aplicación en **Google AI Studio** o cualquier otro entorno de desarrollo.

## 1. Prompt de Extracción (IA)

Para que la IA identifique correctamente el billete, utiliza el siguiente prompt. Este prompt está diseñado para devolver datos estructurados (JSON) que facilitan la validación automática.

**Prompt Sugerido:**
```text
Analyze this image of a Bolivian banknote. 
1. Identify the denomination (must be 10, 20, 50, 100, or 200).
2. Extract the serial number (the numeric part).
3. Extract the series letter (the single letter at the end of the serial number, e.g., 'A', 'B', 'C', etc.).
Return ONLY a JSON object like this: {"denomination": 10, "serial": "12345678", "series": "B"}
```

---

## 2. Lógica de Validación

La aplicación no solo lee el billete, sino que aplica reglas de negocio específicas:

1.  **Filtro de Serie:** La validación de inhabilitados **SOLO** se aplica a billetes de la **Serie B**.
2.  **Filtro de Corte:** Solo se validan los cortes de **10, 20 y 50 Bs**.
3.  **Resultado:** Si el billete es de otra serie (A, C, D, etc.) o de otro corte (100, 200 Bs), se considera **Válido** (no inhabilitado).

---

## 3. Rangos de Billetes Inhabilitados (Serie B)

Si el billete detectado es **Serie B**, se debe verificar si el número de serie cae dentro de alguno de estos rangos:

### Corte 10 Bs
- 77100001 – 77550000
- 78000001 – 78450000
- 78900001 – 96350000
- 96350001 – 96800000
- 96800001 – 97250000
- 98150001 – 98600000
- 104900001 – 105350000
- 105350001 – 105800000
- 106700001 – 107150000
- 107600001 – 108050000
- 108050001 – 108500000
- 109400001 – 109850000

### Corte 20 Bs
- 87280145 – 91646549
- 96650001 – 97100000
- 99800001 – 100250000
- 100250001 – 100700000
- 109250001 – 109700000
- 110600001 – 111050000
- 111050001 – 111500000
- 111950001 – 112400000
- 112400001 – 112850000
- 112850001 – 113000000
- 114200001 – 114650000
- 114650001 – 115100000
- 115100001 – 115550000
- 118700001 – 119150000
- 119150001 – 119600000
- 120500001 – 120950000

### Corte 50 Bs
- 67250001 – 67700000
- 69050001 – 69500000
- 69500001 – 69950000
- 69950001 – 70400000
- 70400001 – 70850000
- 70850001 – 71300000
- 76310012 – 85139995
- 86400001 – 86850000
- 90900001 – 91350000
- 91800001 – 92250000

---

## 4. Flujo de Trabajo de la App

1.  **Usuario sube imagen.**
2.  **Frontend llama a Gemini API** con la imagen y el prompt del punto 1.
3.  **Gemini responde** con un JSON: `{"denomination": 20, "serial": "96650050", "series": "B"}`.
4.  **Frontend limpia el JSON** (elimina posibles ```json ... ```).
5.  **Frontend envía datos al Backend** (`/api/scan`).
6.  **Backend ejecuta la lógica:**
    - Si `series !== "B"`, retorna `is_invalid: false`.
    - Si `series === "B"`, busca el número en los rangos del punto 3.
7.  **Frontend muestra el resultado** al usuario con colores y mensajes claros.
