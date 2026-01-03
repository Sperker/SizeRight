// ===================================================================================
// 02_RENDER.TEST.JS
// ===================================================================================

/**
 * @file 02_render.test.js
 * @description Unit tests for the View layer and DOM rendering engine (2_render.js).
 * * Objectives:
 * 1. Verify UI String Injection (I18n):
 * - Correct application of localized texts to static elements.
 * - Handling of dynamic elements (tooltips, placeholders).
 * 2. Ensure Partitioned Sorting Logic:
 * - Zone 1: Reference items pinned to top.
 * - Zone 2: Content sorted by active criteria (Job Size, CoD, WSJF).
 * - Zone 3: Spacer item pinned to bottom.
 * 3. Validate Rendering Orchestration (renderAll):
 * - Triggering sub-renders for Lists, Visualizations, and Charts.
 * - Managing container visibility and empty states.
 * 4. Check Visual Feedback & Controls:
 * - Filter button states (enabled/disabled logic).
 * - Legend updates based on sort criteria.
 * - Sticky header alignment.
 * * Note: This suite uses heavy DOM mocking as it tests a pure View layer.
 */

// --- GLOBAL MOCKS for EXTERNAL functions ---
// We mock functions that are defined in other files (like 5_visualizations.js or 6_utils.js)
// to isolate the testing of the rendering orchestration logic.

global.ensureLastItemExists = jest.fn((pbis) => {
    const others = (pbis || []).filter(p => !(p.isLastItem || p.id === -1));
    const spacer = { id: -1, isLastItem: true, isReference: false, title: '---' };
    return [...others, spacer];
});

global.syncRelativeSizingHeaderPadding = jest.fn();
global.syncRowHeights = jest.fn();
global.highlightAndScrollToLastEditedPbi = jest.fn();

// Visualization mocks - we assume these create SVG content
global.createStoryVisualization = jest.fn((pbi, wrapper) => { wrapper.innerHTML = '<svg class="mock-vis"></svg>'; });
global.createPlaceholderVisualization = jest.fn((pbi, wrapper) => { wrapper.innerHTML = '<svg class="mock-placeholder"></svg>'; });
global.createCodVisualization = jest.fn((pbi, wrapper) => { wrapper.innerHTML = '<svg class="mock-cod-vis"></svg>'; });
global.createCodPlaceholderVisualization = jest.fn((pbi, wrapper) => { wrapper.innerHTML = '<svg class="mock-cod-placeholder"></svg>'; });

global.createCodChart = jest.fn((chartIdPrefix, sortedPbiList, pbiIdToStyle) => {
    const container = document.getElementById(chartIdPrefix + '-area');
    if (container) container.innerHTML = '<div>Mock Chart Content for ' + chartIdPrefix + '</div>';
    return 100; // Return a dummy cost value
});

global.updateRefMarkerButtonState = jest.fn(); 

global.getReferencePbi = jest.fn((list, type) => {
    if (!Array.isArray(list)) return null;
    return list.find(p => p.isReference && (!type || p.referenceType === type)) || null;
});

global.calculateWsjfRanks = jest.fn((pbis) => { 
    const ranks = {};
    pbis.filter(p => p && !p.isLastItem && p.jobSize > 0 && p.cod > 0)
        .sort((a,b) => (b.cod/b.jobSize) - (a.cod/a.jobSize))
        .forEach((p, i) => ranks[p.id] = i + 1);
    return ranks;
});

global.config = { uiStrings: {}, allTshirtSizes: [], pastelColorPalette: [], demoData: {} }; 
global.generatePastelColors = jest.fn(() => []); 
global.isPinReferenceEnabled = jest.fn(() => true); 

if (!global.window) { global.window = {}; }
global.window._equalizeGridRows = jest.fn();
global.requestAnimationFrame = function (cb) { if (typeof cb === 'function') { cb(); } };

// Import the module under test
const renderModule = require('./2_render.js');
const {
    applyUiStrings,
    getSortedPbis,
    renderPbiList,
    renderRelativeSizingList,
    renderAllVisualizations,
    renderCodVisualizations,
    renderWsjfVisualization, 
    createChartStructure, 
    updateFilterButtonStates,
    updateReferenceSlots,
    updateLegendSortInfo,
    updateCodLegendSortInfo,
    updateWsjfLegendSortInfo,
    renderAll,
    updateGlobalVisibility,
    updateRelativeSizingHeaders,
    updateActiveFilterButtonVisualState,
    updateSortDirectionButtons,
    ensureReferenceFirstInVisualizations,
    syncRelativeSizingHeaderPadding
} = renderModule;

// --- TESTS START HERE ---

describe('renderPbiList Demo Data Link Logic', () => {
        
    beforeEach(() => {
        // Setup minimal DOM for empty state testing
        document.body.innerHTML = '<div id="pbi-list"></div><div id="pbi-list-container"></div><div id="panel-wsjf-viz" class="hidden"></div>';
        
        global.pbis = [ { id: -1, isLastItem: true } ]; // Empty list
        global.currentSortCriteria = 'creationOrder';
        global.currentSortDirection = 'asc';
        global.isFilterLocked = false;
        global.lockedPbiOrder = [];

        global.config = {
            showDemoDataLink: true,
            demoData: {},
            pastelColorPalette: ['#e0e0e0'],
            uiStrings: {
                demoDataLabel: 'Load Demo Data:',
                demoDataLinkEN: 'EN',
                demoDataLinkDE: 'DE',
                emptyStateMessage: 'Empty {btnAddPbi} {modalLabelComplexity} {modalLabelEffort} {modalLabelDoubt}',
                btnAddPbi: 'Add',
                modalLabelComplexity: 'Comp',
                modalLabelEffort: 'Eff',
                modalLabelDoubt: 'Doubt',
                pbiInfoTshirtSize: 'Size',
                pbiInfoJobSize: 'JS',
                pbiInfoCoD: 'CoD',
                pbiInfoWSJF: 'WSJF',
                pbiInfoNA: '-',
                btnEdit: 'Edit',
                btnDelete: 'Delete',
                tooltipSetReference: 'Set Ref',
                tooltipUnsetReference: 'Unset Ref'
            }
        };
    });

    test('should render both EN and DE links when both paths are present', () => {
        global.config.demoData = {
            en: { path: "en.json" },
            de: { path: "de.json" }
        };
        global.config.uiStrings.demoDataLabel = 'Test Demo:';
        global.config.uiStrings.demoDataLinkEN = 'Eng';
        global.config.uiStrings.demoDataLinkDE = 'Deu';

        renderPbiList();

        const emptyState = document.querySelector('.pbi-list-empty-state');
        expect(emptyState.innerHTML).toContain('Test Demo:');
        expect(emptyState.innerHTML).toMatch(/Eng<\/a><span>-<\/span><a data-lang="de"[\s\S]*>Deu<\/a>/);
        expect(emptyState.querySelectorAll('.empty-state-demo-data a').length).toBe(2);
    });

    test('should render only EN link when DE path is empty string', () => {
        global.config.demoData = {
            en: { path: "en.json" },
            de: { path: "" }
        };
        global.config.uiStrings.demoDataLinkEN = 'Eng';
        global.config.uiStrings.demoDataLinkDE = 'Deu';

        renderPbiList();

        const emptyState = document.querySelector('.pbi-list-empty-state');
        expect(emptyState.innerHTML).toContain('Eng');
        expect(emptyState.innerHTML).not.toContain('Deu');
        expect(emptyState.querySelectorAll('.empty-state-demo-data a').length).toBe(1);
    });

    test('should render no demo data block when no paths are present', () => {
        global.config.demoData = {
            en: { path: "" },
            de: { path: "" }
        };

        renderPbiList();

        const emptyState = document.querySelector('.pbi-list-empty-state');
        expect(emptyState.innerHTML).not.toContain('empty-state-demo-data');
        expect(emptyState.querySelectorAll('.empty-state-demo-data a').length).toBe(0);
    });
});


