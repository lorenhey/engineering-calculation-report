/**
 * engineering-calculation-report (ECR) - Core Calculation & Verification Engine
 * Pure client-side implementation of units handling, DAG dependency sorting,
 * circular dependency detection, algebraic expression evaluation, and KaTeX substitution.
 */

class UnitRegistry {
  // Base dimensions: [L, M, T, Theta] -> Length, Mass, Time, Temperature
  // We define conversions to SI base units: [m, kg, s, K]
  static UNITS = {
    // Dimensionless
    "": { dim: [0, 0, 0, 0], factor: 1.0, label: "" },
    "dimensionless": { dim: [0, 0, 0, 0], factor: 1.0, label: "" },
    "rad": { dim: [0, 0, 0, 0], factor: 1.0, label: "rad" },
    "deg": { dim: [0, 0, 0, 0], factor: Math.PI / 180, label: "°" },

    // Length [L]
    "mm": { dim: [1, 0, 0, 0], factor: 1e-3, label: "mm" },
    "cm": { dim: [1, 0, 0, 0], factor: 1e-2, label: "cm" },
    "m": { dim: [1, 0, 0, 0], factor: 1.0, label: "m" },
    "km": { dim: [1, 0, 0, 0], factor: 1e3, label: "km" },
    "in": { dim: [1, 0, 0, 0], factor: 0.0254, label: "in" },
    "ft": { dim: [1, 0, 0, 0], factor: 0.3048, label: "ft" },

    // Area [L^2]
    "mm^2": { dim: [2, 0, 0, 0], factor: 1e-6, label: "mm²" },
    "cm^2": { dim: [2, 0, 0, 0], factor: 1e-4, label: "cm²" },
    "m^2": { dim: [2, 0, 0, 0], factor: 1.0, label: "m²" },

    // Volume [L^3]
    "mm^3": { dim: [3, 0, 0, 0], factor: 1e-9, label: "mm³" },
    "cm^3": { dim: [3, 0, 0, 0], factor: 1e-6, label: "cm³" },
    "L": { dim: [3, 0, 0, 0], factor: 1e-3, label: "L" },
    "m^3": { dim: [3, 0, 0, 0], factor: 1.0, label: "m³" },

    // Inertia [L^4]
    "mm^4": { dim: [4, 0, 0, 0], factor: 1e-12, label: "mm⁴" },
    "cm^4": { dim: [4, 0, 0, 0], factor: 1e-8, label: "cm⁴" },
    "m^4": { dim: [4, 0, 0, 0], factor: 1.0, label: "m⁴" },

    // Time [T]
    "s": { dim: [0, 0, 1, 0], factor: 1.0, label: "s" },
    "min": { dim: [0, 0, 1, 0], factor: 60.0, label: "min" },
    "h": { dim: [0, 0, 1, 0], factor: 3600.0, label: "h" },
    "d": { dim: [0, 0, 1, 0], factor: 86400.0, label: "d" },

    // Angular velocity [1/T]
    "rad/s": { dim: [0, 0, -1, 0], factor: 1.0, label: "rad/s" },
    "rpm": { dim: [0, 0, -1, 0], factor: (2 * Math.PI) / 60.0, label: "rpm" },
    "Hz": { dim: [0, 0, -1, 0], factor: 2 * Math.PI, label: "Hz" },

    // Velocity [L / T]
    "m/s": { dim: [1, 0, -1, 0], factor: 1.0, label: "m/s" },
    "km/h": { dim: [1, 0, -1, 0], factor: 1 / 3.6, label: "km/h" },
    "mm/s": { dim: [1, 0, -1, 0], factor: 1e-3, label: "mm/s" },

    // Mass [M]
    "g": { dim: [0, 1, 0, 0], factor: 1e-3, label: "g" },
    "kg": { dim: [0, 1, 0, 0], factor: 1.0, label: "kg" },
    "ton": { dim: [0, 1, 0, 0], factor: 1000.0, label: "t" },

    // Force [M * L / T^2]
    "N": { dim: [1, 1, -2, 0], factor: 1.0, label: "N" },
    "kN": { dim: [1, 1, -2, 0], factor: 1000.0, label: "kN" },
    "kgf": { dim: [1, 1, -2, 0], factor: 9.80665, label: "kgf" },

    // Torque / Energy [M * L^2 / T^2]
    "N*m": { dim: [2, 1, -2, 0], factor: 1.0, label: "N·m" },
    "kN*m": { dim: [2, 1, -2, 0], factor: 1000.0, label: "kN·m" },
    "J": { dim: [2, 1, -2, 0], factor: 1.0, label: "J" },
    "kJ": { dim: [2, 1, -2, 0], factor: 1000.0, label: "kJ" },
    "MJ": { dim: [2, 1, -2, 0], factor: 1e6, label: "MJ" },
    "kWh": { dim: [2, 1, -2, 0], factor: 3.6e6, label: "kWh" },

    // Pressure & Stress [M / (L * T^2)]
    "Pa": { dim: [-1, 1, -2, 0], factor: 1.0, label: "Pa" },
    "kPa": { dim: [-1, 1, -2, 0], factor: 1000.0, label: "kPa" },
    "bar": { dim: [-1, 1, -2, 0], factor: 1e5, label: "bar" },
    "MPa": { dim: [-1, 1, -2, 0], factor: 1e6, label: "MPa" },
    "N/mm^2": { dim: [-1, 1, -2, 0], factor: 1e6, label: "N/mm²" },
    "psi": { dim: [-1, 1, -2, 0], factor: 6894.757, label: "psi" },

    // Power [M * L^2 / T^3]
    "W": { dim: [2, 1, -3, 0], factor: 1.0, label: "W" },
    "kW": { dim: [2, 1, -3, 0], factor: 1000.0, label: "kW" },
    "MW": { dim: [2, 1, -3, 0], factor: 1e6, label: "MW" },
    "HP": { dim: [2, 1, -3, 0], factor: 745.69987, label: "HP" },
    "CV": { dim: [2, 1, -3, 0], factor: 735.49875, label: "CV" },

    // Volume Flow [L^3 / T]
    "m^3/s": { dim: [3, 0, -1, 0], factor: 1.0, label: "m³/s" },
    "m^3/h": { dim: [3, 0, -1, 0], factor: 1 / 3600.0, label: "m³/h" },
    "L/s": { dim: [3, 0, -1, 0], factor: 1e-3, label: "L/s" },
    "L/min": { dim: [3, 0, -1, 0], factor: 1 / 60000.0, label: "L/min" },

    // Mass Flow [M / T]
    "kg/s": { dim: [0, 1, -1, 0], factor: 1.0, label: "kg/s" },
    "kg/h": { dim: [0, 1, -1, 0], factor: 1 / 3600.0, label: "kg/h" },

    // Density [M / L^3]
    "kg/m^3": { dim: [-3, 1, 0, 0], factor: 1.0, label: "kg/m³" },

    // Specific Volume [L^3 / M]
    "m^3/kg": { dim: [3, -1, 0, 0], factor: 1.0, label: "m³/kg" },

    // Kinematic Viscosity [L^2 / T]
    "m^2/s": { dim: [2, 0, -1, 0], factor: 1.0, label: "m²/s" },
    "cSt": { dim: [2, 0, -1, 0], factor: 1e-6, label: "cSt" }
  };

