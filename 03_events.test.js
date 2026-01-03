// ===================================================================================
// 03_EVENTS.TEST.JS
// ===================================================================================

/**
 * @file 03_events.test.js
 * @description Unit tests for the interaction controller (3_events.js).
 * * Objectives:
 * 1. Verify Global Event Listeners:
 * - Handling clicks on Delete/Edit buttons in the list.
 * - Modal navigation logic (Next/Prev item).
 * 2. Test Drag & Drop Integration (SortableJS):
 * - Initialization conditions (Custom sort vs. Standard sort).
 * - Handling sort-end events and updating the locked order.
 * 3. Validate Rich Text Editor Logic:
 * - `handlePasteInNote`: Sanitizing input (stripping scripts, keeping formatting).
 * 4. Ensure Input Logic & Constraints:
 * - Slider interaction (snapping to scale values).
 * - Zero-locking behavior for dependent values.
 * - Filter lock toggling and state restoration.
 */

// --- Tell Jest to control timers ---
jest.useFakeTimers();

// Import functions to test
const {
    handlePbiListClick,
    savePbiFromModal,
    handleModalNavClick,
    toggleHighlight,
    deactivateFilterLock,
    updateFilterLockButtonState,
    handleSavePbi,
    initSortable,
    destroySortable,
    handleSortEnd,
    handlePasteInNote,
    handleSliderInput,
    setupEventListeners
} = require('./3_events.js');

// --- Global Mocks for Dependencies ---
// Core UI Functions
global.renderAll = jest.fn();
global.saveToLocalStorage = jest.fn();
global.showModal = jest.fn(); 
global.confirm = jest.fn(() => true);
global.alert = jest.fn();

// Modal & Settings Functions (Missing previously)
global.openSettingsModal = jest.fn();
global.openDocumentation = jest.fn();
global.saveAndCloseSettings = jest.fn();
global.resetSettingsToDefault = jest.fn();

// Logic & Utils
global.getSortedPbis = jest.fn(); 
global.getIsModalDirty = jest.fn(() => false);
global.markModalAsDirty = jest.fn();
global.exportPbisAsJson = jest.fn();
global.handleImport = jest.fn();
global.checkScreenResolution = jest.fn();
global.updateExportModalUI = jest.fn();
global.exportPbisAsCsv = jest.fn();
global.clearLocalStorageAndReset = jest.fn();
global.loadDemoData = jest.fn();
global.getTshirtSizeFromValue = jest.fn();
global.highlightAndScrollToLastEditedPbi = jest.fn();

// Visualization & Popups
global.showTshirtPopup = jest.fn();
global.showValuePopup = jest.fn();
global.renderWsjfVisualization = jest.fn();
global.generatePastelColors = jest.fn();
global.rgbToHex = jest.fn();

// Layout & Synchronization
global.initSyncScroll = jest.fn();
global.syncRowHeights = jest.fn();
global.syncRelativeSizingHeaderPadding = jest.fn();
global.updateSortDirectionButtons = jest.fn();
global.updateFilterButtonStates = jest.fn();
global.updateAllSliderFills = jest.fn();
global.updateActiveScaleValue = jest.fn();

// Mock Utils normally found in 6_utils.js
global.findNearestScaleValue = jest.fn((val, scale) => {
    // Simple mock logic for finding nearest
    return scale.reduce(function(prev, curr) {
        return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
    });
});

// Mock SortableJS Library
const mockDestroy = jest.fn();
global.Sortable = {
    create: jest.fn().mockReturnValue({
        destroy: mockDestroy
    })
};

