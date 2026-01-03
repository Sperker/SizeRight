// ===================================================================================
// 05_VISUALIZATIONS.TEST.JS
// ===================================================================================

/**
 * @file 05_visualizations.test.js
 * @description Unit tests for the graphical rendering engine (5_visualizations.js).
 * * Objectives:
 * 1. Verify SVG Generation Logic:
 * - `createStoryVisualization`: Rendering Job Size bubbles (Complexity/Effort/Doubt).
 * - `createCodVisualization`: Rendering CoD stacks (BV/TC/RR).
 * 2. Test Placeholder & Empty States:
 * - Rendering partial graphics for incomplete items.
 * - Handling zero-value scenarios gracefully.
 * 3. Validate WSJF Chart Calculations:
 * - `createCodChart`: Stacking logic for processing vs. waiting time.
 * - Axis label generation and scaling.
 * 4. Ensure Visual Consistency:
 * - Correct application of ranks and colors.
 * - Tooltip generation for chart segments.
 */

// Import all visualization functions
const viz = require('./5_visualizations.js');

// Helper function to set up CSS variables (mocking the browser's style system)
function setupCssVariables() {
    document.documentElement.style.setProperty('--color-total', '#efefef');
    document.documentElement.style.setProperty('--outer-stroke-color', '#fff');
    document.documentElement.style.setProperty('--border-color', '#aaaaaa');
    document.documentElement.style.setProperty('--color-complexity', '#cacde6');
    document.documentElement.style.setProperty('--color-effort', '#A9E0E7');
    document.documentElement.style.setProperty('--color-doubt', '#FFA6BE');
    document.documentElement.style.setProperty('--circle-number-color-complexity', '#111');
    document.documentElement.style.setProperty('--circle-number-color-effort', '#222');
    document.documentElement.style.setProperty('--circle-number-color-doubt', '#333');
    document.documentElement.style.setProperty('--color-bv', '#abf2ab');
    document.documentElement.style.setProperty('--color-tc', '#f7dc91');
    document.documentElement.style.setProperty('--color-rroe', '#acd2fb');
    document.documentElement.style.setProperty('--circle-number-color-bv', '#444');
    document.documentElement.style.setProperty('--circle-number-color-tc', '#555');
    document.documentElement.style.setProperty('--circle-number-color-rroe', '#666');
    document.documentElement.style.setProperty('--bubble-gap', '2px');
}

// Helper function to set up global mocks and browser APIs
function setupGlobalMocks() {
    global.config = {
        uiStrings: {
            legendComplexity: 'Complexity',
            legendEffort: 'Effort',
            legendDoubt: 'Doubt',
            modalLabelCodBv: 'Business Value',
            modalLabelCodTc: 'Time Criticality',
            modalLabelCodRroe: 'RR/OE',
            wsjfChartNoData: 'No data',
            wsjfChartTooltipXAxisLabel: 'Cumulative Job Size: {value}',
            wsjfChartTooltipYAxisLabel: 'Cumulative CoD: {value}',
            wsjfChartTooltipProcessing: 'Processing',
            wsjfChartTooltipWaiting: 'Waiting',
            wsjfChartTooltipItem: 'Item',
            wsjfChartTooltipJobSize: 'Job Size',
            wsjfChartTooltipCod: 'CoD',
            wsjfChartLabelAccumulatedCost: 'Accumulated Cost' 
        }
    };

    // Ensure the global options object exists
    global.window.BUBBLE_CLUSTER_OPTS = { edgePair: 'largest', paddingCssVar: '--bubble-gap' };
    
    // Mock requestAnimationFrame to run synchronously for text positioning tests
    global.requestAnimationFrame = jest.fn(function(cb) { cb(); });

    // Mock window._equalizeGridRows function which is called after rendering
    global.window._equalizeGridRows = jest.fn();

    // Mock getBBox for text centering logic (SVG method not available in JSDOM)
    SVGElement.prototype.getBBox = function() { 
        return { x: 10, y: 10, width: 20, height: 20 }; 
    };

    // Mock document.fonts API to ensure the promise-based text centering logic runs
    Object.defineProperty(document, 'fonts', {
        value: {
            ready: Promise.resolve()
        },
        writable: true
    });
}


