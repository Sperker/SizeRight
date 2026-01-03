// ===================================================================================
// 1_MAIN.JS
// ===================================================================================


/**
 * @file 1_MAIN.JS - The Application Orchestrator & State Repository
 * @description
 * This file serves as the core foundational layer of the application. It acts as the 
 * central "Brain" that manages the global state and coordinates the lifecycle of 
 * the estimation tool.
 * * 
 *
 * <br><b>Core Responsibilities:</b>
 * <ul>
 * <li><b>Global State Management:</b> Defines and maintains the "Single Source of Truth" 
 * for all application data, including PBIs, sorting criteria, and UI states.</li>
 * <li><b>Application Bootstrapping:</b> Contains the entry point logic (`loadConfigAndInit`) 
 * to extract JSON configurations and initialize global variables.</li>
 * <li><b>Configuration Processing:</b> Validates incoming settings, sets default color 
 * palettes, and handles language detection via URL parameters.</li>
 * <li><b>Lifecycle Coordination:</b> Orchestrates the startup sequence, including 
 * LocalStorage restoration, version display, and the initial rendering trigger.</li>
 * <li><b>Theming & Branding:</b> Dynamically manages CSS variables to apply color 
 * schemes for metrics and the text editor across the entire DOM.</li>
 * </ul>
 * * <br><b>Architectural Context:</b>
 * This file provides the shared variables and utility functions that subsequent 
 * modules (like `2_RENDER.JS` and `3_EVENTS.JS`) rely on to function correctly.
 */


// ===================================================================================
// GLOBAL STATE & VARIABLES
// ===================================================================================


/**
 * @file Global Variables & Application State
 * <br><b>Role:</b> This section initializes the core state of the application. 
 * These variables are globally accessible and track user interactions, data sets, 
 * and configuration settings across different modules.
 */
let config, SCALES;
let pbis = [];
let currentLanguage;
let currentScale;
let currentEditingId = null;
let currentSortCriteria = 'jobSize'; 
let currentSortDirection = 'asc'; 
let lastImportedFileName = null;
let currentHighlightedColumn = null;
let lastEditedPbiId = null;
let activePopupPbiId = null;
let isFilterLocked = false;
let lockedPbiOrder = []; 
let preLockSortCriteria = 'jobSize'; 
let preLockSortDirection = 'asc'; 
let initialCustomOrderSet = false; 
let pbiIdToCustomColor = {};
let isOptimalChartCollapsed = true;
let exportSortCriteria = 'jobSize';
let exportSortDirection = 'asc';

window.isResolutionWarningDismissed = false;


/** 
 * * Initialization of global UI flags.
 */
if (typeof window !== 'undefined') {
    window.showReferenceMarkers = true;
}


/**
 * Guarantees that the PBI array contains exactly one specialized placeholder item at the end.
 * <br><b>Purpose:</b>
 * The UI requires a "Last Item" to render the empty slots at the bottom of the list. 
 * This function cleans the input array and appends a standardized spacer.
 * * <br><b>Logic:</b>
 * <ul>
 * <li>Filters out any existing items with `id: -1` to prevent duplicates.</li>
 * <li>Creates a new `spacerItem` with all values set to 0 or null.</li>
 * <li>Appends this item to the end of the "real" PBI list.</li>
 * </ul>
 * * @param {Array<Object>} pbisArray - The raw array of PBIs.
 * @returns {Array<Object>} The sanitized array with the placeholder at the end.
 */
function ensureLastItemExists(pbisArray) {
    if (!pbisArray) {
        pbisArray = [];
    }

    var lastItems = [];
    var otherPbis = [];

    for (var i = 0; i < pbisArray.length; i++) {
        if (pbisArray[i]) {
            if (pbisArray[i].id === -1 || pbisArray[i].isLastItem === true) {
                if (lastItems.length === 0) {
                     lastItems.push(pbisArray[i]);
                }
            } else {
                otherPbis.push(pbisArray[i]);
            }
        }
    }

    var resultArray = otherPbis;
    var spacerItem = {
        id: -1,
        isLastItem: true,
        isReference: false, 
        referenceType: null, 
        title: (config && config.uiStrings) ? config.uiStrings.lastItemTitle : "---",
        complexity: 0,
        effort: 0,
        doubt: 0,
        jobSize: null,
        cod_bv: 0,
        cod_tc: 0,
        cod_rroe: 0,
        cod: null,
        tshirtSize: null
    };

    resultArray.push(spacerItem);

    return resultArray;
}