const setupDom = () => {
    document.body.innerHTML = `
        <div id="edit-modal" style="display:none;"></div>
        <div id="settings-modal" style="display:none;"></div>
        <div id="info-modal" style="display:none;"></div>
        <div id="reset-app-modal" style="display:none;"></div>
        <div id="csv-export-modal" style="display:none;"></div>

        <input id="pbi-title">
        <input id="pbi-complexity" type="range"><input id="pbi-effort" type="range"><input id="pbi-doubt" type="range">
        <input id="pbi-cod-bv" type="range"><input id="pbi-cod-tc" type="range"><input id="pbi-cod-rroe" type="range">
        <div id="pbi-notes" contenteditable="true"></div>
        <div id="modal-tshirt-display"></div>
        
        <button id="modal-prev-btn"></button>
        <button id="modal-next-btn"></button>
        <button id="export-btn"></button>
        <button id="import-btn"></button>
        <input type="file" id="import-file-input">
        <button id="add-pbi-btn"></button>
        <button id="cancel-btn"></button>
        <button id="save-btn"></button>
        <button id="reset-job-size-btn"></button>
        <button id="toggle-ref-markers-btn"></button>
        <button id="toggle-ref-markers-cod-btn"></button>
        <button id="reset-cod-btn"></button>
        <button id="settings-btn"></button>
        <button id="help-btn"></button>
        <button id="settings-cancel-btn"></button>
        <button id="settings-save-btn"></button>
        <button id="reset-settings-btn"></button>
        <button id="info-btn"></button>
        <button id="info-close-btn"></button>
        <button id="info-tab-btn-software"></button>
        <button id="info-tab-btn-thirdparty"></button>
        <button id="reset-app-btn"></button>
        <button id="reset-app-cancel-btn"></button>
        <button id="reset-app-export-btn"></button>
        <button id="reset-app-confirm-btn"></button>
        <button id="btn-csv-export"></button>
        <button id="btn-csv-export-cancel"></button>
        <button id="btn-csv-export-confirm"></button>
        
        <button id="filter-job-size-btn" class="filter-btn"></button>
        <button id="filter-cod-btn" class="filter-btn"></button>
        <button id="filter-wsjf-btn" class="filter-btn"></button>
        <button id="filter-tshirt-size-btn" class="filter-btn"></button>
        <button id="custom-sort-btn"></button>
        <button id="sort-asc-btn"></button>
        <button id="sort-desc-btn"></button>
        <button id="filter-lock-btn"></button>
        <button id="reset-filters-btn"></button>
        
        <button id="csv-sort-btn-job-size"></button>
        <button id="csv-sort-btn-tshirt-size"></button>
        <button id="csv-sort-btn-cod"></button>
        <button id="csv-sort-btn-wsjf"></button>
        <button id="csv-sort-custom-btn"></button>
        <button id="csv-sort-asc-btn"></button>
        <button id="csv-sort-desc-btn"></button>

        <button id="tab-btn-jobsize"></button>
        <button id="tab-btn-cod"></button>
        <div id="tab-content-jobsize"></div>
        <div id="tab-content-cod"></div>
        <div id="view-tab-job-size-viz"></div>
        <div id="view-tab-cod-viz"></div>
        <div id="view-tab-wsjf-viz"></div>
        <div id="view-tab-relative-sizing"></div>
        
        <div id="pbi-list"></div>
        <div id="pbi-list-container"></div>
        <div id="visualization-container"></div>
        <div id="cod-visualization-container"></div>
        <div id="wsjf-visualization-container"></div>
        <div id="relative-sizing-list"></div>
        <div id="relative-sizing-header">
             <div class="rs-col-header"></div>
        </div>
        <div id="panel-job-size-viz"></div>
        <div id="panel-cod-viz"></div>
        <div id="panel-wsjf-viz"></div>
        <div id="panel-relative-sizing"></div>
        <div id="info-tab-content-software"></div>
        <div id="info-tab-content-thirdparty"></div>
        <div id="split-root"></div>
        <div id="editor-toolbar"></div>

        <div id="resolution-warning" class="hidden"></div>
        <button id="resolution-warning-ignore-btn"></button>
    `;
};

// --- Setup Global State ---
const setupGlobalState = () => {
    global.config = {
        uiStrings: {
            confirmDelete: 'Are you sure?',
            tooltipFilterLock: 'Lock',
            tooltipFilterUnlock: 'Unlock'
        }
    };
    global.pbis = [];
    global.currentSortCriteria = 'jobSize';
    global.currentSortDirection = 'asc';
    global.isFilterLocked = false;
    global.lockedPbiOrder = [];
    global.preLockSortCriteria = 'jobSize';
    global.preLockSortDirection = 'asc';
    global.currentEditingId = null;
    global.lastEditedPbiId = null;
    global.currentScale = 'safe';
    global.initialCustomOrderSet = false;
    
    // Explicitly reset mocks that track calls
    mockDestroy.mockClear();
    global.Sortable.create.mockClear();
    
    global.SCALES = {
        safe: { values: [0, 1, 2, 3, 5, 8, 13] }
    };
};

