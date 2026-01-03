// ===================================================================================
// 01_MAIN.TEST.JS
// ===================================================================================

/**
 * @file 01_main.test.js
 * @description Unit tests for the core application logic (1_main.js).
 * * Objectives:
 * 1. Verify Core Initialization & Bootstrapping:
 * - Loading and parsing configuration from DOM script tags.
 * - Initializing global state variables (config, pbis, scales).
 * 2. Test Data Integrity Functions:
 * - `ensureLastItemExists`: Enforcing the presence of the spacer item.
 * - Handling edge cases (empty arrays, duplicates, null inputs).
 * 3. Validate Configuration Processing:
 * - Language detection logic (URL parameters vs. Defaults).
 * - Boolean flag handling (e.g., showReferenceMarkers).
 * 4. Ensure DOM Injection & Visual Settings:
 * - `applyColorSettings`: Dynamic generation of CSS variables in <head>.
 * - `displayVersionInfo`: syncing meta-data to UI elements.
 */

// --- GLOBAL MOCKS for EXTERNAL functions ---
// These functions are expected to exist on the global scope (provided by other modules)
global.applyUiStrings = jest.fn();
global.checkForUpdates = jest.fn();
global.renderAll = jest.fn();
global.syncRelativeSizingHeaderPadding = jest.fn();
global.setupEventListeners = jest.fn();
global.initSplit = jest.fn();
global.updateAllSliderFills = jest.fn();
global.initResizeHandler = jest.fn();
global.loadFromLocalStorage = jest.fn(() => false); // Simulate no local storage by default

// Import the module under test
const main = require('./1_main.js');
const { 
    processConfig, 
    ensureLastItemExists, 
    applyColorSettings, 
    displayVersionInfo, 
    loadConfigAndInit 
} = main;