describe('applyUiStrings', () => {

    beforeEach(() => {
        // Setup comprehensive DOM structure to test all string injections
        document.body.innerHTML = '' +
            '<title>Old Title</title><html lang="en"></html><h1 id="main-header"></h1><span id="main-claim"></span><button id="add-pbi-btn"></button>' +
            '<button id="import-btn" title=""></button><button id="export-btn" title=""></button><button id="help-btn" title=""></button>' +
            '<button id="reset-app-btn" title=""></button>' +
            '<button id="btn-csv-export" title=""></button>' +
            '<span id="legend-complexity"></span><span id="legend-effort"></span><span id="legend-doubt"></span>' +
            '<span id="legend-cod-bv"></span><span id="legend-cod-tc"></span><span id="legend-cod-rroe"></span>' +
            '<input id="pbi-title" placeholder=""><textarea id="pbi-notes" placeholder=""></textarea><button id="cancel-btn"></button>' +
            '<button id="save-btn"></button><button id="settings-btn" title=""></button><h2 id="settings-modal-title"></h2>' +
            '<strong id="settings-modal-language-label"></strong><span id="settings-lang-option-de"></span><span id="settings-lang-option-en"></span>' +
            '<button id="settings-cancel-btn"></button><button id="settings-save-btn"></button><button id="filter-job-size-btn"></button>' +
            '<button id="filter-cod-btn"></button><button id="filter-wsjf-btn"></button><button id="filter-tshirt-size-btn"></button>' +
            '<button id="tab-btn-jobsize"></button><button id="tab-btn-cod"></button><strong id="settings-modal-scale-label"></strong>' +
            '<strong id="settings-modal-tshirt-label"></strong><span id="settings-scale-option-metric"></span><span id="settings-scale-option-safe"></span>' +
            '<strong id="settings-modal-general-label"></strong>' +
            '<span id="settings-label-show-res-warning"></span>' +
            '<input type="checkbox" id="setting-show-res-warning">' +
            '<button id="custom-sort-btn" title=""></button>' +
            '<button id="sort-asc-btn" title=""></button><button id="sort-desc-btn" title=""></button><button id="filter-lock-btn" title=""></button>' +
            '<button id="reset-filters-btn" title=""></button>' +
            '<label for="pbi-complexity" id="modal-complexity-label"><span class="label-text"></span></label>' +
            '<label for="pbi-effort" id="modal-effort-label"><span class="label-text"></span></label>' +
            '<label for="pbi-doubt" id="modal-doubt-label"><span class="label-text"></span></label>' +
            '<label for="pbi-cod-bv" id="modal-cod-bv-label"><span class="label-text"></span></label>' +
            '<label for="pbi-cod-tc" id="modal-cod-tc-label"><span class="label-text"></span></label>' +
            '<label for="pbi-cod-rroe" id="modal-cod-rroe-label"><span class="label-text"></span></label>' +
            '<label id="modal-notes-label"></label><button id="reset-cod-btn"></button><button id="reset-job-size-btn"></button>' +
            '<button id="modal-prev-btn"></button><span id="modal-prev-label"></span>' +
            '<span id="modal-nav-info"></span>' +
            '<button id="modal-next-btn"></button><span id="modal-next-label"></span>' +
            '<span id="settings-label-show-ref-markers"></span>' +
            '<div id="split-divider" title=""></div>' +
            '<h2 id="reset-app-modal-title"></h2><p id="reset-app-text"></p>' +
            '<button id="reset-app-export-btn"></button><button id="reset-app-confirm-btn"></button><button id="reset-app-cancel-btn"></button>' +
            '<h2 id="csv-export-modal-title"></h2><p id="csv-export-text"></p><button id="btn-csv-export-cancel"></button><button id="btn-csv-export-confirm"></button>' +
            '<button id="csv-sort-btn-job-size"></button><button id="csv-sort-btn-tshirt-size"></button><button id="csv-sort-btn-cod"></button>' +
            '<button id="csv-sort-btn-wsjf"></button><button id="csv-sort-custom-btn" title=""></button><button id="csv-sort-asc-btn" title=""></button><button id="csv-sort-desc-btn" title=""></button>' +
            '<div id="info-modal">' +
               '<p id="info-weblink-sentence"></p><strong id="info-about-label"></strong><span id="info-version-label"></span><span id="info-build-label"></span>' +
               '<div id="info-entry-contact"><span id="info-contact-label"></span><span id="info-contact-value"></span></div>' +
               '<div id="info-entry-function"><span id="info-function-label"></span><span id="info-function-value"></span></div>' +
               '<div id="info-entry-email"><span id="info-email-label"></span><span id="info-email-value"></span></div>' +
               '<div id="info-entry-department"><span id="info-department-label"></span><span id="info-department-value"></span></div>' +
               '<div id="info-entry-company"><span id="info-company-label"></span><span id="info-company-value"></span></div>' +
               '<div id="info-about-divider"></div>' +
               '<textarea id="info-license-text"></textarea><textarea id="info-license-text-thirdparty"></textarea>' +
               '<button id="info-close-btn"></button><button id="info-tab-btn-software"></button><button id="info-tab-btn-thirdparty"></button>' +
               '<span id="info-license-designation-software"></span><a id="info-license-link-software"></a>' +
               '<span id="info-license-designation-thirdparty"></span><a id="info-license-link-thirdparty"></a>' +
               '<strong id="info-weblink-label"></strong><h2 id="info-modal-title"></h2>' +
            '</div>' +
            '<strong id="settings-modal-color-label"></strong>' +
            '<label id="color-label-complexity"></label><label id="color-label-effort"></label><label id="color-label-doubt"></label>' +
            '<label id="color-label-total"></label><label id="color-label-number-complexity"></label><label id="color-label-number-effort"></label>' +
            '<label id="color-label-number-doubt"></label><label id="color-label-bv"></label><label id="color-label-tc"></label>' +
            '<label id="color-label-rroe"></label><label id="color-label-number-bv"></label><label id="color-label-number-tc"></label>' +
            '<label id="color-label-number-rroe"></label><button id="reset-settings-btn"></button>' +
            '<button id="view-tab-job-size-viz"></button><button id="view-tab-cod-viz"></button><button id="view-tab-wsjf-viz"></button><button id="view-tab-relative-sizing"></button>' +
            '<div id="rs-group-header-job-size"></div><div id="rs-group-header-cod"></div><div id="rs-group-header-wsjf"></div>' +
            '<div class="rs-col-header" title=""><span id="rs-col-header-complexity"></span></div>' +
            '<div class="rs-col-header" title=""><span id="rs-col-header-effort"></span><button class="highlight-btn" title=""></button></div>' +
            '<div class="rs-col-header" title=""><span id="rs-col-header-doubt"></span></div><div class="rs-col-header" title=""><span id="rs-col-header-job-size"></span></div>' +
            '<div class="rs-col-header" title=""><span id="rs-col-header-bv"></span></div><div class="rs-col-header" title=""><span id="rs-col-header-tc"></span></div>' +
            '<div class="rs-col-header" title=""><span id="rs-col-header-rroe"></span></div><div class="rs-col-header" title=""><span id="rs-col-header-cod"></span></div>' +
            '<div class="rs-col-header" title=""><span id="rs-col-header-wsjf"></span></div>' +
            '<span id="legend-sort-info"></span><span id="cod-legend-sort-info"></span><span id="wsjf-legend-sort-info"></span>' +
            '<p id="resolution-warning-text"></p><button id="resolution-warning-ignore-btn"></button>' + 
            '<button id="btn-editor-bold"></button><button id="btn-editor-italic"></button><button id="btn-editor-underline"></button>' +
            '<button id="btn-editor-link"></button><button id="btn-editor-clean"></button>' +
            '<button id="btn-editor-c1"></button><button id="btn-editor-c2"></button><button id="btn-editor-c3"></button><button id="btn-editor-c4"></button>' +
            '<strong id="settings-modal-editor-color-label"></strong><label id="label-editor-c1"></label><label id="label-editor-c2"></label><label id="label-editor-c3"></label><label id="label-editor-c4"></label>' +
            '<button id="btn-editor-strike"></button>';

        global.currentLanguage = 'en';
        global.currentSortCriteria = 'jobSize';
        global.currentSortDirection = 'asc';
        global.isFilterLocked = false;
        global.pbis = [{id: 1, title: 'Item 1', isLastItem: false}];
        global.config = { uiStrings: { 
            pageTitle: 'Test Page Title', mainHeader: 'Test Header', mainClaim: 'Test Claim', btnAddPbi: 'Add Button Text', btnImportTitle: 'Import Tooltip', btnExportTitle: 'Export Tooltip', helpButtonTitle: 'Help Tooltip',
            legendComplexity: 'Complexity Legend', legendEffort: 'Effort Legend', legendDoubt: 'Doubt Legend', legendCodBv: 'BV Legend', legendCodTc: 'TC Legend', legendCodRroe: 'RR/OE Legend',
            modalPlaceholderTitle: 'Enter Title', modalNotesPlaceholder: 'Enter Notes', btnCancel: 'Cancel', btnSave: 'Save', btnSettingsTitle: 'Settings Tooltip', modalTitleSettings: 'Settings Title',
            modalLanguageLabel: 'Language:', langOptionDe: 'German', langOptionEn: 'English', settingsCancelBtn: 'Cancel Settings', settingsSaveBtn: 'Save Settings', filterJobSize: 'Job Size Filter',
            filterCoD: 'CoD Filter', filterWSJF: 'WSJF Filter', filterTshirtSize: 'T-Shirt Filter', filterCustomSort: 'Custom Sort Filter', tabJobSize: 'Job Size Tab', tabCoD: 'CoD Tab', modalScaleLabel: 'Scale:', modalTshirtLabel: 'T-Shirts:',
            scaleOptionMetric: 'Metric Scale', scaleOptionSAFe: 'SAFe Scale', tooltipSortAsc: 'Sort Asc', tooltipSortDesc: 'Sort Desc', tooltipFilterLock: 'Lock Sort', tooltipFilterUnlock: 'Unlock Sort',
            btnResetFiltersTitle: 'Reset Filters', modalLabelComplexity: 'Complexity Label', modalLabelEffort: 'Effort Label', modalLabelDoubt: 'Doubt Label', modalLabelCodBv: 'BV Label', modalLabelCodTc: 'TC Label',
            modalLabelCodRroe: 'RR/OE Label', modalLabelNotes: 'Notes Label', btnResetCoD: 'Reset CoD', btnResetJobSize: 'Reset Job Size', dividerTooltip: 'Drag Divider', modalTitleInfo: 'Info Title',
            infoWeblinkLabel: 'Weblink Label', infoWeblinkSentence: 'See {weblink} for details.', infoWeblinkText: 'the docs', infoWeblinkUrl: 'http://example.com', infoAboutLabel: 'About Label', infoVersionLabel: 'Version:',
            infoBuildLabel: 'Build:', infoContactLabel: 'Contact:', infoContactValue: 'Contact Value', infoCompanyLabel: 'Company:', infoCompanyValue: 'Company Value', infoFunctionLabel: 'Function:', infoFunctionValue: 'Function Value',
            infoEmailLabel: 'Email:', infoEmailValue: 'Email Value', infoDepartmentLabel: 'Dept:', infoDepartmentValue: 'Dept Value', btnClose: 'Close', 
            licenseTitle: 'License Title', licenseText: 'MIT License Text',
            infoTabLicenseSoftware: 'Software License Tab', infoTabLicenseThirdParty: 'Third-Party License Tab', licenseTextThirdParty: 'Third-Party License Text', 
            infoLicenseDesignationSoftware: 'SizeRight Designation', infoLicenseLinkTextSoftware: 'SizeRight Link Text', infoLicenseDesignationThirdParty: 'SortableJS Designation', infoLicenseLinkTextThirdParty: 'SortableJS Link Text', 
            settingsColorLabel: 'Colors Label', colorComplexity: 'Complexity Color', colorEffort: 'Effort Color', colorDoubt: 'Doubt Color', colorTotal: 'Total Color', colorNumberComplexity: 'Num Comp Color',
            colorNumberEffort: 'Num Effort Color', colorNumberDoubt: 'Num Doubt Color', colorBv: 'BV Color', colorTc: 'TC Color', colorRrOe: 'RR/OE Color', colorNumberBv: 'Num BV Color', colorNumberTc: 'Num TC Color',
            colorNumberRrOe: 'Num RR/OE Color', btnResetSettings: 'Reset Settings', tabJobSizeViz: 'Job Viz Tab', tabCoDViz: 'CoD Viz Tab', tabWsjfViz: 'WSJF Viz Tab', tabRelativeSizing: 'Relative Tab', groupJobSize: 'Job Size Group', groupCoD: 'CoD Group',
            groupWsjf: 'WSJF Group', colComplexity: 'Comp.', colEffort: 'Eff.', colDoubt: 'Dbt.', colJobSize: 'JS', colBv: 'BV', colTc: 'TC', colRrOe: 'RR', pbiInfoCoD: 'CoD', colWsjf: 'WSJF', tooltipComplexity: 'Comp Col Tip',
            tooltipEffort: 'Eff Col Tip', tooltipDoubt: 'Dbt Col Tip', tooltipJobSize: 'JS Col Tip', tooltipBv: 'BV Col Tip', tooltipTc: 'TC Col Tip', tooltipRrOe: 'RR Col Tip', tooltipCoD: 'CoD Col Tip', tooltipWsjf: 'WSJF Col Tip',
            highlightColumnTitle: 'Highlight This', legendSortBy: 'Sort by', sortOptionAsc: 'Ascending', sortOptionDesc: 'Descending',
            wsjfChartTitleOptimal: "Optimal Order", wsjfChartTitleCurrent: "Current Order", wsjfChartLabelTotalCost: "Total Cost:", wsjfChartNoData: "No Data",
            resolutionWarning: "Resolution Warning Text",
            editorBold: 'Bold', editorItalic: 'Italic', editorUnderline: 'Underline', editorLink: 'Link', editorClean: 'Clean',
            editorColor1: 'Color 1', editorColor2: 'Color 2', editorColor3: 'Color 3', editorColor4: 'Color 4',
            settingsEditorColorLabel: 'Editor Colors Label',
            editorStrikethrough: 'Strikethrough',
            tooltipModalPrev: 'Prev Item', tooltipModalNext: 'Next Item', navPrevItem: 'Back', navNextItem: 'Forward',
            btnResetAppTitle: 'Reset App', modalTitleResetApp: 'Reset App Title', resetAppText: 'Reset Text',
            btnResetAppExport: 'Export', btnResetAppDelete: 'Delete', btnResetAppCancel: 'Cancel',
            btnCsvExportTitle: 'CSV Export', modalTitleCsvExport: 'CSV Modal', csvExportText: 'CSV Text',
            btnCsvExportCancel: 'Cancel CSV', btnCsvExportConfirm: 'Confirm CSV',
            btnOpenAnyway: 'Open Anyway' 
        },
         pastelColorPalette: ['#DCBCBD', '#B6E2B7'],
         allTshirtSizes: ['XS', 'S', 'M', 'L', 'XL'] 
        };
    });

    test('should set text for new editor color buttons and labels', () => {
        applyUiStrings();
        expect(document.getElementById('btn-editor-c1').title).toBe('Color 1');
        expect(document.getElementById('settings-modal-editor-color-label').textContent).toBe('Editor Colors Label');
        expect(document.getElementById('label-editor-c1').textContent).toBe('Color 1');
        expect(document.getElementById('btn-editor-strike').title).toBe('Strikethrough'); 
    });

    test('should set title/text for reset app button and modal elements', () => {
        applyUiStrings();
        expect(document.getElementById('reset-app-btn').title).toBe('Reset App');
        expect(document.getElementById('reset-app-modal-title').textContent).toBe('Reset App Title');
        expect(document.getElementById('reset-app-text').textContent).toBe('Reset Text');
        expect(document.getElementById('reset-app-export-btn').textContent).toBe('Export');
        expect(document.getElementById('reset-app-confirm-btn').textContent).toBe('Delete');
        expect(document.getElementById('reset-app-cancel-btn').textContent).toBe('Cancel');
    });

    test('should set title/text for CSV export elements', () => {
        applyUiStrings();
        expect(document.getElementById('btn-csv-export').title).toBe('CSV Export');
        expect(document.getElementById('csv-export-modal-title').textContent).toBe('CSV Modal');
        expect(document.getElementById('csv-export-text').textContent).toBe('CSV Text');
        expect(document.getElementById('btn-csv-export-cancel').textContent).toBe('Cancel CSV');
        expect(document.getElementById('btn-csv-export-confirm').textContent).toBe('Confirm CSV');
    });

     test('should set document title and lang attribute', () => { applyUiStrings(); expect(document.title).toBe('Test Page Title'); expect(document.documentElement.lang).toBe('en'); });
     test('should set textContent for various elements', () => { applyUiStrings(); expect(document.getElementById('main-header').textContent).toBe('Test Header'); expect(document.getElementById('add-pbi-btn').textContent).toBe('Add Button Text'); expect(document.getElementById('legend-complexity').textContent).toBe('Complexity Legend'); expect(document.getElementById('filter-job-size-btn').textContent).toBe('Job Size Filter'); });
     test('should set title attributes', () => { 
         applyUiStrings(); 
         expect(document.getElementById('import-btn').title).toBe('Import Tooltip'); 
         expect(document.getElementById('export-btn').title).toBe('Export Tooltip'); 
         expect(document.getElementById('help-btn').title).toBe('Help Tooltip'); 
         expect(document.getElementById('settings-btn').title).toBe('Settings Tooltip'); 
         expect(document.getElementById('sort-asc-btn').title).toBe('Sort Asc'); 
         expect(document.getElementById('custom-sort-btn').title).toBe('Custom Sort Filter'); 
         expect(document.getElementById('filter-lock-btn').title).toBe('Lock Sort'); 
         expect(document.getElementById('reset-filters-btn').title).toBe('Reset Filters'); 
         const effortHeader = document.getElementById('rs-col-header-effort').parentElement; 
         expect(effortHeader.title).toBe('Eff Col Tip'); 
         expect(document.querySelector('.highlight-btn').title).toBe('Highlight This'); 
    });
     test('should set title correctly when isFilterLocked is true', () => { global.isFilterLocked = true; applyUiStrings(); expect(document.getElementById('filter-lock-btn').title).toBe('Unlock Sort'); });
     test('should set placeholder attributes', () => { applyUiStrings(); expect(document.getElementById('pbi-title').placeholder).toBe('Enter Title'); expect(document.getElementById('pbi-notes').placeholder).toBe('Enter Notes'); });
     test('should set value for textareas (like license)', () => { applyUiStrings(); expect(document.getElementById('info-license-text').value).toBe('MIT License Text'); });
     test('should handle web link sentence with placeholder', () => { applyUiStrings(); const weblinkSentence = document.getElementById('info-weblink-sentence'); expect(weblinkSentence.textContent).toContain('See '); expect(weblinkSentence.textContent).toContain(' for details.'); const linkElement = weblinkSentence.querySelector('a'); expect(linkElement).not.toBeNull(); expect(linkElement.textContent).toBe('the docs'); expect(linkElement.href).toMatch(/^http:\/\/example\.com\/?$/); expect(linkElement.target).toBe('_blank'); });
     test('should set text for the new WSJF tab', () => { applyUiStrings(); expect(document.getElementById('view-tab-wsjf-viz').textContent).toBe('WSJF Viz Tab'); });
     
     test('should hide empty optional info entries and the divider', () => {
        global.config.uiStrings.infoContactValue = ''; global.config.uiStrings.infoFunctionValue = ''; global.config.uiStrings.infoEmailValue = '';
        global.config.uiStrings.infoDepartmentValue = ''; global.config.uiStrings.infoCompanyValue = '';
        applyUiStrings();
        expect(document.getElementById('info-entry-contact').style.display).toBe('none'); expect(document.getElementById('info-entry-function').style.display).toBe('none');
        expect(document.getElementById('info-entry-email').style.display).toBe('none'); expect(document.getElementById('info-entry-department').style.display).toBe('none');
        expect(document.getElementById('info-entry-company').style.display).toBe('none'); expect(document.getElementById('info-about-divider').style.display).toBe('none');
        expect(document.getElementById('info-license-text').style.minHeight).toBe('100px');
     });
    test('should show optional info entries and the divider if they have values', () => {
        applyUiStrings();
        expect(document.getElementById('info-entry-contact').style.display).toBe(''); expect(document.getElementById('info-contact-value').textContent).toBe('Contact Value');
        expect(document.getElementById('info-entry-function').style.display).toBe(''); expect(document.getElementById('info-function-value').textContent).toBe('Function Value');
        expect(document.getElementById('info-entry-email').style.display).toBe(''); expect(document.getElementById('info-email-value').textContent).toBe('Email Value');
        expect(document.getElementById('info-entry-department').style.display).toBe(''); expect(document.getElementById('info-department-value').textContent).toBe('Dept Value');
        expect(document.getElementById('info-entry-company').style.display).toBe(''); expect(document.getElementById('info-company-value').textContent).toBe('Company Value');
        expect(document.getElementById('info-about-divider').style.display).toBe(''); 
        expect(document.getElementById('info-license-text').style.minHeight).toBe('');
    });
     test('should show divider if at least one optional info entry has a value', () => {
        global.config.uiStrings.infoContactValue = ''; global.config.uiStrings.infoFunctionValue = 'Test Function'; global.config.uiStrings.infoEmailValue = '';
        global.config.uiStrings.infoDepartmentValue = ''; global.config.uiStrings.infoCompanyValue = '';
        applyUiStrings();
        expect(document.getElementById('info-entry-contact').style.display).toBe('none'); expect(document.getElementById('info-entry-function').style.display).toBe('');
        expect(document.getElementById('info-function-value').textContent).toBe('Test Function'); expect(document.getElementById('info-entry-email').style.display).toBe('none');
        expect(document.getElementById('info-entry-department').style.display).toBe('none'); expect(document.getElementById('info-entry-company').style.display).toBe('none');
        expect(document.getElementById('info-about-divider').style.display).toBe(''); 
        expect(document.getElementById('info-license-text').style.minHeight).toBe('');
     });
    
    test('should set text for new info modal tabs and textareas', () => {
        applyUiStrings();
        expect(document.getElementById('info-tab-btn-software').textContent).toBe('Software License Tab');
        expect(document.getElementById('info-tab-btn-thirdparty').textContent).toBe('Third-Party License Tab');
        expect(document.getElementById('info-license-text').value).toBe('MIT License Text');
        expect(document.getElementById('info-license-text-thirdparty').value).toBe('Third-Party License Text');
    });
    
    test('should set text for new license designation and link elements', () => {
        applyUiStrings();
        expect(document.getElementById('info-license-designation-software').textContent).toBe('SizeRight Designation');
        expect(document.getElementById('info-license-link-software').textContent).toBe('SizeRight Link Text');
        expect(document.getElementById('info-license-designation-thirdparty').textContent).toBe('SortableJS Designation');
        expect(document.getElementById('info-license-link-thirdparty').textContent).toBe('SortableJS Link Text');
    });
}); 