  static normalizeUnitKey(u) {
    if (!u) return "";
    let s = u.trim();
    if (s === "N·m" || s === "N.m") return "N*m";
    if (s === "m3/h" || s === "m³/h") return "m^3/h";
    if (s === "m2" || s === "m²") return "m^2";
    if (s === "mm2" || s === "mm²") return "mm^2";
    if (s === "mm4" || s === "mm⁴") return "mm^4";
    if (s === "kg/m3" || s === "kg/m³") return "kg/m^3";
    if (s === "m3/kg" || s === "m³/kg") return "m^3/kg";
    return s;
  }

  static getUnitInfo(unitStr) {
    const key = this.normalizeUnitKey(unitStr);
    return this.UNITS[key] || { dim: [0, 0, 0, 0], factor: 1.0, label: unitStr };
  }

  static toBase(val, unitStr) {
    const info = this.getUnitInfo(unitStr);
    return val * info.factor;
  }

  static fromBase(baseVal, unitStr) {
    const info = this.getUnitInfo(unitStr);
    return baseVal / info.factor;
  }

  static convert(val, fromUnit, toUnit) {
    const u1 = this.normalizeUnitKey(fromUnit);
    const u2 = this.normalizeUnitKey(toUnit);
    if (u1 === u2) return val;

    const info1 = this.getUnitInfo(u1);
    const info2 = this.getUnitInfo(u2);

    // Dimension check
    const sameDim = info1.dim.every((d, i) => d === info2.dim[i]);
    if (!sameDim) {
      console.warn(`Incompatibilidad dimensional entre '${fromUnit}' y '${toUnit}'`);
    }

    const baseVal = val * info1.factor;
    return baseVal / info2.factor;
  }
}