/**
 * Processes and validates the global configuration object during application startup.
 * <br><b>Core Responsibilities (Bootstrapping):</b>
 * <ol>
 * <li><b>Standardization:</b> Ensures all necessary property paths (settings, colors) exist.</li>
 * <li><b>Color Fallback:</b> Defines default color palettes for graphical estimations (Complexity, Effort, CoD) and the text editor.</li>
 * <li><b>Language Detection (I18n):</b> Determines the active language through a priority chain:
 * <ul>
 * <li>1. URL query parameters (`?lang=en` or simple query `?en`).</li>
 * <li>2. Default setting defined in the configuration (`defaultSettings.language`).</li>
 * </ul>
 * </li>
 * <li><b>State Initialization:</b> Prepares the final object for the global application state.</li>
 * </ol>
 *
 * <br><b>Global State Synchronization:</b>
 * The function writes specific flags (such as `showReferenceMarkers`) directly to the global `window` object to allow quick access for CSS classes and UI logic.
 *
 * @param {Object} configObject - The raw configuration object (usually from an external JSON or config.js).
 * @returns {Object} A state object containing the validated `config`, `SCALES`, initial `pbis`, `currentLanguage`, and `currentScale`.
 * @global
 */
function processConfig(configObject) {
    let newConfig = configObject;

    if (!newConfig.defaultSettings) newConfig.defaultSettings = {};
    if (typeof newConfig.defaultSettings.confirmOnExit !== 'boolean') {
        newConfig.defaultSettings.confirmOnExit = false;
    }

    if (typeof window !== 'undefined') {
        if (typeof newConfig.defaultSettings.showReferenceMarkers === 'boolean') {
            window.showReferenceMarkers = newConfig.defaultSettings.showReferenceMarkers;
        } else {
            window.showReferenceMarkers = true;
        }
    }

    if (!newConfig.defaultColors) {
        newConfig.defaultColors = {
            complexity: '#cacde6', effort: '#A9E0E7', doubt: '#FFA6BE', total: '#efefef',
            numberComplexity: '#666666', numberEffort: '#666666', numberDoubt: '#666666',
            bv: '#FFD700', tc: '#87CEEB', rroe: '#98FB98',
            numberBv: '#666666', numberTc: '#666666', numberRrOe: '#666666'
        };
    }

    if (!newConfig.colors) {
        newConfig.colors = JSON.parse(JSON.stringify(newConfig.defaultColors));
    }

    if (!newConfig.defaultEditorColors) {
        newConfig.defaultEditorColors = {
            "1": "#279745", "2": "#2560d1", "3": "#937404", "4": "#c90000"
        };
    }

    if (!newConfig.editorColors) {
        newConfig.editorColors = JSON.parse(JSON.stringify(newConfig.defaultEditorColors));
    }

    let newCurrentLanguage = newConfig.defaultSettings.language;

    if (typeof window !== 'undefined' && window.location) {
        var queryString = window.location.search.substring(1); 
        var urlLang = null;

        if (typeof URLSearchParams !== 'undefined') {
            var params = new URLSearchParams(queryString);
            urlLang = params.get('lang');
        }

        if (!urlLang && queryString) {
            var parts = queryString.split('&');
            if (parts.length > 0) {
                var potentialLang = parts[0];
                if (newConfig.languages && newConfig.languages[potentialLang]) {
                    urlLang = potentialLang;
                }
            }
        }

        if (urlLang && newConfig.languages && newConfig.languages[urlLang]) {
            newCurrentLanguage = urlLang;
        }
    }

    if (newConfig.languages && newConfig.languages[newCurrentLanguage]) {
        newConfig.uiStrings = newConfig.languages[newCurrentLanguage];
    }

    const initialPbis = Array.isArray(newConfig.initialPbis) ? newConfig.initialPbis : [];

    return {
        config: newConfig,
        SCALES: newConfig.scales,
        pbis: initialPbis,
        currentLanguage: newCurrentLanguage,
        currentScale: newConfig.defaultSettings.scale
    };
}