describe('1_main.js - Core Application Logic', () => {

    // --- SETUP & TEARDOWN ---
    
    // Save the original window location to restore it after tests
    const originalLocation = window.location;

    beforeEach(() => {
        // Reset DOM for every test to ensure a clean slate
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        
        // Reset Mocks
        jest.clearAllMocks();
        
        // Mock a standard window.location
        delete window.location;
        window.location = {
            search: '',
            href: 'http://localhost/',
            assign: jest.fn(),
            reload: jest.fn()
        };
    });

    afterAll(() => {
        window.location = originalLocation;
    });

    // --- TEST GROUPS ---

    describe('ensureLastItemExists (Data Integrity)', () => {
        
        test('should create a new array with a spacer if input is empty', () => {
            var input = [];
            var result = ensureLastItemExists(input);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(-1);
            expect(result[0].isLastItem).toBe(true);
            expect(result[0].title).toBe('---');
        });

        test('should append a spacer if one does not exist', () => {
            var input = [{ id: 1, title: 'Item 1' }];
            var result = ensureLastItemExists(input);
            expect(result.length).toBe(2);
            expect(result[0].id).toBe(1);
            expect(result[1].isLastItem).toBe(true);
        });

        test('should remove duplicate spacers and keep only one at the end', () => {
            var input = [
                { id: 1, title: 'Item 1' },
                { id: -1, isLastItem: true }, // Duplicate in middle
                { id: 2, title: 'Item 2' },
                { id: -1, isLastItem: true }  // Existing at end
            ];
            var result = ensureLastItemExists(input);
            
            expect(result.length).toBe(3); // Item 1, Item 2, Spacer
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(2);
            expect(result[2].id).toBe(-1);
            expect(result[2].isLastItem).toBe(true);
        });

        test('should handle null or undefined input gracefully', () => {
            var resultNull = ensureLastItemExists(null);
            expect(resultNull.length).toBe(1);
            expect(resultNull[0].isLastItem).toBe(true);

            var resultUndef = ensureLastItemExists(undefined);
            expect(resultUndef.length).toBe(1);
        });
    });

    describe('processConfig (Configuration Logic)', () => {
        
        let baseConfig;

        beforeEach(() => {
            baseConfig = {
                defaultSettings: { language: 'en', scale: 'metric', confirmOnExit: false },
                languages: {
                    en: { pageTitle: 'English' },
                    de: { pageTitle: 'Deutsch' }
                },
                initialPbis: [],
                defaultColors: { complexity: '#000' }
            };
        });

        test('should use defaults from config if no URL params are present', () => {
            var result = processConfig(baseConfig);
            expect(result.currentLanguage).toBe('en');
            expect(result.config.defaultSettings.confirmOnExit).toBe(false);
        });

        test('should detect language from URL query string (?lang=de)', () => {
            // Mock URL params
            window.location.search = '?lang=de';
            
            var result = processConfig(baseConfig);
            expect(result.currentLanguage).toBe('de');
            expect(result.config.uiStrings.pageTitle).toBe('Deutsch');
        });

        test('should fallback to default language if URL param is invalid', () => {
            window.location.search = '?lang=fr'; // 'fr' not in baseConfig.languages
            
            var result = processConfig(baseConfig);
            expect(result.currentLanguage).toBe('en');
        });

        test('should ensure default colors are set if missing', () => {
            var emptyConfig = { defaultSettings: { language: 'en' } };
            var result = processConfig(emptyConfig);
            
            expect(result.config.defaultColors).toBeDefined();
            expect(result.config.colors).toBeDefined();
            expect(result.config.colors.complexity).toBe('#cacde6'); // Check against hardcoded fallback in main.js
        });
        
        test('should correctly process boolean flags', () => {
             baseConfig.defaultSettings.showReferenceMarkers = false;
             processConfig(baseConfig);
             expect(window.showReferenceMarkers).toBe(false);
             
             baseConfig.defaultSettings.showReferenceMarkers = true;
             processConfig(baseConfig);
             expect(window.showReferenceMarkers).toBe(true);
        });
    });

    describe('applyColorSettings (DOM Manipulation)', () => {
        
        test('should inject a style tag with CSS variables into head', () => {
            var colorConfig = {
                complexity: '#111111',
                effort: '#222222',
                doubt: '#333333',
                total: '#444444',
                numberComplexity: '#555',
                numberEffort: '#666',
                numberDoubt: '#777',
                bv: '#888',
                tc: '#999',
                rroe: '#aaa',
                numberBv: '#bbb',
                numberTc: '#ccc',
                numberRrOe: '#ddd'
            };

            // Ensure head is empty
            document.head.innerHTML = '';
            
            applyColorSettings(colorConfig);
            
            var styleTag = document.getElementById('dynamic-color-settings');
            expect(styleTag).not.toBeNull();
            expect(styleTag.tagName).toBe('STYLE');
            
            // Check content of the style tag
            var cssContent = styleTag.innerHTML || styleTag.innerText;
            expect(cssContent).toContain('--color-complexity: #111111');
            expect(cssContent).toContain('--color-effort: #222222');
        });

        test('should replace existing style tag if called twice', () => {
            var colors1 = { complexity: '#AAAAAA' };
            var colors2 = { complexity: '#BBBBBB' }; // Different color

            applyColorSettings(colors1);
            var style1 = document.getElementById('dynamic-color-settings');
            
            applyColorSettings(colors2);
            var style2 = document.getElementById('dynamic-color-settings');
            
            // Should be the same ID, but updated content
            expect(style2.innerHTML).toContain('#BBBBBB');
            // Ensure we don't have duplicates in head
            expect(document.head.querySelectorAll('style').length).toBe(1);
        });
    });

    describe('displayVersionInfo', () => {
        
        test('should update DOM elements with version and build info', () => {
            // 1. Setup DOM with Elements AND Config Script
            // We need to provide the config via script tag so loadConfigAndInit can read it
            document.body.innerHTML = 
                '<meta name="version" content="1.0.0">' +
                '<span id="info-version-value"></span>' +
                '<span id="info-build-value"></span>' +
                '<script id="size-right-config" type="application/json">' +
                JSON.stringify({
                    scales: {},
                    defaultSettings: { language: 'en' },
                    languages: { en: {} },
                    initialPbis: [],
                    buildNumber: 'Build-123' 
                }) +
                '</script>';
            
            // 2. Initialize the internal 'config' variable of the module
            // This is crucial because displayVersionInfo uses the local variable, not global.config
            loadConfigAndInit();
            
            // 3. Execute function
            displayVersionInfo();
            
            // 4. Assertions
            expect(document.getElementById('info-version-value').textContent).toBe('1.0.0');
            expect(document.getElementById('info-build-value').textContent).toBe('Build-123');
        });
    });

    describe('loadConfigAndInit (Integration)', () => {
        
        test('should parse script tag and initialize globals', () => {
            // Setup Configuration Script in DOM
            var mockConfig = {
                scales: { metric: { values: [0, 1] } },
                defaultSettings: { language: 'en', scale: 'metric' },
                languages: { en: { pageTitle: 'Init Test' } },
                initialPbis: [{ id: 1, title: 'Init Item' }]
            };

            document.body.innerHTML = 
                '<script id="size-right-config" type="application/json">' + 
                JSON.stringify(mockConfig) + 
                '</script>';

            // Call the initialization function
            loadConfigAndInit();

            // Check if global side-effects occurred
            // 1. applyUiStrings should be called
            expect(global.applyUiStrings).toHaveBeenCalled();
            
            // 2. Since we cannot easily access private module variables (let config) directly 
            // without getters in CommonJS if not exported, we verify behavior:
            // The ensureLastItemExists should have been called on the pbis,
            // but since that's internal, we rely on the logic that loadConfigAndInit
            // orchestrates the setup.
            
            // NOTE: In a real integration, we would check if `renderAll` was called,
            // but `loadConfigAndInit` inside 1_main.js usually just prepares the state.
            // The actual render triggers happen in the DOMContentLoaded event listener.
        });

        test('should log error if config script is missing', () => {
            console.error = jest.fn();
            document.body.innerHTML = ''; // No script tag

            loadConfigAndInit();

            expect(console.error).toHaveBeenCalledWith('Configuration script tag not found!');
        });
    });

});