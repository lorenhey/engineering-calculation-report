/**
 * engineering-calculation-report (ECR) - Curated Industrial Engineering Presets
 * Declarative engineering calculation projects with units, formulas, checks, and metadata.
 */

const ECR_PRESETS = {
  mechanical_torsion: {
    id: "mechanical_torsion",
    title: "Cálculo y Verificación de Eje a Torsión Mecánica",
    discipline: "Ingeniería Mecánica / Elementos de Máquinas",
    standard: "Norma DIN 743 / Criterio de Falla por Tensión Cortante Máxima",
    author: "Ing. Lorenzo Pérez",
    project: "Línea de Tracción y Accionamiento - Motor M-101",
    client: "Boxmark Leather Industrial Plant",
    revision: "Rev. 02",
    date: "2026-10-19",
    description: "Dimensionamiento y comprobación de resistencia a la torsión pura de un eje circular macizo de acero al carbono acoplado a un motorreductor industrial de 15 kW.",
    assumptions: [
      { id: "A1", desc: "Material isótropo y homogéneo operando en régimen estrictamente elástico lineal (Ley de Hooke)." },
      { id: "A2", desc: "Sección circular maciza uniforme sin concentradores de tensión geométricos en la zona de máximo momento." },
      { id: "A3", desc: "Efecto de la flexión secundaria despreciable frente al momento torsor predominante de transmisión." }
    ],
    variables: [
      { id: "P", simbolo: "P", descripcion: "Potencia nominal transmitida por el motor", valor: 15, unidad: "kW", tipo: "entrada", fuente: "Placa motor M-101" },
      { id: "n", simbolo: "n", descripcion: "Velocidad de rotación del eje", valor: 1450, unidad: "rpm", tipo: "entrada", fuente: "Catálogo de accionamiento" },
      { id: "d", simbolo: "d", descripcion: "Diámetro geométrico nominal del eje", valor: 35, unidad: "mm", tipo: "entrada", fuente: "Plano mecánico MEC-042" },
      { id: "tau_adm", simbolo: "tau_adm", descripcion: "Tensión cortante admisible del material (Acero SAE 1045)", valor: 60, unidad: "MPa", tipo: "entrada", fuente: "Norma DIN 743 / Factor S=2.5" },
      { id: "omega", simbolo: "omega", descripcion: "Velocidad angular de rotación", unidad: "rad/s", tipo: "calculada" },
      { id: "T", simbolo: "T", descripcion: "Momento torsor transmitido", unidad: "N*m", tipo: "calculada" },
      { id: "J", simbolo: "J", descripcion: "Momento polar de inercia de la sección", unidad: "mm^4", tipo: "calculada" },
      { id: "tau_max", simbolo: "tau_max", descripcion: "Tensión cortante máxima periférica", unidad: "MPa", tipo: "calculada" }
    ],
    equations: [
      {
        id: "vel_angular",
        nombre: "Velocidad Angular",
        latex_formula: "\\omega = 2 \\cdot \\pi \\cdot n",
        expresion: "omega = 2 * 3.14159265 * n",
        output_var: "omega",
        output_unit: "rad/s"
      },
      {
        id: "momento_torsor",
        nombre: "Momento Torsor Transmitido",
        latex_formula: "T = \\frac{P}{\\omega}",
        expresion: "T = P / omega",
        output_var: "T",
        output_unit: "N*m"
      },
      {
        id: "momento_polar",
        nombre: "Momento Polar de Inercia",
        latex_formula: "J = \\frac{\\pi \\cdot d^4}{32}",
        expresion: "J = 3.14159265 * d**4 / 32",
        output_var: "J",
        output_unit: "mm^4"
      },
      {
        id: "tension_cortante",
        nombre: "Tensión Cortante Máxima de Torsión",
        latex_formula: "\\tau_{max} = \\frac{T \\cdot (d / 2)}{J}",
        expresion: "tau_max = T * (d / 2) / J",
        output_var: "tau_max",
        output_unit: "MPa"
      }
    ],
    checks: [
      {
        id: "check_tension",
        descripcion: "Resistencia Mecánica: La tensión tangencial máxima debe ser menor a la tensión admisible del acero",
        expresion: "tau_max <= tau_adm",
        lhs_var: "tau_max",
        op: "<=",
        rhs_var: "tau_adm",
        severidad: "error",
        norma: "DIN 743 / Criterio Tresca"
      }
    ]
  },

  steam_pipe_sizing: {
    id: "steam_pipe_sizing",
    title: "Dimensionamiento y Verificación de Cañería de Vapor Saturado",
    discipline: "Ingeniería Termomecánica / Redes de Vapor",
    standard: "Norma ASME B31.1 / Spirax Sarco Steam Engineering Guidelines",
    author: "Ing. Lorenzo Pérez",
    project: "Ramal de Distribución de Vapor a Secaderos Continuos",
    client: "Boxmark Leather Industrial Plant",
    revision: "Rev. 01",
    date: "2026-10-19",
    description: "Cálculo de velocidad de flujo, sección transversal y pérdida admisible para cañería de acero al carbono Sch 40 que transporta vapor saturado seco a 7 bar relativos hacia túneles de secado.",
    assumptions: [
      { id: "A1", desc: "Vapor saturado seco a título x = 0.98 con trampas de condensado funcionando en régimen permanente." },
      { id: "A2", desc: "Régimen de flujo unidimensional, estacionario e incompresible en el tramo de velocidad de diseño." },
      { id: "A3", desc: "Velocidad límite recomendada para vapor saturado seco sin arrastre de agua: v_max = 30 m/s." }
    ],
    variables: [
      { id: "m_dot", simbolo: "m_dot", descripcion: "Caudal másico total de vapor requerido", valor: 4200, unidad: "kg/h", tipo: "entrada", fuente: "Balance térmico secaderos" },
      { id: "v_esp", simbolo: "v_esp", descripcion: "Volumen específico del vapor saturado a 7 bar", valor: 0.2404, unidad: "m^3/kg", tipo: "entrada", fuente: "Tablas de vapor IAPWS-IF97" },
      { id: "D_ext", simbolo: "D_ext", descripcion: "Diámetro exterior cañería 4 pulg Sch 40", valor: 114.3, unidad: "mm", tipo: "entrada", fuente: "ASME B36.10M" },
      { id: "espesor", simbolo: "espesor", descripcion: "Espesor de pared nominal Sch 40", valor: 6.02, unidad: "mm", tipo: "entrada", fuente: "ASME B36.10M" },
      { id: "v_adm", simbolo: "v_adm", descripcion: "Velocidad máxima admisible recomendada", valor: 30.0, unidad: "m/s", tipo: "entrada", fuente: "Criterio Spirax Sarco / ASME" },
      { id: "d_int", simbolo: "d_int", descripcion: "Diámetro interior útil de paso", unidad: "mm", tipo: "calculada" },
      { id: "Q_vol", simbolo: "Q_vol", descripcion: "Caudal volumétrico horario de vapor", unidad: "m^3/h", tipo: "calculada" },
      { id: "Area", simbolo: "Area", descripcion: "Área de pasaje de la sección interior", unidad: "m^2", tipo: "calculada" },
      { id: "vel_flujo", simbolo: "vel_flujo", descripcion: "Velocidad media de circulación de vapor", unidad: "m/s", tipo: "calculada" }
    ],
    equations: [
      {
        id: "diametro_interior",
        nombre: "Diámetro Interior Útil",
        latex_formula: "d_{int} = D_{ext} - 2 \\cdot espesor",
        expresion: "d_int = D_ext - 2 * espesor",
        output_var: "d_int",
        output_unit: "mm"
      },
      {
        id: "caudal_volumetrico",
        nombre: "Caudal Volumétrico de Vapor",
        latex_formula: "Q_{vol} = \\dot{m} \\cdot v_{esp}",
        expresion: "Q_vol = m_dot * v_esp",
        output_var: "Q_vol",
        output_unit: "m^3/h"
      },
      {
        id: "area_paso",
        nombre: "Área de Sección Interior",
        latex_formula: "A = \\frac{\\pi \\cdot d_{int}^2}{4}",
        expresion: "Area = 3.14159265 * d_int**2 / 4",
        output_var: "Area",
        output_unit: "m^2"
      },
      {
        id: "velocidad_vapor",
        nombre: "Velocidad de Flujo del Vapor",
        latex_formula: "v = \\frac{Q_{vol}}{A}",
        expresion: "vel_flujo = Q_vol / Area",
        output_var: "vel_flujo",
        output_unit: "m/s"
      }
    ],
    checks: [
      {
        id: "check_velocidad",
        descripcion: "Erosión y Golpe de Ariete: La velocidad del vapor debe mantenerse inferior a 30 m/s para prevenir desgaste y ruidos",
        expresion: "vel_flujo <= v_adm",
        lhs_var: "vel_flujo",
        op: "<=",
        rhs_var: "v_adm",
        severidad: "error",
        norma: "ASME B31.1"
      }
    ]
  },

  pressure_vessel_asme: {
    id: "pressure_vessel_asme",
    title: "Cálculo de Espesor de Envolvente Cilíndrica sometida a Presión Interna",
    discipline: "Ingeniería de Recipientes y Calderería",
    standard: "Código ASME Sección VIII, División 1, Párrafo UG-27",
    author: "Ing. Lorenzo Pérez",
    project: "Tanque Pulmón de Almacenamiento de Aire Comprimido (V = 3000 L)",
    client: "Boxmark Leather Industrial Plant",
    revision: "Rev. 03",
    date: "2026-10-19",
    description: "Determinación del espesor mínimo reglamentario y comprobación de presión máxima de trabajo admisible (MAWP) de la envolvente cilíndrica de un acumulador neumático de 10 bar de diseño.",
    assumptions: [
      { id: "A1", desc: "Envolvente cilíndrica de pared delgada donde el espesor t no excede la mitad del radio interior (t <= 0.5 * R)." },
      { id: "A2", desc: "Material: Chapa de acero al carbono para recipientes a presión ASTM A516 Grado 70." },
      { id: "A3", desc: "Eficiencia de junta soldada a tope longitudinal radiografiada por muestreo: E = 0.85 (Spot Radiography, UW-12)." }
    ],
    variables: [
      { id: "P_dis", simbolo: "P_dis", descripcion: "Presión interna de diseño manométrica", valor: 1.15, unidad: "MPa", tipo: "entrada", fuente: "Especificación de seguridad" },
      { id: "R_int", simbolo: "R_int", descripcion: "Radio interior del cuerpo cilíndrico", valor: 550, unidad: "mm", tipo: "entrada", fuente: "Geometría requerida" },
      { id: "S_adm", simbolo: "S_adm", descripcion: "Tensión admisible del material a 50°C (SA-516 Gr. 70)", valor: 138, unidad: "MPa", tipo: "entrada", fuente: "ASME Sección II Parte D" },
      { id: "E_junta", simbolo: "E_junta", descripcion: "Eficiencia de junta soldada longitudinal", valor: 0.85, unidad: "dimensionless", tipo: "entrada", fuente: "ASME UW-12 Tipo 1 Spot" },
      { id: "CA", simbolo: "CA", descripcion: "Sobreespesor por corrosión interior", valor: 1.5, unidad: "mm", tipo: "entrada", fuente: "Condición aire comprimido húmedo" },
      { id: "t_comercial", simbolo: "t_comercial", descripcion: "Espesor comercial de chapa adoptado", valor: 8.0, unidad: "mm", tipo: "entrada", fuente: "Espesor chapa laminada" },
      { id: "t_min_asme", simbolo: "t_min_asme", descripcion: "Espesor mínimo calculado por UG-27 (con corrosión)", unidad: "mm", tipo: "calculada" }
    ],
    equations: [
      {
        id: "espesor_ug27",
        nombre: "Espesor Mínimo según ASME UG-27(c)(1)",
        latex_formula: "t_{min} = \\frac{P \\cdot R}{S \\cdot E - 0.6 \\cdot P} + CA",
        expresion: "t_min_asme = (P_dis * R_int) / (S_adm * E_junta - 0.6 * P_dis) + CA",
        output_var: "t_min_asme",
        output_unit: "mm"
      }
    ],
    checks: [
      {
        id: "check_espesor",
        descripcion: "Seguridad Estructural: El espesor comercial adoptado de chapa debe superar al espesor mínimo reglamentario ASME",
        expresion: "t_comercial >= t_min_asme",
        lhs_var: "t_comercial",
        op: ">=",
        rhs_var: "t_min_asme",
        severidad: "error",
        norma: "ASME VIII Div. 1 UG-27"
      }
    ]
  },

  pumping_head_loss: {
    id: "pumping_head_loss",
    title: "Cálculo Hidráulico de Bombeo y Pérdida de Carga (Darcy-Weisbach)",
    discipline: "Ingeniería Hidráulica y Fluidodinámica",
    standard: "Ecuación de Darcy-Weisbach / Aproximación de Swamee-Jain",
    author: "Ing. Lorenzo Pérez",
    project: "Circuito de Agua de Enfriamiento y Torres de Enfriamiento",
    client: "Boxmark Leather Industrial Plant",
    revision: "Rev. 01",
    date: "2026-10-19",
    description: "Evaluación de pérdidas de carga por fricción, régimen turbulento (Reynolds), altura manométrica y potencia hidráulica requerida en bomba centrífuga de recirculación.",
    assumptions: [
      { id: "A1", desc: "Fluido: Agua a 25°C (densidad rho = 997 kg/m³, viscosidad cinematica nu = 1.0e-6 m²/s)." },
      { id: "A2", desc: "Cañería de acero comercial con rugosidad absoluta epsilon = 0.045 mm." },
      { id: "A3", desc: "Aceleración de la gravedad estándar g = 9.80665 m/s²." }
    ],
    variables: [
      { id: "Q_m3h", simbolo: "Q_m3h", descripcion: "Caudal de bombeo en servicio continuo", valor: 50.0, unidad: "m^3/h", tipo: "entrada", fuente: "Requerimiento de intercambio" },
      { id: "D_mm", simbolo: "D_mm", descripcion: "Diámetro interior de cañería", valor: 80.0, unidad: "mm", tipo: "entrada", fuente: "Cañería DN 80" },
      { id: "L_m", simbolo: "L_m", descripcion: "Longitud total equivalente de cañería", valor: 95.0, unidad: "m", tipo: "entrada", fuente: "Isométrico de tuberías" },
      { id: "H_estatica", simbolo: "H_estatica", descripcion: "Diferencia de cota geométrica (altura estática)", valor: 14.0, unidad: "m", tipo: "entrada", fuente: "Diferencia de nivel tanque" },
      { id: "rho", simbolo: "rho", descripcion: "Densidad del agua de refrigeración", valor: 997.0, unidad: "kg/m^3", tipo: "entrada", fuente: "Propiedad física" },
      { id: "nu", simbolo: "nu", descripcion: "Viscosidad cinemática del agua", valor: 0.000001, unidad: "m^2/s", tipo: "entrada", fuente: "Propiedad física a 25°C" },
      { id: "v_flujo", simbolo: "v_flujo", descripcion: "Velocidad media de pasaje", unidad: "m/s", tipo: "calculada" },
      { id: "Re", simbolo: "Re", descripcion: "Número de Reynolds", unidad: "dimensionless", tipo: "calculada" },
      { id: "f_darcy", simbolo: "f_darcy", descripcion: "Factor de fricción de Darcy (Swamee-Jain)", unidad: "dimensionless", tipo: "calculada" },
      { id: "hf_perdida", simbolo: "hf_perdida", descripcion: "Pérdida de carga continua por fricción", unidad: "m", tipo: "calculada" },
      { id: "H_manometrica", simbolo: "H_manometrica", descripcion: "Altura manométrica total de la bomba", unidad: "m", tipo: "calculada" },
      { id: "Pot_hidraulica", simbolo: "Pot_hidraulica", descripcion: "Potencia hidráulica neta demandada al fluido", unidad: "kW", tipo: "calculada" }
    ],
    equations: [
      {
        id: "velocidad_tubo",
        nombre: "Velocidad de Flujo",
        latex_formula: "v = \\frac{Q}{\\frac{\\pi \\cdot D^2}{4}}",
        expresion: "v_flujo = Q_m3h / (3.14159265 * D_mm**2 / 4)",
        output_var: "v_flujo",
        output_unit: "m/s"
      },
      {
        id: "num_reynolds",
        nombre: "Número de Reynolds",
        latex_formula: "Re = \\frac{v \\cdot D}{\\nu}",
        expresion: "Re = v_flujo * D_mm / nu",
        output_var: "Re",
        output_unit: "dimensionless"
      },
      {
        id: "factor_friccion",
        nombre: "Factor de Fricción (Swamee-Jain)",
        latex_formula: "f = \\frac{0.25}{\\left[ \\log_{10} \\left( \\frac{\\varepsilon / D}{3.7} + \\frac{5.74}{Re^{0.9}} \\right) \\right]^2}",
        expresion: "f_darcy = 0.25 / (Math.log10( (0.045 / D_mm) / 3.7 + 5.74 / (Re**0.9) ) )**2",
        output_var: "f_darcy",
        output_unit: "dimensionless"
      },
      {
        id: "perdida_darcy",
        nombre: "Pérdida de Carga por Fricción (Darcy-Weisbach)",
        latex_formula: "h_f = f \\cdot \\frac{L}{D} \\cdot \\frac{v^2}{2g}",
        expresion: "hf_perdida = f_darcy * (L_m / D_mm) * (v_flujo**2 / (2 * 9.80665))",
        output_var: "hf_perdida",
        output_unit: "m"
      },
      {
        id: "altura_manometrica",
        nombre: "Altura Manométrica Total",
        latex_formula: "H_{total} = H_{estatica} + h_f",
        expresion: "H_manometrica = H_estatica + hf_perdida",
        output_var: "H_manometrica",
        output_unit: "m"
      },
      {
        id: "potencia_bomba",
        nombre: "Potencia Hidráulica del Fluido",
        latex_formula: "P_h = \\rho \\cdot g \\cdot Q \\cdot H_{total}",
        expresion: "Pot_hidraulica = (rho * 9.80665 * Q_m3h * H_manometrica) / 1000",
        output_var: "Pot_hidraulica",
        output_unit: "kW"
      }
    ],
    checks: [
      {
        id: "check_vel_hidraulica",
        descripcion: "Velocidad en Cañería: La velocidad del agua debe estar en el rango óptimo (0.8 m/s a 2.5 m/s) para evitar sedimentación o erosión",
        expresion: "v_flujo <= 2.5",
        lhs_var: "v_flujo",
        op: "<=",
        rhs_val: 2.5,
        severidad: "warning",
        norma: "Hydraulic Institute Guidelines"
      }
    ]
  }
};