/**
 * Initializes the application by loading configuration and setting the global state.
 * <br><b>Initialization Lifecycle:</b>
 * <ol>
 * <li><b>Extraction:</b> Searches for a `<script>` tag with the ID `size-right-config` that contains the configuration as JSON text.</li>
 * <li><b>Parsing & Processing:</b> Converts the JSON string into an object and passes it to `processConfig` to validate default values and language settings.</li>
 * <li><b>State Assignment:</b> Updates global variables (`config`, `SCALES`, `pbis`, `currentLanguage`, `currentScale`) with the processed values.</li>
 * <li><b>UI Preparation:</b> 
 * <ul>
 * <li>Invokes `applyUiStrings()` to set all static text in the DOM using the correct language.</li>
 * <li>Ensures the PBI array ends with a placeholder for adding new items using `ensureLastItemExists`.</li>
 * </ul>
 * </li>
 * </ol>
 * <br><b>Error Handling:</b>
 * If the configuration script is missing from the DOM, an error is logged to the console to alert developers to an incorrect HTML structure.
 * * @global
 * @requires processConfig - Validates the raw configuration data.
 * @requires applyUiStrings - Translates the user interface.
 * @requires ensureLastItemExists - Guarantees data list integrity.
 */
function loadConfigAndInit() {
    const configScript = document.getElementById('size-right-config');
    if (configScript) {
        const configObject = JSON.parse(configScript.textContent);

        const newState = processConfig(configObject);

        config = newState.config;
        SCALES = newState.SCALES;
        pbis = newState.pbis;
        currentLanguage = newState.currentLanguage;
        currentScale = newState.currentScale;

        applyUiStrings();
        pbis = ensureLastItemExists(pbis);
    } else {
        console.error('Configuration script tag not found!');
    }
}


/**
 * Injects dynamic color settings into the document by generating a global CSS stylesheet.
 * <br><b>Technical Approach (CSS-in-JS):</b>
 * This function bypasses static stylesheets to provide real-time theming. It creates a 
 * `<style>` element containing a `:root` block, which overwrites global CSS variables.
 * * <br><b>Execution Flow:</b>
 * <ol>
 * <li><b>Cleanup:</b> Searches for an existing `<style>` tag with the ID `dynamic-color-settings` 
 * and removes it to prevent memory leaks and style conflicts.</li>
 * <li><b>Color Resolution:</b> 
 * <ul>
 * <li>Retrieves editor color mappings from the configuration, falling back to 
 * standardized defaults if none are found.</li>
 * <li>Uses the provided `colorConfig` for metric-specific colors (Complexity, Effort, etc.).</li>
 * </ul>
 * </li>
 * <li><b>CSS Generation:</b> Constructs a string of CSS variable definitions (e.g., `--color-complexity`) 
 * based on the resolved settings.</li>
 * <li><b>DOM Injection:</b> Creates a new `<style>` element and appends it to the `<head>` 
 * of the document, immediately triggering a visual update across the UI.</li>
 * </ol>
 * * <br><b>UI Impact:</b>
 * Affects the background colors and text colors of bubble charts, rank tags, and the 
 * contextual colors used in the rich-text notes editor.
 * * @global
 * @param {Object} colorConfig - An object containing the primary hex/color codes for metrics and circles.
 */
