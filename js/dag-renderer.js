/**
 * engineering-calculation-report (ECR) - DAG Dependency Graph Renderer
 * Renders an interactive SVG Directed Acyclic Graph showing calculation dependencies,
 * execution levels, variable types, and values.
 */

class DagRenderer {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    this.options = {
      nodeWidth: 150,
      nodeHeight: 65,
      levelSpacing: 210,
      nodeSpacing: 95,
      padding: 40,
      ...options
    };
    this.selectedNode = null;
    this.hoveredNode = null;
    this.onNodeClick = null;
  }

  render(engine) {
    if (!this.container) return;
    this.engine = engine;
    this.container.innerHTML = "";

    const { nodes, edges } = engine.graph;
    if (!nodes || nodes.length === 0) {
      this.container.innerHTML = `<div class="dag-empty">No hay variables ni dependencias para graficar en este proyecto.</div>`;
      return;
    }

    // 1. Calculate topological levels (ranks) for each node
    const levels = {};
    const inEdges = {};
    const outEdges = {};

    nodes.forEach(n => {
      levels[n.id] = 0;
      inEdges[n.id] = [];
      outEdges[n.id] = [];
    });

    edges.forEach(e => {
      if (inEdges[e.to]) inEdges[e.to].push(e.from);
      if (outEdges[e.from]) outEdges[e.from].push(e.to);
    });

    // Compute levels iteratively (longest path from sources)
    let changed = true;
    let iterations = 0;
    while (changed && iterations < nodes.length * 2) {
      changed = false;
      iterations++;
      edges.forEach(e => {
        const sourceLvl = levels[e.from] || 0;
        if (levels[e.to] <= sourceLvl) {
          levels[e.to] = sourceLvl + 1;
          changed = true;
        }
      });
    }

    // 2. Group nodes by level
    const maxLevel = Math.max(...Object.values(levels), 0);
    const levelColumns = Array.from({ length: maxLevel + 1 }, () => []);

    nodes.forEach(n => {
      const lvl = levels[n.id];
      levelColumns[lvl].push(n);
    });

    // 3. Compute coordinates
    const { nodeWidth, nodeHeight, levelSpacing, nodeSpacing, padding } = this.options;
    const maxNodesInCol = Math.max(...levelColumns.map(col => col.length));
    const totalHeight = Math.max(480, maxNodesInCol * (nodeHeight + nodeSpacing) + padding * 2);
    const totalWidth = Math.max(760, (maxLevel + 1) * levelSpacing + padding * 2);

    const positions = {};
    levelColumns.forEach((col, colIdx) => {
      const colX = padding + colIdx * levelSpacing;
      const colHeight = col.length * (nodeHeight + nodeSpacing) - nodeSpacing;
      const startY = (totalHeight - colHeight) / 2;

      col.forEach((node, rowIdx) => {
        positions[node.id] = {
          x: colX,
          y: startY + rowIdx * (nodeHeight + nodeSpacing),
          level: colIdx
        };
      });
    });

    // 4. Construct SVG DOM
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
    svg.setAttribute("class", "ecr-dag-svg");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.minHeight = "460px";

    // Defs: markers and filters
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
      </marker>
      <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0.5 L 10 5 L 0 9.5 z" fill="#00e5ff" />
      </marker>
      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00e5ff" flood-opacity="0.35"/>
      </filter>
      <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#ffb74d" flood-opacity="0.35"/>
      </filter>
      <filter id="shadow-card" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    `;
    svg.appendChild(defs);

    // Grid / Level guides
    const guidesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    guidesGroup.setAttribute("class", "dag-guides");
    levelColumns.forEach((_, colIdx) => {
      const colX = padding + colIdx * levelSpacing + nodeWidth / 2;
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", colX);
      text.setAttribute("y", 22);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "dag-level-label");
      text.textContent = colIdx === 0 ? "ENTRADAS" : `NIVEL DE CÁLCULO ${colIdx}`;
      guidesGroup.appendChild(text);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", colX);
      line.setAttribute("y1", 30);
      line.setAttribute("x2", colX);
      line.setAttribute("y2", totalHeight - 15);
      line.setAttribute("class", "dag-column-line");
      guidesGroup.appendChild(line);
    });
    svg.appendChild(guidesGroup);

    // Edges Group
    const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    edgesGroup.setAttribute("class", "dag-edges");

    const edgeElements = [];
    edges.forEach(e => {
      const p1 = positions[e.from];
      const p2 = positions[e.to];
      if (!p1 || !p2) return;

      const startX = p1.x + nodeWidth;
      const startY = p1.y + nodeHeight / 2;
      const endX = p2.x;
      const endY = p2.y + nodeHeight / 2;

      // Smooth cubic bezier
      const dx = Math.abs(endX - startX) * 0.55;
      const d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "dag-edge");
      path.setAttribute("marker-end", "url(#arrow-normal)");
      path.dataset.from = e.from;
      path.dataset.to = e.to;

      edgesGroup.appendChild(path);
      edgeElements.push({ path, from: e.from, to: e.to });
    });
    svg.appendChild(edgesGroup);

    // Nodes Group
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "dag-nodes");

    nodes.forEach(n => {
      const pos = positions[n.id];
      const v = engine.variables[n.id];
      const isInput = v.tipo === "entrada";
      const valStr = v.current_value !== null && v.current_value !== undefined 
        ? (Number(v.current_value).toLocaleString("es-AR", { maximumFractionDigits: 3 })) 
        : "--";
      const unitLabel = v.unidad ? (UnitRegistry.getUnitInfo(v.unidad).label || v.unidad) : "";

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `dag-node ${isInput ? "node-input" : "node-calc"}`);
      g.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
      g.dataset.id = n.id;
      g.style.cursor = "pointer";

      // Card Background
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", nodeWidth);
      rect.setAttribute("height", nodeHeight);
      rect.setAttribute("rx", "8");
      rect.setAttribute("class", "node-box");
      rect.setAttribute("filter", "url(#shadow-card)");
      g.appendChild(rect);

      // Status indicator pill
      const pill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      pill.setAttribute("x", "0");
      pill.setAttribute("y", "0");
      pill.setAttribute("width", "5");
      pill.setAttribute("height", nodeHeight);
      pill.setAttribute("rx", "2");
      pill.setAttribute("class", `node-strip ${isInput ? "strip-cyan" : "strip-amber"}`);
      g.appendChild(pill);

      // Header: Symbol + Type Tag
      const symText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      symText.setAttribute("x", "14");
      symText.setAttribute("y", "20");
      symText.setAttribute("class", "node-symbol");
      symText.textContent = v.simbolo;
      g.appendChild(symText);

      const tagText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tagText.setAttribute("x", nodeWidth - 10);
      tagText.setAttribute("y", "20");
      tagText.setAttribute("text-anchor", "end");
      tagText.setAttribute("class", `node-tag ${isInput ? "tag-cyan" : "tag-amber"}`);
      tagText.textContent = isInput ? "ENTRADA" : "CALCULADA";
      g.appendChild(tagText);

      // Body: Value & Unit
      const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valText.setAttribute("x", "14");
      valText.setAttribute("y", "44");
      valText.setAttribute("class", "node-value");
      valText.textContent = `${valStr} ${unitLabel}`.trim();
      g.appendChild(valText);

      // Tooltip / Description subtitle
      const descText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      descText.setAttribute("x", "14");
      descText.setAttribute("y", "57");
      descText.setAttribute("class", "node-desc");
      const shortDesc = v.descripcion.length > 20 ? v.descripcion.substring(0, 19) + "…" : v.descripcion;
      descText.textContent = shortDesc;
      g.appendChild(descText);

      // Mouse Events: Highlight dependencies on hover
      g.addEventListener("mouseenter", () => {
        this.highlightNodeDependencies(n.id, edgeElements, nodesGroup);
      });

      g.addEventListener("mouseleave", () => {
        this.resetHighlights(edgeElements, nodesGroup);
      });

      g.addEventListener("click", () => {
        if (this.onNodeClick) {
          this.onNodeClick(n.id, v, engine);
        }
      });

      nodesGroup.appendChild(g);
    });

    svg.appendChild(nodesGroup);
    this.container.appendChild(svg);
  }

  highlightNodeDependencies(nodeId, edgeElements, nodesGroup) {
    const connectedEdges = [];
    const connectedNodes = new Set([nodeId]);

    // Find incoming and outgoing edges
    edgeElements.forEach(e => {
      if (e.from === nodeId) {
        connectedNodes.add(e.to);
        connectedEdges.push(e);
      }
      if (e.to === nodeId) {
        connectedNodes.add(e.from);
        connectedEdges.push(e);
      }
    });

    // Dim all
    nodesGroup.querySelectorAll(".dag-node").forEach(nodeEl => {
      const id = nodeEl.dataset.id;
      if (connectedNodes.has(id)) {
        nodeEl.classList.add("node-highlighted");
        nodeEl.classList.remove("node-dimmed");
      } else {
        nodeEl.classList.add("node-dimmed");
        nodeEl.classList.remove("node-highlighted");
      }
    });

    edgeElements.forEach(e => {
      if (connectedEdges.includes(e)) {
        e.path.classList.add("edge-highlighted");
        e.path.setAttribute("marker-end", "url(#arrow-active)");
      } else {
        e.path.classList.add("edge-dimmed");
      }
    });
  }

  resetHighlights(edgeElements, nodesGroup) {
    nodesGroup.querySelectorAll(".dag-node").forEach(nodeEl => {
      nodeEl.classList.remove("node-highlighted", "node-dimmed");
    });
    edgeElements.forEach(e => {
      e.path.classList.remove("edge-highlighted", "edge-dimmed");
      e.path.setAttribute("marker-end", "url(#arrow-normal)");
    });
  }
}

if (typeof window !== "undefined") {
  window.DagRenderer = DagRenderer;
}
