# Engineering Calculation Report (ECR)

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00e5ff?style=for-the-badge&logo=github)](https://lorenhey.github.io/engineering-calculation-report/)
[![Python Tests](https://img.shields.io/badge/Tests-100%25%20Passing-10b981?style=for-the-badge&logo=pytest)](https://github.com/lorenhey/engineering-calculation-report)
[![Standard](https://img.shields.io/badge/Standard-ASME%20%7C%20DIN%20743%20%7C%20SI-3b82f6?style=for-the-badge)](https://lorenhey.github.io/engineering-calculation-report/)
[![Release](https://img.shields.io/badge/Release-v2.0.0-ffb74d?style=for-the-badge)](https://github.com/lorenhey/engineering-calculation-report/releases/tag/v2.0.0)

> **Suite interactiva de memorias de cálculo de ingeniería con verificación dimensional en el Sistema Internacional (SI), resolución topológica de dependencias en Grafos Acíclicos Dirigidos (DAG), sustitución matemática paso a paso en KaTeX y formato imprimible normalizado para plantas industriales.**

👉 **Accedé a la aplicación interactiva en vivo:**  
**[https://lorenhey.github.io/engineering-calculation-report/](https://lorenhey.github.io/engineering-calculation-report/)**

---

## 🛠️ Capacidades Principales

1. **Resolución Topológica en Grafo Acíclico Dirigido (DAG):**
   - Ordenamiento de cálculo automático mediante el algoritmo de Kahn.
   - Detección proactiva de dependencias circulares con diagnóstico explícito de variables afectadas.
   - Visualizador gráfico SVG interactivo con rutas Bezier, niveles de ejecución e inspección al clic.

2. **Sustitución Matemática en 3 Pasos (KaTeX):**
   - Fórmula simbólica analítica $\implies$ Sustitución numérica con magnitudes y unidades $\implies$ Valor de diseño resultante formateado.
   - Cero posibilidad de discrepancia entre cálculo interno y documento final.

3. **Verificación de Criterios de Diseño y Factores de Seguridad:**
   - Comprobación automática de tolerancias, tensiones admisibles y límites operacionales ($\tau_{max} \le \tau_{adm}$, $v \le 30\,\text{m/s}$, $t_{comercial} \ge t_{req}$, $v_{hidr} \le 2.5\,\text{m/s}$).
   - Cálculo en tiempo real de márgenes de seguridad porcentuales y factores de seguridad reales ($FS$).

4. **Memoria de Cálculo Imprimible (Formato Normalizado Boxmark):**
   - Encabezado formal con metadatos técnicos (proyecto, código, revisión, fecha y estado de aprobación).
   - Portada de ingeniería, declaración de hipótesis y supuestos de cálculo ($A_1 \dots A_n$).
   - Tabla de parámetros nominales de entrada con fuente y trazabilidad.
   - Conclusiones técnicas de aptitud estructural.
   - Cuadro de firmas normalizado: *Calculó y Elaboró*, *Revisó* y *Aprobó*.
   - Optimizado para impresión `@media print` y exportación a PDF en un clic.

5. **Entorno Reactivo y Multiherramienta:**
   - **Editor YAML en Vivo:** Editá el proyecto declarativamente y recalculá al vuelo.
   - **Terminal CLI `ecr` Integrada:** Simulador en el navegador con comandos interactivos (`help`, `demo`, `calculate`, `check`, `report`, `graph`, `units`, `clear`).
   - **Exportación:** Descarga de proyectos en formato YAML y documentos en LaTeX.

---

## 🏭 Proyectos Industriales Preconfigurados

- **Transmisión Mecánica - Eje a Torsión (DIN 743 / Tresca):**
  Dimensionamiento y verificación de resistencia de eje circular macizo de acero SAE 1045 acoplado a un motorreductor industrial de 15 kW.
- **Termomecánica de Planta - Cañería de Vapor Saturado (ASME B31.1 / Boxmark):**
  Línea de distribución de vapor hacia bombos de curtiembre, verificando velocidad máxima admisible para evitar golpes de ariete y erosión.
- **Recipientes a Presión - Envolvente Cilíndrica (ASME VIII Div. 1 UG-27):**
  Cálculo de espesor mínimo requerido con sobreespesor de corrosión y eficiencia de junta soldada.
- **Hidráulica y Bombeo - Darcy-Weisbach & Swamee-Jain:**
  Circuito de bombeo de agua de proceso, cálculo de número de Reynolds, factor de fricción turbulento, pérdida de carga manométrica y potencia de bomba.

---

## 💻 Instalación y Uso Local en Python

Si deseás utilizar la herramienta por línea de comandos o como librería de Python:

```bash
# Clonar el repositorio
git clone https://github.com/lorenhey/engineering-calculation-report.git
cd engineering-calculation-report

# Instalar dependencias en entorno virtual
pip install -e .

# Ejecutar el demo interactivo en consola
ecr demo

# Crear un nuevo proyecto
ecr new mi_calculo

# Calcular y generar reporte
ecr calculate mi_calculo
ecr report mi_calculo
```

### Ejecutar Tests Automatizados

```bash
python -m pytest
```

---

## 🏛️ Arquitectura del Sistema

```
engineering-calculation-report/
├── index.html                   # Single Page Application con KaTeX y FontAwesome
├── css/
│   └── style.css                # Tema industrial dark dashboard + @media print formal
├── js/
│   ├── ecr-presets.js           # Catálogo de memorias de cálculo industriales
│   ├── ecr-engine.js            # Motor de cálculo: Unidades SI, Kahn's DAG y KaTeX
│   ├── dag-renderer.js          # Renderizador SVG del grafo de dependencias
│   └── app.js                   # Orquestador UI, CLI simulado y editor YAML
├── src/ecr/                     # Paquete Python original (Pint, SymPy, NetworkX, Typer)
│   ├── cli/                     # CLI Typer & Rich
│   ├── core/                    # Engine, modelos Pydantic y registry de unidades
│   └── render/                  # Plantillas de renderizado
├── tests/                       # Suite de pruebas unitarias pytest
└── .github/workflows/deploy.yml # Workflow de despliegue a GitHub Pages (master)
```

---

## 📜 Licencia y Autoría

- **Autor:** Lorenzo Pérez (Ingeniero de Proyectos y Procesos)
- **Organización:** Boxmark Leather Argentina S.A.
- **Licencia:** MIT License