describe('Visualization Config', function() {
    beforeEach(function() {
        setupGlobalMocks();
    });

    test('setBubbleClusterOptions should update global configuration', function() {
        // Test if the exported helper updates the window object
        if (viz.setBubbleClusterOptions) {
            viz.setBubbleClusterOptions({ paddingPx: 50, edgePair: 'random' });
            expect(window.BUBBLE_CLUSTER_OPTS.paddingPx).toBe(50);
            expect(window.BUBBLE_CLUSTER_OPTS.edgePair).toBe('random');
        }
    });
});


describe('createStoryVisualization', function() {
    var mockPbi;
    var container;
    
    beforeEach(function() {
        setupCssVariables();
        setupGlobalMocks();
        
        mockPbi = { id: 1, title: 'Test Viz', complexity: 5, effort: 3, doubt: 1, jobSize: 9 };
        
        document.body.innerHTML = '<div id="container" data-id="1"></div>';
        container = document.getElementById('container');
    });

    test('should append an SVG element', function() {
        viz.createStoryVisualization(mockPbi, container);
        var svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
    });

    test('should render 3 circles (bubbles) and 3 text elements for values', function() {
        viz.createStoryVisualization(mockPbi, container);
        // 3 bubbles + 1 outer stroke + 1 outer bg = 5 circles
        var circles = container.querySelectorAll('circle');
        var texts = container.querySelectorAll('text');
        
        // We expect 5 circles total (3 data + 2 decorative)
        expect(circles.length).toBe(5); 
        expect(texts.length).toBe(3);
        
        // Check if the text values are correct
        var textContents = Array.from(texts).map(function(t) { return t.textContent; }).sort();
        expect(textContents).toEqual(['1', '3', '5']);
    });

    test('should handle a PBI with zero values gracefully', function() {
        var zeroPbi = { id: 2, title: 'Zero PBI', complexity: 0, effort: 0, doubt: 0, jobSize: 0 };
        var action = function() { viz.createStoryVisualization(zeroPbi, container); };
        
        expect(action).not.toThrow();
        expect(container.querySelector('svg')).not.toBeNull();
        // Should still render 3 text elements (with '0'), even if circles are opacity 0
        var texts = container.querySelectorAll('text');
        expect(texts.length).toBe(3);
        var textContents = Array.from(texts).map(function(t) { return t.textContent; }).sort();
        expect(textContents).toEqual(['0', '0', '0']);
    });

    test('should trigger _equalizeGridRows after rendering', function() {
        viz.createStoryVisualization(mockPbi, container);
        expect(global.window._equalizeGridRows).toHaveBeenCalled();
    });
});


describe('createPlaceholderVisualization', function() {
    var container;

    beforeEach(function() {
        setupCssVariables();
        document.body.innerHTML = '<div id="container" data-id="1"></div>';
        container = document.getElementById('container');
    });

    test('should append an SVG', function() {
        var pbi = { complexity: 1, effort: 0, doubt: 0 };
        viz.createPlaceholderVisualization(pbi, container);
        expect(container.querySelector('svg')).not.toBeNull();
    });

    test('should render a partial path if one value is present', function() {
        var pbi = { complexity: 1, effort: 0, doubt: 0 };
        viz.createPlaceholderVisualization(pbi, container);
        var path = container.querySelector('path');
        expect(path).not.toBeNull(); // Path should exist
        // Check if path 'd' attribute corresponds to 120 degrees
        expect(path.getAttribute('d')).toContain('A 27.5,27.5 0 0,1');
    });

    test('should render a larger path if two values are present', function() {
        var pbi = { complexity: 1, effort: 1, doubt: 0 };
        viz.createPlaceholderVisualization(pbi, container);
        var path = container.querySelector('path');
        expect(path).not.toBeNull();
        // Check for the 'large-arc-flag' (1) indicating > 180 degrees (240)
        expect(path.getAttribute('d')).toContain('A 27.5,27.5 0 1,1');
    });
    
    test('should not render a path if all values are zero', function() {
        var pbi = { complexity: 0, effort: 0, doubt: 0 };
        viz.createPlaceholderVisualization(pbi, container);
        var path = container.querySelector('path');
        expect(path).toBeNull(); // No path should be drawn
    });
});


