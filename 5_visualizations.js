// ===================================================================================
// 5_VISUALIZATIONS.JS
// ===================================================================================


/**
 * @file 5_VISUALIZATIONS.JS - The Graphical Rendering Engine
 * @description
 * This file acts as the specialized visualization core of the application. It 
 * translates numerical estimation data into intuitive, proportional graphical 
 * elements, specifically bubble charts and stacked bar visualizations.
 * * 
 *
 * <br><b>Core Responsibilities:</b>
 * <ul>
 * <li><b>Proportional Logic:</b> Calculates the diameter and positioning of 
 * circles based on the relative sizing metrics (Complexity, Effort, Doubt) 
 * to ensure visual accuracy across the backlog.</li>
 * <li><b>Job Size Visualization:</b> Implements the logic to render the 
 * three-circle bubble component, representing the total 'Job Size' as 
 * a sum of its parts.</li>
 * <li><b>Cost of Delay (CoD) Charts:</b> Orchestrates the rendering of 
 * stacked bubble visualizations that represent Business Value, Time 
 * Criticality, and Risk Reduction/Opportunity Enablement.</li>
 * <li><b>SVG Generation:</b> Dynamically creates and injects SVG elements 
 * or highly styled DIV structures into the DOM for high-fidelity 
 * rendering.</li>
 * <li><b>Placeholder Management:</b> Defines the visual state for 
 * "incomplete" data, rendering grayed-out or empty state visualizations 
 * when mandatory metrics are missing.</li>
 * </ul>
 *
 * <br><b>Technical Approach:</b>
 * This module leverages <b>mathematical scaling</b> to normalize input values 
 * against the available screen space, ensuring that even extremely large 
 * or small estimates remain legible and comparable within the UI.
 */


// ===================================================================================
// VISUALIZATION CORE FUNCTIONS
// ===================================================================================


/* ==== Bubble Cluster Options (configurable) ====
   - paddingPx: default gap in px between bubbles AND to the container wall.
                Can be overridden via CSS custom property set on :root (or any ancestor):
                  :root { --bubble-gap: 4px; }
                Use 'paddingCssVar' to choose the CSS name.
   - edgePair: which two bubbles must touch the container wall:
       'largest' | 'KA' | 'KU' | 'AU' | 'random'
   - paddingCssVar: CSS custom property name to read (if present), e.g. '--bubble-gap'
*/

window.BUBBLE_CLUSTER_OPTS = window.BUBBLE_CLUSTER_OPTS || {
  paddingPx: 2,
  edgePair: 'largest',
  paddingCssVar: '--bubble-gap'
};


/**
 * Public API: Updates the configuration for the Bubble Cluster visualization at runtime.
 * <br><b>Architecture (Global Interface):</b>
 * This function is explicitly attached to the global `window` object. This allows external scripts, browser extensions, 
 * or the developer (via the browser console) to tweak visualization settings dynamically without needing access to the internal application scope.
 * <br><b>Merge Logic (Shallow Update):</b>
 * It uses <code>Object.assign</code> to merge the provided `opts` into the existing global `window.BUBBLE_CLUSTER_OPTS`.
 * <b>Benefit:</b> This allows for "Partial Updates". You can pass an object intended to change only a single property 
 * (e.g., <code>{ maxRadius: 50 }</code>), and all other existing configuration values (colors, physics, etc.) remain intact.
 * <br><b>Safety:</b>
 * Includes a validation check <code>(opts && typeof opts === 'object')</code> to ensure the input is valid before attempting the merge, 
 * preventing crashes if called with `null` or non-object primitives.
 *
 * @param {Object} opts - A partial configuration object containing the specific settings to override.
 */
window.setBubbleClusterOptions = function setBubbleClusterOptions(opts){
  if (opts && typeof opts === 'object') Object.assign(window.BUBBLE_CLUSTER_OPTS, opts);
};


/**
 * Internal Helper: Retrieves the current padding/gap value to be used between bubbles in the cluster simulation.
 * <br><b>Architecture (CSS-in-JS Bridge):</b>
 * This function allows the physics simulation to respect the application's global styling system.
 * Instead of hardcoding pixel values in JS, it attempts to read a dynamic CSS variable (Default: `--bubble-gap`) from the `:root` element.
 * This means changing the CSS variable in a stylesheet will automatically adjust the collision physics of the bubble chart.
 *
 * <br><b>Resolution Priority (The Fallback Chain):</b>
 * 1. <b>CSS Variable:</b> Tries to parse the value of `window.BUBBLE_CLUSTER_OPTS.paddingCssVar`.
 * 2. <b>JS Config:</b> If CSS parsing fails (or returns NaN), it falls back to `window.BUBBLE_CLUSTER_OPTS.paddingPx`.
 * 3. <b>Hardcoded Default:</b> If all else fails, returns `2` pixels.
 *
 * <br><b>Robustness:</b>
 * Wrapped in a `try-catch` block to safely handle environments where `getComputedStyle` might fail (e.g., during tests or inside detached iframes).
 *
 * @returns {number} The resolved padding in pixels as a finite number.
 */
function __bc_readPaddingPx(){
  try {
    const varName = window.BUBBLE_CLUSTER_OPTS.paddingCssVar || '--bubble-gap';
    const cssVal  = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (cssVal) {
      const n = parseFloat(cssVal);
      if (Number.isFinite(n)) return n;
    }
  } catch(e){}
  return Number(window.BUBBLE_CLUSTER_OPTS.paddingPx || 2);
}


/**
 * Internal Helper: Determines which two bubbles (indices) from a triplet should form the primary "docking edges".
 * <br><b>Geometry Concept (The Triplet Problem):</b>
 * When arranging three circles of varying sizes into a tight cluster, you generally fix the position of the third circle 
 * based on its tangency to the first two. This creates a triangle.
 * However, depending on the `mode`, we might prioritize different connections (edges) of this triangle:
 * <ul>
 * <li><b>KA (Komplexität vs. Aufwand):</b> Connects Index 0 and 1.</li>
 * <li><b>KU (Komplexität vs. Unsicherheit):</b> Connects Index 0 and 2.</li>
 * <li><b>AU (Aufwand vs. Unsicherheit):</b> Connects Index 1 and 2.</li>
 * </ul>
 * <br><b>Dynamic Modes:</b>
 * <ul>
 * <li><b>'random':</b> Randomly selects one of the three pairs. This creates a more organic, less rigid cluster appearance.</li>
 * <li><b>Default (Size-Based Optimization):</b> If no specific mode is matched, it sorts the bubbles by size (Radius `rBase`) descending. 
 * It then selects the <b>two largest bubbles</b> to form the stable base. This is the most physically stable configuration (placing the small item in the "valley" between the two big ones).</li>
 * </ul>
 *
 * @param {string} mode - The layout strategy ('KA', 'KU', 'AU', 'random', or undefined).
 * @param {Array<number>} rBase - An array of radii for the three bubbles in the current group.
 * @returns {Array<number>} An array containing exactly two indices (e.g., `[0, 1]`) representing the selected edge pair.
 */