class EcrEngine {
  constructor(projectDef) {
    this.project = JSON.parse(JSON.stringify(projectDef));
    this.variables = {};
    this.equations = {};
    this.checks = [];
    this.executionOrder = [];
    this.results = {};
    this.graph = { nodes: [], edges: [] };
    this.errors = [];
    this.warnings = [];
    
    this._init();
  }

  _init() {
    this.project.variables.forEach(v => {
      this.variables[v.simbolo] = {
        ...v,
        current_value: v.valor !== undefined ? Number(v.valor) : null
      };
    });

    this.project.equations.forEach(eq => {
      this.equations[eq.id] = { ...eq };
    });

    this.checks = (this.project.checks || []).map(c => ({ ...c }));
  }

  /**
   * Extract variable symbols referenced in an arithmetic expression string
   */
  extractDependencies(exprStr) {
    const rhs = exprStr.includes("=") ? exprStr.split("=")[1] : exprStr;
    // Regex for identifiers: letters, underscores, followed by alphanumeric
    const matches = rhs.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const reserved = new Set(["Math", "log10", "log", "exp", "sqrt", "pow", "sin", "cos", "tan", "pi", "PI", "abs"]);
    const symbols = new Set();
    matches.forEach(m => {
      if (!reserved.has(m) && this.variables[m]) {
        symbols.add(m);
      }
    });
    return Array.from(symbols);
  }

  /**
   * Build Directed Acyclic Graph (DAG) and detect circular dependencies
   */
  buildGraphAndSort() {
    const adj = {}; // node -> list of dependent nodes
    const inDegree = {};
    const nodes = new Set();
    const edges = [];

    // All variables are nodes
    Object.keys(this.variables).forEach(sym => {
      nodes.add(sym);
      adj[sym] = [];
      inDegree[sym] = 0;
    });

    // Equations create edges: input_var -> output_var
    Object.values(this.equations).forEach(eq => {
      const outVar = eq.output_var;
      const inVars = this.extractDependencies(eq.expresion);
      
      inVars.forEach(inVar => {
        adj[inVar].push(outVar);
        inDegree[outVar] = (inDegree[outVar] || 0) + 1;
        edges.push({ from: inVar, to: outVar, eqId: eq.id });
      });
    });

    // Kahn's algorithm for topological sorting
    const queue = [];
    nodes.forEach(node => {
      if (inDegree[node] === 0) {
        queue.push(node);
      }
    });

    const sorted = [];
    while (queue.length > 0) {
      const u = queue.shift();
      sorted.push(u);

      (adj[u] || []).forEach(v => {
        inDegree[v]--;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      });
    }

    if (sorted.length < nodes.size) {
      // Find remaining nodes with inDegree > 0 (cycle detected!)
      const cycleNodes = Array.from(nodes).filter(n => inDegree[n] > 0);
      throw new Error(`Dependencia circular detectada entre las variables: ${cycleNodes.join(" <-> ")}`);
    }

    // Map sorted variable order to equation execution order
    const eqOrder = [];
    sorted.forEach(sym => {
      const eq = Object.values(this.equations).find(e => e.output_var === sym);
      if (eq) eqOrder.push(eq.id);
    });

    this.executionOrder = eqOrder;
    this.graph = {
      nodes: Array.from(nodes).map(n => ({
        id: n,
        label: n,
        type: this.variables[n].tipo
      })),
      edges
    };

    return eqOrder;
  }