beforeEach(() => {
    setupGlobalState();
    jest.clearAllMocks();
    setupDom();
});

// --- Test Suite: PBI List Interactions ---
describe('handlePbiListClick', () => {
    test('should trigger delete logic when delete button is clicked', () => {
        global.pbis = [{ id: 1, title: 'Test Item', isLastItem: false }];
        document.getElementById('pbi-list').innerHTML = 
            '<div class="pbi-item" data-id="1"><button class="delete">Delete</button></div>';
        
        handlePbiListClick({ target: document.querySelector('.delete') });

        expect(global.confirm).toHaveBeenCalledWith(global.config.uiStrings.confirmDelete);
        expect(global.pbis.length).toBe(0);
        expect(global.saveToLocalStorage).toHaveBeenCalled();
        expect(global.renderAll).toHaveBeenCalled();
    });

    test('should call showModal when edit button is clicked', () => {
        const item = { id: 2, title: 'Edit Me', isLastItem: false };
        global.pbis = [item];
        document.getElementById('pbi-list').innerHTML = 
            '<div class="pbi-item" data-id="2"><button class="edit"></button></div>';

        handlePbiListClick({ target: document.querySelector('.edit') });
        expect(global.showModal).toHaveBeenCalledWith(item);
    });
});

// --- Test Suite: SortableJS Integration (Drag & Drop) ---
describe('SortableJS Integration', () => {
    
    test('initSortable should create instance if custom sort and not locked', () => {
        global.currentSortCriteria = 'custom';
        global.isFilterLocked = false;
        
        initSortable();
        
        expect(global.Sortable.create).toHaveBeenCalled();
        expect(document.getElementById('pbi-list')).not.toBeNull();
    });

    test('initSortable should NOT create instance if sort criteria is not custom', () => {
        global.currentSortCriteria = 'jobSize';
        initSortable();
        expect(global.Sortable.create).not.toHaveBeenCalled();
    });

    test('destroySortable should destroy instance if it exists', () => {
        // 1. Setup conditions to create the instance first
        global.currentSortCriteria = 'custom';
        global.isFilterLocked = false;
        
        initSortable(); // This sets the internal variable
        
        // 2. Now destroy it
        destroySortable();
        
        // 3. Verify the destroy method on the mock object was called
        expect(mockDestroy).toHaveBeenCalled();
    });

    test('handleSortEnd should update lockedPbiOrder based on DOM order', () => {
        // Setup DOM to reflect new order
        document.getElementById('pbi-list').innerHTML = 
            '<div class="pbi-item" data-id="10"></div>' +
            '<div class="pbi-item" data-id="20"></div>';
        
        const mockEvt = { item: { dataset: { id: "10" } } };
        
        handleSortEnd(mockEvt);
        
        expect(global.lockedPbiOrder).toEqual([10, 20]);
        expect(global.lastEditedPbiId).toBe(10);
        expect(global.saveToLocalStorage).toHaveBeenCalled();
        expect(global.renderAll).toHaveBeenCalled();
    });
});

// --- Test Suite: Rich Text Editor (Paste Sanitization) ---
describe('Rich Text Editor: handlePasteInNote', () => {
    
    // Mock execCommand since JSDOM doesn't support it fully
    document.execCommand = jest.fn();

    test('should strip dangerous tags (script) but keep text', () => {
        const mockEvent = {
            preventDefault: jest.fn(),
            clipboardData: {
                getData: jest.fn((type) => {
                    if (type === 'text/html') return '<b>Bold</b><script>alert("hack")</script>';
                    if (type === 'text/plain') return 'Boldalert("hack")';
                })
            }
        };

        handlePasteInNote(mockEvent);

        expect(document.execCommand).toHaveBeenCalledWith(
            "insertHTML", 
            false, 
            expect.stringContaining('<b>Bold</b>') // Should have bold
        );
        expect(document.execCommand).toHaveBeenCalledWith(
            "insertHTML", 
            false, 
            expect.not.stringContaining('<script>') // Should NOT have script
        );
    });

    test('should preserve allowed formatting (Bold, Italic, Link)', () => {
         const mockEvent = {
            preventDefault: jest.fn(),
            clipboardData: {
                getData: jest.fn((type) => {
                    if (type === 'text/html') return '<b>B</b><i>I</i><a href="http://test.com">Link</a>';
                    return '';
                })
            }
        };

        handlePasteInNote(mockEvent);

        // JSDOM may normalize URL by adding trailing slash, so we expect that possibility
        const lastCall = document.execCommand.mock.calls[0];
        const insertedHTML = lastCall[2];
        
        expect(insertedHTML).toContain('<b>B</b>');
        expect(insertedHTML).toContain('<i>I</i>');
        // Regex to match both http://test.com and http://test.com/
        expect(insertedHTML).toMatch(/<a href="http:\/\/test\.com\/?" target="_blank">Link<\/a>/);
    });
});