function __bc_selectEdgePair(mode, rBase){
  if (mode === 'KA') return [0,1];
  if (mode === 'KU') return [0,2];
  if (mode === 'AU') return [1,2];
  if (mode === 'random') {
    const pairs = [[0,1],[0,2],[1,2]];
    return pairs[Math.floor(Math.random()*pairs.length)];
  }
  return [0,1,2].sort((a,b)=>rBase[b]-rBase[a]).slice(0,2);
}


/**
 * Renders a fallback "Progress Pie" visualization for items that are not yet fully estimated.
 * <br><b>Concept (Gamification):</b>
 * Instead of showing a broken or empty Bubble Cluster, this function displays a circular progress indicator.
 * It visualizes how "complete" the estimation is:
 * <ul>
 * <li><b>1/3 Filled:</b> Only 1 value set (e.g., Complexity).</li>
 * <li><b>2/3 Filled:</b> 2 values set.</li>
 * <li><b>Full Circle:</b> (Ideally transitions to the real bubble visualization, but serves as 3/3 state here).</li>
 * </ul>
 * <br><b>SVG Geometry:</b>
 * - <b>ViewBox:</b> Centered at `(0,0)` with dynamic padding.
 * - <b>Arc Calculation:</b> Uses trigonometry (`Math.cos`, `Math.sin`) to draw a slice of the pie starting from 12 o'clock (-90 degrees) and spanning `valueCount * 120` degrees.
 * - <b>Styling:</b> Pulls colors dynamically from CSS variables (`--color-total`, `--border-color`) to match the current theme (Dark/Light mode).
 *
 * @param {Object} pbi - The Backlog Item being rendered.
 * @param {HTMLElement} wrapper - The DOM element where the SVG will be injected.
 */