describe('createCodVisualization', function() {
    var mockPbi;
    var container;
    
    beforeEach(function() {
        setupCssVariables();
        setupGlobalMocks();
        
        mockPbi = { id: 1, title: 'CoD Viz', cod_bv: 5, cod_tc: 3, cod_rroe: 1, cod: 9 };
        
        document.body.innerHTML = '<div id="container" data-id="1"></div>';
        container = document.getElementById('container');
    });

    test('should append an SVG element', function() {
        viz.createCodVisualization(mockPbi, container);
        var svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
    });

    test('should render 3 circles (bubbles) and 3 text elements for CoD values', function() {
        viz.createCodVisualization(mockPbi, container);
        var circles = container.querySelectorAll('circle');
        var texts = container.querySelectorAll('text');
        
        expect(circles.length).toBe(5); // 3 data + 2 decorative
        expect(texts.length).toBe(3);
        var textContents = Array.from(texts).map(function(t) { return t.textContent; }).sort();
        expect(textContents).toEqual(['1', '3', '5']);
    });
});


describe('createCodPlaceholderVisualization', function() {
     var container;

    beforeEach(function() {
        setupCssVariables();
        document.body.innerHTML = '<div id="container" data-id="1"></div>';
        container = document.getElementById('container');
    });

    test('should append an SVG', function() {
        var pbi = { cod_bv: 1, cod_tc: 0, cod_rroe: 0 };
        viz.createCodPlaceholderVisualization(pbi, container);
        expect(container.querySelector('svg')).not.toBeNull();
    });

    test('should render a partial path if one value is present', function() {
        var pbi = { cod_bv: 1, cod_tc: 0, cod_rroe: 0 };
        viz.createCodPlaceholderVisualization(pbi, container);
        var path = container.querySelector('path');
        expect(path).not.toBeNull();
        expect(path.getAttribute('d')).toContain('A 27.5,27.5 0 0,1'); // 120 degrees
    });
    
    test('should not render a path if all values are zero', function() {
        var pbi = { cod_bv: 0, cod_tc: 0, cod_rroe: 0 };
        viz.createCodPlaceholderVisualization(pbi, container);
        var path = container.querySelector('path');
        expect(path).toBeNull();
    });
});

