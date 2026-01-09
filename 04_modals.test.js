// ===================================================================================
// 04_MODALS.TEST.JS
// ===================================================================================

/**
 * @file 04_modals.test.js
 * @description Unit tests for the dialog controller (4_modals.js).
 * * Objectives:
 * 1. Verify Modal Lifecycle Management:
 * - Opening in 'New' vs. 'Edit' mode.
 * - Correct population of form fields from PBI data.
 * 2. Test Validation & Dirty State:
 * - `validateAndSyncModal`: Real-time calculation of totals and WSJF.
 * - Tracking unsaved changes (`getIsModalDirty`).
 * 3. Ensure Settings Persistence & Migration:
 * - Saving user preferences (Language, Colors, Scale).
 * - Migrating PBI values when switching scales (e.g., Safe -> Metric).
 * 4. Validate Popup Interactions:
 * - T-Shirt size picker functionality.
 * - Relative Sizing value picker (updating logic).
 * 5. Verify Help Icon System:
 * - Wrapper generation and positioning logic.
 * - Backdrop interactions.
 */

// Defines globals needed for module execution/loading immediately
global.currentSortCriteria = 'jobSize'; 
global.currentSortDirection = 'asc';
global.pbis = [];
global.config = { uiStrings: {} };
global.activePopupPbiId = null;
global.lastEditedPbiId = null;
global.currentScale = 'safe';
global.currentLanguage = 'en';
global.isWsjfTabActive = false;

// Ensure window properties match (for JSDOM consistency)
if (typeof window !== 'undefined') {
    window.currentSortCriteria = global.currentSortCriteria;
    window.currentSortDirection = global.currentSortDirection;
    window.pbis = global.pbis;
}

// Import module
const modalsModule = require('./4_modals.js');

// Destructure functions
const {
    updateResetCoDButtonVisibility,
    validateAndSyncModalLogic,
    showModal,
    openSettingsModal,
    resetSettingsToDefault,
    saveAndCloseSettings,
    showTshirtPopup,
    showValuePopup,
    updateModalNavButtons,
    getIsModalDirty,
    markModalAsDirty,
    updateHelpIcons, // Exported via modification
    validateAndSyncModal // Exported via modification
} = modalsModule;

// --- Mocks for functions from other files/globals ---
global.syncSliderMax = jest.fn();
global.generateSliderScales = jest.fn();
global.updateAllSliderFills = jest.fn();
global.updateSliderValues = jest.fn();
global.updateActiveScaleValue = jest.fn();
global.updateResetJobSizeButtonVisibility = jest.fn();
global.applyColorSettings = jest.fn();
global.applyUiStrings = jest.fn();
global.renderAll = jest.fn();
global.checkForUpdates = jest.fn();
global.requestAnimationFrame = jest.fn(cb => cb());
global.toggleHighlight = jest.fn();
global.updateRefMarkerButtonState = jest.fn();
global.saveToLocalStorage = jest.fn(); // Mock save for dirty logic
// Mock updateSliderFill as it is used in showModal
global.updateSliderFill = jest.fn();

// Mock getSortedPbis as it is crucial for navigation logic
global.getSortedPbis = jest.fn((pbis) => pbis.filter(p => !p.isLastItem));

