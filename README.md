# engineering-calculation-report (ECR)

`engineering-calculation-report` convierte cálculos de ingeniería ejecutables en memorias reproducibles y auditables.

Define tus variables, ecuaciones y verificaciones en un archivo declarativo (YAML). El motor ECR se encarga de:
- Ordenar lógicamente las ecuaciones (resolución de dependencias).
- Validar y convertir unidades físicas de manera estricta.
- Realizar las verificaciones de diseño (ej. velocidad máxima permitida).
- Generar un informe presentable en HTML (y próximamente PDF) donde los resultados conservan la trazabilidad de sus orígenes, sin posibilidad de copiar un número mal.

## Instalación

```bash
git clone https://github.com/.../engineering-calculation-report.git
cd engineering-calculation-report
pip install -e .
```

## Uso Rápido

Para ver una demostración inmediata sin configurar nada:

```bash
ecr demo
```

Para crear un nuevo proyecto:

```bash
ecr new mi_proyecto
```

Esto generará una carpeta `mi_proyecto` con un `calculation.yaml` de base. Editá ese archivo con tus variables, y luego ejecutá:

```bash
ecr calculate mi_proyecto
ecr report mi_proyecto
```

## Conceptos Core

### Variables
Tienen símbolo, valor y unidad física. Si no tienen valor, el motor asumirá que son calculadas a partir de otras.

### Ecuaciones
Se escriben en texto plano, por ejemplo: `A = 3.14159 * D**2 / 4`. El motor extrae las variables, busca sus dependencias y evalúa el resultado asegurándose de que la unidad resultante sea coherente con la declaración de la variable.

### Verificaciones (Checks)
Criterios de diseño expresados matemáticamente, como `v <= 3 m/s`. Pueden evaluarse en base a variables calculadas usando sus respectivas unidades.

## Arquitectura

- **ecr.core.units**: Integra `pint` para análisis dimensional.
- **ecr.core.models**: Esquemas Pydantic del modelo declarativo.
- **ecr.core.engine**: Motor principal que construye un grafo dirigido (NetworkX), resuelve el orden de dependencias, parsea expresiones (SymPy) y evalúa resultados (Pint + SymPy lambdify).
- **ecr.render**: Sistema de renderizado en plantillas.
- **ecr.cli**: Interfaz de comandos construida con Typer y Rich.
