/**
 * engineering-calculation-report (ECR) - Main Web Application Controller
 * Handles UI interactions, reactive inputs, tabs, presets, KaTeX rendering,
 * interactive DAG graph, YAML project editor, and simulated ecr CLI.
 */

document.addEventListener("DOMContentLoaded", () => {
  let currentPresetKey = "mechanical_torsion";
  let activeProject = JSON.parse(JSON.stringify(ECR_PRESETS[currentPresetKey]));
  let engine = new EcrEngine(activeProject);
  let dagRenderer = null;

  // Cache DOM elements
  const presetSelect = document.getElementById("preset-select");
  const quickInputsContainer = document.getElementById("quick-inputs-container");
  const reportContainer = document.getElementById("report-view-container");
  const dagContainer = document.getElementById("dag-canvas-container");
  const nodeDetailPanel = document.getElementById("dag-node-detail");
  const yamlEditorTextarea = document.getElementById("yaml-editor-textarea");
  const btnCalculateYaml = document.getElementById("btn-calculate-yaml");
  const variablesTableBody = document.getElementById("variables-table-body");
  const checksBadgeCount = document.getElementById("checks-summary-badge");
  const cliTerminalInput = document.getElementById("cli-input");
  const cliTerminalOutput = document.getElementById("cli-output");

  // Initialize DAG Renderer
  if (dagContainer) {
    dagRenderer = new DagRenderer(dagContainer);
    dagRenderer.onNodeClick = (nodeId, v, eng) => {
      showNodeDetail(nodeId, v, eng);
    };
  }

  // Populate presets dropdown
  if (presetSelect) {
    presetSelect.innerHTML = "";
    Object.keys(ECR_PRESETS).forEach(key => {
      const p = ECR_PRESETS[key];
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${p.title} (${p.standard.split("/")[0].trim()})`;
      if (key === currentPresetKey) opt.selected = true;
      presetSelect.appendChild(opt);
    });

    presetSelect.addEventListener("change", (e) => {
      loadPreset(e.target.value);
    });
  }

  // Tab switching logic
  const tabButtons = document.querySelectorAll(".nav-tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add("active");
        if (targetId === "tab-dag" && dagRenderer && engine) {
          setTimeout(() => dagRenderer.render(engine), 50);
        }
      }
    });
  });

  // Action Buttons
  document.getElementById("btn-print-report")?.addEventListener("click", () => {
    window.print();
  });

  document.getElementById("btn-export-yaml")?.addEventListener("click", () => {
    exportYamlFile();
  });

  document.getElementById("btn-export-latex")?.addEventListener("click", () => {
    exportLatexFile();
  });

  document.getElementById("btn-reset-preset")?.addEventListener("click", () => {
    loadPreset(currentPresetKey);
  });

  if (btnCalculateYaml) {
    btnCalculateYaml.addEventListener("click", () => {
      parseAndRunYaml();
    });
  }

  // Load a preset project
  function loadPreset(presetKey) {
    currentPresetKey = presetKey;
    activeProject = JSON.parse(JSON.stringify(ECR_PRESETS[presetKey]));
    engine = new EcrEngine(activeProject);
    recalculateAll();
    syncYamlEditor();
    if (cliTerminalOutput) {
      appendCliMessage(`Proyecto cargado: [${activeProject.title}] (${activeProject.revision})`, "sys");
    }
  }

  // Recalculate everything and update UI components
  function recalculateAll() {
    const success = engine.calculate();
    renderQuickInputs();
    renderReportView();
    renderVariablesTable();
    updateChecksBadge();

    if (dagRenderer) {
      dagRenderer.render(engine);
    }

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX auto-render error:", e);
      }
    }
  }

  // Quick inputs sidebar
  function renderQuickInputs() {
    if (!quickInputsContainer) return;
    quickInputsContainer.innerHTML = "";

    const inputs = Object.values(engine.variables).filter(v => v.tipo === "entrada");

    inputs.forEach(v => {
      const group = document.createElement("div");
      group.className = "input-control-card";

      const unitLabel = UnitRegistry.getUnitInfo(v.unidad).label || v.unidad;

      group.innerHTML = `
        <div class="input-card-header">
          <span class="input-symbol">${v.simbolo}</span>
          <span class="input-unit">[${unitLabel}]</span>
        </div>
        <div class="input-card-desc" title="${v.descripcion}">${v.descripcion}</div>
        <div class="input-card-field">
          <input type="number" step="any" class="input-number-field" id="input-${v.simbolo}" value="${v.current_value}">
          <span class="input-field-unit">${unitLabel}</span>
        </div>
        ${v.fuente ? `<div class="input-card-source"><i class="fa-solid fa-tag"></i> ${v.fuente}</div>` : ""}
      `;

      const numInput = group.querySelector(".input-number-field");
      numInput.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          engine.setVariableValue(v.simbolo, val);
          // Recalculate only equations and checks without rebuilding the input cards
          engine.calculate();
          renderReportView();
          renderVariablesTable();
          updateChecksBadge();
          if (dagRenderer) dagRenderer.render(engine);
          syncYamlEditor();

          if (window.renderMathInElement) {
            window.renderMathInElement(reportContainer, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false }
              ],
              throwOnError: false
            });
          }
        }
      });

      quickInputsContainer.appendChild(group);
    });
  }

  // Formal Boxmark Printable Calculation Memorandum
  function renderReportView() {
    if (!reportContainer) return;

    const p = engine.project;
    const allChecksPass = engine.checks.every(c => c.is_pass);

    let html = `
      <div class="memoria-boxmark-document" id="printable-memorandum">
        <!-- HEADER FORMAL BOXMARK LEATHER S.A. -->
        <header class="doc-header-boxmark">
          <div class="header-brand-block">
            <div class="brand-logo-area">
              <span class="brand-logo-badge"><i class="fa-solid fa-microchip"></i> BOXI ECR</span>
              <span class="brand-org-name">BOXMARK LEATHER ARGENTINA S.A.</span>
            </div>
            <div class="brand-dept-name">DEPARTAMENTO DE INGENIERÍA Y MANTENIMIENTO INDUSTRIAL</div>
          </div>
          <div class="header-meta-table">
            <div class="meta-row"><span class="meta-lbl">DOCUMENTO:</span><span class="meta-val">MEMORIA DE CÁLCULO TÉCNICA</span></div>
            <div class="meta-row"><span class="meta-lbl">PROYECTO:</span><span class="meta-val">${p.project || "Planta Industrial"}</span></div>
            <div class="meta-row"><span class="meta-lbl">CÓDIGO:</span><span class="meta-val">ECR-${p.id.toUpperCase()}-2026</span></div>
            <div class="meta-row"><span class="meta-lbl">REVISIÓN:</span><span class="meta-val">${p.revision || "Rev. 00"}</span></div>
            <div class="meta-row"><span class="meta-lbl">FECHA:</span><span class="meta-val">${p.date || "2026-10-19"}</span></div>
            <div class="meta-row"><span class="meta-lbl">ESTADO:</span><span class="meta-val ${allChecksPass ? 'text-success' : 'text-danger'}"><strong>${allChecksPass ? 'APROBADO' : 'OBSERVADO / RECHAZADO'}</strong></span></div>
          </div>
        </header>

        <!-- PORTADA / TÍTULO -->
        <div class="doc-title-section">
          <div class="doc-discipline-tag">${p.discipline}</div>
          <h1 class="doc-title">${p.title}</h1>
          <div class="doc-standard-ref"><i class="fa-solid fa-book-bookmark"></i> Marco Normativo: <strong>${p.standard}</strong></div>
          <p class="doc-objective">${p.description}</p>
        </div>

        <!-- 1. HIPÓTESIS Y SUPUESTOS DE CÁLCULO -->
        <section class="doc-section">
          <h2 class="section-title"><span class="sec-num">1.0</span> Hipótesis y Supuestos de Diseño</h2>
          <div class="assumptions-list">
            ${(p.assumptions || []).map(a => `
              <div class="assumption-item">
                <span class="assumption-badge">${a.id}</span>
                <span class="assumption-text">${a.desc}</span>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- 2. PARÁMETROS Y VARIABLES DE ENTRADA -->
        <section class="doc-section">
          <h2 class="section-title"><span class="sec-num">2.0</span> Parámetros y Datos Nominales de Entrada</h2>
          <table class="doc-table">
            <thead>
              <tr>
                <th style="width: 12%;">Símbolo</th>
                <th style="width: 44%;">Descripción del Parámetro</th>
                <th style="width: 14%; text-align: right;">Valor</th>
                <th style="width: 12%;">Unidad</th>
                <th style="width: 18%;">Fuente / Referencia</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(engine.variables).filter(v => v.tipo === "entrada").map(v => `
                <tr>
                  <td><code class="symbol-code">${v.simbolo}</code></td>
                  <td>${v.descripcion}</td>
                  <td style="text-align: right; font-weight: 600;">${Number(v.current_value).toLocaleString("es-AR", { maximumFractionDigits: 3 })}</td>
                  <td>${UnitRegistry.getUnitInfo(v.unidad).label || v.unidad}</td>
                  <td class="text-muted"><small>${v.fuente || "Dato de diseño"}</small></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>

        <!-- 3. DESARROLLO MATEMÁTICO Y SUSTITUCIÓN NUMÉRICA PASO A PASO -->
        <section class="doc-section">
          <h2 class="section-title"><span class="sec-num">3.0</span> Desarrollo Analítico y Sustitución Numérica</h2>
          <p class="section-instruction">
            Las ecuaciones son evaluadas en secuencia topológica libre de ciclos conforme a la formulación dimensional del SI:
          </p>
          <div class="equations-flow-container">
            ${engine.executionOrder.map((eqId, idx) => {
              const eq = engine.equations[eqId];
              const outVar = engine.variables[eq.output_var];
              const unitLabel = UnitRegistry.getUnitInfo(outVar.unidad).label || outVar.unidad;
              const valFormatted = Number(outVar.current_value).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
              });

              return `
                <div class="equation-calc-card">
                  <div class="eq-header">
                    <span class="eq-step-tag">Paso 3.${idx + 1}</span>
                    <span class="eq-name">${eq.nombre}</span>
                    <span class="eq-out-tag">Resultado: ${outVar.simbolo}</span>
                  </div>
                  <div class="eq-latex-substitution">
                    $$${eq.latex_formula}$$
                  </div>
                  <div class="eq-subst-eval">
                    <div class="eval-line">
                      <span class="eval-label">Sustitución y Resultado:</span>
                      <span class="eval-math">$$${outVar.simbolo} = ${valFormatted} \\; \\text{${unitLabel}}$$</span>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </section>

        <!-- 4. VERIFICACIÓN DE CRITERIOS DE DISEÑO Y SEGURIDAD -->
        <section class="doc-section">
          <h2 class="section-title"><span class="sec-num">4.0</span> Verificación de Criterios y Factores de Seguridad</h2>
          <div class="checks-grid">
            ${engine.checks.map(chk => {
              const lhsFormatted = Number(chk.lhs_val).toLocaleString("es-AR", { maximumFractionDigits: 3 });
              const rhsFormatted = Number(chk.rhs_eval).toLocaleString("es-AR", { maximumFractionDigits: 3 });
              const marginStr = chk.margin_pct >= 0 ? `+${chk.margin_pct.toFixed(1)}%` : `${chk.margin_pct.toFixed(1)}%`;
              const sfStr = chk.safety_factor.toFixed(2);

              return `
                <div class="check-result-card ${chk.is_pass ? 'check-pass' : 'check-fail'}">
                  <div class="check-card-header">
                    <div class="check-status-badge ${chk.is_pass ? 'badge-pass' : 'badge-fail'}">
                      <i class="fa-solid ${chk.is_pass ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
                      ${chk.status}
                    </div>
                    <span class="check-standard-ref">${chk.norma || p.standard}</span>
                  </div>
                  <div class="check-desc">${chk.descripcion}</div>
                  <div class="check-comparison-math">
                    $$\\mathbf{${chk.lhs_var}} = ${lhsFormatted} \\quad ${chk.op} \\quad \\mathbf{${chk.rhs_var || 'Límite'}} = ${rhsFormatted}$$
                  </div>
                  <div class="check-metrics-row">
                    <div class="metric-item">
                      <span class="metric-lbl">Margen de Seguridad:</span>
                      <span class="metric-val ${chk.is_pass ? 'text-success' : 'text-danger'}">${marginStr}</span>
                    </div>
                    <div class="metric-item">
                      <span class="metric-lbl">Factor de Seguridad Real (FS):</span>
                      <span class="metric-val ${chk.safety_factor >= 1.0 ? 'text-success' : 'text-danger'}">${sfStr}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </section>

        <!-- 5. CONCLUSIÓN Y CONFORMIDAD -->
        <section class="doc-section">
          <h2 class="section-title"><span class="sec-num">5.0</span> Conclusión Técnica de Ingeniería</h2>
          <div class="conclusion-box ${allChecksPass ? 'conclusion-pass' : 'conclusion-warn'}">
            <p>
              ${allChecksPass
                ? `Todas las ecuaciones y verificaciones dimensionales satisfacen los límites fijados por la norma <strong>${p.standard}</strong>. La configuración geométrica y las propiedades del material son adecuadas para la operación continua en planta bajo las condiciones de diseño especificadas.`
                : `Se han detectado criterios de diseño no conformes con la norma <strong>${p.standard}</strong>. Es mandatorio redefinir las variables de entrada geométricas o seleccionar un material de mayor límite elástico antes de autorizar la fabricación o montaje.`
              }
            </p>
          </div>
        </section>

        <!-- 6. CUADRO DE FIRMAS NORMALIZADO BOXMARK -->
        <section class="doc-signatures-section">
          <div class="signature-box">
            <div class="sig-role">CALCULÓ Y ELABORÓ</div>
            <div class="sig-line"></div>
            <div class="sig-name">${p.author || "Ing. Lorenzo Pérez"}</div>
            <div class="sig-title">Ingeniero de Proyectos y Procesos</div>
            <div class="sig-entity">Boxmark Leather Argentina S.A.</div>
          </div>
          <div class="signature-box">
            <div class="sig-role">REVISÓ</div>
            <div class="sig-line"></div>
            <div class="sig-name">Jefatura Técnica de Planta</div>
            <div class="sig-title">Ingeniería & Mantenimiento</div>
            <div class="sig-entity">Boxmark Leather Argentina S.A.</div>
          </div>
          <div class="signature-box">
            <div class="sig-role">APROBÓ</div>
            <div class="sig-line"></div>
            <div class="sig-name">Gerencia de Operaciones</div>
            <div class="sig-title">Dirección de Planta Industrial</div>
            <div class="sig-entity">Boxmark Leather Argentina S.A.</div>
          </div>
        </section>
      </div>
    `;

    reportContainer.innerHTML = html;
  }

  // Variables and Units Table tab
  function renderVariablesTable() {
    if (!variablesTableBody) return;
    variablesTableBody.innerHTML = "";

    Object.values(engine.variables).forEach(v => {
      const isInput = v.tipo === "entrada";
      const uInfo = UnitRegistry.getUnitInfo(v.unidad);
      const valStr = v.current_value !== null && v.current_value !== undefined 
        ? Number(v.current_value).toLocaleString("es-AR", { maximumFractionDigits: 4 })
        : "--";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="var-badge ${isInput ? 'badge-input' : 'badge-calc'}">${isInput ? 'ENTRADA' : 'CALCULADA'}</span></td>
        <td><code>${v.simbolo}</code></td>
        <td>${v.descripcion}</td>
        <td style="text-align: right; font-weight: 600;">${valStr}</td>
        <td><strong>${uInfo.label || v.unidad}</strong></td>
        <td><code>[${uInfo.dim.join(", ")}]</code></td>
        <td class="text-muted"><small>${v.fuente || "-"}</small></td>
      `;
      variablesTableBody.appendChild(tr);
    });
  }

  function updateChecksBadge() {
    if (!checksBadgeCount) return;
    const passes = engine.checks.filter(c => c.is_pass).length;
    const total = engine.checks.length;
    checksBadgeCount.textContent = `${passes}/${total} Verificados`;
    if (passes === total) {
      checksBadgeCount.className = "status-pill-badge pill-pass";
    } else {
      checksBadgeCount.className = "status-pill-badge pill-fail";
    }
  }

  function showNodeDetail(nodeId, v, eng) {
    if (!nodeDetailPanel) return;
    const isInput = v.tipo === "entrada";
    const valFormatted = Number(v.current_value).toLocaleString("es-AR", { maximumFractionDigits: 4 });
    const unitLabel = UnitRegistry.getUnitInfo(v.unidad).label || v.unidad;

    // Find if variable is output of an equation
    const eq = Object.values(eng.equations).find(e => e.output_var === nodeId);

    nodeDetailPanel.innerHTML = `
      <div class="node-inspector-card">
        <div class="inspector-header">
          <span class="inspector-sym">${v.simbolo}</span>
          <span class="var-badge ${isInput ? 'badge-input' : 'badge-calc'}">${isInput ? 'ENTRADA' : 'CALCULADA'}</span>
          <button class="btn-close-inspector" onclick="this.closest('.node-inspector-card').remove()">&times;</button>
        </div>
        <div class="inspector-desc">${v.descripcion}</div>
        <div class="inspector-val">
          <span class="val-num">${valFormatted}</span>
          <span class="val-unit">${unitLabel}</span>
        </div>
        ${eq ? `
          <div class="inspector-formula">
            <div class="lbl">Ecuación gobernante: <strong>${eq.nombre}</strong></div>
            <div class="math-eq">$$${eq.latex_formula}$$</div>
          </div>
        ` : ""}
        ${v.fuente ? `<div class="inspector-source"><i class="fa-solid fa-tag"></i> Fuente: ${v.fuente}</div>` : ""}
      </div>
    `;

    if (window.renderMathInElement) {
      window.renderMathInElement(nodeDetailPanel, {
        delimiters: [{ left: "$$", right: "$$", display: true }]
      });
    }
  }

  // Synchronize YAML Editor textarea
  function syncYamlEditor() {
    if (!yamlEditorTextarea) return;
    const yamlStr = jsyamlDump(engine.project);
    yamlEditorTextarea.value = yamlStr;
  }

  // Simple clean YAML dumper for client-side without bulky external parser
  function jsyamlDump(obj) {
    let out = `# Proyecto de Memoria de Cálculo ECR\n`;
    out += `id: "${obj.id}"\n`;
    out += `title: "${obj.title}"\n`;
    out += `discipline: "${obj.discipline}"\n`;
    out += `standard: "${obj.standard}"\n`;
    out += `author: "${obj.author}"\n`;
    out += `project: "${obj.project}"\n`;
    out += `revision: "${obj.revision}"\n`;
    out += `date: "${obj.date}"\n`;
    out += `description: "${obj.description}"\n\n`;

    out += `assumptions:\n`;
    (obj.assumptions || []).forEach(a => {
      out += `  - id: "${a.id}"\n`;
      out += `    desc: "${a.desc}"\n`;
    });

    out += `\nvariables:\n`;
    Object.values(obj.variables).forEach(v => {
      out += `  - id: "${v.id}"\n`;
      out += `    simbolo: "${v.simbolo}"\n`;
      out += `    descripcion: "${v.descripcion}"\n`;
      out += `    tipo: "${v.tipo}"\n`;
      if (v.tipo === "entrada") {
        out += `    valor: ${v.valor !== undefined ? v.valor : v.current_value}\n`;
      }
      out += `    unidad: "${v.unidad}"\n`;
      if (v.fuente) out += `    fuente: "${v.fuente}"\n`;
    });

    out += `\nequations:\n`;
    (obj.equations || []).forEach(eq => {
      out += `  - id: "${eq.id}"\n`;
      out += `    nombre: "${eq.nombre}"\n`;
      out += `    latex_formula: "${eq.latex_formula.replace(/\\/g, "\\\\")}"\n`;
      out += `    expresion: "${eq.expresion}"\n`;
      out += `    output_var: "${eq.output_var}"\n`;
      out += `    output_unit: "${eq.output_unit}"\n`;
    });

    out += `\nchecks:\n`;
    (obj.checks || []).forEach(c => {
      out += `  - id: "${c.id}"\n`;
      out += `    descripcion: "${c.descripcion}"\n`;
      out += `    lhs_var: "${c.lhs_var}"\n`;
      out += `    op: "${c.op}"\n`;
      if (c.rhs_var) out += `    rhs_var: "${c.rhs_var}"\n`;
      if (c.rhs_val !== undefined) out += `    rhs_val: ${c.rhs_val}\n`;
      if (c.norma) out += `    norma: "${c.norma}"\n`;
    });

    return out;
  }

  function parseAndRunYaml() {
    if (!yamlEditorTextarea) return;
    const rawYaml = yamlEditorTextarea.value;
    try {
      // Basic YAML line parser for ECR project structures
      const lines = rawYaml.split("\n");
      const project = {
        id: "custom_project",
        title: "Proyecto Personalizado YAML",
        discipline: "Ingeniería Industrial",
        standard: "ASME / DIN / ISO",
        author: "Usuario ECR",
        project: "Cálculo en Vivo",
        revision: "Rev. 00",
        date: new Date().toISOString().split("T")[0],
        description: "Proyecto evaluado en tiempo real desde el editor YAML.",
        assumptions: [],
        variables: [],
        equations: [],
        checks: []
      };

      let currentSection = null;
      let currentItem = null;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;

        if (trimmed.startsWith("id:")) project.id = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("title:")) project.title = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("discipline:")) project.discipline = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("standard:")) project.standard = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("author:")) project.author = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("project:")) project.project = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("revision:")) project.revision = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("date:")) project.date = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed.startsWith("description:")) project.description = trimmed.split(":")[1].trim().replace(/['"]/g, "");
        else if (trimmed === "assumptions:") currentSection = "assumptions";
        else if (trimmed === "variables:") currentSection = "variables";
        else if (trimmed === "equations:") currentSection = "equations";
        else if (trimmed === "checks:") currentSection = "checks";
        else if (trimmed.startsWith("- id:")) {
          currentItem = { id: trimmed.split(":")[1].trim().replace(/['"]/g, "") };
          if (currentSection) project[currentSection].push(currentItem);
        } else if (currentItem) {
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx > 0) {
            const k = trimmed.substring(0, colonIdx).trim();
            let v = trimmed.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
            if (!isNaN(Number(v)) && k !== "latex_formula" && k !== "expresion" && k !== "id") {
              v = Number(v);
            }
            currentItem[k] = v;
          }
        }
      });

      if (project.variables.length === 0) {
        alert("El YAML no contiene una lista válida de 'variables'.");
        return;
      }

      engine = new EcrEngine(project);
      recalculateAll();
      alert("¡Proyecto YAML recalculado y verificado exitosamente!");
      document.querySelector('[data-tab="tab-memoria"]')?.click();
    } catch (err) {
      alert("Error procesando YAML: " + err.message);
    }
  }

  function exportYamlFile() {
    const yamlStr = jsyamlDump(engine.project);
    const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memoria_calculo_${engine.project.id}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportLatexFile() {
    const p = engine.project;
    let tex = `% Memoria de Cálculo - ${p.title}\n`;
    tex += `\\documentclass[11pt,a4paper]{article}\n`;
    tex += `\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath,amssymb}\n`;
    tex += `\\title{${p.title}}\n\\author{${p.author}}\n\\date{${p.date}}\n\\begin{document}\n\\maketitle\n\n`;
    tex += `\\section{Hipótesis de Diseño}\n\\begin{itemize}\n`;
    (p.assumptions || []).forEach(a => {
      tex += `  \\item [${a.id}] ${a.desc}\n`;
    });
    tex += `\\end{itemize}\n\n\\section{Desarrollo de Ecuaciones}\n`;
    engine.executionOrder.forEach(eqId => {
      const eq = engine.equations[eqId];
      tex += `\\subsection{${eq.nombre}}\n\\[ ${eq.latex_formula} \\]\n`;
    });
    tex += `\\end{document}\n`;

    const blob = new Blob([tex], { type: "application/x-latex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memoria_calculo_${engine.project.id}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Web CLI Terminal Emulator
  if (cliTerminalInput) {
    cliTerminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = cliTerminalInput.value.trim();
        cliTerminalInput.value = "";
        executeCliCommand(cmd);
      }
    });
  }

  function appendCliMessage(text, type = "normal") {
    if (!cliTerminalOutput) return;
    const line = document.createElement("div");
    line.className = `cli-line cli-${type}`;
    line.textContent = text;
    cliTerminalOutput.appendChild(line);
    cliTerminalOutput.scrollTop = cliTerminalOutput.scrollHeight;
  }

  function executeCliCommand(cmd) {
    appendCliMessage(`$ ${cmd}`, "user");
    const parts = cmd.split(" ").filter(p => p.length > 0);
    const root = parts[0]?.toLowerCase() || "";

    switch (root) {
      case "help":
        appendCliMessage("Comandos disponibles de ecr CLI:", "info");
        appendCliMessage("  ecr demo [torsion|steam|pressure|pumping]  : Cargar un proyecto industrial", "sys");
        appendCliMessage("  ecr calculate                              : Ejecutar cálculo en orden topológico", "sys");
        appendCliMessage("  ecr check                                  : Verificar tolerancias y factores de seguridad", "sys");
        appendCliMessage("  ecr report                                 : Ver resumen de memoria de cálculo", "sys");
        appendCliMessage("  ecr vars                                   : Listar tabla de variables del proyecto", "sys");
        appendCliMessage("  ecr graph                                  : Mostrar niveles y dependencias del DAG", "sys");
        appendCliMessage("  ecr units [convert <val> <from> <to>]      : Convertidor dimensional SI", "sys");
        appendCliMessage("  clear                                      : Limpiar la pantalla de la terminal", "sys");
        break;

      case "clear":
        cliTerminalOutput.innerHTML = "";
        break;

      case "demo":
      case "ecr":
        handleEcrCommand(parts.slice(root === "ecr" ? 1 : 0));
        break;

      default:
        appendCliMessage(`Comando no reconocido: '${cmd}'. Escribí 'help' para ver las opciones disponibles.`, "error");
        break;
    }
  }

  function handleEcrCommand(args) {
    const sub = args[0]?.toLowerCase();
    if (!sub || sub === "help") {
      executeCliCommand("help");
      return;
    }

    if (sub === "demo") {
      const which = args[1]?.toLowerCase();
      let key = "mechanical_torsion";
      if (which === "steam") key = "steam_pipe_sizing";
      else if (which === "pressure") key = "pressure_vessel_asme";
      else if (which === "pumping") key = "pumping_head_loss";

      if (ECR_PRESETS[key]) {
        loadPreset(key);
        if (presetSelect) presetSelect.value = key;
        appendCliMessage(`[OK] Preset cargado: ${ECR_PRESETS[key].title}`, "success");
      } else {
        appendCliMessage(`Preset desconocido. Opciones: torsion, steam, pressure, pumping`, "error");
      }
    } else if (sub === "calculate") {
      engine.calculate();
      recalculateAll();
      appendCliMessage(`[OK] Proyecto recalculado en orden topológico sin ciclos.`, "success");
      engine.executionOrder.forEach((eqId, i) => {
        const eq = engine.equations[eqId];
        const v = engine.variables[eq.output_var];
        appendCliMessage(`  Paso ${i+1}: ${eq.nombre} -> ${v.simbolo} = ${v.current_value.toFixed(3)} ${v.unidad}`, "info");
      });
    } else if (sub === "check") {
      engine.calculate();
      updateChecksBadge();
      appendCliMessage(`--- Verificación de Criterios de Diseño ---`, "info");
      engine.checks.forEach(chk => {
        const tag = chk.is_pass ? "[APROBADO]" : "[RECHAZADO]";
        const clr = chk.is_pass ? "success" : "error";
        appendCliMessage(`  ${tag} ${chk.descripcion} (FS = ${chk.safety_factor.toFixed(2)}, Margen = ${chk.margin_pct.toFixed(1)}%)`, clr);
      });
    } else if (sub === "vars") {
      appendCliMessage(`--- Variables del Proyecto ---`, "info");
      Object.values(engine.variables).forEach(v => {
        appendCliMessage(`  ${v.simbolo.padEnd(16)} = ${String(v.current_value).padEnd(12)} [${v.unidad.padEnd(8)}] (${v.tipo})`, "sys");
      });
    } else if (sub === "graph") {
      engine.buildGraphAndSort();
      appendCliMessage(`--- Grafo de Dependencias (DAG) ---`, "info");
      appendCliMessage(`  Nodos: ${engine.graph.nodes.length} | Aristas: ${engine.graph.edges.length}`, "info");
      appendCliMessage(`  Orden de Ejecución Topológico: ${engine.executionOrder.join(" -> ")}`, "sys");
    } else if (sub === "units") {
      if (args[1] === "convert" && args.length >= 5) {
        const val = parseFloat(args[2]);
        const fromU = args[3];
        const toU = args[4];
        const res = UnitRegistry.convert(val, fromU, toU);
        appendCliMessage(`${val} ${fromU} = ${res.toFixed(4)} ${toU}`, "success");
      } else {
        appendCliMessage("Uso: ecr units convert <valor> <origen> <destino>", "info");
        appendCliMessage("Ejemplo: ecr units convert 100 psi bar", "sys");
      }
    } else {
      appendCliMessage(`Subcomando ecr '${sub}' no reconocido.`, "error");
    }
  }

  // Initial calculation and load
  loadPreset(currentPresetKey);
  appendCliMessage("BOXI ECR Terminal v2.0.0 iniciada. Escribí 'help' para comenzar.", "sys");
});