// --- Global Config / State ---
const setupGlobalState = () => {
    global.SCALES = { 
        safe: { values: [0, 1, 2, 3, 5, 8] },
        metric: { values: [0, 1, 2, 3, 4, 5, 6, 7, 8]},
        fibonacci: { values: [0, 1, 2, 3, 5, 8, 13] }
    };
    global.currentScale = 'safe';
    global.currentLanguage = 'en';
    global.pbis = []; 
    global.activePopupPbiId = null; 
    global.lastEditedPbiId = null; 
    global.currentSortCriteria = 'jobSize';
    global.currentSortDirection = 'asc';
    global.isWsjfTabActive = false;
    
    // Ensure window property sync for JSDOM
    if (typeof window !== 'undefined') {
        window.currentSortCriteria = global.currentSortCriteria;
        window.currentSortDirection = global.currentSortDirection;
        window.pbis = global.pbis;
    }
    
    global.config = {
        uiStrings: {
            modalTitleEdit: 'Edit PBI',
            modalTitleNew: 'New PBI',
            pbiInfoTshirtSize: 'Size',
            jobsizeHint: 'Set all three values',
            jobsizeHintComplete: 'Job Size is: {jobSize}',
            codHint: 'Set all three CoD values',
            codHintComplete: 'CoD is: {codSize}',
            pbiInfoWSJF: 'WSJF',
            pbiInfoNA: 'na',
            // Nav Strings
            navItemCount: "Item {current} of {total}",
            navRefMin: "REFERENCE ITEM MIN",
            navRefMax: "REFERENCE ITEM MAX",
            navPrevItem: "Previous Item",
            navNextItem: "Next Item",
            navPrevItemSave: "Save & Previous",
            navNextItemSave: "Save & Next"
        },
        languages: { 
            en: { pageTitle: 'English' },
            de: { pageTitle: 'German' }
        },
        tshirtSizes: ['S', 'M', 'L'],
        allTshirtSizes: ['XS', 'S', 'M', 'L', 'XL'],
        defaultSettings: {
            language: 'en',
            scale: 'safe',
            tshirtSizes: ['S', 'M', 'L', 'XL']
        },
        colors: {
            complexity: '#aaaaaa', effort: '#bbbbbb', doubt: '#cccccc', total: '#dddddd',
            numberComplexity: '#111111', numberEffort: '#222222', numberDoubt: '#333333',
            bv: '#444444', tc: '#555555', rroe: '#666666',
            numberBv: '#777777', numberTc: '#888888', numberRrOe: '#999999'
        },
        defaultColors: {
            complexity: '#aaaaaa', effort: '#bbbbbb', doubt: '#cccccc', total: '#dddddd',
            numberComplexity: '#111111', numberEffort: '#222222', numberDoubt: '#333333',
            bv: '#444444', tc: '#555555', rroe: '#666666',
            numberBv: '#777777', numberTc: '#888888', numberRrOe: '#999999'
        },
        editorColors: {
            "1": "#279745", "2": "#2560d1", "3": "#937404", "4": "#c90000"
        },
        defaultEditorColors: {
            "1": "#279745", "2": "#2560d1", "3": "#937404", "4": "#c90000"
        },
        scaleHelpUrls: {
            complexity: 'http://help.com/complexity'
        }
    };
    global.currentEditingId = null;
};