function applyColorSettings(colorConfig) {
    var styleId = 'dynamic-color-settings';
    var existingStyle = document.getElementById(styleId);
    if (existingStyle) {
        existingStyle.remove();
    }

    var edColors = (config && config.editorColors) || (config && config.defaultEditorColors) || { "1": "#4ba663", "2": "#ee6969", "3": "#4e71f0", "4": "#937404" };

    var css = ':root {' +
        '--color-complexity: ' + colorConfig.complexity + ';' +
        '--color-effort: ' + colorConfig.effort + ';' +
        '--color-doubt: ' + colorConfig.doubt + ';' +
        '--color-total: ' + colorConfig.total + ';' +
        '--circle-number-color-complexity: ' + colorConfig.numberComplexity + ';' +
        '--circle-number-color-effort: ' + colorConfig.numberEffort + ';' +
        '--circle-number-color-doubt: ' + colorConfig.numberDoubt + ';' +
        '--color-bv: ' + colorConfig.bv + ';' +
        '--color-tc: ' + colorConfig.tc + ';' +
        '--color-rroe: ' + colorConfig.rroe + ';' +
        '--circle-number-color-bv: ' + colorConfig.numberBv + ';' +
        '--circle-number-color-tc: ' + colorConfig.numberTc + ';' +
        '--circle-number-color-rroe: ' + colorConfig.numberRrOe + ';' +
        '--color-editor-1: ' + edColors["1"] + ';' +
        '--color-editor-2: ' + edColors["2"] + ';' +
        '--color-editor-3: ' + edColors["3"] + ';' +
        '--color-editor-4: ' + edColors["4"] + ';' +
    '}';

    var style = document.createElement('style');
    style.id = styleId;
    style.type = 'text/css';

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.head.appendChild(style);
}


/**
 * Extracts and displays application version and build metadata.
 * <br><b>Data Sourcing:</b>
 * This function retrieves versioning data from two distinct locations to populate the "About" or "Info" modal:
 * <ul>
 * <li><b>Version:</b> Scraped from the HTML `<meta name="version">` attribute.</li>
 * <li><b>Build Number:</b> Retrieved from the global `config.buildNumber` object.</li>
 * </ul>
 * * <br><b>DOM Impact:</b>
 * If the corresponding elements (`info-version-value` and `info-build-value`) exist in the DOM, 
 * their text content is updated with the retrieved values.
 * * @global
 */
function displayVersionInfo() {
    const versionMeta = document.querySelector('meta[name="version"]');
    const versionValueEl = document.getElementById('info-version-value');
    if (versionMeta && versionValueEl) {
        versionValueEl.textContent = versionMeta.getAttribute('content');
    }

    const buildValueEl = document.getElementById('info-build-value');
    if (config && config.buildNumber && buildValueEl) {
        buildValueEl.textContent = config.buildNumber;
    }
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        loadConfigAndInit();
        
        if (typeof loadFromLocalStorage === 'function') {
            var loaded = loadFromLocalStorage();
            if (loaded) {
                if (typeof ensureLastItemExists === 'function') {
                    pbis = ensureLastItemExists(pbis);
                }
                if (typeof applyColorSettings === 'function') {
                    applyColorSettings(config.colors);
                }
                if (typeof applyUiStrings === 'function') {
                    applyUiStrings();
                }
            }
        }

        applyColorSettings(config.colors);
        displayVersionInfo();
        checkForUpdates();
        renderAll();
        requestAnimationFrame(syncRelativeSizingHeaderPadding);
        syncRelativeSizingHeaderPadding();
        setupEventListeners();
        initSplit();
        updateAllSliderFills();
        initResizeHandler();
    });
}


/**
 * @ignore
 * CommonJS Module Export Definition (Core Initialization & Configuration).
 * <br><b>Architecture Role:</b>
 * This module manages the bridge between static configuration data and the live 
 * application state. It facilitates the transition from raw JSON data to a 
 * fully initialized DOM environment.
 *
 * <br><b>Exported Functionalities:</b>
 * <ul>
 * <li><b>`processConfig`</b>: Validates and sanitizes the raw configuration object, setting defaults for colors and settings.</li>
 * <li><b>`ensureLastItemExists`</b>: Maintains the integrity of the PBI data structure by guaranteeing a "Last Item" spacer exists.</li>
 * <li><b>`applyColorSettings`</b>: Dynamically injects CSS variables into the document head based on user/system preferences.</li>
 * <li><b>`displayVersionInfo`</b>: Synchronizes version and build metadata from meta tags and config to the UI.</li>
 * <li><b>`loadConfigAndInit`</b>: Orchestrates the primary bootstrap sequence by extracting JSON from the DOM script tags.</li>
 * </ul>
 *
 * <br><b>Contextual Note:</b>
 * The `if (typeof module !== 'undefined' && module.exports)` wrapper ensures 
 * compatibility between browser-native execution and Node.js-based test 
 * environments like Jest.
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processConfig,
        ensureLastItemExists,
        applyColorSettings,
        displayVersionInfo,
        loadConfigAndInit
    };
}