// ===================================================================================
// 06_UTILS.TEST.JS
// ===================================================================================

/**
 * @file 06_utils.test.js
 * @description Unit tests for the utility layer (6_utils.js).
 * * Objectives:
 * 1. Verify Mathematical & Logic Helpers:
 * - `calculateWSJF`: Score computation and zero-handling.
 * - `calculateWsjfRanks`: Sorting and ranking logic.
 * 2. Test Data Persistence & Transfer:
 * - LocalStorage operations (Save/Load/Reset).
 * - JSON Import/Export (Structure validation, Legacy support).
 * - CSV Export (Header generation, Data formatting).
 * 3. Validate String & Color Utilities:
 * - `htmlToMarkdown`: Converting editor notes for export.
 * - `generatePastelColors`: Palette management and fallback logic.
 * 4. Ensure Environment Utilities:
 * - Screen resolution checks and warnings.
 * - Update checker (Semver comparison).
 */

// --- Tell Jest to control timers ---
jest.useFakeTimers();

// Import functions to test
const utils = require('./6_utils.js');
const {
    calculateWSJF,
    updateSliderFill,
    getReferencePbi,
    getReferencePbiId,
    isPinReferenceEnabled,
    compareSemver,
    updateResetJobSizeButtonVisibility,
    updateResetCoDButtonVisibility,
    highlightAndScrollToLastEditedPbi,
    scrollContainerToItem,
    calculateWsjfRanks,
    generatePastelColors,
    rgbToHex,
    exportPbisAsJson,
    handleImport,
    updateSliderValues,
    updateAllSliderFills,
    syncSliderMax,
    initSplit,
    generateSliderScales,
    updateActiveScaleValue,
    openDocumentation,
    initSyncScroll,
    syncRowHeights,
    showUpdateNotification,
    checkForUpdates,
    applyImportedData,
    loadDemoData,
    checkScreenResolution,
    initResizeHandler,
    clearLocalStorageAndReset,
    htmlToMarkdown,
    exportPbisAsCsv,
    saveToLocalStorage,
    loadFromLocalStorage
} = require('./6_utils.js');

// --- Global Mocks ---
global.applyColorSettings = jest.fn();
global.applyUiStrings = jest.fn();
global.renderAll = jest.fn();
global.syncSliderMax = jest.fn();
global.generateSliderScales = jest.fn();
global.updateFilterLockButtonState = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.syncRelativeSizingHeaderPadding = jest.fn();
global.updateRefMarkerButtonState = jest.fn();

// Mock File/DOM APIs
global.Blob = jest.fn((content, options) => ({ content, options }));
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
const mockFileReader = {
  readAsText: jest.fn(),
  onload: null,
  onerror: null,
  result: ''
};
global.FileReader = jest.fn(() => mockFileReader);

// Mock showSaveFilePicker
const mockFileHandle = {
  createWritable: jest.fn(() => mockWritable),
};
const mockWritable = {
  write: jest.fn(),
  close: jest.fn(),
};
global.window.showSaveFilePicker = jest.fn(() => Promise.resolve(mockFileHandle));

// Mock window.open
global.window.open = jest.fn(() => ({
    document: {
        write: jest.fn(),
        close: jest.fn()
    }
}));

// Mock fetch
global.fetch = jest.fn();