// --- Tests for createCodChart ---
describe('createCodChart', function() {

    var pbiList, pbiStyles;
    var chartId = 'test-chart';

    beforeEach(function() {
        setupGlobalMocks(); 
        
        document.body.innerHTML = 
            '<div id="test-chart-content">' +
                '<div id="test-chart-area"></div>' +
                '<div id="test-chart-xaxis"></div>' +
                '<div id="test-chart-y-axis-max" class="wsjf-y-axis-label wsjf-y-axis-max"></div>' +
                '<div class="wsjf-y-axis-label wsjf-y-axis-zero"></div>' +
            '</div>';
        
        // Mock Data
        pbiList = [
            { id: 1, title: 'PBI A', jobSize: 2, cod: 10, wsjf: 5 }, // Processed first
            { id: 2, title: 'PBI B', jobSize: 3, cod: 5,  wsjf: 1.67 } // Processed second
        ];
        pbiStyles = {
            1: { rank: 1, color: '#ff0000' },
            2: { rank: 2, color: '#00ff00' }
        };
    });

    test('should return 0 and show "No data" message if list is empty', function() {
        var totalCost = viz.createCodChart(chartId, [], pbiStyles);
        expect(totalCost).toBe(0);
        var chartArea = document.getElementById('test-chart-area');
        expect(chartArea.textContent).toContain('No data');
        expect(document.getElementById('test-chart-y-axis-max').textContent).toBe('0');
    });

    test('should return 0 and show "No data" message if PBIs have 0 jobSize', function() {
        var zeroJsPbi = [{ id: 1, title: 'PBI A', jobSize: 0, cod: 10 }];
        var totalCost = viz.createCodChart(chartId, zeroJsPbi, pbiStyles);
        expect(totalCost).toBe(0);
        expect(document.getElementById('test-chart-area').textContent).toContain('No data');
    });

    test('should calculate total delay cost correctly', function() {
        // PBI A (JS=2, CoD=10) runs first.
        // During A, PBI B (CoD=5) waits. Cost = 5 * 2 = 10
        // PBI B (JS=3, CoD=5) runs second.
        // During B, nothing waits. Cost = 0 * 3 = 0
        // Total Cost = 10
        var totalCost = viz.createCodChart(chartId, pbiList, pbiStyles);
        expect(totalCost).toBe(10);
    });

    test('should render correct number of segments and axis labels', function() {
        viz.createCodChart(chartId, pbiList, pbiStyles);
        var segments = document.querySelectorAll('.wsjf-segment-container');
        expect(segments.length).toBe(2); // One for PBI A, one for PBI B
        
        var xLabels = document.querySelectorAll('.wsjf-time-label');
        expect(xLabels.length).toBe(3); // 0, 2, 5
        expect(xLabels[0].textContent).toBe('0');
        expect(xLabels[1].textContent).toBe('2');
        expect(xLabels[2].textContent).toBe('5'); // 2 (A) + 3 (B)
        
        var yLabels = document.querySelectorAll('.wsjf-y-axis-label');
        // Max (15), Zero (0), Y-label at time 2 (CoD=5), Y-label at time 5 (CoD=0, hidden)
        // Note: The initial Y-Label (15) is skipped because it equals max (15)
        expect(yLabels.length).toBe(4);
        expect(document.getElementById('test-chart-y-axis-max').textContent).toBe('15'); // 10 + 5
    });
    
    test('should render correct blocks within segments', function() {
        viz.createCodChart(chartId, pbiList, pbiStyles);
        var segments = document.querySelectorAll('.wsjf-segment-container');
        
        // Segment 1 (PBI A processing)
        var seg1_blocks = segments[0].querySelectorAll('.wsjf-delay-block');
        expect(seg1_blocks.length).toBe(2); // B waiting, A processing
        
        var seg1_pbiB_wait = seg1_blocks[0]; // B is stacked first (drawn at bottom)
        expect(seg1_pbiB_wait.classList.contains('waiting')).toBe(true);
        expect(seg1_pbiB_wait.dataset.pbiId).toBe('2');
        expect(seg1_pbiB_wait.style.height).toBe((5/15)*100 + '%');
        expect(seg1_pbiB_wait.querySelector('.wsjf-delay-block-label').textContent).toBe('10'); // 5 * 2 = 10
        
        var seg1_pbiA_proc = seg1_blocks[1]; // A is stacked on top
        expect(seg1_pbiA_proc.classList.contains('processing')).toBe(true);
        expect(seg1_pbiA_proc.dataset.pbiId).toBe('1');
        expect(seg1_pbiA_proc.style.height).toBe((10/15)*100 + '%');
        expect(seg1_pbiA_proc.querySelector('.wsjf-delay-block-label').textContent).toBe('1'); // Rank
        
        // Segment 2 (PBI B processing)
        var seg2_blocks = segments[1].querySelectorAll('.wsjf-delay-block');
        expect(seg2_blocks.length).toBe(1); // Only B processing
        
        var seg2_pbiB_proc = seg2_blocks[0];
        expect(seg2_pbiB_proc.classList.contains('processing')).toBe(true);
        expect(seg2_pbiB_proc.dataset.pbiId).toBe('2');
        expect(seg2_pbiB_proc.style.height).toBe((5/15)*100 + '%');
        expect(seg2_pbiB_proc.querySelector('.wsjf-delay-block-label').textContent).toBe('2'); // Rank
    });

    test('should set correct tooltips on blocks', function() {
        viz.createCodChart(chartId, pbiList, pbiStyles);
        
        // PBI A (Proc) in Seg 1
        var pbiA_proc = document.querySelector('.wsjf-delay-block.processing[data-pbi-id="1"]');
        expect(pbiA_proc.title).toBe('"PBI A"\nProcessing\nItem: 1 - Job Size: 2 - CoD: 10 - WSJF: 5,00');
        
        // PBI B (Wait) in Seg 1
        var pbiB_wait = document.querySelector('.wsjf-delay-block.waiting[data-pbi-id="2"]');
        expect(pbiB_wait.title).toContain('"PBI B"\nWaiting');
        // Matches "Accumulated Cost 10" because the mock string "Accumulated Cost" has no colon
        expect(pbiB_wait.title).toContain('Accumulated Cost 10');
    });
});