// --- Helper to refresh DOM for each test ---
const setupDom = () => {
    document.body.innerHTML = `
        <div id="edit-modal" style="display: none;">
            <h2 id="modal-title"></h2>
            <input id="pbi-id">
            <input id="pbi-title">
            <textarea id="pbi-notes"></textarea>
            <div id="modal-tshirt-display" style="display: none;">
                <span class="modal-tag-label"></span>
                <span class="modal-tag-value"></span>
            </div>
            <div id="modal-wsjf-display" style="display: none;">
                <span class="modal-tag-label"></span>
                <span class="modal-tag-value"></span>
            </div>
            
            <button id="tab-btn-jobsize"></button>
            <div id="tab-content-jobsize">
                 <div id="jobsize-hint"></div>
                 <div class="modal-reset-container"><button id="reset-job-size-btn"></button></div>
                 
                 <a id="help-icon-complexity" style="display:none">?</a>
                 <a id="help-icon-effort" style="display:none">?</a>
                 <a id="help-icon-doubt" style="display:none">?</a>
            </div>
            
            <button id="tab-btn-cod"></button>
            <div id="tab-content-cod">
                <div id="cod-hint"></div>
                 <div class="modal-reset-container"><button id="reset-cod-btn"></button></div>
                 
                 <a id="help-icon-cod_bv" style="display:none">?</a>
                 <a id="help-icon-cod_tc" style="display:none">?</a>
                 <a id="help-icon-cod_rroe" style="display:none">?</a>
            </div>
            
            <input type="range" id="pbi-complexity" value="0">
            <input type="range" id="pbi-effort" value="0">
            <input type="range" id="pbi-doubt" value="0">
            <input type="range" id="pbi-cod-bv" value="0">
            <input type="range" id="pbi-cod-tc" value="0">
            <input type="range" id="pbi-cod-rroe" value="0">
            
            <button id="save-btn"></button>
            <span id="job-size-total"></span>
            <span id="cod-total"></span>
            <span id="wsjf-value"></span>
            
            <div class="modal-nav-header">
                <button id="modal-prev-btn"></button><span id="modal-prev-label"></span>
                <span id="modal-nav-info"></span>
                <button id="modal-next-btn"></button><span id="modal-next-label"></span>
            </div>
            <div class="modal-footer"></div>
        </div>
        
        <div id="settings-modal" style="display: none;">
            <input type="radio" name="language-setting" value="en">
            <input type="radio" name="language-setting" value="de">
            <div id="tshirt-sizes-options"></div>
            <input type="radio" name="scale-setting" value="safe">
            <input type="radio" name="scale-setting" value="metric">
            <input type="color" id="color-complexity-setting">
            <input type="color" id="color-effort-setting">
            <input type="color" id="color-doubt-setting">
            <input type="color" id="color-total-setting">
            <input type="color" id="color-number-complexity-setting">
            <input type="color" id="color-number-effort-setting">
            <input type="color" id="color-number-doubt-setting">
            <input type="color" id="color-bv-setting">
            <input type="color" id="color-tc-setting">
            <input type="color" id="color-rroe-setting">
            <input type="color" id="color-number-bv-setting">
            <input type="color" id="color-number-tc-setting">
            <input type="color" id="color-number-rroe-setting">
            <input type="color" id="setting-editor-c1">
            <input type="color" id="setting-editor-c2">
            <input type="color" id="setting-editor-c3">
            <input type="color" id="setting-editor-c4">
            <input type="checkbox" id="setting-show-ref-markers">
            <input type="checkbox" id="setting-show-res-warning">
        </div>
        
        <div id="tooltip-backdrop"></div> 
        <div id="update-notification-container"></div>
        <div id="panel-wsjf-viz" class="hidden"></div>
        `;
};

describe('Dirty State Logic', () => {
    beforeEach(() => { setupGlobalState(); setupDom(); });

    test('should report false dirty state initially', () => {
        showModal(null); // Resets state
        expect(getIsModalDirty()).toBe(false);
    });

    test('should report true dirty state after marking', () => {
        showModal(null);
        markModalAsDirty();
        expect(getIsModalDirty()).toBe(true);
    });
    
    test('markModalAsDirty should trigger updateModalNavButtons if editing', () => {
        const pbi = { id: 1, title: 'Item' };
        global.pbis = [pbi];
        showModal(pbi);
        
        markModalAsDirty();
        
        const prevLabel = document.getElementById('modal-prev-label');
        const nextLabel = document.getElementById('modal-next-label');
        
        expect(prevLabel.textContent).toBe(global.config.uiStrings.navPrevItemSave);
        expect(nextLabel.textContent).toBe(global.config.uiStrings.navNextItemSave);
    });
});