// --- Global State Setup ---
const setupGlobalState = () => {
    global.currentLanguage = 'en';
    global.currentScale = 'safe';
    global.currentSortCriteria = 'jobSize';
    global.currentSortDirection = 'asc';
    global.preLockSortCriteria = 'jobSize';
    global.preLockSortDirection = 'asc';
    global.isFilterLocked = false;
    global.lockedPbiOrder = [];
    global.pbiIdToCustomColor = {};
    global.lastImportedFileName = null;
    global.pbis = [];
    global.currentEditingId = null; 
    global.initialCustomOrderSet = false;
    global.isResolutionWarningDismissed = false;
    
    global.SCALES = {
        safe: { values: [0, 1, 2, 3, 5, 8] },
        metric: { values: [0, 1, 2, 3, 4, 5, 6, 7, 8]}
    };
    
    global.config = {
        languages: {
            en: { 
                uiString: 'value',
                importSuccess: 'Success!', 
                importError: 'Error!',
                documentationHtml: '<h1>English Doc</h1>',
                mainHeader: 'Header',
                mainClaim: 'Claim',
                tocTitle: 'Contents',
                updateChecker: {
                    updateNotification: 'App is old!',
                    updateButtonText: 'Download {version}'
                },
                infoVersionOutdated: 'is outdated, current is:',
                infoVersionCurrent: 'is up-to-date',
                colComplexity: 'Comp', colEffort: 'Eff', colDoubt: 'Dbt', colJobSize: 'JS', 
                pbiInfoTshirtSize: 'Size', modalLabelCodBv: 'BV', modalLabelCodTc: 'TC', 
                modalLabelCodRroe: 'RR', pbiInfoCoD: 'CoD', colWsjf: 'WSJF', modalLabelNotes: 'Notes', 
                csvHeaderRef: 'Ref', modalPlaceholderTitle: 'Title'
            }
        },
        tshirtSizes: ['S', 'M', 'L'],
        allTshirtSizes: ['XS', 'S', 'M', 'L', 'XL'],
        defaultSettings: {
            language: 'en',
            scale: 'safe',
            tshirtSizes: ['S', 'M', 'L']
        },
        colors: { complexity: '#aaaaaa' },
        defaultColors: { complexity: '#bbbbbb' },
        pastelColorPalette: ['#FF0000', '#00FF00', '#0000FF'], // Mock palette
        editorColors: { "1": "#279745" },
        defaultEditorColors: { "1": "#279745" },
        uiStrings: {
            colComplexity: 'Comp', colEffort: 'Eff', colDoubt: 'Dbt', colJobSize: 'JS', 
            pbiInfoTshirtSize: 'Size', modalLabelCodBv: 'BV', modalLabelCodTc: 'TC', 
            modalLabelCodRroe: 'RR', pbiInfoCoD: 'CoD', colWsjf: 'WSJF', modalLabelNotes: 'Notes', 
            csvHeaderRef: 'Ref', modalPlaceholderTitle: 'Title',
            importError: 'Error import'
        },
        updateChecker: {
            versionUrl: 'http://example.com/version.json',
            downloadUrl: 'http://example.com/download'
        },
        resolutionSettings: {
            minWidth: 1000,
            minHeight: 600
        }
    };
};

const setWindowSize = (width, height) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));
};

beforeEach(() => {
    setupGlobalState();
    jest.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        // Reset spies on localStorage
        jest.restoreAllMocks();
    }
});

// --- TESTS ---

describe('App Reset & LocalStorage', () => {
    let reloadSpy;
    
    beforeEach(() => {
        // Mock window.location.reload
        reloadSpy = jest.fn();
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { reload: reloadSpy }
        });
    });

    test('clearLocalStorageAndReset should remove specific keys and reload', () => {
        window.localStorage.setItem('sizeRight_autosave_v1', 'some data');
        window.localStorage.setItem('sizeRight_dismissedUpdateVersion', '1.0.0');
        window.localStorage.setItem('other_app_data', 'keep me');

        clearLocalStorageAndReset();

        expect(window.localStorage.getItem('sizeRight_autosave_v1')).toBeNull();
        expect(window.localStorage.getItem('sizeRight_dismissedUpdateVersion')).toBeNull();
        expect(window.localStorage.getItem('other_app_data')).toBe('keep me');
        expect(reloadSpy).toHaveBeenCalled();
    });

    test('saveToLocalStorage includes resolution dismissal state', () => {
        window.isResolutionWarningDismissed = true;
        
        // Mock setItem on Storage.prototype to correctly catch the call in JSDOM
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
        
        // Execute
        saveToLocalStorage(); 
        
        // Verify
        expect(setItemSpy).toHaveBeenCalled();
        const jsonArg = setItemSpy.mock.calls[0][1]; 
        const parsed = JSON.parse(jsonArg);
        
        expect(parsed.settings.isResolutionWarningDismissed).toBe(true);
    });
});