describe('2_render core rendering and reference pinning', function () {

    var owDesc;
    var cwDesc;

    beforeEach(function () {
        jest.clearAllMocks(); 

        // Minimal DOM - Ensure all necessary containers and panels exist.
        document.body.innerHTML = `
            <div id="ref-slot-left"></div><div id="ref-slot-right"></div><div id="pbi-list"></div><div id="relative-sizing-list"></div>
            <div id="relative-sizing-header"><span id="relative-sizing-title"></span></div>
            <div id="visualization-legend"><span id="legend-sort-info"></span></div>
            <div id="cod-visualization-legend"><span id="cod-legend-sort-info"></span></div>
            <div id="wsjf-visualization-legend" class="legend hidden"><div class="legend-sort-container"><span id="wsjf-legend-sort-info"></span></div></div>
            <div id="visualization-container"></div>
            <div id="cod-visualization-container"></div>
            <div id="wsjf-visualization-container" class="container"></div>
            <div id="view-tabs"></div><div id="split-root"></div>
            <div id="panel-wsjf-viz" class="view-panel hidden"></div>
            <button id="filter-job-size-btn" class="filter-btn"></button><button id="filter-cod-btn" class="filter-btn"></button>
            <button id="filter-wsjf-btn" class="filter-btn"></button><button id="filter-tshirt-size-btn" class="filter-btn"></button>
            <button id="custom-sort-btn"></button>
            <button id="filter-lock-btn"></button><button id="reset-filters-btn"></button><button id="sort-asc-btn"></button>
            <button id="sort-desc-btn"></button><button id="export-btn"></button>
            <button id="btn-csv-export"></button>
            <p id="resolution-warning-text"></p>`;

        // Global State
        global.pbis = []; global.currentSortCriteria = 'jobSize'; global.currentSortDirection = 'asc'; global.currentHighlightedColumn = null; global.isFilterLocked = false; global.lockedPbiOrder = []; global.isOptimalChartCollapsed = true;

        global.config = { uiStrings: { pbiInfoNA: 'na', pbiInfoJobSize: 'Job Size', pbiInfoCoD: 'CoD', pbiInfoWSJF: 'WSJF', tooltipJobSizeNa: 'Job Size cannot be calculated. Missing values: {missingValues}', tooltipCodNa: 'Cost of Delay cannot be calculated. Missing values: {missingValues}', tooltipWsjfNa: 'WSJF cannot be calculated. Missing: {missingValues}', colComplexity: 'Complexity', colEffort: 'Effort', colDoubt: 'Doubt', colBv: 'BV', colTc: 'TC', colRrOe: 'RR/OE', groupJobSize: 'Job Size', groupCoD: 'Cost of Delay', filterJobSize: 'Job Size Filter', filterCoD: 'CoD Filter', filterWSJF: 'WSJF Filter', filterTshirtSize: 'T-Shirt Filter', filterCustomSort: 'Custom Sort Filter', legendSortBy: 'Sort by', sortOptionAsc: 'Ascending', sortOptionDesc: 'Descending', tooltipSetReference: 'Set as reference', tooltipUnsetReference: 'Unset reference', btnEdit: 'Edit', btnDelete: 'Delete', tooltipComplexity: 'Complexity Tooltip', tooltipEffort: 'Effort Tooltip', tooltipDoubt: 'Doubt Tooltip', tooltipJobSize: 'Job Size Tooltip', tooltipBv: 'BV Tooltip', tooltipTc: 'TC Tooltip', tooltipRrOe: 'RR/OE Tooltip', tooltipCoD: 'CoD Tooltip', tooltipWsjf: 'WSJF Col Tip', valuesMissing: '-', lastItemTitle: '---', tooltipFilterLock: 'Lock Sort', wsjfChartTitleOptimal: "Optimal", wsjfChartTitleCurrent: "Current", wsjfChartLabelTotalCost: "Cost:", wsjfChartNoData: "No Data", resolutionWarning: "ResWarn" }, allTshirtSizes: ['XS', 'S', 'M', 'L', 'XL'], pastelColorPalette: ['#DCBCBD', '#B6E2B7'] };
        global.SCALES = { safe: { values: [0, 1, 2, 3, 5, 8, 13] } }; global.currentScale = 'safe';
        global.currentLanguage = 'en';

        // Keep minimal required shims/mocks
        global.ensureLastItemExists.mockImplementation((pbisArr) => pbisArr || []);
        global.createStoryVisualization.mockClear();
        global.createPlaceholderVisualization.mockClear();
        global.createCodVisualization.mockClear();
        global.createCodPlaceholderVisualization.mockClear();
        global.createCodChart.mockClear(); 
        if(global.window) global.window._equalizeGridRows.mockClear();

        owDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
        cwDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
        global.isPinReferenceEnabled = jest.fn(() => true);
    });

    afterEach(function () {
        if (owDesc) { Object.defineProperty(HTMLElement.prototype, 'offsetWidth', owDesc); }
        if (cwDesc) { Object.defineProperty(HTMLElement.prototype, 'clientWidth', cwDesc); }
        jest.restoreAllMocks();
    });

    function setThreePbisWithReferenceAndSpacer() {
         global.pbis = [ 
            { id: 1, title: 'A', complexity: 1, effort: 1, doubt: 1, jobSize: 3, cod_bv: 2, cod_tc: 1, cod_rroe: 0, cod: 3, tshirtSize: 'S', isReference: false, isLastItem: false }, 
            { id: 2, title: 'REF', complexity: 2, effort: 2, doubt: 1, jobSize: 5, cod_bv: 5, cod_tc: 3, cod_rroe: 2, cod: 10, tshirtSize: 'M', isReference: true, referenceType: 'min', isLastItem: false }, 
            { id: 3, title: 'C', complexity: 3, effort: 2, doubt: 1, jobSize: 6, cod_bv: 6, cod_tc: 2, cod_rroe: 2, cod: 10, tshirtSize: 'L', isReference: false, isLastItem: false }, 
            { id: -1, title: '---', complexity: 0, effort: 0, doubt: 0, jobSize: null, cod_bv: 0, cod_tc: 0, cod_rroe: 0, cod: null, tshirtSize: null, isReference: false, isLastItem: true } 
        ]; 
        global.currentSortCriteria = 'jobSize'; 
        global.currentSortDirection = 'asc'; 
    }

    
    // --- getSortedPbis ---
    test('getSortedPbis pins reference first, spacer last, sorts others asc', function () { var local = [ { id: 1, jobSize: 3, cod: 6, isLastItem: false, complexity: 1, effort: 1, doubt: 1 }, { id: 2, jobSize: 5, cod: 10, isReference: true, isLastItem: false, complexity: 1, effort: 1, doubt: 1 }, { id: 3, jobSize: 1, cod: 2, isLastItem: false, complexity: 1, effort: 1, doubt: 1 }, { id: -1, isLastItem: true } ]; global.currentSortCriteria = 'jobSize'; var list = getSortedPbis(local, 'jobSize', 'asc', config); expect(list.length).toBe(4); expect(list[0].id).toBe(2); expect(list[1].id).toBe(3); expect(list[2].id).toBe(1); expect(list[3].id).toBe(-1); });
    test('getSortedPbis keeps reference first, spacer last, sorts others desc', function () { var local = [ { id: 11, jobSize: 2, cod: 4, isLastItem: false, complexity: 1, effort: 1, doubt: 1 }, { id: 12, jobSize: 3, cod: 5, isReference: true, isLastItem: false, complexity: 1, effort: 1, doubt: 1 }, { id: 13, jobSize: 8, cod: 12, isLastItem: false, complexity: 1, effort: 1, doubt: 1 }, { id: -1, isLastItem: true } ]; global.currentSortCriteria = 'jobSize'; var list = getSortedPbis(local, 'jobSize', 'desc', config); expect(list.length).toBe(4); expect(list[0].id).toBe(12); expect(list[1].id).toBe(13); expect(list[2].id).toBe(11); expect(list[3].id).toBe(-1); });
    test('getSortedPbis treats reference item like others in custom sort', function () { var local = [ { id: 1, jobSize: 3, isReference: false, isLastItem: false }, { id: 2, jobSize: 5, isReference: true, isLastItem: false }, { id: 3, jobSize: 1, isReference: false, isLastItem: false }, { id: -1, isLastItem: true } ]; global.lockedPbiOrder = [1, 2, 3]; global.currentSortCriteria = 'custom'; var list = getSortedPbis(local, 'custom', 'asc', config); expect(list.length).toBe(4); expect(list[0].id).toBe(1); expect(list[1].id).toBe(2); expect(list[2].id).toBe(3); expect(list[3].id).toBe(-1); });


    // --- updateReferenceSlots ---
     test('updateReferenceSlots moves item to slots in default mode', () => { setThreePbisWithReferenceAndSpacer(); global.currentSortCriteria = 'jobSize'; renderPbiList(); renderRelativeSizingList(); updateReferenceSlots(); const leftSlot = document.getElementById('ref-slot-left'); const rightSlot = document.getElementById('ref-slot-right'); expect(leftSlot.style.display).toBe('block'); expect(leftSlot.querySelector('.pbi-item[data-id="2"]')).not.toBeNull(); expect(rightSlot.style.display).toBe('block'); expect(rightSlot.querySelector('.rs-item[data-id="2"]')).not.toBeNull(); expect(document.querySelector('#pbi-list .pbi-item[data-id="2"]')).toBeNull(); });
     test('updateReferenceSlots hides slots if no reference item', () => { global.pbis = [ { id: 1, title: 'A', isReference: false, isLastItem: false }, { id: -1, isLastItem: true } ]; renderPbiList(); renderRelativeSizingList(); updateReferenceSlots(); const leftSlot = document.getElementById('ref-slot-left'); const rightSlot = document.getElementById('ref-slot-right'); expect(leftSlot.style.display).toBe('none'); expect(rightSlot.style.display).toBe('none'); });
     test('updateReferenceSlots respects isPinReferenceEnabled mock', () => { setThreePbisWithReferenceAndSpacer(); renderPbiList(); renderRelativeSizingList(); global.isPinReferenceEnabled.mockReturnValue(false); updateReferenceSlots(); const leftSlot = document.getElementById('ref-slot-left'); const rightSlot = document.getElementById('ref-slot-right'); expect(leftSlot.style.display).toBe('none'); expect(rightSlot.style.display).toBe('none'); });
     test('updateReferenceSlots clones in custom sort mode', () => { setThreePbisWithReferenceAndSpacer(); global.currentSortCriteria = 'custom'; global.lockedPbiOrder = [1, 2, 3]; renderPbiList(); renderRelativeSizingList(); updateReferenceSlots(); const leftSlot = document.getElementById('ref-slot-left'); const rightSlot = document.getElementById('ref-slot-right'); expect(leftSlot.style.display).toBe('block'); expect(leftSlot.querySelector('.pbi-item[data-id="2"].reference-item')).not.toBeNull(); expect(rightSlot.style.display).toBe('block'); expect(rightSlot.querySelector('.rs-item[data-id="2"].reference-item')).not.toBeNull(); expect(document.querySelector('#pbi-list .pbi-item[data-id="2"]')).not.toBeNull(); expect(document.querySelector('#pbi-list .pbi-item[data-id="2"]').classList.contains('reference-item')).toBe(false); expect(document.querySelector('#relative-sizing-list .rs-item[data-id="2"]')).not.toBeNull(); expect(document.querySelector('#relative-sizing-list .rs-item[data-id="2"]').classList.contains('reference-item')).toBe(false); });
     test('updateReferenceSlots hides slots in WSJF tab mode', () => { setThreePbisWithReferenceAndSpacer(); const wsjfPanel = document.getElementById('panel-wsjf-viz'); wsjfPanel.classList.remove('hidden'); renderPbiList(); renderRelativeSizingList(); updateReferenceSlots(); const leftSlot = document.getElementById('ref-slot-left'); const rightSlot = document.getElementById('ref-slot-right'); expect(leftSlot.style.display).toBe('none'); expect(rightSlot.style.display).toBe('none'); expect(document.querySelector('#pbi-list .pbi-item[data-id="2"]')).not.toBeNull(); expect(document.querySelector('#relative-sizing-list .rs-item[data-id="2"]')).not.toBeNull(); });

    // --- List-Rendering Checks ---
     test('renderPbiList renders reference without special class in custom sort', function () { setThreePbisWithReferenceAndSpacer(); global.currentSortCriteria = 'custom'; global.lockedPbiOrder = [1, 2, 3]; renderPbiList(); const pbiList = document.getElementById('pbi-list'); const refItem = pbiList.querySelector('.pbi-item[data-id="2"]'); expect(refItem).not.toBeNull(); expect(refItem.classList.contains('reference-item')).toBe(false); expect(refItem.querySelector('.reference-btn').classList.contains('is-reference')).toBe(true); });
     test('renderPbiList renders reference WITH special class in non-custom/non-wsjf sort', function () { setThreePbisWithReferenceAndSpacer(); global.currentSortCriteria = 'jobSize'; renderPbiList(); const pbiList = document.getElementById('pbi-list'); const refItem = pbiList.querySelector('.pbi-item[data-id="2"]'); expect(refItem).not.toBeNull(); expect(refItem.classList.contains('reference-item')).toBe(true); });
     test('renderRelativeSizingList renders reference without special class in custom sort', function () { setThreePbisWithReferenceAndSpacer(); global.currentSortCriteria = 'custom'; global.lockedPbiOrder = [1, 2, 3]; renderRelativeSizingList(); const rsList = document.getElementById('relative-sizing-list'); const refItem = rsList.querySelector('.rs-item[data-id="2"]'); expect(refItem).not.toBeNull(); expect(refItem.classList.contains('reference-item')).toBe(false); });
     test('renderRelativeSizingList renders reference WITH special class in non-custom/non-wsjf sort', function () { setThreePbisWithReferenceAndSpacer(); global.currentSortCriteria = 'jobSize'; renderRelativeSizingList(); const rsList = document.getElementById('relative-sizing-list'); const refItem = rsList.querySelector('.rs-item[data-id="2"]'); expect(refItem).not.toBeNull(); expect(refItem.classList.contains('reference-item')).toBe(true); });

    // --- Visualization Routing Logic ---
    // Test if the renderer correctly chooses between "Complete Visualization" and "Placeholder"
    test('renderAllVisualizations calls createStoryVisualization for complete items', () => {
        global.pbis = [ { id: 1, complexity: 1, effort: 1, doubt: 1, jobSize: 3, isLastItem: false }, { id: -1, isLastItem: true } ];
        renderAllVisualizations();
        expect(global.createStoryVisualization).toHaveBeenCalledTimes(1);
        expect(global.createPlaceholderVisualization).not.toHaveBeenCalled();
    });

    test('renderAllVisualizations calls createPlaceholderVisualization for incomplete items', () => {
        global.pbis = [ { id: 1, complexity: 1, effort: 0, doubt: 1, jobSize: null, isLastItem: false }, { id: -1, isLastItem: true } ];
        renderAllVisualizations();
        expect(global.createStoryVisualization).not.toHaveBeenCalled();
        expect(global.createPlaceholderVisualization).toHaveBeenCalledTimes(1);
    });

    // --- Relative Sizing Grid Structure ---
    test('renderRelativeSizingList creates correct number of cells per row', () => {
        global.pbis = [ { id: 1, complexity: 1, effort: 1, doubt: 1, jobSize: 3, cod: 5, isLastItem: false } ];
        renderRelativeSizingList();
        const container = document.getElementById('relative-sizing-list');
        const item = container.querySelector('.rs-item[data-id="1"]');
        expect(item).not.toBeNull();
        // Expecting 8 data columns + 1 calculated WSJF column = 9 cells
        expect(item.querySelectorAll('.rs-cell').length).toBe(9);
    });

    // --- Full pipeline ---
    test('renderAll calls ensureLastItemExists and populates containers', function () {
        setThreePbisWithReferenceAndSpacer(); 
        const ensureLastSpy = jest.spyOn(global, 'ensureLastItemExists');
        const createCodChartSpy = jest.spyOn(global, 'createCodChart');

        renderAll(); 

        expect(ensureLastSpy).toHaveBeenCalled();
        expect(createCodChartSpy).toHaveBeenCalledTimes(2);

        expect(document.getElementById('pbi-list').innerHTML).not.toBe('');
        expect(document.getElementById('relative-sizing-list').innerHTML).not.toBe('');
        expect(document.getElementById('visualization-container').innerHTML).not.toBe('');
        expect(document.getElementById('cod-visualization-container').innerHTML).not.toBe('');
        
        const wsjfContainer = document.getElementById('wsjf-visualization-container');
        expect(wsjfContainer.querySelector('#wsjf-chart-optimal-wrapper')).not.toBeNull();
        expect(wsjfContainer.querySelector('#wsjf-chart-current-wrapper')).not.toBeNull();

        // Check if Reference slots were updated (default sort)
        const leftSlot = document.getElementById('ref-slot-left');
        expect(leftSlot.querySelector('.pbi-item[data-id="2"]')).not.toBeNull();
        expect(document.querySelector('#pbi-list .pbi-item[data-id="2"]')).toBeNull();

        jest.restoreAllMocks();
    });


    // --- Button Enablement Logic ---
     test('updateFilterButtonStates disables CoD/WSJF if no CoD data present', function () {
         global.pbis = [ { id: 101, title: 'No CoD 1', jobSize: 3, cod: 0, isLastItem: false }, { id: 102, title: 'No CoD 2', jobSize: 5, cod: null, isLastItem: false }, { id: -1, isLastItem: true} ];
         updateFilterButtonStates();
         var codBtn = document.getElementById('filter-cod-btn'); var wsjfBtn = document.getElementById('filter-wsjf-btn');
         expect(codBtn.disabled).toBe(true); expect(wsjfBtn.disabled).toBe(true);
     });
     test('updateFilterButtonStates enables CoD/WSJF when a PBI has CoD', function () {
         global.pbis = [ { id: 201, title: 'Has CoD', jobSize: 3, cod: 10, isLastItem: false }, { id: 202, title: 'No CoD', jobSize: 5, cod: 0, isLastItem: false }, { id: -1, isLastItem: true} ];
         updateFilterButtonStates();
         var codBtn = document.getElementById('filter-cod-btn'); var wsjfBtn = document.getElementById('filter-wsjf-btn');
         expect(codBtn.disabled).toBe(false); expect(wsjfBtn.disabled).toBe(false);
     });
     test('updateFilterButtonStates disables lock and reset buttons in custom sort', () => {
        setThreePbisWithReferenceAndSpacer();
        global.currentSortCriteria = 'custom';
        updateFilterButtonStates();
        expect(document.getElementById('filter-lock-btn').disabled).toBe(true);
        expect(document.getElementById('reset-filters-btn').disabled).toBe(true);
     });
     test('updateFilterButtonStates enables lock and reset buttons in non-custom sort', () => {
        setThreePbisWithReferenceAndSpacer();
        global.currentSortCriteria = 'jobSize';
        updateFilterButtonStates();
        expect(document.getElementById('filter-lock-btn').disabled).toBe(false);
        expect(document.getElementById('reset-filters-btn').disabled).toBe(false);
     });
     
    test('updateFilterButtonStates disables CSV Export if no PBIs', () => {
         global.pbis = [ { id: -1, isLastItem: true } ];
         updateFilterButtonStates();
         expect(document.getElementById('btn-csv-export').disabled).toBe(true);
    });
    test('updateFilterButtonStates enables CSV Export if PBIs exist', () => {
         global.pbis = [ { id: 1, isLastItem: false }, { id: -1, isLastItem: true } ];
         updateFilterButtonStates();
         expect(document.getElementById('btn-csv-export').disabled).toBe(false);
    });

    test('updateFilterButtonStates disables Asc/Desc buttons in Custom Sort', () => {
         global.pbis = [ { id: 1, isLastItem: false }, { id: -1, isLastItem: true } ];
         global.currentSortCriteria = 'custom';
         updateFilterButtonStates();
         expect(document.getElementById('sort-asc-btn').disabled).toBe(true);
         expect(document.getElementById('sort-desc-btn').disabled).toBe(true);
    });

    test('updateFilterButtonStates enables Asc/Desc buttons in Normal Sort', () => {
         global.pbis = [ { id: 1, isLastItem: false }, { id: -1, isLastItem: true } ];
         global.currentSortCriteria = 'jobSize';
         updateFilterButtonStates();
         expect(document.getElementById('sort-asc-btn').disabled).toBe(false);
         expect(document.getElementById('sort-desc-btn').disabled).toBe(false);
    });

}); 