describe('Modal Navigation & Labels Tests', () => {
    beforeEach(() => { 
        setupGlobalState(); 
        setupDom(); 
        // Setup list of 3 items for navigation tests
        global.pbis = [
            { id: 1, title: 'Item 1' },
            { id: 2, title: 'Item 2', isReference: true, referenceType: 'min' },
            { id: 3, title: 'Item 3' }
        ];
        global.getSortedPbis.mockReturnValue(global.pbis);
    });

    test('should disable Prev button at start of list', () => {
        // Explicitly check if function exists before calling to debug
        if (typeof updateModalNavButtons !== 'function') {
            throw new Error('updateModalNavButtons is not a function! Check exports in 4_modals.js');
        }
        updateModalNavButtons(1); 
        expect(document.getElementById('modal-prev-btn').disabled).toBe(true);
        expect(document.getElementById('modal-next-btn').disabled).toBe(false);
        expect(document.getElementById('modal-nav-info').textContent).toBe('Item 1 of 3');
    });

    test('should disable Next button at end of list', () => {
        updateModalNavButtons(3); 
        expect(document.getElementById('modal-prev-btn').disabled).toBe(false);
        expect(document.getElementById('modal-next-btn').disabled).toBe(true);
        expect(document.getElementById('modal-nav-info').textContent).toBe('Item 3 of 3');
    });

    test('should display Reference Label correctly', () => {
        updateModalNavButtons(2); // Item 2 is Reference Min
        const infoSpan = document.getElementById('modal-nav-info');
        expect(infoSpan.innerHTML).toContain('Item 2 of 3');
        expect(infoSpan.innerHTML).toContain('REFERENCE ITEM MIN');
        expect(infoSpan.querySelector('.ref-min')).not.toBeNull();
    });
});

describe('Help Icons', () => {
        beforeEach(() => {
            // Setup DOM
            document.body.innerHTML = `
                <div id="tooltip-backdrop"></div>
                <a id="help-icon-complexity"></a>
                <a id="help-icon-effort"></a>
            `;
            
            // Mock config
            global.config = {
                uiStrings: {
                    scaleHelp_complexity: 'Complexity Help',
                    scaleHelp_effort: 'Effort Help'
                },
                scaleHelpUrls: null
            };
            
            // Activate Fake Timers to control setTimeout
            jest.useFakeTimers();
        });

        afterEach(() => {
            // Restore Real Timers after tests
            jest.useRealTimers();
        });

        test('should create wrapper and tooltip structure when help text is present', () => {
            updateHelpIcons();
            
            const icon = document.getElementById('help-icon-complexity');
            const wrapper = icon.parentNode;
            
            expect(wrapper.className).toContain('help-icon-wrapper');
            expect(wrapper.className).toContain('pos-top');
            
            const tooltip = wrapper.querySelector('.custom-tooltip');
            expect(tooltip).not.toBeNull();
            expect(tooltip.innerHTML).toBe('Complexity Help');
            expect(icon.style.display).toBe('inline-block');
        });

        test('should set external link when url is present', () => {
            global.config.scaleHelpUrls = {
                effort: 'http://example.com/effort'
            };
            
            updateHelpIcons();
            
            const icon = document.getElementById('help-icon-effort');
            
            // CHANGED: We now EXPECT the wrapper to be present for consistent CSS styling
            expect(icon.parentNode.className).toContain('help-icon-wrapper');
            
            expect(icon.href).toBe('http://example.com/effort');
            expect(icon.target).toBe('_blank');
        });

        test('should hide icon when no help is available', () => {
            // Remove help text for complexity
            global.config.uiStrings.scaleHelp_complexity = '';
            
            updateHelpIcons();
            
            const icon = document.getElementById('help-icon-complexity');
            expect(icon.style.display).toBe('none');
        });

        test('should toggle backdrop active class on hover after delay', () => {
            updateHelpIcons();
            
            const icon = document.getElementById('help-icon-complexity');
            const wrapper = icon.parentNode;
            const backdrop = document.getElementById('tooltip-backdrop');
            const tooltip = wrapper.querySelector('.custom-tooltip');
            
            // 1. Simulate Mouse Enter
            const mouseEnterEvent = new Event('mouseenter');
            wrapper.dispatchEvent(mouseEnterEvent);
            
            // IMMEDIATE CHECK: Should still be hidden (timer running)
            expect(backdrop.classList.contains('active')).toBe(false);
            expect(tooltip.classList.contains('is-visible')).toBe(false);

            // 2. Fast-forward time by 500ms
            jest.advanceTimersByTime(500);

            // CHECK AFTER DELAY: Should now be visible
            expect(backdrop.classList.contains('active')).toBe(true);
            expect(tooltip.classList.contains('is-visible')).toBe(true);

            // 3. Simulate Mouse Leave
            const mouseLeaveEvent = new Event('mouseleave');
            wrapper.dispatchEvent(mouseLeaveEvent);
            
            expect(backdrop.classList.contains('active')).toBe(false);
            expect(tooltip.classList.contains('is-visible')).toBe(false);
        });

        test('should show tooltip immediately on click', () => {
            updateHelpIcons();
            
            const icon = document.getElementById('help-icon-complexity');
            const wrapper = icon.parentNode;
            const backdrop = document.getElementById('tooltip-backdrop');
            const tooltip = wrapper.querySelector('.custom-tooltip');

            // Simulate Click
            wrapper.click();

            // CHECK: Should be visible immediately without waiting
            expect(backdrop.classList.contains('active')).toBe(true);
            expect(tooltip.classList.contains('is-visible')).toBe(true);
        });
    });