// ======================================================================
// PERSISTENCE LOADING TESTS
// ======================================================================
describe('Loading from LocalStorage', () => {
    /**
     * Test suite for loadFromLocalStorage.
     * Ensures that data saved in the browser is correctly hydrated back into
     * the global application state variables.
     */
    
    test('loadFromLocalStorage returns false if no data exists', () => {
        // Mock getItem on Storage.prototype
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        
        const result = loadFromLocalStorage();
        
        expect(result).toBe(false);
    });

    test('loadFromLocalStorage correctly restores settings and pbis', () => {
        const mockSavedState = JSON.stringify({
            settings: {
                language: 'de',
                scale: 'metric',
                sortCriteria: 'cod'
            },
            backlogItems: [
                { id: 'pbi_1', title: 'Restored Item', complexity: 5 }
            ]
        });

        // Mock getItem on Storage.prototype
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockSavedState);

        const result = loadFromLocalStorage();

        expect(result).toBe(true);
        expect(global.currentLanguage).toBe('de');
        expect(global.currentScale).toBe('metric');
        expect(global.currentSortCriteria).toBe('cod');
        expect(global.pbis).toHaveLength(1);
        expect(global.pbis[0].title).toBe('Restored Item');
    });

    test('loadFromLocalStorage handles corrupted JSON gracefully', () => {
        // Mock getItem on Storage.prototype
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('{ invalid json ...');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const result = loadFromLocalStorage();
        
        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});

describe('Export Helpers', () => {
    describe('htmlToMarkdown', () => {
        test('should convert basic formatting', () => {
            const html = '<b>Bold</b> and <i>Italic</i>';
            expect(htmlToMarkdown(html)).toBe('**Bold** and _Italic_');
        });

        test('should handle lists', () => {
            const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
            const md = htmlToMarkdown(html);
            expect(md).toContain('- Item 1');
            expect(md).toContain('- Item 2');
        });

        test('should handle links', () => {
            const html = '<a href="http://test.com">Link</a>';
            expect(htmlToMarkdown(html)).toBe('[Link](http://test.com)');
        });

        test('should handle divs and paragraphs by adding newlines', () => {
            const html = '<div>Line 1</div><div>Line 2</div>';
            expect(htmlToMarkdown(html)).toBe("Line 1\nLine 2");
        });
        
        test('should handle empty or null input', () => {
            expect(htmlToMarkdown(null)).toBe('');
            expect(htmlToMarkdown('')).toBe('');
        });
    });

    describe('exportPbisAsCsv', () => {
        test('should create a CSV blob with correct headers and data', () => {
            const pbis = [
                { id: 1, title: 'Item "A"', complexity: 1, effort: 1, doubt: 1, jobSize: 3, tshirtSize: 'S', cod: 10, notes: '<b>Note</b>' }
            ];
            
            const mockLink = { click: jest.fn(), href: '', download: '' };
            
            // Conditional spy for createElement to catch the link creation
            const originalCreateElement = document.createElement;
            const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'a') {
                    return mockLink;
                }
                return originalCreateElement.call(document, tagName);
            });

            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            try {
                exportPbisAsCsv(pbis);

                expect(global.Blob).toHaveBeenCalled();
                const blobContent = global.Blob.mock.calls[0][0][0];
                
                // Check Header
                expect(blobContent).toContain('Title;Comp;Eff;Dbt;JS;Size');
                // Check Data Row with escaping
                expect(blobContent).toContain('"Item ""A"""');
                expect(blobContent).toContain(';3;');
                expect(blobContent).toContain(';S;');
                // This will now work because htmlToMarkdown creates a real div internally
                expect(blobContent).toContain('**Note**');
                
                expect(mockLink.click).toHaveBeenCalled();
            } finally {
                createElementSpy.mockRestore();
            }
        });
    });
});

describe('Math & Logic Utils', () => {
    describe('calculateWSJF', () => {
        test('should calculate correct values', () => {
            expect(calculateWSJF(20, 10)).toBe(2);
        });
        test('should handle zero jobSize', () => {
            expect(calculateWSJF(20, 0)).toBe(0);
        });
    });

    describe('calculateWsjfRanks', () => {
        test('should rank items by WSJF descending', () => {
            const list = [
                { id: 1, cod: 10, jobSize: 2 }, // 5
                { id: 2, cod: 20, jobSize: 2 }, // 10 (Rank 1)
                { id: 3, cod: 12, jobSize: 3 }  // 4
            ];
            const ranks = calculateWsjfRanks(list);
            expect(ranks['2']).toBe(1);
            expect(ranks['1']).toBe(2);
            expect(ranks['3']).toBe(3);
        });
    });

    describe('rgbToHex', () => {
        test('should convert rgb(r, g, b)', () => {
            expect(rgbToHex('rgb(255, 0, 0)')).toBe('#FF0000');
        });
        test('should return null for invalid', () => {
            expect(rgbToHex('red')).toBeNull();
        });
    });
    
    describe('compareSemver', () => {
        test('should compare versions correctly', () => {
            expect(compareSemver('1.0.0', '1.0.1')).toBeLessThan(0);
            expect(compareSemver('1.1', '1.0.9')).toBeGreaterThan(0);
        });
    });

    // ======================================================================
    // COLOR UTILITY TESTS
    // ======================================================================
    describe('Color Utilities', () => {
        /** * Test suite for generatePastelColors.
         * Verifies that the function respects the global palette configuration
         * and handles fallback scenarios correctly.
         */
        describe('generatePastelColors', () => {
            test('should return fallback colors if palette is missing or empty', () => {
                // Setup: Empty palette
                global.config.pastelColorPalette = [];
                
                // Mute console.warn for this test to keep output clean
                const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
                
                const colors = generatePastelColors(3);
                
                expect(colors).toHaveLength(3);
                // Expect the hardcoded fallback grey defined in 6_utils.js
                expect(colors[0]).toBe('#e0e0e0');
                expect(colors[1]).toBe('#e0e0e0'); 
                
                warnSpy.mockRestore();
            });

            test('should return colors from the palette sequentially', () => {
                // Setup: Define a specific palette
                global.config.pastelColorPalette = ['#FF0000', '#00FF00', '#0000FF'];
                
                const colors = generatePastelColors(2, null, 0);
                
                expect(colors[0]).toBe('#FF0000');
                expect(colors[1]).toBe('#00FF00');
            });

            test('should try to avoid the current color when requesting a single color', () => {
                global.config.pastelColorPalette = ['#AAAAAA', '#BBBBBB'];
                
                // If current is AAAAAA, it should return BBBBBB
                const result = generatePastelColors(1, '#AAAAAA');
                
                expect(result).toHaveLength(1);
                expect(result[0]).toBe('#BBBBBB');
            });
        });
    });
});