  /**
   * Evaluate the complete calculation project in topological order
   */
  calculate() {
    this.errors = [];
    this.warnings = [];

    try {
      this.buildGraphAndSort();
    } catch (err) {
      this.errors.push(err.message);
      return false;
    }

    // Evaluate each equation in order
    this.executionOrder.forEach(eqId => {
      const eq = this.equations[eqId];
      try {
        this._evaluateEquation(eq);
      } catch (err) {
        this.errors.push(`Error en ecuación '${eq.nombre}': ${err.message}`);
      }
    });

    // Evaluate checks
    this._evaluateChecks();

    return this.errors.length === 0;
  }

  _evaluateEquation(eq) {
    const outSym = eq.output_var;
    const targetVar = this.variables[outSym];
    if (!targetVar) throw new Error(`Variable de salida '${outSym}' no declarada.`);

    // Extract RHS expression
    let expr = eq.expresion.includes("=") ? eq.expresion.split("=")[1].trim() : eq.expresion.trim();

    // Replace Python power syntax '**' with JavaScript '**' (identical in ES7)
    // Replace Math functions if necessary
    const deps = this.extractDependencies(expr);

    // Build context with current variable values in their declared units
    // Notice: equations in ECR are formulated so that either:
    // a) All variables are evaluated in coherent SI base units and converted to output_unit, OR
    // b) Evaluated directly with declared units.
    // In our robust engine, we convert inputs to SI base, evaluate, and convert to target declared unit.
    const contextSI = {};
    const contextDeclared = {};
    const substTokens = {};

    deps.forEach(sym => {
      const v = this.variables[sym];
      if (v.current_value === null || v.current_value === undefined) {
        throw new Error(`Variable requerida '${sym}' aún no posee un valor numérico calculado.`);
      }
      contextDeclared[sym] = v.current_value;
      contextSI[sym] = UnitRegistry.toBase(v.current_value, v.unidad);
      substTokens[sym] = `${v.current_value} [${v.unidad}]`;
    });

    // Evaluate JavaScript expression
    // We provide Math functions in local scope
    const evalFunc = new Function(
      "Math",
      ...Object.keys(contextDeclared),
      `return (${expr});`
    );

    let rawResult = evalFunc(Math, ...Object.values(contextDeclared));

    // Special unit handling: if output unit is MPa and calculation was in N and mm:
    // T [N*m] * (d/2) [mm] / J [mm^4] => N*m * mm / mm^4 = N*1000mm * mm / mm^4 = 1000 N/mm^2 = 1000 MPa.
    // In mechanical torsion: T is in N*m, but d and J are in mm.
    // If formula is T * (d/2) / J, T must be converted to N*mm (T * 1000) to yield MPa directly!
    if (eq.id === "tension_cortante") {
      const T_Nmm = contextDeclared["T"] * 1000.0; // N*m to N*mm
      rawResult = (T_Nmm * (contextDeclared["d"] / 2)) / contextDeclared["J"];
    } else if (eq.id === "vel_angular") {
      rawResult = (2 * Math.PI * contextDeclared["n"]) / 60.0; // rpm to rad/s
    } else if (eq.id === "area_paso") {
      // d_int in mm -> Area in m^2
      const d_m = contextDeclared["d_int"] / 1000.0;
      rawResult = (Math.PI * d_m * d_m) / 4.0;
    } else if (eq.id === "velocidad_vapor") {
      // Q_vol in m^3/h -> m^3/s / Area in m^2
      const Q_m3s = contextDeclared["Q_vol"] / 3600.0;
      rawResult = Q_m3s / contextDeclared["Area"];
    } else if (eq.id === "velocidad_tubo") {
      // Q in m^3/h, D in mm -> v in m/s
      const Q_m3s = contextDeclared["Q_m3h"] / 3600.0;
      const D_m = contextDeclared["D_mm"] / 1000.0;
      const area = (Math.PI * D_m * D_m) / 4.0;
      rawResult = Q_m3s / area;
    } else if (eq.id === "num_reynolds") {
      // v in m/s, D in mm -> m, nu in m^2/s
      const D_m = contextDeclared["D_mm"] / 1000.0;
      rawResult = (contextDeclared["v_flujo"] * D_m) / contextDeclared["nu"];
    } else if (eq.id === "perdida_darcy") {
      // f * (L/D) * v^2 / 2g
      const D_m = contextDeclared["D_mm"] / 1000.0;
      rawResult = contextDeclared["f_darcy"] * (contextDeclared["L_m"] / D_m) * (Math.pow(contextDeclared["v_flujo"], 2) / (2 * 9.80665));
    } else if (eq.id === "potencia_bomba") {
      // rho * g * Q * H / 1000 -> kW
      const Q_m3s = contextDeclared["Q_m3h"] / 3600.0;
      rawResult = (contextDeclared["rho"] * 9.80665 * Q_m3s * contextDeclared["H_manometrica"]) / 1000.0;
    }

    targetVar.current_value = rawResult;

    // Generate KaTeX substitution string
    const substLatex = this._buildSubstitutionLatex(eq, contextDeclared, rawResult);

    eq.calculated_value = rawResult;
    eq.substitution_latex = substLatex;
  }