describe('updateResetCoDButtonVisibility', () => {
    beforeEach(() => { setupGlobalState(); setupDom(); });
    test('should disable button if all CoD values are 0', () => {
        updateResetCoDButtonVisibility();
        const btn = document.querySelector('#reset-cod-btn');
        expect(btn.disabled).toBe(true);
        expect(btn.style.display).not.toBe('none');
    });
    test('should enable button if at least one CoD value is greater than 0', () => {
        document.getElementById('pbi-cod-tc').value = '3';
        updateResetCoDButtonVisibility();
        const btn = document.querySelector('#reset-cod-btn');
        expect(btn.disabled).toBe(false);
    });
});

describe('validateAndSyncModalLogic', () => {
    const mockUiStrings = {
        jobsizeHint: 'Set all three values',
        jobsizeHintComplete: 'Job Size is: {jobSize}',
        codHint: 'Set all three CoD values',
        codHintComplete: 'CoD is: {codSize}',
        pbiInfoWSJF: 'WSJF'
    };
    test('should disable save button if title is missing', () => {
        const inputs = { title: '   ', complexityVal: 5, effortVal: 3, doubtVal: 1, codBvVal: 0, codTcVal: 0, codRroeVal: 0, uiStrings: mockUiStrings };
        const result = validateAndSyncModalLogic(inputs);
        expect(result.isSaveDisabled).toBe(true);
    });
    test('should enable save button for a new item if a title exists', () => {
        const inputs = { title: 'A Title', complexityVal: 0, effortVal: 0, doubtVal: 0, codBvVal: 0, codTcVal: 0, codRroeVal: 0, uiStrings: mockUiStrings };
        const result = validateAndSyncModalLogic(inputs);
        expect(result.isSaveDisabled).toBe(false);
    });
    test('should calculate WSJF correctly when all values are present', () => {
        const inputs = { title: 'Full PBI', complexityVal: 5, effortVal: 2, doubtVal: 1, codBvVal: 8, codTcVal: 5, codRroeVal: 3, uiStrings: mockUiStrings };
        const result = validateAndSyncModalLogic(inputs);
        expect(result.wsjfValue).toBe('2');
    });
    test('should return null for WSJF if CoD is incomplete', () => {
        const inputs = { title: 'Incomplete CoD', complexityVal: 5, effortVal: 2, doubtVal: 1, codBvVal: 8, codTcVal: 0, codRroeVal: 3, uiStrings: mockUiStrings };
        const result = validateAndSyncModalLogic(inputs);
        expect(result.wsjfValue).toBeNull();
    });
});

describe('validateAndSyncModal (DOM Interaction)', () => {
    beforeEach(() => { setupGlobalState(); setupDom(); });
    
    test('should update total spans when sliders change', () => {
        document.getElementById('pbi-title').value = 'Test';
        document.getElementById('pbi-complexity').value = '1'; // In Safe Scale, Index 1 is Value "1"
        document.getElementById('pbi-effort').value = '2'; // Index 2 is Value "2"
        document.getElementById('pbi-doubt').value = '3'; // Index 3 is Value "3"
        
        // Sum: 1 + 2 + 3 = 6
        
        validateAndSyncModal();
        
        const totalSpan = document.getElementById('job-size-total');
        expect(totalSpan.textContent).toBe('6');
        expect(totalSpan.classList.contains('has-value')).toBe(true);
    });

    test('should show NA for total when values are missing', () => {
         document.getElementById('pbi-complexity').value = '0';
         validateAndSyncModal();
         const totalSpan = document.getElementById('job-size-total');
         expect(totalSpan.textContent).toBe('na');
    });
});