describe('Legend Sort Info Updates', () => {
     beforeEach(() => {
        document.body.innerHTML = `
            <div id="visualization-legend"><span id="legend-sort-info"></span></div>
            <div id="cod-visualization-legend"><span id="cod-legend-sort-info"></span></div>
            <div id="wsjf-visualization-legend"><span id="wsjf-legend-sort-info"></span></div>`; 
        global.config = {
            uiStrings: {
                legendSortBy: 'Sorted by', sortOptionAsc: 'Ascending', sortOptionDesc: 'Descending', filterJobSize: 'Job Size Filter', filterCoD: 'CoD Filter',
                filterWSJF: 'WSJF Filter', filterTshirtSize: 'T-Shirt Filter', filterCustomSort: 'Custom Sort Filter', colComplexity: 'Complexity Column',
                colEffort: 'Effort Column', colDoubt: 'Doubt Column', colBv: 'BV Column', colTc: 'TC Column', colRrOe: 'RR/OE Column', tooltipFilterLock: 'Locked'
            }
        };
        global.pbis = [{ id: 1, title: 'Item 1', isLastItem: false }];
        global.isFilterLocked = false;
        global.currentSortDirection = 'asc';
        global.currentLanguage = 'en';
    });

    test('updateLegendSortInfo displays Job Size correctly', () => { global.currentSortCriteria = 'jobSize'; updateLegendSortInfo(); expect(document.getElementById('legend-sort-info').textContent).toBe('Sorted by: Job Size Filter - Ascending'); });
    test('updateLegendSortInfo shows Lock status when locked', () => { global.isFilterLocked = true; global.currentSortCriteria = 'jobSize'; updateLegendSortInfo(); expect(document.getElementById('legend-sort-info').textContent).toBe('Sorted by: Locked'); });

    test('updateCodLegendSortInfo displays CoD correctly', () => { global.currentSortCriteria = 'cod'; updateCodLegendSortInfo(); expect(document.getElementById('cod-legend-sort-info').textContent).toBe('Sorted by: CoD Filter - Ascending'); });
    test('updateCodLegendSortInfo displays Custom Sort correctly', () => { global.currentSortCriteria = 'custom'; updateCodLegendSortInfo(); expect(document.getElementById('cod-legend-sort-info').textContent).toBe('Sorted by: Custom Sort Filter'); });

    test('updateWsjfLegendSortInfo displays WSJF correctly', () => { global.currentSortCriteria = 'wsjf'; updateWsjfLegendSortInfo(); expect(document.getElementById('wsjf-legend-sort-info').textContent).toBe('Sorted by: WSJF Filter - Ascending'); });
    test('updateWsjfLegendSortInfo hides on creationOrder', () => { global.currentSortCriteria = 'creationOrder'; updateWsjfLegendSortInfo(); expect(document.getElementById('wsjf-legend-sort-info').style.display).toBe('none'); });
});