function createPlaceholderVisualization(pbi, wrapper) {
    var R_OUTER = (3 * 15) / 2; 
    function getCssVar(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    var valueCount = 0;
    if (pbi.complexity > 0) valueCount++;
    if (pbi.effort > 0) valueCount++;
    if (pbi.doubt > 0) valueCount++;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    var size = Math.ceil(2 * (R_OUTER + 20));
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', [-R_OUTER - 20, -R_OUTER - 20, 2 * (R_OUTER + 20), 2 * (R_OUTER + 20)].join(' '));

    var outerCircleBG = document.createElementNS(NS, 'circle');
    outerCircleBG.setAttribute('cx', 0);
    outerCircleBG.setAttribute('cy', 0);
    outerCircleBG.setAttribute('r', R_OUTER + 10);
    outerCircleBG.setAttribute('fill', getCssVar('--color-total'));
    svg.appendChild(outerCircleBG);

    if (valueCount > 0) {
        var angle = valueCount * 120; 
        var r = R_OUTER + 5; 
        var radiansEnd = (angle - 90) * Math.PI / 180;

        var xEnd = r * Math.cos(radiansEnd);
        var yEnd = r * Math.sin(radiansEnd);
        var largeArcFlag = angle > 180 ? 1 : 0;

        var path = document.createElementNS(NS, 'path');
        var d = "M 0,0 L 0,-" + r + " A " + r + "," + r + " 0 " + largeArcFlag + ",1 " + xEnd + "," + yEnd + " z";
        path.setAttribute('d', d);
        path.setAttribute('fill', getCssVar('--border-color')); 
        svg.appendChild(path);
    }

    var outerCircleStroke = document.createElementNS(NS, 'circle');
    outerCircleStroke.setAttribute('cx', 0);
    outerCircleStroke.setAttribute('cy', 0);
    outerCircleStroke.setAttribute('r', R_OUTER + 5);
    outerCircleStroke.setAttribute('fill', 'none');
    outerCircleStroke.setAttribute('stroke', getCssVar('--outer-stroke-color'));
    outerCircleStroke.setAttribute('stroke-width', '2');
    svg.appendChild(outerCircleStroke);

    wrapper.dataset.size = R_OUTER;
    wrapper.prepend(svg);
}


/**
 * Renders a fallback "Progress Pie" visualization specifically for the Cost of Delay (CoD) estimation status.
 * <br><b>Context (The "Other Half" of WSJF):</b>
 * While `createPlaceholderVisualization` handles the Job Size (Denominator), this function visualizes the Cost of Delay (Numerator).
 * WSJF requires both sides to be complete. This visual indicator helps users identify which PBI is missing CoD values at a glance.
 *
 * <br><b>Business Logic (Triangulation):</b>
 * Checks for the presence of the three sub-values defined in the SAFe WSJF model:
 * <ul>
 * <li><b>BV:</b> User-Business Value (`pbi.cod_bv`)</li>
 * <li><b>TC:</b> Time Criticality (`pbi.cod_tc`)</li>
 * <li><b>RR/OE:</b> Risk Reduction / Opportunity Enablement (`pbi.cod_rroe`)</li>
 * </ul>
 *
 * <br><b>Visual Feedback Loop:</b>
 * The pie chart fills up by 120 degrees for each non-zero component found.
 * <ul>
 * <li>0/3: Empty circle (Background color only).</li>
 * <li>1/3: 120° slice (Start of estimation).</li>
 * <li>2/3: 240° slice (Almost done).</li>
 * <li>3/3: Full circle (Ready for calculation).</li>
 * </ul>
 *
 * <br><b>Technical details:</b>
 * Uses the exact same SVG geometry and dynamic CSS variable styling (`--color-total`, `--outer-stroke-color`) as the Job Size visualization
 * to maintain UI consistency.
 *
 * @param {Object} pbi - The Backlog Item containing the CoD metrics.
 * @param {HTMLElement} wrapper - The container where the SVG will be prepended.
 */
function createCodPlaceholderVisualization(pbi, wrapper) {
    var R_OUTER = (3 * 15) / 2; 

    function getCssVar(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    var valueCount = 0;
    if (pbi.cod_bv > 0) valueCount++;
    if (pbi.cod_tc > 0) valueCount++;
    if (pbi.cod_rroe > 0) valueCount++;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    var size = Math.ceil(2 * (R_OUTER + 20));
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', [-R_OUTER - 20, -R_OUTER - 20, 2 * (R_OUTER + 20), 2 * (R_OUTER + 20)].join(' '));

    var outerCircleBG = document.createElementNS(NS, 'circle');
    outerCircleBG.setAttribute('cx', 0);
    outerCircleBG.setAttribute('cy', 0);
    outerCircleBG.setAttribute('r', R_OUTER + 10);
    outerCircleBG.setAttribute('fill', getCssVar('--color-total'));
    svg.appendChild(outerCircleBG);


    if (valueCount > 0) {
        var angle = valueCount * 120; 
        var r = R_OUTER + 5;
        var radiansEnd = (angle - 90) * Math.PI / 180;

        var xEnd = r * Math.cos(radiansEnd);
        var yEnd = r * Math.sin(radiansEnd);
        var largeArcFlag = angle > 180 ? 1 : 0;

        var path = document.createElementNS(NS, 'path');
        var d = "M 0,0 L 0,-" + r + " A " + r + "," + r + " 0 " + largeArcFlag + ",1 " + xEnd + "," + yEnd + " z";
        path.setAttribute('d', d);
        path.setAttribute('fill', getCssVar('--border-color')); 
        svg.appendChild(path);
    }

    var outerCircleStroke = document.createElementNS(NS, 'circle');
    outerCircleStroke.setAttribute('cx', 0);
    outerCircleStroke.setAttribute('cy', 0);
    outerCircleStroke.setAttribute('r', R_OUTER + 5);
    outerCircleStroke.setAttribute('fill', 'none');
    outerCircleStroke.setAttribute('stroke', getCssVar('--outer-stroke-color'));
    outerCircleStroke.setAttribute('stroke-width', '2');
    svg.appendChild(outerCircleStroke);

    wrapper.dataset.size = R_OUTER;
    wrapper.prepend(svg);
}


/**
 * Renders the primary "Bubble Cluster" visualization for a fully estimated Backlog Item.
 * <br><b>Visual Metaphor (Area Representation):</b>
 * Represents the three dimensions of work (Complexity, Effort, Doubt) as circles packed tightly together.
 * Crucially, the <i>Area</i> of each circle corresponds to the numeric value. Therefore, the radius is calculated as the square root of the value (`Math.sqrt(v)`).
 *
 * <br><b>The Geometric Problem (Circle Packing):</b>
 * The function solves a constraint problem: "How can I fit three specific circles (A, B, C) into a bounding circle of a fixed size (`R_OUTER`), maintaining a specific padding between them?"
 * 
 *
 * <br><b>Algorithm Step-by-Step:</b>
 * 1. <b>Edge Pair Selection:</b> Uses `__bc_selectEdgePair` to decide which two circles form the "base" of the cluster.
 * 2. <b>Iterative Layout Solver:</b>
 * - It iterates through a range of opening angles (`phi` from 70° to 160°).
 * - For each angle, it performs a <b>Binary Search</b> (`getScale`) to find the maximum possible scaling factor that allows the circles to fit without overlapping the outer boundary or each other.
 * - It keeps the layout configuration (`bestLayout`) that results in the largest possible bubbles (highest `scale`).
 * 3. <b>Intersection Calculation:</b> Uses `getIntersections` (Circle-Circle Intersection) to mathematically determine the coordinates where the third circle must be placed to touch the first two.
 * 

[Image of intersection of two circles formula]

 *
 * <br><b>Rendering Details:</b>
 * - <b>SVG Generation:</b> Dynamically creates an SVG element.
 * - <b>Styling:</b> Colors are pulled from CSS variables (`--color-complexity`, etc.) to support theming.
 * - <b>Text Centering:</b> Uses a `requestAnimationFrame` + `getBBox()` technique to perfectly center the numeric labels within their respective bubbles, accounting for different font rendering engines.
 *
 * @param {Object} pbi - The Backlog Item containing the estimation values.
 * @param {HTMLElement} wrapper - The DOM element to inject the visualization into.
 */
function createStoryVisualization(pbi, wrapper) {
    const PADDING = __bc_readPaddingPx();
    let R_OUTER = (pbi.jobSize * 15) / 2; 
    function getCssVar(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function getIntersections(p1, r1, p2, r2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const d = Math.hypot(dx, dy);
        const EPS = 1e-6;

        if (d < EPS || d > r1 + r2 + EPS || d < Math.abs(r1 - r2) - EPS) {
            return [];
        }

        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const h_sq = Math.max(0, r1 * r1 - a * a);
        const h = Math.sqrt(h_sq);

        const cx2 = p1.x + (a * dx) / d;
        const cy2 = p1.y + (a * dy) / d;

        const nx = -dy / d;
        const ny = dx / d;

        return [{
            x: cx2 + h * nx,
            y: cy2 + h * ny
        }, {
            x: cx2 - h * nx,
            y: cy2 - h * ny
        }, ];
    }

    const rawRadii = [pbi.complexity, pbi.effort, pbi.doubt]
        .map(v => Math.max(0, Number(v) || 0))
        .map(v => Math.sqrt(v));

    const edgePairIndices = __bc_selectEdgePair(
        window.BUBBLE_CLUSTER_OPTS.edgePair || 'largest',
        rawRadii
    );

    const idxA = edgePairIndices[0];
    const idxB = edgePairIndices[1];
    const idxC = [0, 1, 2].find(i => i !== idxA && i !== idxB);

    const rA_raw = rawRadii[idxA];
    const rB_raw = rawRadii[idxB];
    const rC_raw = rawRadii[idxC];

    function getScale(phi) {
        let low = 0;
        let high = (R_OUTER - PADDING) / Math.min(rA_raw, rB_raw) - 1e-6;
        const cos_phi = Math.cos(phi);

        for (let i = 0; i < 50; i++) {
            const mid = (low + high) / 2;
            const rA_ext = R_OUTER - mid * rA_raw - PADDING;
            const rB_ext = R_OUTER - mid * rB_raw - PADDING;

            const d_sq = Math.max(0, rA_ext * rA_ext + rB_ext * rB_ext - 2 * rA_ext * rB_ext * cos_phi);
            if (Math.sqrt(d_sq) > mid * (rA_raw + rB_raw) + PADDING) {
                low = mid;
            } else {
                high = mid;
            }
        }
        return (low + high) / 2;
    }

    function getLayout(phi) {
        const scale = getScale(phi);
        const rA = scale * rA_raw;
        const rB = scale * rB_raw;
        const rC = scale * rC_raw;

        const R_A_ext = R_OUTER - rA - PADDING;
        const R_B_ext = R_OUTER - rB - PADDING;

        const alpha_A = Math.PI / 2 - phi / 2;
        const alpha_B = Math.PI / 2 + phi / 2;

        const cA = { x: Math.cos(alpha_A) * R_A_ext, y: Math.sin(alpha_A) * R_A_ext };
        const cB = { x: Math.cos(alpha_B) * R_B_ext, y: Math.sin(alpha_B) * R_B_ext };

        const intersections = getIntersections(cA, rA + rC + PADDING, cB, rB + rC + PADDING);
        if (!intersections.length) return null;

        const cC = intersections.map(p => ({ p: p, d: Math.hypot(p.x, p.y) }))
            .sort((a, b) => a.d - b.d)[0].p;

        if (Math.hypot(cC.x, cC.y) + rC + PADDING > R_OUTER + 0.001) {
            return null;
        }

        return { s: scale, rA, rB, rC, cA, cB, cC, phi };
    }

    let bestLayout = null;
    for (let angle = 70; angle <= 160; angle += 0.5) {
        const layout = getLayout(angle * Math.PI / 180);
        if (layout && (!bestLayout || layout.s > bestLayout.s)) {
            bestLayout = layout;
        }
    }

    if (!bestLayout) {
        const phi = 120 * Math.PI / 180;
        const scale = getScale(phi) * 0.95;
        const rA = scale * rA_raw;
        const rB = scale * rB_raw;
        const rC = scale * rC_raw;
        const R_A_ext = R_OUTER - rA - PADDING;
        const R_B_ext = R_OUTER - rB - PADDING;
        const alpha_A = Math.PI / 2 - phi / 2;
        const alpha_B = Math.PI / 2 + phi / 2;
        const cA = { x: Math.cos(alpha_A) * R_A_ext, y: Math.sin(alpha_A) * R_A_ext };
        const cB = { x: Math.cos(alpha_B) * R_B_ext, y: Math.sin(alpha_B) * R_B_ext };
        const cC = getIntersections(cA, rA + rC + PADDING, cB, rB + rC + PADDING)[0] || { x: 0, y: 0 };
        bestLayout = { s: scale, rA, rB, rC, cA, cB, cC, phi };
    }

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    const size = Math.ceil(2 * (R_OUTER + 20));
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', [-R_OUTER - 20, -R_OUTER - 20, 2 * (R_OUTER + 20), 2 * (R_OUTER + 20)].join(' '));

    const outerCircleBG = document.createElementNS(NS, 'circle');
    outerCircleBG.setAttribute('cx', 0);
    outerCircleBG.setAttribute('cy', 0);
    outerCircleBG.setAttribute('r', R_OUTER + 10);
    outerCircleBG.setAttribute('fill', getCssVar('--color-total'));

    const outerCircleStroke = document.createElementNS(NS, 'circle');
    outerCircleStroke.setAttribute('cx', 0);
    outerCircleStroke.setAttribute('cy', 0);
    outerCircleStroke.setAttribute('r', R_OUTER + 5);
    outerCircleStroke.setAttribute('fill', 'none');
    outerCircleStroke.setAttribute('stroke', getCssVar('--outer-stroke-color'));
    outerCircleStroke.setAttribute('stroke-width', '2');

    svg.appendChild(outerCircleBG);
    svg.appendChild(outerCircleStroke);

    const radii = [];
    const centers = [];
    radii[idxA] = bestLayout.rA;
    radii[idxB] = bestLayout.rB;
    radii[idxC] = bestLayout.rC;
    centers[idxA] = bestLayout.cA;
    centers[idxB] = bestLayout.cB;
    centers[idxC] = bestLayout.cC;

    const fillColors = {
        0: getCssVar('--color-complexity'),
        1: getCssVar('--color-effort'),
        2: getCssVar('--color-doubt'),
    };
    
    const numberColors = {
        0: getCssVar('--circle-number-color-complexity'),
        1: getCssVar('--circle-number-color-effort'),
        2: getCssVar('--circle-number-color-doubt'),
    };

    const tooltipTexts = {
        0: config.uiStrings.legendComplexity,
        1: config.uiStrings.legendEffort,
        2: config.uiStrings.legendDoubt
    };

    const values = [pbi.complexity, pbi.effort, pbi.doubt];

    [0, 1, 2].sort((a, b) => radii[b] - radii[a]).forEach(idx => {
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', centers[idx].x);
        circle.setAttribute('cy', centers[idx].y);
        circle.setAttribute('r', radii[idx]);
        circle.setAttribute('fill', fillColors[idx]);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', radii[idx] > 0.5 ? '0.9' : '0');
        
        const tooltip = document.createElementNS(NS, 'title');
        tooltip.textContent = tooltipTexts[idx];
        circle.appendChild(tooltip);

        svg.appendChild(circle);

        const text = document.createElementNS(NS, 'text');
        text.style.fontFamily = '"Roboto Mono", ui-monospace, Menlo, monospace';
        text.style.fontVariantNumeric = 'tabular-nums lining-nums';
        text.style.fontFeatureSettings = '"tnum" 1, "lnum" 1';
        text.setAttribute('x', 0);
        text.setAttribute('y', 0);
        text.setAttribute('fill', numberColors[idx]); 
        text.setAttribute('font-weight', 'bold');
        text.style.pointerEvents = 'none'; 

        const valueStr = String(values[idx]);
        const baseFontSize = Math.max(12, radii[idx] / 2.5);
        const lengthAdjust = { 1: 1, 2: 1.25, 3: 1.35, 4: 1.45, 5: 1.55, 6: 1.65, 7: 1.75, 8: 1.85 }[valueStr.length] || 1;
        text.setAttribute('font-size', (baseFontSize * lengthAdjust) + 'px');
        text.textContent = valueStr;
        text.setAttribute('opacity', radii[idx] > 0.5 ? '1' : '0');
        svg.appendChild(text);

        const cx = centers[idx].x;
        const cy = centers[idx].y;

        const centerText = () => {
            const bbox = text.getBBox();
            text.setAttribute('text-anchor', 'start');
            text.removeAttribute('dominant-baseline');
            text.setAttribute('x', cx - (bbox.x + bbox.width / 2));
            text.setAttribute('y', cy - (bbox.y + bbox.height / 2));
        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => requestAnimationFrame(centerText));
        } else {
            requestAnimationFrame(centerText);
        }
    });

    wrapper.dataset.size = R_OUTER;
    wrapper.prepend(svg);

    if (window._equalizeGridRows) {
        requestAnimationFrame(function() {
            window._equalizeGridRows();
        });
    }
}


/**
 * Renders the "Bubble Cluster" visualization specifically for the Cost of Delay (CoD) components.
 * <br><b>Context (The Numerator):</b>
 * While `createStoryVisualization` renders the Job Size (Denominator), this function visualizes the Value (Numerator) of the WSJF equation.
 * It follows the Scaled Agile Framework (SAFe) model where CoD is the sum of three distinct value dimensions:
 * <ul>
 * <li><b>BV (Business Value):</b> Direct value to the user/business.</li>
 * <li><b>TC (Time Criticality):</b> Decay of value over time.</li>
 * <li><b>RR/OE (Risk Reduction / Opportunity Enablement):</b> Strategic value.</li>
 * </ul>
 *
 * <br><b>Algorithmic Symmetry:</b>
 * It reuses the exact same <b>Iterative Layout Solver</b> logic as the Job Size visualization to ensure visual consistency:
 * 1. <b>Normalization:</b> Converts raw values into radii (`Math.sqrt(value)`).
 * 2. <b>Binary Search:</b> Finds the optimal scale to fit the bubbles into the container.
 * 3. <b>Geometry:</b> Uses circle intersections to calculate the precise coordinates `(x, y)` for the three bubbles.
 *
 * <br><b>Styling Differentiation:</b>
 * While the geometry is identical, the coloring is distinct. It pulls from a different set of CSS variables (`--color-bv`, `--color-tc`, `--color-rroe`) 
 * to allow the user to visually distinguish between "Effort" (Job Size) and "Value" (CoD) at a glance.
 *
 * @param {Object} pbi - The Backlog Item containing the CoD metrics.
 * @param {HTMLElement} wrapper - The DOM element where the visualization will be injected.
 */
function createCodVisualization(pbi, wrapper) {
    const PADDING = __bc_readPaddingPx();
    let R_OUTER = (pbi.cod * 15) / 2;

    function getCssVar(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function getIntersections(p1, r1, p2, r2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const d = Math.hypot(dx, dy);
        const EPS = 1e-6;

        if (d < EPS || d > r1 + r2 + EPS || d < Math.abs(r1 - r2) - EPS) {
            return [];
        }

        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const h_sq = Math.max(0, r1 * r1 - a * a);
        const h = Math.sqrt(h_sq);

        const cx2 = p1.x + (a * dx) / d;
        const cy2 = p1.y + (a * dy) / d;

        const nx = -dy / d;
        const ny = dx / d;

        return [{ x: cx2 + h * nx, y: cy2 + h * ny }, { x: cx2 - h * nx, y: cy2 - h * ny }];
    }

    const rawRadii = [pbi.cod_bv, pbi.cod_tc, pbi.cod_rroe]
        .map(v => Math.max(0, Number(v) || 0))
        .map(v => Math.sqrt(v));

    const edgePairIndices = __bc_selectEdgePair(window.BUBBLE_CLUSTER_OPTS.edgePair || 'largest', rawRadii);
    const idxA = edgePairIndices[0];
    const idxB = edgePairIndices[1];
    const idxC = [0, 1, 2].find(i => i !== idxA && i !== idxB);

    const rA_raw = rawRadii[idxA];
    const rB_raw = rawRadii[idxB];
    const rC_raw = rawRadii[idxC];

    function getScale(phi) {
        let low = 0;
        let high = (R_OUTER - PADDING) / Math.min(rA_raw, rB_raw) - 1e-6;
        const cos_phi = Math.cos(phi);

        for (let i = 0; i < 50; i++) {
            const mid = (low + high) / 2;
            const rA_ext = R_OUTER - mid * rA_raw - PADDING;
            const rB_ext = R_OUTER - mid * rB_raw - PADDING;
            const d_sq = Math.max(0, rA_ext * rA_ext + rB_ext * rB_ext - 2 * rA_ext * rB_ext * cos_phi);
            if (Math.sqrt(d_sq) > mid * (rA_raw + rB_raw) + PADDING) {
                low = mid;
            } else {
                high = mid;
            }
        }
        return (low + high) / 2;
    }

    function getLayout(phi) {
        const scale = getScale(phi);
        const rA = scale * rA_raw;
        const rB = scale * rB_raw;
        const rC = scale * rC_raw;
        const R_A_ext = R_OUTER - rA - PADDING;
        const R_B_ext = R_OUTER - rB - PADDING;
        const alpha_A = Math.PI / 2 - phi / 2;
        const alpha_B = Math.PI / 2 + phi / 2;
        const cA = { x: Math.cos(alpha_A) * R_A_ext, y: Math.sin(alpha_A) * R_A_ext };
        const cB = { x: Math.cos(alpha_B) * R_B_ext, y: Math.sin(alpha_B) * R_B_ext };
        const intersections = getIntersections(cA, rA + rC + PADDING, cB, rB + rC + PADDING);
        if (!intersections.length) return null;
        const cC = intersections.map(p => ({ p: p, d: Math.hypot(p.x, p.y) })).sort((a, b) => a.d - b.d)[0].p;
        if (Math.hypot(cC.x, cC.y) + rC + PADDING > R_OUTER + 0.001) return null;
        return { s: scale, rA, rB, rC, cA, cB, cC, phi };
    }

    let bestLayout = null;
    for (let angle = 70; angle <= 160; angle += 0.5) {
        const layout = getLayout(angle * Math.PI / 180);
        if (layout && (!bestLayout || layout.s > bestLayout.s)) {
            bestLayout = layout;
        }
    }

    if (!bestLayout) {
        const phi = 120 * Math.PI / 180;
        const scale = getScale(phi) * 0.95;
        const rA = scale * rA_raw, rB = scale * rB_raw, rC = scale * rC_raw;
        const R_A_ext = R_OUTER - rA - PADDING, R_B_ext = R_OUTER - rB - PADDING;
        const alpha_A = Math.PI / 2 - phi / 2, alpha_B = Math.PI / 2 + phi / 2;
        const cA = { x: Math.cos(alpha_A) * R_A_ext, y: Math.sin(alpha_A) * R_A_ext };
        const cB = { x: Math.cos(alpha_B) * R_B_ext, y: Math.sin(alpha_B) * R_B_ext };
        const cC = getIntersections(cA, rA + rC + PADDING, cB, rB + rC + PADDING)[0] || { x: 0, y: 0 };
        bestLayout = { s: scale, rA, rB, rC, cA, cB, cC, phi };
    }

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    const size = Math.ceil(2 * (R_OUTER + 20));
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', [-R_OUTER - 20, -R_OUTER - 20, 2 * (R_OUTER + 20), 2 * (R_OUTER + 20)].join(' '));

    const outerCircleBG = document.createElementNS(NS, 'circle');
    outerCircleBG.setAttribute('cx', 0);
    outerCircleBG.setAttribute('cy', 0);
    outerCircleBG.setAttribute('r', R_OUTER + 10);
    outerCircleBG.setAttribute('fill', getCssVar('--color-total'));
    svg.appendChild(outerCircleBG);

    const outerCircleStroke = document.createElementNS(NS, 'circle');
    outerCircleStroke.setAttribute('cx', 0);
    outerCircleStroke.setAttribute('cy', 0);
    outerCircleStroke.setAttribute('r', R_OUTER + 5);
    outerCircleStroke.setAttribute('fill', 'none');
    outerCircleStroke.setAttribute('stroke', getCssVar('--outer-stroke-color'));
    outerCircleStroke.setAttribute('stroke-width', '2');
    svg.appendChild(outerCircleStroke);

    const radii = [], centers = [];
    radii[idxA] = bestLayout.rA;
    radii[idxB] = bestLayout.rB;
    radii[idxC] = bestLayout.rC;
    centers[idxA] = bestLayout.cA;
    centers[idxB] = bestLayout.cB;
    centers[idxC] = bestLayout.cC;

    const fillColors = { 0: getCssVar('--color-bv'), 1: getCssVar('--color-tc'), 2: getCssVar('--color-rroe') };
    const numberColors = { 0: getCssVar('--circle-number-color-bv'), 1: getCssVar('--circle-number-color-tc'), 2: getCssVar('--circle-number-color-rroe') };
    const tooltipTexts = { 0: config.uiStrings.modalLabelCodBv, 1: config.uiStrings.modalLabelCodTc, 2: config.uiStrings.modalLabelCodRroe };
    const values = [pbi.cod_bv, pbi.cod_tc, pbi.cod_rroe];

    [0, 1, 2].sort((a, b) => radii[b] - radii[a]).forEach(idx => {
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', centers[idx].x);
        circle.setAttribute('cy', centers[idx].y);
        circle.setAttribute('r', radii[idx]);
        circle.setAttribute('fill', fillColors[idx]);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', radii[idx] > 0.5 ? '0.9' : '0');
        const tooltip = document.createElementNS(NS, 'title');
        tooltip.textContent = tooltipTexts[idx];
        circle.appendChild(tooltip);
        svg.appendChild(circle);

        const text = document.createElementNS(NS, 'text');
        text.style.fontFamily = '"Roboto Mono", ui-monospace, Menlo, monospace';
        text.style.fontVariantNumeric = 'tabular-nums lining-nums';
        text.style.fontFeatureSettings = '"tnum" 1, "lnum" 1';
        text.setAttribute('x', 0);
        text.setAttribute('y', 0);
        text.setAttribute('fill', numberColors[idx]);
        text.setAttribute('font-weight', 'bold');
        text.style.pointerEvents = 'none';
        const valueStr = String(values[idx]);
        const baseFontSize = Math.max(12, radii[idx] / 2.5);
        const lengthAdjust = { 1: 1, 2: 1.25, 3: 1.35, 4: 1.45, 5: 1.55, 6: 1.65, 7: 1.75, 8: 1.85 }[valueStr.length] || 1;
        text.setAttribute('font-size', (baseFontSize * lengthAdjust) + 'px');
        text.textContent = valueStr;
        text.setAttribute('opacity', radii[idx] > 0.5 ? '1' : '0');
        svg.appendChild(text);

        const cx = centers[idx].x, cy = centers[idx].y;
        const centerText = () => {
            const bbox = text.getBBox();
            text.setAttribute('text-anchor', 'start');
            text.removeAttribute('dominant-baseline');
            text.setAttribute('x', cx - (bbox.x + bbox.width / 2));
            text.setAttribute('y', cy - (bbox.y + bbox.height / 2));
        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => requestAnimationFrame(centerText));
        } else {
            requestAnimationFrame(centerText);
        }
    });

    wrapper.dataset.size = R_OUTER;
    wrapper.prepend(svg);

    if (window._equalizeGridRows) {
        requestAnimationFrame(function() { window._equalizeGridRows(); });
    }
}


/**
 * Generates the "Cost of Delay Profile" chart (Step Chart) for a specific prioritization order.
 * <br><b>Concept (The Economics of Queues):</b>
 * This function visualizes the cumulative economic cost incurred over time based on the sequence in which items are processed.
 * <ul>
 * <li><b>Y-Axis:</b> The sum of the "Cost of Delay" (CoD) of all items currently <i>waiting</i> in the queue.</li>
 * <li><b>X-Axis:</b> The cumulative time elapsed (Job Size).</li>
 * <li><b>The Goal:</b> To minimize the total area under the curve (Total Accumulated Delay Cost). WSJF aims to reduce this area fastest by tackling high-CoD items early.</li>
 * </ul>
 *
 * <br><b>Simulation Logic (Integration):</b>
 * The function iterates through the `sortedPbiList` to simulate the passage of time:
 * 1. <b>Segment Creation:</b> For each PBI, it creates a vertical "slice" (segment) of the chart. The width is the PBI's duration (`jobSize`).
 * 2. <b>Cost Calculation:</b> While a PBI is being "processed" (the width of the slice), all <i>other</i> remaining items are waiting. 
 * The height of the graph represents the sum of the CoD of these waiting items.
 * 3. <b>Stack Visualization:</b> Inside each segment, it renders a visual stack:
 * - <b>Colored Block:</b> The item currently being processed (at the top).
 * - <b>Grey Blocks:</b> The items waiting in the queue (below), scaled by their CoD.
 * 4. <b>Total Cost Accumulation:</b> It calculates <code>Cost * Duration</code> for the segment and adds it to `totalCalculatedDelayCost`.
 *
 * <br><b>DOM Manipulation:</b>
 * It dynamically constructs the chart using absolute positioning and flexbox within the provided container IDs.
 * It also manages axis labels (Max CoD at start, 0 at end) and intermediate time markers.
 *
 * @param {string} chartIdPrefix - The DOM ID prefix (e.g., "chart-left") to locate the container elements (`-area`, `-xaxis`, etc.).
 * @param {Array<Object>} sortedPbiList - The specific permutation of PBIs to simulate.
 * @param {Object} pbiIdToStyle - A lookup map `{ [id]: { color, rank } }` to style the "Processing" blocks consistent with the main list.
 * @returns {number} The <b>Total Accumulated Delay Cost</b> (the calculated area under the curve). This metric is used to compare the efficiency of different sort orders (e.g., "WSJF" vs. "Random").
 */
function createCodChart(chartIdPrefix, sortedPbiList, pbiIdToStyle) {

    var chartArea = document.getElementById(chartIdPrefix + '-area');
    var xAxisContainer = document.getElementById(chartIdPrefix + '-xaxis');
    var yAxisMaxLabel = document.getElementById(chartIdPrefix + '-y-axis-max');
    var yAxisZeroLabel = document.querySelector('#' + chartIdPrefix + '-content .wsjf-y-axis-zero');
    var chartOuter = document.getElementById(chartIdPrefix + '-content'); 
    var uiStrings = config.uiStrings || {};

    if (!chartArea || !xAxisContainer || !yAxisMaxLabel || !yAxisZeroLabel || !chartOuter) {
        console.error("Missing essential DOM elements for chart: " + chartIdPrefix);
        return 0;
    }

    var existingIntermediateYLabels = document.querySelectorAll('#' + chartIdPrefix + '-content .wsjf-y-axis-intermediate');
    existingIntermediateYLabels.forEach(function(label) { label.remove(); });

    if (yAxisMaxLabel.parentElement !== chartArea) {
        chartArea.appendChild(yAxisMaxLabel);
    }
    if (yAxisZeroLabel.parentElement !== chartArea) {
        chartArea.appendChild(yAxisZeroLabel);
    }

    chartArea.innerHTML = ''; 
    xAxisContainer.innerHTML = '';

    var totalJobSize = 0;
    var maxTotalCod = 0;
    var accumulatedDelayCostMap = {};
    sortedPbiList.forEach(function(pbi){
        totalJobSize += pbi.jobSize;
        maxTotalCod += pbi.cod;
        accumulatedDelayCostMap[pbi.id] = 0;
    });

    if (totalJobSize <= 0 || maxTotalCod <= 0) {
        chartArea.innerHTML = '<p style="text-align:center; color:#999;">' + (uiStrings.wsjfChartNoData || 'No valid data to display.') + '</p>';
        yAxisMaxLabel.textContent = '0';
        yAxisZeroLabel.textContent = '0'; 
        var startLabelFallback = document.createElement('div');
        startLabelFallback.className = 'wsjf-time-label wsjf-time-label-start';
        startLabelFallback.style.left = '0%';
        startLabelFallback.textContent = '0';
        startLabelFallback.title = (uiStrings.wsjfChartTooltipXAxisLabel || 'Cumulative Job Size: {value}').replace('{value}', '0');
        xAxisContainer.appendChild(startLabelFallback);

        chartArea.appendChild(yAxisMaxLabel);
        chartArea.appendChild(yAxisZeroLabel);
        return 0;
    }

    yAxisMaxLabel.textContent = maxTotalCod.toLocaleString();
    yAxisMaxLabel.title = (uiStrings.wsjfChartTooltipYAxisLabel || 'Sum of Waiting Cost of Delay: {value}').replace('{value}', maxTotalCod.toLocaleString());
    yAxisZeroLabel.textContent = '0';
    yAxisZeroLabel.title = (uiStrings.wsjfChartTooltipYAxisLabel || 'Sum of Waiting Cost of Delay: {value}').replace('{value}', '0');

    chartArea.appendChild(yAxisMaxLabel);
    chartArea.appendChild(yAxisZeroLabel);


    var totalCalculatedDelayCost = 0;
    var currentTime = 0;
    var remainingPbis = sortedPbiList.slice();

    var startLabel = document.createElement('div');
    startLabel.className = 'wsjf-time-label wsjf-time-label-start';
    startLabel.style.left = '0%';
    startLabel.textContent = '0';
    startLabel.title = (uiStrings.wsjfChartTooltipXAxisLabel || 'Cumulative Job Size: {value}').replace('{value}', '0');
    xAxisContainer.appendChild(startLabel);

    var initialWaitingCodSum = 0;
    sortedPbiList.forEach(function(p){ initialWaitingCodSum += p.cod; });
    if (Math.abs(initialWaitingCodSum - maxTotalCod) > 0.01) { 
        var initialYLabel = document.createElement('div');
        initialYLabel.className = 'wsjf-y-axis-label wsjf-y-axis-intermediate';
        var initialYPercent = (initialWaitingCodSum / maxTotalCod) * 100;
        initialYLabel.style.bottom = initialYPercent + '%';
        initialYLabel.style.transform = 'translateY(50%)';
        initialYLabel.textContent = initialWaitingCodSum.toLocaleString();
        initialYLabel.title = (uiStrings.wsjfChartTooltipYAxisLabel || 'Sum of Waiting Cost of Delay: {value}').replace('{value}', initialWaitingCodSum.toLocaleString());
        chartArea.appendChild(initialYLabel); 
    }

    sortedPbiList.forEach(function(currentPbi) {
        if (currentPbi.jobSize <= 0) return;

        var segmentDuration = currentPbi.jobSize;
        var sumOfWaitingCodForYLabel = 0;
        remainingPbis.forEach(function(p){ sumOfWaitingCodForYLabel += p.cod; });
        remainingPbis = remainingPbis.filter(function(p){ return p.id !== currentPbi.id; });
        var sumOfWaitingCodForCost = 0;
        remainingPbis.forEach(function(p){ sumOfWaitingCodForCost += p.cod; });


        var segmentCost = sumOfWaitingCodForCost * segmentDuration;
        totalCalculatedDelayCost += segmentCost;
        var segmentWidthPercent = (segmentDuration / totalJobSize) * 100;

        var segmentContainer = document.createElement('div');
        segmentContainer.className = 'wsjf-segment-container';
        segmentContainer.style.width = segmentWidthPercent + '%';

        remainingPbis.forEach(function(waitingPbi) {
            var costInThisSegment = waitingPbi.cod * segmentDuration;
            accumulatedDelayCostMap[waitingPbi.id] += costInThisSegment;
        });

        var pbiStack = remainingPbis.slice().reverse();
        pbiStack.push(currentPbi);

        pbiStack.forEach(function(pbiInStack, index){
            var isProcessing = (pbiInStack.id === currentPbi.id);
            var blockHeightPercent = (pbiInStack.cod / maxTotalCod) * 100;

            if (blockHeightPercent > 0) {
                var delayBlock = document.createElement('div');
                delayBlock.className = 'wsjf-delay-block ' + (isProcessing ? 'processing' : 'waiting');
                delayBlock.style.height = blockHeightPercent + '%';
                delayBlock.dataset.pbiId = pbiInStack.id;

                var styleInfo = pbiIdToStyle[pbiInStack.id] || { rank: '?', color: '#ccc' };
                if (isProcessing) {
                    delayBlock.style.backgroundColor = styleInfo.color;
                }

                var label = document.createElement('span');
                label.className = 'wsjf-delay-block-label';

                if (isProcessing) {
                    label.textContent = styleInfo.rank;
                } else {
                    label.textContent = accumulatedDelayCostMap[pbiInStack.id].toLocaleString();
                }

                var wsjfValue = (pbiInStack.cod / (pbiInStack.jobSize || 1)).toFixed(2).replace('.', ',');
                var titleLine1 = '"' + pbiInStack.title + '"';
                var titleLine2 = isProcessing ? (uiStrings.wsjfChartTooltipProcessing || 'Processing') : (uiStrings.wsjfChartTooltipWaiting || 'Waiting');
                var titleLine3 = (uiStrings.wsjfChartTooltipItem || 'Item') + ': ' + styleInfo.rank
                               + ' - ' + (uiStrings.wsjfChartTooltipJobSize || 'Job Size') + ': ' + pbiInStack.jobSize
                               + ' - ' + (uiStrings.wsjfChartTooltipCod || 'CoD') + ': ' + pbiInStack.cod
                               + ' - WSJF: ' + wsjfValue;

                if (isProcessing) {
                    delayBlock.title = titleLine1 + '\n' + titleLine2 + '\n' + titleLine3;
                    label.title = delayBlock.title;
                } else {
                    var titleLine4 = (uiStrings.wsjfChartLabelAccumulatedCost || 'Accumulated Delay Cost:') + ' ' + accumulatedDelayCostMap[pbiInStack.id].toLocaleString();
                    delayBlock.title = titleLine1 + '\n' + titleLine2 + '\n' + titleLine3 + '\n' + titleLine4;
                    label.title = delayBlock.title;
                }
                delayBlock.appendChild(label);
                segmentContainer.appendChild(delayBlock);
            }
        });

        chartArea.appendChild(segmentContainer);

        currentTime += segmentDuration;

        var timeLabel = document.createElement('div');
        timeLabel.className = 'wsjf-time-label';
        var xPercent = (currentTime / totalJobSize) * 100;
        timeLabel.style.left = xPercent + '%';
        timeLabel.textContent = currentTime;
        timeLabel.title = (uiStrings.wsjfChartTooltipXAxisLabel || 'Cumulative Job Size: {value}').replace('{value}', currentTime);
        xAxisContainer.appendChild(timeLabel); 

        var yLabel = document.createElement('div');
        yLabel.className = 'wsjf-y-axis-label wsjf-y-axis-intermediate';
        var yPercent = (sumOfWaitingCodForCost / maxTotalCod) * 100;
        yLabel.style.bottom = yPercent + '%'; 
        yLabel.style.transform = 'translateY(50%)';
        yLabel.textContent = sumOfWaitingCodForCost.toLocaleString();
        yLabel.title = (uiStrings.wsjfChartTooltipYAxisLabel || 'Sum of Waiting Cost of Delay: {value}').replace('{value}', sumOfWaitingCodForCost.toLocaleString());
        chartArea.appendChild(yLabel);

        if (Math.abs(currentTime - totalJobSize) < 0.01) {
            timeLabel.classList.add('wsjf-time-label-end');
            if (yPercent < 2) { 
                yLabel.style.display = 'none';
            }
        }

    });

    return totalCalculatedDelayCost;
}


/**
 * @ignore
 * CommonJS Module Export Definition (Visualization Subsystem).
 * <br><b>Architecture (Testability of UI):</b>
 * This specific export block exposes the heavy DOM-manipulation functions to the test runner.
 * <br><b>Why is this needed?</b>
 * Testing visualizations like "Circle Packing" or "WSJF Charts" is difficult. By exporting these functions, unit tests can:
 * <ol>
 * <li><b>Snapshot Testing:</b> Call `createStoryVisualization` with a mock PBI and compare the generated SVG string against a known "golden master" to detect visual regressions.</li>
 * <li><b>Logic Verification:</b> Verify that the correct number of circles are drawn or that the chart segments correspond mathematically to the input data, using a headless DOM implementation (like JSDOM).</li>
 * </ol>
 * <br><b>Separation of Concerns:</b>
 * While the application logic (calculations) is exported elsewhere, this block specifically bridges the gap between the raw data and the pixel-perfect SVG/HTML generation.
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createStoryVisualization: createStoryVisualization,
        createPlaceholderVisualization: createPlaceholderVisualization,
        createCodVisualization: createCodVisualization,
        createCodPlaceholderVisualization: createCodPlaceholderVisualization,
        createCodChart: createCodChart,
        setBubbleClusterOptions: (typeof window !== 'undefined' && window.setBubbleClusterOptions) ? window.setBubbleClusterOptions : null
    };
}