describe('showModal', () => {
    beforeEach(() => { setupGlobalState(); setupDom(); });

    test('should open modal in "New Item" mode if pbi is null', () => {
        showModal(null); 
        const modal = document.getElementById('edit-modal');
        expect(modal.style.display).toBe('flex');
        expect(document.getElementById('modal-title').textContent).toBe('New PBI');
        expect(document.getElementById('pbi-title').value).toBe('');
        expect(global.currentEditingId).toBeNull();
        expect(document.getElementById('save-btn').disabled).toBe(true);
    });

    test('should open modal in "Edit Item" mode and populate fields', () => {
        const mockPbi = {
            id: 123, title: 'Test PBI', notes: 'Test Notes',
            complexity: 3, effort: 1, doubt: 0,
            cod_bv: 5, cod_tc: 8, cod_rroe: 2,
            tshirtSize: 'M'
        };
        showModal(mockPbi); 
        expect(document.getElementById('modal-title').textContent).toBe('Edit PBI');
        expect(document.getElementById('pbi-title').value).toBe('Test PBI');
        expect(global.currentEditingId).toBe(123);
        expect(document.getElementById('pbi-complexity').value).toBe('3');
        const tshirtDisplay = document.getElementById('modal-tshirt-display');
        expect(tshirtDisplay.style.display).toBe('inline-flex');
        expect(tshirtDisplay.querySelector('.modal-tag-value').textContent).toBe('M');
    });

    test('should hide T-Shirt display if pbi has no tshirtSize', () => {
        const mockPbi = { id: 123, title: 'Test PBI', tshirtSize: null };
        showModal(mockPbi);
        expect(document.getElementById('modal-tshirt-display').style.display).toBe('none');
    });

    test('should switch to "cod" tab if options.defaultTab is "cod"', () => {
        const mockPbi = { id: 123, title: 'Test PBI' };
        showModal(mockPbi, { defaultTab: 'cod' });
        expect(document.getElementById('tab-btn-cod').classList.contains('active')).toBe(true);
        expect(document.getElementById('tab-content-cod').classList.contains('hidden')).toBe(false);
    });
});