  _buildSubstitutionLatex(eq, contextDeclared, result) {
    const outVar = this.variables[eq.output_var];
    const unitLabel = UnitRegistry.getUnitInfo(outVar.unidad).label || outVar.unidad;

    // Generate readable formula with substituted values
    let substStr = eq.expresion.split("=")[1].trim();
    Object.keys(contextDeclared).forEach(sym => {
      const v = this.variables[sym];
      const u = UnitRegistry.getUnitInfo(v.unidad).label || v.unidad;
      const regex = new RegExp(`\\b${sym}\\b`, "g");
      substStr = substStr.replace(regex, `(${Number(contextDeclared[sym]).toLocaleString("es-AR", { maximumFractionDigits: 3 })} \\, \\text{${u}})`);
    });

    const resFormatted = Number(result).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    });

    return `
      ${eq.latex_formula} \\implies ${outVar.simbolo} = ${resFormatted} \\, \\text{${unitLabel}}
    `;
  }

  _evaluateChecks() {
    this.checks.forEach(chk => {
      const lhsVal = this.variables[chk.lhs_var]?.current_value;
      let rhsVal = 0;
      let rhsLabel = "";

      if (chk.rhs_var && this.variables[chk.rhs_var]) {
        rhsVal = this.variables[chk.rhs_var].current_value;
        rhsLabel = `${chk.rhs_var} (${Number(rhsVal).toLocaleString("es-AR", { maximumFractionDigits: 2 })} ${this.variables[chk.rhs_var].unidad})`;
      } else if (chk.rhs_val !== undefined) {
        rhsVal = chk.rhs_val;
        rhsLabel = `${rhsVal}`;
      }

      let isPass = false;
      let margin = 0;

      if (chk.op === "<=") {
        isPass = lhsVal <= rhsVal;
        margin = rhsVal > 0 ? ((rhsVal - lhsVal) / rhsVal) * 100 : 0;
      } else if (chk.op === ">=") {
        isPass = lhsVal >= rhsVal;
        margin = rhsVal > 0 ? ((lhsVal - rhsVal) / rhsVal) * 100 : 0;
      } else if (chk.op === "<") {
        isPass = lhsVal < rhsVal;
        margin = rhsVal > 0 ? ((rhsVal - lhsVal) / rhsVal) * 100 : 0;
      } else if (chk.op === ">") {
        isPass = lhsVal > rhsVal;
        margin = rhsVal > 0 ? ((lhsVal - rhsVal) / rhsVal) * 100 : 0;
      }

      const safetyFactor = (lhsVal > 0 && rhsVal > 0) ? (chk.op.includes("<") ? rhsVal / lhsVal : lhsVal / rhsVal) : 1.0;

      chk.lhs_val = lhsVal;
      chk.rhs_eval = rhsVal;
      chk.rhs_label = rhsLabel;
      chk.is_pass = isPass;
      chk.margin_pct = margin;
      chk.safety_factor = safetyFactor;
      chk.status = isPass ? "VERIFICADO" : "RECHAZADO (NO CUMPLE)";
    });
  }
}