describe('UI Update Functions', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="visualization-legend" class=""></div>
            <div id="cod-visualization-legend" class=""></div>
            <div id="wsjf-visualization-legend" class=""></div>
            <div id="split-root" class=""></div>
            <div id="view-tabs" class=""></div>
            <div id="relative-sizing-header">
                <div class="rs-col-header" data-sort-by="complexity">
                    <span class="sort-asc-icon" style="display: none;"></span>
                    <span class="sort-desc-icon" style="display: none;"></span>
                    <span class="sort-default-icon" style="display: none;"></span>
                    <button class="highlight-btn"></button>
                </div>
                <div class="rs-col-header" data-sort-by="effort">
                    <span class="sort-asc-icon" style="display: none;"></span>
                    <span class="sort-desc-icon" style="display: none;"></span>
                    <span class="sort-default-icon" style="display: none;"></span>
                    <button class="highlight-btn"></button>
                </div>
            </div>
            <button id="filter-job-size-btn" class="filter-btn"></button>
            <button id="filter-cod-btn" class="filter-btn"></button>
            <button id="sort-asc-btn"></button>
            <button id="sort-desc-btn"></button>
            <button id="custom-sort-btn"></button>
            <div id="visualization-container">
                 <div class="story-visualization" data-id="2">Viz 2</div>
                 <div class="story-visualization" data-id="1">Viz 1</div>
            </div>
            <div id="cod-visualization-container">
                 <div class="story-visualization" data-id="2">CodViz 2</div>
                 <div class="story-visualization" data-id="1">CodViz 1</div>
            </div>
        `;
        global.pbis = [];
        global.currentSortCriteria = 'creationOrder';
        global.currentSortDirection = 'asc';
        global.isFilterLocked = false;
        global.currentHighlightedColumn = null;
    });

    describe('updateGlobalVisibility', () => {
        test('should hide elements if no real PBIs exist', () => {
            global.pbis = [{ id: -1, isLastItem: true }]; 
            updateGlobalVisibility();
            expect(document.getElementById('visualization-legend').classList.contains('hidden')).toBe(true);
            expect(document.getElementById('split-root').classList.contains('is-empty')).toBe(true);
        });

        test('should show elements if real PBIs exist', () => {
            global.pbis = [{ id: 1, isLastItem: false }, { id: -1, isLastItem: true }];
            updateGlobalVisibility();
            expect(document.getElementById('visualization-legend').classList.contains('hidden')).toBe(false);
            expect(document.getElementById('split-root').classList.contains('is-empty')).toBe(false);
        });
    });

    describe('updateRelativeSizingHeaders', () => {
        test('should show asc icon for current sort criteria (asc)', () => {
            global.currentSortCriteria = 'complexity';
            global.currentSortDirection = 'asc';
            updateRelativeSizingHeaders();
            const header = document.querySelector('.rs-col-header[data-sort-by="complexity"]');
            expect(header.querySelector('.sort-asc-icon').style.display).toBe('inline-block');
        });

        test('should add active class to highlight button', () => {
            global.currentHighlightedColumn = 'effort';
            updateRelativeSizingHeaders();
            const btn = document.querySelector('.rs-col-header[data-sort-by="effort"] .highlight-btn');
            expect(btn.classList.contains('active')).toBe(true);
        });
    });

    describe('updateActiveFilterButtonVisualState', () => {
        test('should activate jobSize button when criteria is jobSize', () => {
            global.currentSortCriteria = 'jobSize';
            updateActiveFilterButtonVisualState();
            expect(document.getElementById('filter-job-size-btn').classList.contains('active')).toBe(true);
            expect(document.getElementById('filter-cod-btn').classList.contains('active')).toBe(false);
        });
    });

    describe('updateSortDirectionButtons', () => {
        beforeEach(() => { global.pbis = [{ id: 1, isLastItem: false }]; });

        test('should activate asc button', () => {
            global.currentSortCriteria = 'jobSize';
            global.currentSortDirection = 'asc';
            updateSortDirectionButtons(global.pbis, global.currentSortDirection);
            expect(document.getElementById('sort-asc-btn').classList.contains('active')).toBe(true);
        });

        test('should activate custom button only for custom sort', () => {
            global.currentSortCriteria = 'custom';
            global.currentSortDirection = 'asc';
            updateSortDirectionButtons(global.pbis, global.currentSortDirection);
            expect(document.getElementById('custom-sort-btn').classList.contains('active')).toBe(true);
            expect(document.getElementById('sort-asc-btn').classList.contains('active')).toBe(false); 
        });
    });

    describe('ensureReferenceFirstInVisualizations', () => {
        test('should move reference item to start of vis containers', () => {
            global.pbis = [{ id: 1, isReference: false }, { id: 2, isReference: true, referenceType: 'min' }];
            ensureReferenceFirstInVisualizations();
            
            const visContainer = document.getElementById('visualization-container');
            expect(visContainer.children.length).toBe(2);
            expect(visContainer.firstElementChild.dataset.id).toBe('2');
            expect(visContainer.firstElementChild.classList.contains('reference-item')).toBe(true);
        });
    });

});

describe('createChartStructure', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        global.config = {
            uiStrings: {
                wsjfChartLabelTotalCost: 'Total Cost:',
                wsjfChartLegendLabelVertical: 'Y:',
                wsjfChartLegendUnitVertical: 'Cost',
                wsjfChartLegendLabelHorizontal: 'X:',
                wsjfChartLegendUnitHorizontal: 'Size'
            }
        };
        global.isOptimalChartCollapsed = false;
        global.currentSortCriteria = 'wsjf';
    });

    test('should create the correct DOM structure', () => {
        createChartStructure(container, 'test-chart', 'Test Title');
        const wrapper = container.querySelector('#wsjf-chart-test-chart-wrapper');
        expect(wrapper).not.toBeNull();
        expect(wrapper.querySelector('.wsjf-chart-title').textContent).toBe('| Test Title');
    });

    test('should add collapsed class to optimal chart if global flag is set', () => {
        global.isOptimalChartCollapsed = true;
        createChartStructure(container, 'optimal', 'Optimal Title');
        const wrapper = container.querySelector('#wsjf-chart-optimal-wrapper');
        expect(wrapper.classList.contains('collapsed')).toBe(true);
    });
});

describe('renderWsjfVisualization Details', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="wsjf-visualization-container"></div>';
        global.createCodChart = jest.fn(() => 100);

        global.getReferencePbi = jest.fn((list, type) => {
            if (!Array.isArray(list)) return null;
            return list.find(p => p.isReference && (!type || p.referenceType === type)) || null;
        });
                
        global.currentSortCriteria = 'wsjf'; 
        global.currentSortDirection = 'desc';
        global.lockedPbiOrder = [];
        global.isOptimalChartCollapsed = false;

        global.config = {
            uiStrings: {
                wsjfChartNoData: "No valid WSJF data available.", 
                wsjfChartTitleOptimal: "Optimal",
                wsjfChartTitleCurrent: "Current",
                valuesMissing: "N/A"
            },
            pastelColorPalette: ['#ccc']
        };
    });

    test('should render "No Data" message if no valid PBIs exist', () => {
        // Even if cod/jobSize are > 0, missing sub-components (like complexity) makes it invalid now
        const emptyPbis = [{ id: 1, cod: 0, jobSize: 5, complexity: 0, effort: 0 }]; 
        renderWsjfVisualization(emptyPbis);
        const container = document.getElementById('wsjf-visualization-container');
        expect(container.textContent).toContain(global.config.uiStrings.wsjfChartNoData);
    });

    test('should render charts if valid PBIs exist', () => {
        const validPbis = [{ 
            id: 1, 
            title: 'A',
            jobSize: 5, 
            cod: 100, 
            // Job Size Components
            complexity: 1, effort: 3, doubt: 1,
            // CoD Components
            cod_bv: 50, cod_tc: 40, cod_rroe: 10
        }];
        
        renderWsjfVisualization(validPbis);
        const container = document.getElementById('wsjf-visualization-container');
        
        expect(container.querySelector('#wsjf-chart-optimal-wrapper')).not.toBeNull();
        expect(global.createCodChart).toHaveBeenCalledTimes(2);
    });

    test('should calculate percentage difference correctly', () => {
        const validPbis = [{ 
            id: 1, 
            title: 'A',
            jobSize: 5, 
            cod: 100,
            // Job Size Components
            complexity: 1, effort: 3, doubt: 1,
            // CoD Components
            cod_bv: 50, cod_tc: 40, cod_rroe: 10
        }];
        
        // Mock createCodChart: First call (Optimal) = 100, Second call (Current) = 150
        global.createCodChart.mockReturnValueOnce(100).mockReturnValueOnce(150);
        
        renderWsjfVisualization(validPbis);
        
        const currentCostSpan = document.getElementById('wsjf-chart-current-total-cost-value');
        expect(currentCostSpan).not.toBeNull(); // Ensure element exists first
        
        // (150 - 100) / 100 = 50% increase
        expect(currentCostSpan.textContent).toContain('(+50%)');
        
        const costLabelDiv = document.getElementById('wsjf-chart-current-total-cost');
        expect(costLabelDiv.classList.contains('cost-higher')).toBe(true);
    });
});

describe('syncRelativeSizingHeaderPadding', () => {
    let header, list, tabs, rightSlot;

    beforeEach(() => {
        // Mocking DOM elements with style objects
        header = { style: {} };
        list = { offsetWidth: 100, clientWidth: 90, style: {} }; // Mock scrollbar width = 10px
        tabs = { style: {} };
        rightSlot = { 
            style: {}, 
            classList: { contains: jest.fn().mockReturnValue(true) } 
        };

        jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            if (id === 'relative-sizing-header') return header;
            if (id === 'relative-sizing-list') return list;
            if (id === 'view-tabs') return tabs;
            if (id === 'ref-slot-right') return rightSlot;
            return null;
        });

        window.getComputedStyle = jest.fn((element) => {
            return {
                getPropertyValue: (prop) => {
                    if (prop === '--right-gutter') return '5';
                    return '';
                }
            };
        });
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should apply padding equal to scrollbar width + gutter', () => {
        syncRelativeSizingHeaderPadding();
        // 10px scrollbar + 5px gutter
        expect(header.style.paddingRight).toBe('calc(10px + 5px)');
        expect(tabs.style.paddingRight).toBe('calc(10px + 5px)');
    });
    
    test('should handle no scrollbar (width 0)', () => {
        list.offsetWidth = 100;
        list.clientWidth = 100; // No scrollbar
        syncRelativeSizingHeaderPadding();
        expect(header.style.paddingRight).toBe('calc(0px + 5px)');
    });

    test('should not apply padding if right slot has no content', () => {
        rightSlot.classList.contains.mockReturnValue(false);
        syncRelativeSizingHeaderPadding();
        expect(rightSlot.style.paddingRight).toBe('');
    });
});