describe('UI Update Utilities', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="modal-reset-container"><button id="reset-job-size-btn"></button></div>
            <input id="pbi-complexity" value="0"><input id="pbi-effort" value="0"><input id="pbi-doubt" value="0">
            
            <div class="modal-reset-container"><button id="reset-cod-btn"></button></div>
            <input id="pbi-cod-bv" value="0"><input id="pbi-cod-tc" value="0"><input id="pbi-cod-rroe" value="0">
            
            <input type="range" id="slider1" value="50" min="0" max="100">
        `;
    });

   test('updateResetJobSizeButtonVisibility disables/enables button instead of hiding', () => {
        updateResetJobSizeButtonVisibility();
        const btn = document.querySelector('#reset-job-size-btn');
        expect(btn.disabled).toBe(true);
        expect(btn.style.display).not.toBe('none');

        document.getElementById('pbi-complexity').value = '1';
        updateResetJobSizeButtonVisibility();
        expect(btn.disabled).toBe(false);
        expect(btn.style.display).not.toBe('none');
    });

    test('updateResetCoDButtonVisibility disables/enables button instead of hiding', () => {
        updateResetCoDButtonVisibility();
        const btn = document.querySelector('#reset-cod-btn');
        expect(btn.disabled).toBe(true);
        expect(btn.style.display).not.toBe('none');

        document.getElementById('pbi-cod-tc').value = '1';
        updateResetCoDButtonVisibility();
        expect(btn.disabled).toBe(false);
        expect(btn.style.display).not.toBe('none');
    });

    test('updateSliderFill sets CSS var', () => {
        const s = document.getElementById('slider1');
        s.style.setProperty = jest.fn();
        updateSliderFill(s);
        expect(s.style.setProperty).toHaveBeenCalledWith('--pct', '50%');
    });
});

describe('Update Checker', () => {
    let consoleWarnSpy;
    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        document.body.innerHTML = '<meta name="version" content="1.0.0"><span id="info-version-value"></span><div id="update-notification-container"></div>';
        document.documentElement.style.setProperty = jest.fn();
    });
    afterEach(() => consoleWarnSpy.mockRestore());

    test('checkForUpdates detects new version', async () => {
        global.fetch.mockResolvedValue({ json: () => Promise.resolve({ version: '1.1.0' }) });
        await checkForUpdates();
        expect(document.querySelector('.update-notification')).not.toBeNull();
    });

    test('checkForUpdates respects dismissed version', async () => {
        window.localStorage.setItem('sizeRight_dismissedUpdateVersion', '1.1.0');
        global.fetch.mockResolvedValue({ json: () => Promise.resolve({ version: '1.1.0' }) });
        await checkForUpdates();
        expect(document.querySelector('.update-notification')).toBeNull();
    });
});

// ======================================================================
// IMPORT / EXPORT DATA & LOGIC
// ======================================================================
describe('Import/Export Data', () => {
    test('exportPbisAsJson calls showSaveFilePicker', async () => {
        global.pbis = [{ id: 1, title: 'Export Me', isLastItem: false }];
        await exportPbisAsJson();
        expect(global.window.showSaveFilePicker).toHaveBeenCalled();
    });

    test('handleImport parses JSON and calls applyImportedData', () => {
        const fileContent = { settings: {}, backlogItems: [] };
        mockFileReader.result = JSON.stringify(fileContent);
        
        handleImport({ target: { files: [{ name: 'test.json' }] } });
        mockFileReader.onload({ target: { result: mockFileReader.result } });
        
        expect(global.renderAll).toHaveBeenCalled(); // applyImportedData calls renderAll
    });

    describe('applyImportedData Logic', () => {
        /**
         * Test suite for applyImportedData.
         * Verifies handling of different file formats (Legacy Array vs. New State Object)
         * and ensures global state is updated accordingly.
         */

        test('should handle "Legacy Format" (simple array of PBIs)', () => {
            // Setup: Legacy format is just an array [ { ... }, { ... } ]
            const legacyData = [
                { id: 'legacy_1', title: 'Old Item', jobSize: 5 }
            ];

            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            // Mute warn for legacy format import
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            global.renderAll.mockClear();

            // Execute
            applyImportedData(legacyData, 'legacy.json');

            // Verify
            expect(global.pbis).toHaveLength(1);
            expect(global.pbis[0].title).toBe('Old Item');
            // Legacy import should reset settings to defaults
            expect(global.currentSortCriteria).toBe('creationOrder'); 
            expect(global.renderAll).toHaveBeenCalled();
            
            warnSpy.mockRestore();
        });

        test('should handle "New Format" (Object with settings & backlogItems)', () => {
            // Setup: New format contains settings
            const newData = {
                settings: {
                    language: 'hu', // Hungarian
                    scale: 'fibonacci'
                },
                backlogItems: [
                    { id: 'new_1', title: 'New Item' }
                ]
            };

            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            
            // Execute
            applyImportedData(newData, 'new_format.json');

            // Verify
            expect(global.pbis).toHaveLength(1);
            expect(global.currentLanguage).toBe('hu'); // Settings applied
            expect(global.lastImportedFileName).toBe('new_format.json');
        });

        test('should throw error/alert on invalid data structure', () => {
            const invalidData = { randomField: 'nothing' };
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Execute
            applyImportedData(invalidData, 'bad.json');

            // Verify: Error caught and user alerted
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
            expect(global.lastImportedFileName).toBeNull();
            
            consoleSpy.mockRestore();
        });
        
        test('should restore custom sort order from imported data', () => {
             // Setup: Data with customSortIndex
             const sortData = {
                 settings: { sortCriteria: 'custom' },
                 backlogItems: [
                     { id: 'a', title: 'A', customSortIndex: 1 },
                     { id: 'b', title: 'B', customSortIndex: 0 }
                 ]
             };
             
             // Execute
             applyImportedData(sortData, 'sort.json');
             
             // Verify: lockedPbiOrder should be reconstructed
             // Item 'b' has index 0, so it should be first
             expect(global.lockedPbiOrder[0]).toBe('b');
             expect(global.lockedPbiOrder[1]).toBe('a');
             expect(global.initialCustomOrderSet).toBe(true);
        });
    });
});


describe('Layout & Resize', () => {
    let warningOverlay;
    
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="resolution-warning" class="hidden"></div>
            <div id="pbi-list"></div>
            <div id="relative-sizing-list"></div>
        `;
        warningOverlay = document.getElementById('resolution-warning');
        window.isResolutionWarningDismissed = false;
        setWindowSize(1920, 1080);
    });

    test('checkScreenResolution hides warning on large screens', () => {
        setWindowSize(1920, 1080);
        checkScreenResolution();
        expect(warningOverlay.classList.contains('hidden')).toBe(true);
        expect(document.body.classList.contains('scroll-active')).toBe(true);
    });

    test('checkScreenResolution shows warning on small screen if NOT dismissed', () => {
        setWindowSize(800, 600); 
        window.isResolutionWarningDismissed = false;
        
        checkScreenResolution();
        
        expect(warningOverlay.classList.contains('hidden')).toBe(false); 
        expect(document.body.classList.contains('scroll-active')).toBe(false); 
    });

    test('checkScreenResolution HIDES warning on small screen if DISMISSED', () => {
        setWindowSize(800, 600); 
        window.isResolutionWarningDismissed = true; 
        
        checkScreenResolution();
        
        expect(warningOverlay.classList.contains('hidden')).toBe(true); 
        expect(document.body.classList.contains('scroll-active')).toBe(true); 
    });

    test('initResizeHandler attaches listener', () => {
        const spy = jest.spyOn(window, 'addEventListener');
        initResizeHandler();
        expect(spy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
});