// --- Test Suite: Slider Logic (Snapping) ---
describe('Slider Logic: handleSliderInput', () => {
    
    // Mock dependent functions
    global.updateSliderValues = jest.fn();
    global.updateSliderFill = jest.fn();
    global.validateAndSyncModal = jest.fn();
    global.updateResetJobSizeButtonVisibility = jest.fn();

    test('should snap value to nearest scale step', () => {
        const slider = document.getElementById('pbi-complexity');
        slider.value = "4"; // Raw input (user slid to index 4)
        
        handleSliderInput(slider);
        
        expect(global.findNearestScaleValue).toHaveBeenCalled();
        expect(global.updateSliderFill).toHaveBeenCalledWith(slider);
        expect(global.validateAndSyncModal).toHaveBeenCalled();
    });

    test('should lock zero if value > 0', () => {
        const slider = document.getElementById('pbi-effort');
        slider.value = "2"; // Assume scale value 2
        global.findNearestScaleValue.mockReturnValue(2); // Mock return
        
        handleSliderInput(slider);
        
        expect(slider.dataset.zeroLocked).toBe("true");
    });
});

// --- Test Suite: Data Persistence (Modal Save) ---
describe('savePbiFromModal', () => {
    beforeEach(() => {
        document.getElementById('pbi-title').value = 'New Item';
        document.getElementById('pbi-complexity').value = '1'; 
        document.getElementById('pbi-effort').value = '1';
        document.getElementById('pbi-doubt').value = '1';
    });

    test('should create a new PBI when currentEditingId is null', () => {
        global.currentEditingId = null;
        global.pbis = [];

        savePbiFromModal(true);

        expect(global.pbis.length).toBe(1);
        expect(global.pbis[0].title).toBe('New Item');
        expect(global.saveToLocalStorage).toHaveBeenCalled();
    });

    test('should update existing PBI when currentEditingId is set', () => {
        const existingItem = { id: 99, title: 'Old Title', complexity: 0 };
        global.pbis = [existingItem];
        global.currentEditingId = 99;
        document.getElementById('pbi-title').value = 'Updated Title';
        
        savePbiFromModal(true);

        expect(global.pbis[0].title).toBe('Updated Title');
    });
});

// --- Test Suite: Filter Lock Logic ---
describe('Filter Lock Logic', () => {
    test('updateFilterLockButtonState should toggle active class', () => {
        global.isFilterLocked = true;
        updateFilterLockButtonState();
        const btn = document.getElementById('filter-lock-btn');
        expect(btn.classList.contains('active')).toBe(true);
    });

    test('deactivateFilterLock should restore criteria', () => {
        global.isFilterLocked = true;
        global.preLockSortCriteria = 'wsjf';
        
        deactivateFilterLock();

        expect(global.isFilterLocked).toBe(false);
        expect(global.currentSortCriteria).toBe('wsjf');
    });
});

// --- Test Suite: Resolution Warning ---
describe('Resolution Warning', () => {
    test('clicking ignore button sets global flag', () => {
        // Setup Listeners
        setupEventListeners();
        
        const btn = document.getElementById('resolution-warning-ignore-btn');
        btn.click();

        expect(window.isResolutionWarningDismissed).toBe(true);
        expect(global.saveToLocalStorage).toHaveBeenCalled();
    });
});