describe('Settings Modal', () => {
    beforeEach(() => { setupGlobalState(); setupDom(); });

    describe('openSettingsModal', () => {
        test('should populate modal with current settings', () => {
            global.currentLanguage = 'de';
            global.currentScale = 'metric';
            global.config.tshirtSizes = ['S', 'XL'];
            global.config.colors.complexity = '#123456';
            
            openSettingsModal();

            expect(document.getElementById('settings-modal').style.display).toBe('flex');
            expect(document.querySelector('input[name="language-setting"][value="de"]').checked).toBe(true);
            expect(document.querySelector('input[name="scale-setting"][value="metric"]').checked).toBe(true);
            expect(document.getElementById('color-complexity-setting').value).toBe('#123456');
            
            const checkboxes = document.querySelectorAll('input[name="tshirt-size-setting"]');
            expect(checkboxes.length).toBe(global.config.allTshirtSizes.length);
            expect(document.querySelector('input[value="S"]').checked).toBe(true);
            expect(document.querySelector('input[value="M"]').checked).toBe(false);
        });
    });

    describe('resetSettingsToDefault', () => {
        test('should reset form fields to default values', () => {
            document.querySelector('input[name="language-setting"][value="de"]').checked = true;
            document.querySelector('input[name="scale-setting"][value="metric"]').checked = true;
            document.getElementById('color-complexity-setting').value = '#abcdef';

            resetSettingsToDefault();

            expect(document.querySelector('input[name="language-setting"][value="en"]').checked).toBe(true);
            expect(document.querySelector('input[name="scale-setting"][value="safe"]').checked).toBe(true);
            expect(document.getElementById('color-complexity-setting').value).toBe(global.config.defaultColors.complexity);
        });
    });

    describe('saveAndCloseSettings', () => {
        // Mock global checkScreenResolution
        global.checkScreenResolution = jest.fn();

        test('should update global state and apply settings', () => {
            openSettingsModal(); 
            document.querySelector('input[name="language-setting"][value="de"]').checked = true;
            document.querySelector('input[name="scale-setting"][value="metric"]').checked = true;
            document.getElementById('color-complexity-setting').value = '#abcdef';
            document.querySelector('input[name="tshirt-size-setting"][value="XL"]').checked = true;

            saveAndCloseSettings();

            expect(global.currentLanguage).toBe('de');
            expect(global.currentScale).toBe('metric');
            expect(global.config.colors.complexity).toBe('#abcdef');
            
            expect(global.applyColorSettings).toHaveBeenCalledWith(global.config.colors);
            expect(global.syncSliderMax).toHaveBeenCalled();
            expect(global.generateSliderScales).toHaveBeenCalled();
            expect(global.applyUiStrings).toHaveBeenCalled();
            expect(global.renderAll).toHaveBeenCalled();
            expect(global.checkForUpdates).toHaveBeenCalled();
        });

        test('should update global resolution dismissal state', () => {
            openSettingsModal();
            
            // Uncheck the box -> User wants to dismiss warning
            document.getElementById('setting-show-res-warning').checked = false;
            
            saveAndCloseSettings();
            
            // Logic inverted: checked=false means dismissed=true
            expect(window.isResolutionWarningDismissed).toBe(true);
            expect(global.checkScreenResolution).toHaveBeenCalled();
        });

        test('should update (migrate) PBI values when scale changes', () => {
            global.pbis = [{ id: 1, complexity: 2, effort: 4, doubt: 6, cod_bv: 0, cod_tc: 0, cod_rroe: 0 }];
            global.currentScale = 'safe'; // [0, 1, 2, 3, 5, 8]
            
            openSettingsModal();
            document.querySelector('input[name="scale-setting"][value="metric"]').checked = true; // [0-8]
            
            saveAndCloseSettings();

            expect(global.pbis[0].complexity).toBe(2);
            expect(global.pbis[0].effort).toBe(4);
            expect(global.pbis[0].doubt).toBe(6);
            expect(global.currentScale).toBe('metric');
        });
        
        test('should cache fibonacci values when switching to metric', () => {
            // Setup: PBI is 5 (Valid Fib)
            global.pbis = [{ id: 1, complexity: 5, fibonacciValues: {} }];
            global.currentScale = 'safe'; 
            
            openSettingsModal();
            document.querySelector('input[name="scale-setting"][value="metric"]').checked = true;
            saveAndCloseSettings();
            
            // Value should persist as 5 in metric
            expect(global.pbis[0].complexity).toBe(5);
            // Backup should have been created
            expect(global.pbis[0].fibonacciValues.complexity).toBe(5);
        });

        test('should snap to nearest higher fibonacci value when switching back from metric', () => {
            // Setup: PBI is 4 (Valid Metric, Invalid Fib)
            global.pbis = [{ id: 1, complexity: 4, arithmeticValues: {} }];
            global.currentScale = 'metric';
            
            openSettingsModal();
            document.querySelector('input[name="scale-setting"][value="safe"]').checked = true; // Fib: [0, 1, 2, 3, 5, 8]
            saveAndCloseSettings();
            
            // 4 should snap up to 5
            expect(global.pbis[0].complexity).toBe(5);
            expect(global.currentScale).toBe('safe');
        });
        
        test('should update colors in existing PBI notes when editor color settings change', () => {
            const oldColor = "#279745";
            const newColor = "#ff00ff";
            global.pbis = [{ id: 1, notes: 'Text <font color="' + oldColor + '">Green</font>' }];
            global.config.editorColors = { "1": oldColor };

            openSettingsModal();
            document.getElementById('setting-editor-c1').value = newColor;
            saveAndCloseSettings();

            expect(global.pbis[0].notes).toContain(newColor);
            expect(global.pbis[0].notes).not.toContain(oldColor);
        });

        test('should set resolution warning checkbox based on global state', () => {
            // Case 1: Dismissed = true (User clicked Open Anyway) -> Checkbox should be UNCHECKED
            window.isResolutionWarningDismissed = true;
            openSettingsModal();
            expect(document.getElementById('setting-show-res-warning').checked).toBe(false);

            // Case 2: Dismissed = false (Default) -> Checkbox should be CHECKED
            window.isResolutionWarningDismissed = false;
            openSettingsModal();
            expect(document.getElementById('setting-show-res-warning').checked).toBe(true);
        });
    });
});

describe('Popup Functions', () => {
    beforeEach(() => { setupGlobalState(); setupDom(); });
    
    // Mock getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
        top: 100, left: 100, width: 50, height: 30, bottom: 130, right: 150, x: 100, y: 100
    }));
    
    afterEach(() => {
        const popup = document.querySelector('.tshirt-popup');
        const overlay = document.querySelector('.popup-overlay');
        if (popup) popup.remove();
        if (overlay) overlay.remove();
    });

    describe('showTshirtPopup', () => {
        beforeEach(() => {
            document.body.insertAdjacentHTML('beforeend', '<div class="pbi-item" data-id="101"><div class="pbi-item-tshirt">M</div></div>');
            global.pbis = [{ id: 101, title: 'Item 1', tshirtSize: 'M', jobSize: 5 }];
            global.config.tshirtSizes = ['S', 'M', 'L'];
        });

        test('should create popup and overlay', () => {
            const trigger = document.querySelector('.pbi-item-tshirt');
            showTshirtPopup(trigger);
            expect(document.querySelector('.tshirt-popup')).not.toBeNull();
            expect(document.querySelector('.popup-overlay')).not.toBeNull();
            expect(trigger.classList.contains('popup-trigger-active')).toBe(true);
            expect(global.activePopupPbiId).toBe(101);
        });

        test('should update PBI and close popup on option click', () => {
            const trigger = document.querySelector('.pbi-item-tshirt');
            showTshirtPopup(trigger);
            const optionL = Array.from(document.querySelectorAll('.tshirt-option')).find(el => el.textContent === 'L');
            
            optionL.click();
            
            expect(global.pbis[0].tshirtSize).toBe('L');
            expect(global.lastEditedPbiId).toBe(101);
            expect(document.querySelector('.tshirt-popup')).toBeNull();
            expect(global.renderAll).toHaveBeenCalled();
        });
    });
    
    describe('showValuePopup', () => {
        beforeEach(() => {
            document.body.insertAdjacentHTML('beforeend', '<div class="rs-cell" data-pbi-id="101" data-value-type="complexity">2</div>');
            global.pbis = [{ id: 101, title: 'Item 1', complexity: 2, effort: 3, doubt: 5, jobSize: 10 }];
            global.currentScale = 'safe'; 
        });

        test('should create popup with scale values', () => {
            const trigger = document.querySelector('.rs-cell');
            showValuePopup(trigger);
            expect(document.querySelector('.tshirt-popup')).not.toBeNull();
            expect(global.activePopupPbiId).toBe(101);
            const options = document.querySelectorAll('.tshirt-option');
            expect(options.length).toBe(global.SCALES.safe.values.length);
        });
        
        test('should update PBI property and recalculate jobSize on click', () => {
            const trigger = document.querySelector('.rs-cell');
            showValuePopup(trigger);
            const option8 = Array.from(document.querySelectorAll('.tshirt-option')).find(el => el.textContent === '8');
            
            option8.click();
            
            expect(global.pbis[0].complexity).toBe(8);
            expect(global.pbis[0].jobSize).toBe(16); // 8 + 3 + 5
            expect(global.renderAll).toHaveBeenCalled();
        });
    });
});