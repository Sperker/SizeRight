// ===================================================================================
// 2_RENDER.JS
// ===================================================================================


/**
 * @file 2_RENDER.JS - The UI Rendering Engine & DOM Synchronizer
 * @description
 * This file serves as the View layer of the application. It is responsible for 
 * transforming the internal state (PBIs, sort criteria, and filters) into a 
 * responsive and interactive user interface.
 * * 
 *
 * <br><b>Core Responsibilities:</b>
 * <ul>
 * <li><b>Rendering Orchestration:</b> The `renderAll` function acts as a master 
 * controller, triggering synchronized updates across the PBI list, bubble charts, 
 * and the Relative Sizing table.</li>
 * <li><b>Dynamic Visualizations:</b> Generates complex SVG and DIV-based charts, 
 * including Job Size bubbles, Cost of Delay stacks, and WSJF economic sequencing 
 * charts.</li>
 * <li><b>DOM Alignment:</b> Manages technical layout challenges, such as 
 * synchronizing row heights between split panels and adjusting header padding 
 * to account for dynamic scrollbars.</li>
 * <li><b>I18n Injection:</b> Maps localized strings from the global configuration 
 * into specific DOM elements, supporting multi-language support on the fly.</li>
 * <li><b>State-to-UI Mapping:</b> Updates the visual status of buttons, legends, 
 * and tooltips based on the current data availability (e.g., disabling the 
 * WSJF button if CoD values are missing).</li>
 * </ul>
 *
 * <br><b>Technical Approach:</b>
 * The file utilizes efficient DOM manipulation techniques, such as 
 * <code>requestAnimationFrame</code>, to ensure smooth visual transitions and 
 * avoid layout thrashing during heavy rendering cycles.
 */


// ===================================================================================
// RENDERING FUNCTIONS
// ===================================================================================


/**
 * Applies the localized text strings from the global configuration to the DOM.
 * <br><b>Role (Localization Engine):</b>
 * This function acts as the bridge between the data model (`config.uiStrings`) and the user interface.
 * It is called during application startup and immediately after the user switches the language in the settings.
 *
 * <br><b>Internal Abstractions:</b>
 * To avoid repetitive `document.getElementById` calls and null-checks, this function defines several scoped helper functions:
 * <ul>
 * <li>`setText(id, text)`: Safely updates `.textContent`.</li>
 * <li>`setTitle(id, text)`: Safely updates the hover `.title` (tooltip).</li>
 * <li>`setPlaceholder(id, text)`: Safely updates input placeholders.</li>
 * <li>`setValue(id, text)`: Safely updates form input values (e.g., textareas).</li>
 * </ul>
 *
 * <br><b>Dynamic Layout Logic ("About" Modal):</b>
 * For the Info/About modal, the function uses `setOptionalInfoEntry`. This helper doesn't just change text;
 * it checks if the configuration value exists. If a field (like "Department" or "Email") is empty in the config,
 * the entire HTML container for that row is hidden (`display: none`). This allows for a clean layout that adapts to available metadata.
 *
 * <br><b>Robustness:</b>
 * The function is designed to be fault-tolerant. If a specific DOM ID is missing (e.g., because the HTML structure changed),
 * it logs a `console.warn` instead of throwing an error, ensuring the rest of the UI still translates correctly.
 */
function applyUiStrings() {
    const s = config.uiStrings;
    var spanEl;
    var el;

    function setText(id, text) {
        el = document.getElementById(id);
        if (el) {
            el.textContent = text || '';
        } else {
            console.warn('applyUiStrings: Element with ID "' + id + '" not found.');
        }
    }

    function setTitle(id, text) {
        el = document.getElementById(id);
        if (el) {
            el.title = text || '';
        } else {
            console.warn('applyUiStrings: Element with ID "' + id + '" not found.');
        }
    }

    function setPlaceholder(id, text) {
        el = document.getElementById(id);
        if (el) {
            el.placeholder = text || '';
        } else {
            console.warn('applyUiStrings: Element with ID "' + id + '" not found.');
        }
    }

    function setValue(id, text) {
        el = document.getElementById(id);
        if (el) {
            el.value = text || '';
        } else {
            console.warn('applyUiStrings: Element with ID "' + id + '" not found.');
        }
    }

     function setQueryText(selector, text) {
        el = document.querySelector(selector);
        if (el) {
            el.textContent = text || '';
        } else {
            console.warn('applyUiStrings: Element with selector "' + selector + '" not found.');
        }
    }
    
    function setQueryAllTitle(selector, text) {
        var foundElements = document.querySelectorAll(selector);
        if (foundElements.length === 0 && selector === '.highlight-btn') {
             // console.warn('applyUiStrings: No elements found for selector "' + selector + '". This might be okay if the list is initially empty.');
        }
        foundElements.forEach(function(item, index) {
            if (item) {
                item.title = text || '';
            } else {
                console.warn('applyUiStrings: Item at index ' + index + ' for selector "' + selector + '" became invalid.');
            }
        });
    }


    /**
     * Sets text for an info modal entry and hides the entire entry if the value is empty.
     * @param {string} entryDivId - The ID of the container div (e.g., 'info-entry-contact').
     * @param {string} labelSpanId - The ID of the label span (e.g., 'info-contact-label').
     * @param {string} valueSpanId - The ID of the value span (e.g., 'info-contact-value').
     * @param {string} labelText - The text for the label.
     * @param {string} valueText - The text for the value.
     * @returns {boolean} Returns true if the entry was hidden (value was empty), false otherwise.
     */
    function setOptionalInfoEntry(entryDivId, labelSpanId, valueSpanId, labelText, valueText) {
        var entryDiv = document.getElementById(entryDivId);
        if (!entryDiv) {
            // console.warn('applyUiStrings: Element with ID "' + entryDivId + '" not found.');
            return false;
        }

        var labelSpan = document.getElementById(labelSpanId);
        var valueSpan = document.getElementById(valueSpanId);

        if (!valueText || valueText.trim() === '') {
            entryDiv.style.display = 'none';
            return true;
        } else {
            entryDiv.style.display = '';
            if (labelSpan) {
                labelSpan.textContent = labelText || '';
            }
            if (valueSpan) {
                valueSpan.textContent = valueText || '';
            }
            return false;
        }
    }

    document.title = s.pageTitle;
    if (document.documentElement) {
        document.documentElement.lang = currentLanguage;
    } else {
         console.warn('applyUiStrings: document.documentElement not found.');
    }

    setText('main-header', s.mainHeader);
    setText('main-claim', s.mainClaim);
    setText('add-pbi-btn', s.btnAddPbi);
    setTitle('import-btn', s.btnImportTitle);
    setTitle('export-btn', s.btnExportTitle);
    setTitle('help-btn', s.helpButtonTitle);
    setText('legend-complexity', s.legendComplexity);
    setText('legend-effort', s.legendEffort);
    setText('legend-doubt', s.legendDoubt);
    setText('legend-cod-bv', s.modalLabelCodBv);
    setText('legend-cod-tc', s.modalLabelCodTc);
    setText('legend-cod-rroe', s.modalLabelCodRroe);
    setPlaceholder('pbi-title', s.modalPlaceholderTitle);
    setPlaceholder('pbi-notes', s.modalNotesPlaceholder);
    setText('cancel-btn', s.btnCancel);
    setText('save-btn', s.btnSave);
    setTitle('settings-btn', s.btnSettingsTitle);
    setTitle('reset-app-btn', s.btnResetAppTitle);
    setText('settings-modal-title', s.modalTitleSettings);
    setText('settings-modal-language-label', s.modalLanguageLabel);
    setText('settings-lang-option-de', s.langOptionDe);
    setText('settings-lang-option-en', s.langOptionEn);
    setText('settings-cancel-btn', s.btnCancel);
    setText('settings-save-btn', s.btnSave);
    setTitle('modal-prev-btn', s.tooltipModalPrev);
    setTitle('modal-next-btn', s.tooltipModalNext);
    setText('filter-job-size-btn', s.filterJobSize);
    setText('filter-cod-btn', s.filterCoD);
    setText('filter-wsjf-btn', s.filterWSJF);
    setText('filter-tshirt-size-btn', s.filterTshirtSize);
    setTitle('custom-sort-btn', s.filterCustomSort);
    setText('tab-btn-jobsize', s.tabJobSize);
    setText('tab-btn-cod', s.tabCoD);
    setText('settings-modal-scale-label', s.modalScaleLabel);
    setText('settings-modal-tshirt-label', s.modalTshirtLabel);
    setText('settings-modal-general-label', s.settingsModalGeneralLabel);
    setText('settings-label-show-res-warning', s.settingsLabelShowResWarning);
    setText('settings-scale-option-metric', s.scaleOptionMetric);
    setText('settings-scale-option-safe', s.scaleOptionSAFe);
    setTitle('sort-asc-btn', s.tooltipSortAsc);
    setTitle('sort-desc-btn', s.tooltipSortDesc);
    setTitle('filter-lock-btn', isFilterLocked ? s.tooltipFilterUnlock : s.tooltipFilterLock);
    setTitle('reset-filters-btn', s.btnResetFiltersTitle);

    setQueryText('#modal-complexity-label .label-text', s.modalLabelComplexity);
    setQueryText('#modal-effort-label .label-text', s.modalLabelEffort);
    setQueryText('#modal-doubt-label .label-text', s.modalLabelDoubt);
    setQueryText('#modal-cod-bv-label .label-text', s.modalLabelCodBv);
    setQueryText('#modal-cod-tc-label .label-text', s.modalLabelCodTc);
    setQueryText('#modal-cod-rroe-label .label-text', s.modalLabelCodRroe);
    setText('modal-notes-label', s.modalLabelNotes);

    setText('reset-cod-btn', s.btnResetCoD);
    setText('reset-job-size-btn', s.btnResetJobSize);
    setTitle('split-divider', s.dividerTooltip);
    setText('info-modal-title', s.modalTitleInfo);
    setText('info-weblink-label', s.infoWeblinkLabel);

    setText('reset-app-modal-title', s.modalTitleResetApp);
    setText('reset-app-text', s.resetAppText);
    setText('reset-app-export-btn', s.btnResetAppExport);
    setText('reset-app-confirm-btn', s.btnResetAppDelete);
    setText('reset-app-cancel-btn', s.btnCancel);

    setTitle('btn-editor-bold', s.editorBold);
    setTitle('btn-editor-italic', s.editorItalic);
    setTitle('btn-editor-underline', s.editorUnderline);
    setTitle('btn-editor-strike', s.editorStrikethrough);
    setTitle('btn-editor-link', s.editorLink);
    setTitle('btn-editor-clean', s.editorClean);
    
    setTitle('btn-editor-c1', s.editorColor1);
    setTitle('btn-editor-c2', s.editorColor2);
    setTitle('btn-editor-c3', s.editorColor3);
    setTitle('btn-editor-c4', s.editorColor4);

    setTitle('btn-csv-export', s.btnCsvExportTitle);
    setText('csv-export-modal-title', s.modalTitleCsvExport);
    setText('csv-export-text', s.csvExportText);
    setText('btn-csv-export-cancel', s.btnCsvExportCancel);
    setText('btn-csv-export-confirm', s.btnCsvExportConfirm);

    setText('settings-modal-editor-color-label', s.settingsEditorColorLabel);
    setText('label-editor-c1', s.editorColor1);
    setText('label-editor-c2', s.editorColor2);
    setText('label-editor-c3', s.editorColor3);
    setText('label-editor-c4', s.editorColor4);

    setText('csv-sort-btn-job-size', s.filterJobSize);
    setText('csv-sort-btn-tshirt-size', s.filterTshirtSize);
    setText('csv-sort-btn-cod', s.filterCoD);
    setText('csv-sort-btn-wsjf', s.filterWSJF);
    setTitle('csv-sort-custom-btn', s.filterCustomSort);
    setTitle('csv-sort-asc-btn', s.tooltipSortAsc);
    setTitle('csv-sort-desc-btn', s.tooltipSortDesc);

    setText('resolution-warning-text', s.resolutionWarning);
    setText('resolution-warning-ignore-btn', s.btnOpenAnyway);

    el = document.getElementById('info-weblink-sentence');
    if (el && s.infoWeblinkSentence) {
        el.textContent = '';

        const parts = String(s.infoWeblinkSentence).split('{weblink}');
        const a = document.createElement('a');
        a.href = s.infoWeblinkUrl || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = s.infoWeblinkText || (s.infoWeblinkUrl || 'link');

        el.appendChild(document.createTextNode(parts[0] || ''));
        el.appendChild(a);
        el.appendChild(document.createTextNode(parts[1] || ''));
    } else if (!el) {
        // console.warn('applyUiStrings: Element with ID "info-weblink-sentence" not found.');
    }

    setText('info-about-label', s.infoAboutLabel);
    setText('info-version-label', s.infoVersionLabel);
    setText('info-build-label', s.infoBuildLabel);

    var isContactEmpty = setOptionalInfoEntry(
        'info-entry-contact',
        'info-contact-label',
        'info-contact-value',
        s.infoContactLabel,
        s.infoContactValue
    );

    var isFunctionEmpty = setOptionalInfoEntry(
        'info-entry-function',
        'info-function-label',
        'info-function-value',
        s.infoFunctionLabel,
        s.infoFunctionValue
    );

    var isEmailEmpty = setOptionalInfoEntry(
        'info-entry-email',
        'info-email-label',
        'info-email-value',
        s.infoEmailLabel,
        s.infoEmailValue
    );

    var isDepartmentEmpty = setOptionalInfoEntry(
        'info-entry-department',
        'info-department-label',
        'info-department-value',
        s.infoDepartmentLabel,
        s.infoDepartmentValue
    );

    var isCompanyEmpty = setOptionalInfoEntry(
        'info-entry-company',
        'info-company-label',
        'info-company-value',
        s.infoCompanyLabel,
        s.infoCompanyValue
    );

    var divider = document.getElementById('info-about-divider');
    var licenseTextArea = document.getElementById('info-license-text');
    var allOptionalEntriesEmpty = isContactEmpty && isFunctionEmpty && isEmailEmpty && isDepartmentEmpty && isCompanyEmpty;

    if (divider) {
        if (allOptionalEntriesEmpty) {
            divider.style.display = 'none';
        } else {
            divider.style.display = '';
        }
    }

    if (licenseTextArea) {
        if (allOptionalEntriesEmpty) {
            licenseTextArea.style.minHeight = '100px';
        } else {
            licenseTextArea.style.minHeight = '';
        }
    }
    var licenseTextAreaThirdParty = document.getElementById('info-license-text-thirdparty');
    if (licenseTextAreaThirdParty) {
        if (allOptionalEntriesEmpty) {
            licenseTextAreaThirdParty.style.minHeight = '100px';
        } else {
            licenseTextAreaThirdParty.style.minHeight = '';
        }
    }


    setText('info-close-btn', s.btnClose);
    setText('info-tab-btn-software', s.infoTabLicenseSoftware);
    setText('info-tab-btn-thirdparty', s.infoTabLicenseThirdParty);
    
    setText('info-license-designation-software', s.infoLicenseDesignationSoftware);
    setText('info-license-link-software', s.infoLicenseLinkTextSoftware);
    setText('info-license-designation-thirdparty', s.infoLicenseDesignationThirdParty);
    setText('info-license-link-thirdparty', s.infoLicenseLinkTextThirdParty);
    
    setValue('info-license-text', s.licenseText);
    setValue('info-license-text-thirdparty', s.licenseTextThirdParty);
    setText('settings-modal-color-label', s.settingsColorLabel);
    setText('color-label-complexity', s.colorComplexity);
    setText('color-label-effort', s.colorEffort);
    setText('color-label-doubt', s.colorDoubt);
    setText('color-label-total', s.colorTotal);
    setText('color-label-number-complexity', s.colorNumberComplexity);
    setText('color-label-number-effort', s.colorNumberEffort);
    setText('color-label-number-doubt', s.colorNumberDoubt);
    setText('color-label-bv', s.colorBv);
    setText('color-label-tc', s.colorTc);
    setText('color-label-rroe', s.colorRrOe);
    setText('color-label-number-bv', s.colorNumberBv);
    setText('color-label-number-tc', s.colorNumberTc);
    setText('color-label-number-rroe', s.colorNumberRrOe);
    setText('reset-settings-btn', s.btnResetSettings);
    setText('view-tab-job-size-viz', s.tabJobSizeViz);
    setText('view-tab-cod-viz', s.tabCoDViz);
    setText('view-tab-wsjf-viz', s.tabWsjfViz);
    setText('view-tab-relative-sizing', s.tabRelativeSizing);
    setText('rs-group-header-job-size', s.groupJobSize);
    setText('rs-group-header-cod', s.groupCoD);
    setText('rs-group-header-wsjf', s.groupWsjf);

    spanEl = document.getElementById('rs-col-header-complexity');
    if (spanEl) {
        spanEl.textContent = s.colComplexity || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipComplexity || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-complexity" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-complexity" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-effort');
     if (spanEl) {
        spanEl.textContent = s.colEffort || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipEffort || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-effort" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-effort" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-doubt');
    if (spanEl) {
        spanEl.textContent = s.colDoubt || '';
         if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipDoubt || ''; }
         else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-doubt" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-doubt" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-job-size');
    if (spanEl) {
        spanEl.textContent = s.colJobSize || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipJobSize || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-job-size" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-job-size" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-bv');
     if (spanEl) {
        spanEl.textContent = s.colBv || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipBv || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-bv" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-bv" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-tc');
     if (spanEl) {
        spanEl.textContent = s.colTc || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipTc || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-tc" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-tc" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-rroe');
    if (spanEl) {
        spanEl.textContent = s.colRrOe || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipRrOe || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-rroe" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-rroe" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-cod');
    if (spanEl) {
        spanEl.textContent = s.pbiInfoCoD || '';
        if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipCoD || ''; }
        else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-cod" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-cod" not found.'); */ }

    spanEl = document.getElementById('rs-col-header-wsjf');
    if (spanEl) {
        spanEl.textContent = s.colWsjf || '';
         if (spanEl.parentElement) { spanEl.parentElement.title = s.tooltipWsjf || ''; }
         else { /* console.warn('applyUiStrings: Parent element for ID "rs-col-header-wsjf" not found.'); */ }
    } else { /* console.warn('applyUiStrings: Element with ID "rs-col-header-wsjf" not found.'); */ }


    setQueryAllTitle('.highlight-btn', s.highlightColumnTitle);

    updateLegendSortInfo();
    updateCodLegendSortInfo();
    updateWsjfLegendSortInfo(); 

    setText('modal-prev-label', s.navPrevItem);
    setText('modal-next-label', s.navNextItem);
    
    if (document.getElementById('settings-label-show-ref-markers')) {
        setText('settings-label-show-ref-markers', s.settingShowRefMarkers);
    }
    
    if (typeof updateRefMarkerButtonState === 'function') {
        updateRefMarkerButtonState();
    }
}


/**
 * The central sorting engine for the Backlog Item list.
 * <br><b>Architecture (Partitioned Sorting):</b>
 * This function does not simply sort the entire array. Instead, it employs a "Divide and Conquer" strategy to ensure UI stability:
 * <ol>
 * <li><b>Zone 1: Reference Items (Pinned Top):</b> Items marked as "Reference Min" or "Reference Max" are extracted and pinned to the top of the list, regardless of the sort criteria (unless in Custom/WSJF mode). This keeps the "Ruler" anchors visible.</li>
 * <li><b>Zone 2: Content Items (Sorted):</b> The main body of PBIs is sorted according to the selected `criteria`.</li>
 * <li><b>Zone 3: Spacer (Pinned Bottom):</b> The "Add New" placeholder (`id: -1`) is extracted and forced to the very bottom.</li>
 * </ol>
 *
 * <br><b>Sorting Strategies:</b>
 * <ul>
 * <li><b>'custom' / 'lock':</b> Reconstructs the order based on an array of IDs (`lockedPbiOrder`). This restores the user's Drag-and-Drop arrangement. Items found in the data but missing from the lock-list are appended at the end.</li>
 * <li><b>'tshirtSize':</b> Maps string values (S, M, L) to numeric indices using `configData.allTshirtSizes` to ensure logical sizing order (XXS < XS < S...).</li>
 * <li><b>'wsjf':</b> Calculates the Weighted Shortest Job First score dynamically:
 * $$WSJF = \frac{\text{Cost of Delay}}{\text{Job Size}}$$
 * </li>
 * <li><b>Standard Properties:</b> Sorts numerically by fields like `jobSize`, `cod`, etc. Uses the Title as a fallback tie-breaker.</li>
 * </ul>
 *
 * @param {Array<Object>} pbisToSort - The raw list of PBI objects.
 * @param {string} criteria - The property or mode to sort by (e.g., 'jobSize', 'wsjf', 'custom').
 * @param {string} direction - 'asc' for ascending, 'desc' for descending.
 * @param {Object} configData - Global configuration containing T-Shirt size definitions.
 * @param {boolean} isWsjfTabActive - Flag to disable Reference Pinning when viewing the WSJF chart (where strict ranking matters more than references).
 * @returns {Array<Object>} A new array containing the fully ordered list ready for rendering.
 */
function getSortedPbis(pbisToSort, criteria, direction, configData, isWsjfTabActive) {

    var referencePbis = [];
    var spacerPbi = null;
    var otherPbis = [];
    var isCustomSort = (criteria === 'custom');
    var isWsjfTab = (isWsjfTabActive === true);

    (pbisToSort || []).forEach(function(pbi) {
        if (!pbi) return;
        
        var isPinned = pbi.isReference && !isCustomSort && !isWsjfTab;

        if (isPinned) {
            referencePbis.push(pbi);
        } else if (pbi.isLastItem || pbi.id === -1) {
            spacerPbi = pbi;
        } else {
            otherPbis.push(pbi);
        }
    });

    referencePbis.sort(function(a, b) {
        if (a.referenceType === 'min') return -1;
        if (b.referenceType === 'min') return 1;
        if (a.referenceType === 'max') return 1;
        if (b.referenceType === 'max') return -1;
        return 0;
    });

    var sortedOthers;

    if (criteria === 'creationOrder') {
        sortedOthers = otherPbis.slice();
    }
    else if (criteria === 'lock' && lockedPbiOrder.length > 0) {
        const pbiMap = otherPbis.reduce(function(map, pbi) {
            map[pbi.id] = pbi;
            return map;
        }, {});
        sortedOthers = lockedPbiOrder
            .map(id => pbiMap[id])
            .filter(pbi => pbi !== undefined);

        const currentLockedOrderIds = lockedPbiOrder.reduce((set, id) => { set[id] = true; return set; }, {});
        const newPbisNotInLock = otherPbis.filter(pbi => !currentLockedOrderIds[pbi.id]);

        sortedOthers = sortedOthers.concat(newPbisNotInLock);

    } else if (criteria === 'custom') {
        const pbiMap = otherPbis.reduce(function(map, pbi) {
            map[pbi.id] = pbi;
            return map;
        }, {});
        sortedOthers = lockedPbiOrder
            .map(id => pbiMap[id])
            .filter(pbi => pbi !== undefined); 

        const currentCustomOrderIds = lockedPbiOrder.reduce((set, id) => { set[id] = true; return set; }, {});
        const newPbisNotInOrder = otherPbis.filter(pbi => !currentCustomOrderIds[pbi.id]);

        sortedOthers = sortedOthers.concat(newPbisNotInOrder);

        if (direction === 'desc') {
            sortedOthers.reverse();
        }

    } else {
        sortedOthers = otherPbis.slice().sort(function(a, b) {
            let valA, valB;

            if (criteria === 'tshirtSize') {
                const sizeOrder = configData.allTshirtSizes.reduce(function(acc, size, index) {
                    acc[size] = index + 1;
                    return acc;
                }, {});
                valA = sizeOrder[a.tshirtSize] || 999;
                valB = sizeOrder[b.tshirtSize] || 999;
            } else if (criteria === 'wsjf') {

                var isJobSizeCompleteA = (a.complexity > 0 && a.effort > 0 && a.doubt > 0);
                var isCodCompleteA = (a.cod_bv > 0 && a.cod_tc > 0 && a.cod_rroe > 0);
                
                var isJobSizeCompleteB = (b.complexity > 0 && b.effort > 0 && b.doubt > 0);
                var isCodCompleteB = (b.cod_bv > 0 && b.cod_tc > 0 && b.cod_rroe > 0);

                const sumA = a.jobSize || 1;
                const sumB = b.jobSize || 1;
                
                valA = (isJobSizeCompleteA && isCodCompleteA) ? ((a.cod || 0) / sumA) : 0;
                valB = (isJobSizeCompleteB && isCodCompleteB) ? ((b.cod || 0) / sumB) : 0;

            } else {
                valA = typeof a[criteria] === 'number' ? a[criteria] : 0;
                valB = typeof b[criteria] === 'number' ? b[criteria] : 0;

                if (criteria === 'jobSize') {
                    var isCompleteA = (a.complexity > 0 && a.effort > 0 && a.doubt > 0);
                    var isCompleteB = (b.complexity > 0 && b.effort > 0 && b.doubt > 0);
                    if (!isCompleteA) { valA = 0; }
                    if (!isCompleteB) { valB = 0; }
                }

                if (criteria === 'cod') {
                    var isCompleteA = (a.cod_bv > 0 && a.cod_tc > 0 && a.cod_rroe > 0);
                    var isCompleteB = (b.cod_bv > 0 && b.cod_tc > 0 && b.cod_rroe > 0);
                    if (!isCompleteA) { valA = 0; }
                    if (!isCompleteB) { valB = 0; }
                }
            }

            if (valA === valB) {
                const titleA = (a.title || '').toLowerCase();
                const titleB = (b.title || '').toLowerCase();
                if (titleA < titleB) return -1;
                if (titleA > titleB) return 1;
                return 0;
            }

            return valA - valB;
        });

        if (direction === 'desc') {
            sortedOthers.reverse();
        }
    }

    var finalSortedList = [];

    finalSortedList = finalSortedList.concat(referencePbis);

    finalSortedList = finalSortedList.concat(sortedOthers); 
    if (spacerPbi) {
        finalSortedList = finalSortedList.concat(spacerPbi);
    }

    return finalSortedList;
}


/**
 * Updates the enabled/disabled state and active status of all toolbar filter and sort buttons.
 * <br><b>Logic & Validation Rules:</b>
 * This function performs a conditional analysis of the current dataset to ensure the UI remains consistent:
 * <ul>
 * <li><b>Data Availability:</b> Most buttons (Export, Sort, Filter) are disabled if the list is empty (`!hasPbis`).</li>
 * <li><b>Metric-Specific Filtering:</b>
 * <ul>
 * <li><b>CoD & WSJF:</b> Buttons are only enabled if at least one item has a calculated Cost of Delay (`isAnyCoDAvailable`).</li>
 * <li><b>T-Shirt Size:</b> The button is only enabled if at least one item has an assigned T-Shirt size.</li>
 * </ul>
 * </li>
 * <li><b>Filter Lock Constraints:</b> If `isFilterLocked` is true, switching to a different sort criteria (like Job Size or CoD) is disabled to protect the current "frozen" view.</li>
 * <li><b>Custom Sort Context:</b> When `currentSortCriteria` is 'custom' (Drag-and-Drop mode), the standard Asc/Desc toggles are disabled because the order is manually defined by the user.</li>
 * </ul>
 *
 * <br><b>Automatic Fallback (State Protection):</b>
 * The function includes self-healing logic. If the user deletes the only item that had a CoD value while the 'wsjf' filter was active, the function automatically resets the `currentSortCriteria` to `'creationOrder'`. This prevents the application from trying to sort by non-existent data.
 *
 * <br><b>Global State Reset:</b>
 * If all items are deleted, it resets all sorting variables (`currentSortCriteria`, `lockedPbiOrder`, `isFilterLocked`) to their default "empty" states.
 */
function updateFilterButtonStates() {
    const realPbis = pbis.filter(function(p) { return !p.isLastItem; });
    const hasPbis = realPbis.length > 0;
    const isAnyCoDAvailable = realPbis.some(pbi => pbi.cod && pbi.cod > 0);
    const isAnyTshirtSizeAvailable = realPbis.some(pbi => pbi.tshirtSize);
    
    const jobSizeBtn = document.getElementById('filter-job-size-btn');
    const codBtn = document.getElementById('filter-cod-btn');
    const wsjfBtn = document.getElementById('filter-wsjf-btn');
    const tshirtSizeBtn = document.getElementById('filter-tshirt-size-btn');
    const sortAscBtn = document.getElementById('sort-asc-btn');
    const sortDescBtn = document.getElementById('sort-desc-btn');
    const customSortBtn = document.getElementById('custom-sort-btn');
    const exportBtn = document.getElementById('export-btn');
    const csvExportBtn = document.getElementById('btn-csv-export');
    
    const lockBtn = document.getElementById('filter-lock-btn');
    const resetBtn = document.getElementById('reset-filters-btn');

    if (jobSizeBtn) jobSizeBtn.disabled = !hasPbis || isFilterLocked;
    if (codBtn) codBtn.disabled = !hasPbis || !isAnyCoDAvailable || isFilterLocked;
    if (wsjfBtn) wsjfBtn.disabled = !hasPbis || !isAnyCoDAvailable || isFilterLocked;
    if (tshirtSizeBtn) tshirtSizeBtn.disabled = !hasPbis || !isAnyTshirtSizeAvailable || isFilterLocked;

    const isCustomSort = currentSortCriteria === 'custom';
    if (sortAscBtn) sortAscBtn.disabled = !hasPbis || isCustomSort;
    if (sortDescBtn) sortDescBtn.disabled = !hasPbis || isCustomSort;

    if (customSortBtn) customSortBtn.disabled = !hasPbis;

    if (lockBtn) lockBtn.disabled = !hasPbis || currentSortCriteria === 'custom';
    if (resetBtn) resetBtn.disabled = !hasPbis || currentSortCriteria === 'custom';

    if (exportBtn) exportBtn.disabled = !hasPbis;
    if (csvExportBtn) csvExportBtn.disabled = !hasPbis;

    const defaultCriteria = 'creationOrder';

    if (hasPbis && !isAnyCoDAvailable && (currentSortCriteria === 'cod' || currentSortCriteria === 'wsjf')) {
        currentSortCriteria = defaultCriteria;
        document.querySelector('.filter-btn.active')?.classList.remove('active');
    }

    if (hasPbis && !isAnyTshirtSizeAvailable && currentSortCriteria === 'tshirtSize') {
        currentSortCriteria = defaultCriteria;
        document.querySelector('.filter-btn.active')?.classList.remove('active');
    }

    if (!hasPbis && currentSortCriteria !== defaultCriteria) {
       currentSortCriteria = defaultCriteria;
       currentSortDirection = 'asc';
       initialCustomOrderSet = false;
       lockedPbiOrder = [];
       isFilterLocked = false; 
    }
}


/**
 * Renders the WSJF (Weighted Shortest Job First) visualization panel, including the Optimal and Current order charts.
 * <br><b>Core Concept: Economic Sequencing</b>
 * This function visualizes the "Cost of Delay" (CoD) over time. It compares:
 * <ol>
 * <li><b>Optimal Order:</b> PBIs sorted strictly by their WSJF score ($WSJF = \frac{CoD}{JobSize}$). This represents the theoretical minimum total cost.</li>
 * <li><b>Current Order:</b> The PBIs in the order currently selected by the user (e.g., custom drag-order or sorted by Name).</li>
 * </ol>
 *
 * <br><b>Visualization Logic:</b>
 * <ul>
 * <li><b>Filtering:</b> Only PBIs with both a valid `cod` > 0 and `jobSize` > 0 are included. Incomplete items are ignored for this chart.</li>
 * <li><b>Ranking & Styling:</b> Assigns a rank and a pastel color to each PBI based on its WSJF score. These colors are persistent to help the user identify the same item in both charts.</li>
 * <li><b>Cost Calculation:</b> Calculates the "Cumulative Cost of Delay". If the current order is less efficient than the optimal one, the UI displays a percentage-based "Waste" or "Higher Cost" indicator.</li>
 * </ul>
 *
 * <br><b>UI States:</b>
 * <ul>
 * <li><b>No Data:</b> If no valid items exist, it displays an SVG empty state with a helpful message.</li>
 * <li><b>Compact Mode:</b> Toggles the `.wsjf-chart-compact` class based on whether the optimal chart is collapsed.</li>
 * <li><b>Interactive Colors:</b> Respects custom colors assigned via the `pbiIdToCustomColor` map.</li>
 * </ul>
 *
 * @param {Array<Object>} [pbisToRender] - Optional subset of PBIs to visualize. Defaults to the global `pbis` array.
 */
function renderWsjfVisualization(pbisToRender) {
    var container = document.getElementById("wsjf-visualization-container");
    if (!container) {
        if (!renderWsjfVisualization.warned) {
             console.error("WSJF visualization container not found!");
             renderWsjfVisualization.warned = true;
        }
        return;
    }
    container.innerHTML = "";
    var uiStrings = config.uiStrings;
    var pbisForProcessing = Array.isArray(pbisToRender) ? pbisToRender : (Array.isArray(pbis) ? pbis : []);

    container.classList.toggle('wsjf-chart-compact', !isOptimalChartCollapsed);

    var validPbis = pbisForProcessing.filter(function(pbi) {
        if (!pbi || pbi.isLastItem) return false;

        var isJobSizeComplete = (pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0);
        var isCodComplete = (pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0);

        return isJobSizeComplete && isCodComplete;
    });

    if (validPbis.length === 0) {
        var noDataContainer = document.createElement('div');
        noDataContainer.id = 'wsjf-no-data-container';

        var noDataSvg = '<svg class="wsjf-no-data-icon" width="128pt" height="128pt" version="1.1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="m24.066 55.262c0 6.2617 2.625 11.93 6.8086 15.961 0.015625 0.015625 0.015625 0.023438 0.023438 0.039063 0.023437 0.023437 0.050781 0.039062 0.074218 0.050781 3.9961 3.7891 9.3555 6.1289 15.285 6.1289 12.234 0 22.195-9.9609 22.195-22.195s-9.9609-22.211-22.195-22.211c-12.238 0-22.195 9.9844-22.195 22.227zm4.2617 0c0-9.1797 6.9102-16.738 15.812-17.805v17.586l-11.66 11.66c-2.5859-3.1094-4.1484-7.1055-4.1484-11.441z"/>' +
            '<path d="m49.051 99.57h-27.855c-3.2734 0-5.9648-2.6758-5.9648-5.9492v-72.359c0-3.2734 2.6914-5.9492 5.9648-5.9492h50.125c3.2734 0 5.9492 2.6758 5.9492 5.9492v41.09c0 1.1797 0.96094 2.125 2.125 2.125 1.1797 0 2.125-0.94531 2.125-2.125v-41.09c0-5.6211-4.5703-10.215-10.215-10.215h-50.109c-5.6289 0-10.227 4.5781-10.227 10.215v72.359c0 5.6289 4.5781 10.215 10.227 10.215h27.855c1.1797 0 2.125-0.94531 2.125-2.125 0-1.1797-0.94922-2.1406-2.125-2.1406z"/>' +
            '<path d="m116.18 107.93-24.078-40.27c-1.3047-2.1641-3.5938-3.4688-6.1211-3.4688-2.5195 0-4.8164 1.3047-6.1211 3.4805l-24.074 40.262c-1.1133 1.8711-1.1406 4.1094-0.074219 6.0039 1.0742 1.8945 3.0117 3.0117 5.1836 3.0117h50.176c2.1758 0 4.1094-1.125 5.1836-3.0117 1.0586-1.9102 1.0352-4.1367-0.074219-6.0039zm-30.195-31.195c1.1797 0 2.125 0.94531 2.125 2.125v18.445c0 1.1641-0.94531 2.125-2.125 2.125-1.1797 0-2.125-0.96094-2.125-2.125v-18.445c0-1.1758 0.94531-2.125 2.125-2.125zm-2.125 29.004c0-1.1797 0.94531-2.125 2.125-2.125 1.1797 0 2.125 0.94531 2.125 2.125v0.80469c0 1.1641-0.94531 2.125-2.125 2.125-1.1797 0-2.125-0.96094-2.125-2.125z"/>' +
            '</svg>';
        noDataContainer.innerHTML = noDataSvg;

        var noDataMessage = document.createElement('div');
        noDataMessage.id = 'wsjf-no-data-text';
        noDataMessage.textContent = uiStrings.wsjfChartNoData || "No valid WSJF data available.";
        noDataContainer.appendChild(noDataMessage);

        container.appendChild(noDataContainer);
        return;
    }

    var pbisForRanking = validPbis.map(function(pbi){
        return {
            id: pbi.id,
            wsjf: (pbi.cod / (pbi.jobSize || 1)),
            originalPbi: pbi
        };
    });
    pbisForRanking.sort(function(a, b) { return b.wsjf - a.wsjf; });

    var pbiIdToStyleMap = {};
    var colorPalette = (config && config.pastelColorPalette) || ['#e0e0e0'];
    if (colorPalette.length === 0) colorPalette = ['#e0e0e0'];

    pbisForRanking.forEach(function(item, index) {
        var rank = index + 1;
        var colorIndex = (rank - 1) % colorPalette.length;
        var defaultColor = colorPalette[colorIndex];
        var finalColor = (typeof pbiIdToCustomColor !== 'undefined' && pbiIdToCustomColor[item.id]) 
                        ? pbiIdToCustomColor[item.id] 
                        : defaultColor;
        pbiIdToStyleMap[item.id] = {
            rank: rank,
            color: finalColor
        };
    });

    var idealSortedPbis = pbisForRanking.map(function(item){ return item.originalPbi; });
    var currentSortedPbis = validPbis.slice();

    var compareFn;
    if (currentSortCriteria === 'custom' || currentSortCriteria === 'lock') {
        var pbiMap = currentSortedPbis.reduce(function(map, pbi) { map[pbi.id] = pbi; return map; }, {});
        currentSortedPbis = lockedPbiOrder
            .map(function(id) { return pbiMap[id]; })
            .filter(function(pbi) { return pbi !== undefined; });
        var currentOrderIds = lockedPbiOrder.reduce(function(set, id) { set[id] = true; return set; }, {});
        var newPbisNotInOrder = validPbis.filter(function(pbi){ return !currentOrderIds[pbi.id]; });
        currentSortedPbis = currentSortedPbis.concat(newPbisNotInOrder);
        if (currentSortDirection === 'desc') {
            currentSortedPbis.reverse();
        }
        compareFn = null;
    } else if (currentSortCriteria === 'tshirtSize') {
        var sizeOrder = config.allTshirtSizes.reduce(function(acc, size, index) { acc[size] = index + 1; return acc; }, {});
        compareFn = function(a, b) {
            var valA = sizeOrder[a.tshirtSize] || 999;
            var valB = sizeOrder[b.tshirtSize] || 999;
            return valA - valB;
        };
    } else if (currentSortCriteria === 'wsjf') {
         compareFn = function(a, b) {
             var valA = (a.cod / (a.jobSize || 1));
             var valB = (b.cod / (b.jobSize || 1));
             return valA - valB;
         };
    } else {
         compareFn = function(a, b) {
             var valA = typeof a[currentSortCriteria] === 'number' ? a[currentSortCriteria] : 0;
             var valB = typeof b[currentSortCriteria] === 'number' ? b[currentSortCriteria] : 0;
             return valA - valB;
         };
    }
    if (compareFn) {
        currentSortedPbis.sort(function(a, b) {
            var comparison = compareFn(a, b);
            if (comparison === 0) {
                var titleA = (a.title || '').toLowerCase();
                var titleB = (b.title || '').toLowerCase();
                if (titleA < titleB) return -1;
                if (titleA > titleB) return 1;
                return 0;
            }
            return comparison;
        });
        if (currentSortDirection === 'desc') {
            currentSortedPbis.reverse();
        }
    }

    var optimalChartWrapper = createChartStructure(container, 'optimal', uiStrings.wsjfChartTitleOptimal);
    var currentChartWrapper = createChartStructure(container, 'current', uiStrings.wsjfChartTitleCurrentOrderPart || 'Current Order/Sorting');
    var optimalCost = 0;
    var currentCost = 0;

    if (typeof createCodChart === 'function') {
        optimalCost = createCodChart('wsjf-chart-optimal', idealSortedPbis, pbiIdToStyleMap);
        currentCost = createCodChart('wsjf-chart-current', currentSortedPbis, pbiIdToStyleMap);
    } else {
        console.error("createCodChart function is not defined! Cannot render WSJF charts.");
        optimalChartWrapper.innerHTML = '<p style="color:red; text-align:center;">Error: Chart rendering function missing.</p>';
        currentChartWrapper.innerHTML = '<p style="color:red; text-align:center;">Error: Chart rendering function missing.</p>';
        return;
    }

    var optimalCostValueSpan = document.getElementById('wsjf-chart-optimal-total-cost-value');
    var currentCostValueSpan = document.getElementById('wsjf-chart-current-total-cost-value');
    var currentCostLabelDiv = document.getElementById('wsjf-chart-current-total-cost');

    if (optimalCostValueSpan) {
        optimalCostValueSpan.textContent = optimalCost.toLocaleString();
    }

    if (currentCostValueSpan && currentCostLabelDiv) {
        var percentageDiff = 0;
        var costSuffix = '';
        var costClass = 'cost-optimal';

        if (optimalCost > 0 && currentCost > optimalCost) {
            percentageDiff = ((currentCost - optimalCost) / optimalCost) * 100;
            costSuffix = ' (+' + percentageDiff.toFixed(0) + '%)';
            costClass = 'cost-higher';
        } else if (Math.abs(currentCost - optimalCost) < 0.01 || currentCost <= optimalCost) {
             costClass = 'cost-optimal';
        }

        currentCostValueSpan.textContent = currentCost.toLocaleString() + costSuffix;
        currentCostLabelDiv.className = 'wsjf-total-cost ' + costClass;
    }
}
renderWsjfVisualization.warned = false;


/**
 * Factory function that constructs the HTML boilerplate for a WSJF chart container.
 * <br><b>Structural Components:</b>
 * This function builds a hierarchical DOM tree consisting of:
 * <ul>
 * <li><b>Wrapper:</b> The main container that handles the "collapsed/expanded" state for the optimal view.</li>
 * <li><b>Header (`titleContainer`):</b>
 * <ul>
 * <li><b>Total Cost Display:</b> Shows the calculated cumulative "Cost of Delay".</li>
 * <li><b>Chart Title:</b> Displays the localized title (e.g., "Optimal Order").</li>
 * </ul>
 * </li>
 * <li><b>Visualization Area (`chartOuter`):</b>
 * <ul>
 * <li><b>Axis Labels:</b> Static labels for Y (Cost of Delay) and X (Cumulative Job Size).</li>
 * <li><b>Chart Area:</b> The actual canvas where SVG or DIV blocks will be injected.</li>
 * <li><b>X-Axis:</b> A dedicated container for horizontal tick marks or labels.</li>
 * </ul>
 * </li>
 * </ul>
 *
 * <br><b>Dynamic Styling:</b>
 * Uses the `idPrefix` to generate unique IDs (e.g., `wsjf-chart-optimal-area`) which allows the CSS and rendering
 * functions to target specific chart instances.
 *
 * @param {HTMLElement} parentContainer - The DOM element where the finished structure should be appended.
 * @param {string} idPrefix - A string identifier used for IDs and classes (usually 'optimal' or 'current').
 * @param {string} titleText - The localized text to display as the chart's main heading.
 * @returns {HTMLElement} The created wrapper element containing the full chart skeleton.
 */
function createChartStructure(parentContainer, idPrefix, titleText) {
    var wrapper = document.createElement('div');
    wrapper.id = 'wsjf-chart-' + idPrefix + '-wrapper';
    wrapper.className = 'wsjf-chart-wrapper';
    var uiStrings = config.uiStrings || {};

    if (idPrefix === 'optimal' && isOptimalChartCollapsed) {
        wrapper.classList.add('collapsed');
    }

    var titleContainer = document.createElement('div');
    titleContainer.id = 'wsjf-chart-' + idPrefix + '-title-container';
    titleContainer.className = 'wsjf-chart-title-container';
    
    var totalCostDiv = document.createElement('div');
    totalCostDiv.id = 'wsjf-chart-' + idPrefix + '-total-cost'; 
    totalCostDiv.className = 'wsjf-total-cost'; 
    totalCostDiv.textContent = (uiStrings.wsjfChartLabelTotalCost || 'Total Delay Cost:') + ' '; 
   
    var totalCostValueSpan = document.createElement('span');
    totalCostValueSpan.id = 'wsjf-chart-' + idPrefix + '-total-cost-value'; 
    totalCostValueSpan.className = 'wsjf-title-cost-value'; 
    totalCostValueSpan.textContent = '0'; 
    totalCostDiv.appendChild(totalCostValueSpan);
    titleContainer.appendChild(totalCostDiv); 
   
    var title = document.createElement('h3');
    title.id = 'wsjf-chart-' + idPrefix + '-title'; 
    title.className = 'wsjf-chart-title';
    title.textContent = "| " + titleText; 
    titleContainer.appendChild(title);

    wrapper.appendChild(titleContainer); 

    var chartOuter = document.createElement('div');
    chartOuter.id = 'wsjf-chart-' + idPrefix + '-content'; 
    chartOuter.className = 'wsjf-chart-outer';


    var axisLegend = document.createElement('div');
    axisLegend.className = 'wsjf-chart-legend';
    axisLegend.innerHTML =
        (uiStrings.wsjfChartLegendLabelVertical || 'Y-Axis:') + ' ' + (uiStrings.wsjfChartLegendUnitVertical || 'Cost of Delay') + '<br>' +
        (uiStrings.wsjfChartLegendLabelHorizontal || 'X-Axis:') + ' ' + (uiStrings.wsjfChartLegendUnitHorizontal || 'Cumulative Job Size');
    chartOuter.appendChild(axisLegend);

    var yAxisLabelMax = document.createElement('div');
    yAxisLabelMax.id = 'wsjf-chart-' + idPrefix + '-y-axis-max';
    yAxisLabelMax.className = 'wsjf-y-axis-label wsjf-y-axis-max';
    yAxisLabelMax.textContent = '0';
    chartOuter.appendChild(yAxisLabelMax);

    var yAxisLabelZero = document.createElement('div');
    yAxisLabelZero.className = 'wsjf-y-axis-label wsjf-y-axis-zero';
    yAxisLabelZero.textContent = '0';
    chartOuter.appendChild(yAxisLabelZero);

    var chartArea = document.createElement('div');
    chartArea.id = 'wsjf-chart-' + idPrefix + '-area';
    chartArea.className = 'wsjf-chart-area';
    chartOuter.appendChild(chartArea);

    wrapper.appendChild(chartOuter);

    var xAxis = document.createElement('div');
    xAxis.id = 'wsjf-chart-' + idPrefix + '-xaxis';
    xAxis.className = 'wsjf-x-axis';
    chartOuter.appendChild(xAxis);

    parentContainer.appendChild(wrapper);
    return wrapper;
}


/**
 * Manages the global visibility of major UI components based on the presence of data.
 * <br><b>Purpose (Empty State Management):</b>
 * To maintain a clean user experience, this function hides advanced visualization tools and legends
 * when the backlog is empty. This prevents the UI from appearing cluttered with useless information 
 * before the user has created their first item.
 * * <br><b>Conditional Logic:</b>
 * The function checks the `pbis` array (excluding the "Last Item" placeholder).
 * If no real items exist (`!hasPbis`):
 * <ul>
 * <li><b>Legends:</b> Hides the color legends for Job Size, Cost of Delay, and WSJF.</li>
 * <li><b>View Tabs:</b> Hides the main navigation tabs for different visualization panels.</li>
 * <li><b>Layout Grid:</b> Applies the `.is-empty` class to the `#split-root` element, which can trigger a specific "Empty State" background or instructional placeholder.</li>
 * </ul>
 * * <br><b>Visual Feedback:</b>
 * Uses CSS class toggling (`.hidden`, `.is-empty`) to trigger transitions or visibility changes defined in the stylesheet.
 * * @global
 * @requires pbis - The global array of Backlog Items.
 */
function updateGlobalVisibility() {
    const legend = document.getElementById('visualization-legend');
    const codLegend = document.getElementById('cod-visualization-legend');
    const wsjfLegend = document.getElementById('wsjf-visualization-legend'); // Added WSJF legend
    const splitRoot = document.getElementById('split-root');
    const viewTabs = document.getElementById('view-tabs');
    const hasPbis = pbis.some(function(p) { return !p.isLastItem; });

    if (legend) {
        legend.classList.toggle('hidden', !hasPbis);
    }
    if (codLegend) {
        codLegend.classList.toggle('hidden', !hasPbis);
    }
    if (wsjfLegend) { 
        wsjfLegend.classList.toggle('hidden', !hasPbis);
    }

    if (splitRoot) {
        splitRoot.classList.toggle('is-empty', !hasPbis);
    }

    if (viewTabs) {
        viewTabs.classList.toggle('hidden', !hasPbis);
    }
}


/**
 * Synchronizes the visual state of the Relative Sizing table headers with the current sorting and highlighting criteria.
 * <br><b>Purpose (UI Consistency):</b>
 * In the tabular "Relative Sizing" view, it is essential for the user to see which column is currently driving the sort order 
 * and which column is visually emphasized.
 * <br><b>Core Logic (Icon Toggling):</b>
 * The function iterates through all `.rs-col-header` elements and performs a 3-step visibility check for sort icons:
 * <ol>
 * <li><b>Reset:</b> Hides all icons (Asc, Desc, Default) by default to ensure a clean slate.</li>
 * <li><b>Context Check:</b> If the list is in a "Locked" or "Custom Drag" state, sorting icons are irrelevant, so only the `defaultIcon` is shown.</li>
 * <li><b>Active State:</b> If the specific column (`sortBy`) matches the active `currentSortCriteria`:
 * <ul>
 * <li>Displays `ascIcon` if the direction is ascending.</li>
 * <li>Displays `descIcon` if the direction is descending.</li>
 * </ul>
 * </li>
 * </ol>
 * <br><b>Column Highlighting:</b>
 * Beyond sorting, the function manages the "Highlight" button state. It adds the `.active` CSS class to the button 
 * if the column's metric matches `currentHighlightedColumn`. This provides a strong visual vertical guide for the user 
 * during complex estimation sessions.
 * * @global
 * @requires currentSortCriteria - The active property used for sorting (e.g., 'complexity').
 * @requires currentSortDirection - The active direction ('asc' or 'desc').
 * @requires currentHighlightedColumn - The property currently targeted for visual column highlighting.
 */
function updateRelativeSizingHeaders() {
    const headers = document.querySelectorAll('.rs-col-header');

    headers.forEach(function(header) {
        const ascIcon = header.querySelector('.sort-asc-icon');
        const descIcon = header.querySelector('.sort-desc-icon');
        const defaultIcon = header.querySelector('.sort-default-icon');
        const highlightBtn = header.querySelector('.highlight-btn');
        const sortBy = header.dataset.sortBy;

        if (ascIcon) ascIcon.style.display = 'none';
        if (descIcon) descIcon.style.display = 'none';
        if (defaultIcon) defaultIcon.style.display = 'none';

        if (isFilterLocked || currentSortCriteria === 'creationOrder' || currentSortCriteria === 'custom') {
            if (defaultIcon) defaultIcon.style.display = 'inline-block';
        } else if (sortBy === currentSortCriteria) {
            if (currentSortDirection === 'asc' && ascIcon) {
                ascIcon.style.display = 'inline-block';
            } else if (currentSortDirection === 'desc' && descIcon) {
                descIcon.style.display = 'inline-block';
            } else if (defaultIcon) { 
                 defaultIcon.style.display = 'inline-block';
            }
        } else {
             if (defaultIcon) defaultIcon.style.display = 'inline-block';
        }

        if (highlightBtn) {
            highlightBtn.classList.toggle('active', sortBy === currentHighlightedColumn);
        }
    });
}


/**
 * Orchestrates the complete re-rendering of the application UI.
 * <br><b>Role (Main Loop):</b>
 * This function acts as the central synchronization point. It ensures that whenever the data 
 * (`pbis`) or state (sort criteria, filters) changes, the entire interface reflects the new truth.
 * * <br><b>Execution Sequence:</b>
 * <ol>
 * <li><b>Data Preparation:</b> Calls `ensureLastItemExists` to make sure the "Add New" placeholder 
 * is present in the array before rendering.</li>
 * <li><b>UI State Sync:</b> Updates visibility flags, legend descriptions, filter button states, 
 * and table headers to match the current configuration.</li>
 * <li><b>Component Rendering:</b> Triggers the individual render functions for:
 * <ul>
 * <li>The main PBI List.</li>
 * <li>The Job Size Bubble Visualization.</li>
 * <li>The Cost of Delay (CoD) Bubble Visualization.</li>
 * <li>The WSJF Economic Chart.</li>
 * <li>The Relative Sizing Table.</li>
 * </ul>
 * </li>
 * <li><b>Post-Processing (DOM Alignment):</b>
 * <ul>
 * <li>Uses `requestAnimationFrame` to ensure that row heights and layout paddings are 
 * synchronized <i>after</i> the browser has completed the initial reflow.</li>
 * <li>Re-initializes the Drag-and-Drop library (`SortableJS`) to ensure the new DOM nodes 
 * are correctly interactive.</li>
 * <li>Triggers a visual "pulse" effect for the last edited item to guide the user.</li>
 * </ul>
 * </li>
 * </ol>
 * * <br><b>Performance Note:</b>
 * The use of `requestAnimationFrame` is critical here to avoid "layout thrashing" and to ensure 
 * smooth transitions between different views.
 * * @global
 * @requires pbis - The global array of Backlog Items.
 * @requires currentSortCriteria - Determines the layout logic for the visualizations.
 */
function renderAll() {

    var splitRootElement = document.getElementById('split-root');
    if (splitRootElement) {
        splitRootElement.classList.toggle('custom-sort-active', currentSortCriteria === 'custom');
    }

    var pbisForRendering; 
    if (typeof ensureLastItemExists === 'function') {
        var ensuredPbis = ensureLastItemExists(pbis); 

        if (Array.isArray(ensuredPbis)) {
            pbisForRendering = ensuredPbis;
        } else {
            console.error("ensureLastItemExists did not return an array! Using original pbis (if available).");
            pbisForRendering = Array.isArray(pbis) ? pbis : [];
            if (!Array.isArray(pbis)) {
                 console.error("Global pbis was not an array either!");
            }
        }
    } else {
         console.error("ensureLastItemExists function is missing! Using global pbis (if available).");
         pbisForRendering = Array.isArray(pbis) ? pbis : [];
         if (!Array.isArray(pbis)) {
             console.error("Global pbis was not an array either!");
         }
    }

    updateGlobalVisibility(); 
    updateLegendSortInfo();  
    updateCodLegendSortInfo(); 
    updateWsjfLegendSortInfo(); 
    updateFilterButtonStates(); 
    updateSortDirectionButtons(pbisForRendering, currentSortDirection); 
    updateActiveFilterButtonVisualState();
    updateRelativeSizingHeaders();

    renderPbiList(pbisForRendering);
    renderAllVisualizations(pbisForRendering);
    renderCodVisualizations(pbisForRendering);
    renderWsjfVisualization(pbisForRendering);
    renderRelativeSizingList(pbisForRendering); 

    updateReferenceSlots();
    requestAnimationFrame(syncRelativeSizingHeaderPadding);

    syncRelativeSizingHeaderPadding();

    requestAnimationFrame(function() {
        syncRowHeights();
        highlightAndScrollToLastEditedPbi();

        if (typeof destroySortable === 'function') destroySortable();
        if (typeof initSortable === 'function') initSortable();
    });
}


/**
 * Renders the primary Backlog Item (PBI) list into the DOM.
 * <br><b>Core Responsibilities:</b>
 * This function acts as the main view-generator for the left-hand column. It handles several distinct visual states:
 * <ol>
 * <li><b>Empty State:</b> If no items exist, it renders a high-quality SVG placeholder with instructional text and optional demo-data links.</li>
 * <li><b>WSJF Ranking:</b> When the WSJF tab is active, it calculates relative ranks ($CoD / JobSize$) and assigns persistent pastel colors to items based on their position.</li>
 * <li><b>Reference Pinning:</b> Visualizes "Min" and "Max" anchors using specific icons and classes, provided the view is not in "Custom Sort" or "WSJF" mode.</li>
 * <li><b>Relevance Feedback:</b> Adds the `is-irrelevant-to-sort` class to items that lack the data required for the currently active sort criteria (e.g., hiding a PBI's prominence when sorting by WSJF but it lacks a CoD value).</li>
 * </ol>
 *
 * <br><b>Technical Implementation Details:</b>
 * <ul>
 * <li><b>Event Delegation Ready:</b> Every item is stamped with a `data-id` attribute, allowing the global click handler to identify the target PBI.</li>
 * <li><b>Performance:</b> The container is cleared once (`innerHTML = ""`) and reconstructed. For high-performance updates, it uses the `getSortedPbis` engine to determine the final display order.</li>
 * <li><b>Tooltips & Accessibility:</b> Dynamically generates tooltips for disabled T-Shirt badges, explaining exactly which values (Complexity, Effort, or Doubt) are missing to complete the estimate.</li>
 * <li><b>SVG Injection:</b> Inlines complex SVG paths for Reference markers (Circle-Minus for Min, Circle-Plus for Max) to ensure styling consistency without external asset dependencies.</li>
 * </ul>
 *
 * @param {Array<Object>} pbisToRender - The array of PBIs to be displayed. If null, falls back to the global `pbis` state.
 */
function renderPbiList(pbisToRender) {
    var pbiListContainer = document.getElementById("pbi-list");
    pbiListContainer.innerHTML = "";
    var uiStrings = config.uiStrings;
    var pbisForProcessing = Array.isArray(pbisToRender) ? pbisToRender : (Array.isArray(pbis) ? pbis : []);
    var realPbis = pbisForProcessing.filter(function(p) { return !p.isLastItem; });
    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');
    var isCustomSortActive = currentSortCriteria === 'custom';

    var pbiIdToStyleMap = {};
    var colorPalette = (config && config.pastelColorPalette) || ['#e0e0e0'];
    if (colorPalette.length === 0) colorPalette = ['#e0e0e0'];
    var fallbackColor = '#e0e0e0';

    if (isWsjfTabActive && typeof calculateWsjfRanks === 'function') {
        var validPbisForRanking = pbisForProcessing.filter(function(pbi) {
            return pbi && !pbi.isLastItem &&
                   typeof pbi.cod === 'number' && pbi.cod > 0 &&
                   typeof pbi.jobSize === 'number' && pbi.jobSize > 0;
        });
 
        var pbisForRanking = validPbisForRanking.map(function(pbi){
            return { id: pbi.id, wsjf: (pbi.cod / pbi.jobSize) };
        });
        pbisForRanking.sort(function(a, b) { return b.wsjf - a.wsjf; });

        pbisForRanking.forEach(function(item, index) {
            var rank = index + 1;
            var colorIndex = (rank - 1) % colorPalette.length;
            var defaultColor = colorPalette[colorIndex];
            var finalColor = (typeof pbiIdToCustomColor !== 'undefined' && pbiIdToCustomColor[item.id])
                           ? pbiIdToCustomColor[item.id]
                           : defaultColor;
            pbiIdToStyleMap[item.id] = { rank: rank, color: finalColor };
        });
    }

    var sortedPbisToRender = getSortedPbis(pbisForProcessing, currentSortCriteria, currentSortDirection, config, isWsjfTabActive);

    pbiListContainer.classList.toggle('is-sortable-active', isCustomSortActive && !isFilterLocked);

    var pbiListContainerElement = document.getElementById('pbi-list-container');
     if (pbiListContainerElement) {
        pbiListContainerElement.classList.toggle('wsjf-tab-view-active', isWsjfTabActive);
     }

    if (realPbis.length === 0) {
        var emptyStateHtml = '<div class="pbi-list-empty-state"><svg class="empty-state-icon" width="1200pt" height="1200pt" version="1.1" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg"><path d="m313.31 636c-12.574-0.33203-22.922 9.8008-22.922 22.359 0 12.574 10.348 22.707 22.922 22.359h571.17c12.574 0.33203 22.922-9.8008 22.922-22.359 0-12.574-10.348-22.707-22.922-22.359z" fill="currentColor"/><path d="m1132.3 479.27c12.281 0.21484 22.078 10.281 22.012 22.559v209.65c0 29.719-0.83984 57.012-11.238 82.293-10.359 25.215-32.012 46.188-63.961 58.281l-3.4648 1.3203v147.15c31.375 6.3867 59.094 25.691 75.48 54.027 6.1719 10.707 2.4922 24.441-8.1992 30.625-10.707 6.1719-24.441 2.5586-30.625-8.1992-12.215-21.188-34.652-34.238-59.094-34.238-24.441 0-46.945 13.055-59.16 34.238-6.0391 11.039-20 14.934-30.922 8.6016-10.828-6.2383-14.441-20.266-7.8398-31.039 16.387-28.332 44.094-47.641 75.48-54.027v-130.2l-54.508 20.625c-11.734 5.1328-25.426-0.54688-29.934-12.492-4.5859-12.012 1.8789-25.348 14.027-29.32l102.99-38.879c23.465-8.8125 32.227-18.68 38.332-33.48 6.1211-14.867 7.8516-36.945 7.8516-65.281v-209.65c-0.14844-12.574 10.133-22.773 22.773-22.562z" fill="currentColor"/><path d="m67.668 479.27c-12.281 0.21484-22.148 10.281-22.012 22.559v209.65c0 29.719 0.83984 57.012 11.188 82.293 10.414 25.215 32.012 46.188 63.961 58.281l3.5352 1.3203v147.15c-31.398 6.3867-59.094 25.691-75.48 54.027-6.1875 10.707-2.5742 24.441 8.1992 30.625 10.676 6.1602 24.367 2.5625 30.543-8.1992 12.227-21.188 34.734-34.238 59.188-34.238 24.453 0 46.934 13.055 59.16 34.238 6.0273 11.039 19.934 14.934 30.828 8.6016 10.895-6.2383 14.453-20.266 7.9062-31.039-16.387-28.332-44.094-47.641-75.48-54.027v-130.2l54.52 20.625c11.668 5.1328 25.332-0.54688 29.922-12.492 4.5195-12.012-1.8672-25.348-14.094-29.32l-102.99-38.879c-23.398-8.8125-32.215-18.68-38.254-33.48-6.1211-14.867-7.9062-36.945-7.9062-65.281l-0.003906-209.65c0.10937-12.574-10.16-22.773-22.73-22.562z" fill="currentColor"/><path d="m1088.5 452.67v282.77c0 20.973-12.973 39.785-32.84 47.508l-137.77 53.48-35.293 207.69c-9.1602 69.867-116.04 52.309-101.75-16.734l40-236.11c2.9883-17.586 15.078-32.375 31.879-38.895l82.293-31.945v-167.99l-31.934 41.387c-8.2656 8.0547-19.375 12.574-31.055 12.574h-113.05c-58.828 0-58.828-87 0-87h95.078l87.293-95.215c13.602-14.867 28.121-26.453 45.348-26.453h50.066c33.754-0.011719 51.738 30.812 51.738 54.922z" fill="currentColor"/><path d="m389.2 391.84c-10.281 0-18.398 4.0117-24.012 9.7188l-48.121 48.465 38.812 42.293h82.84c21.602 0 41.266 8.9609 53.691 22.719 12.359 13.746 17.988 30.895 17.988 47.773 0 16.105-5.1328 32.426-16.254 45.828h75.414l1.0273-105.91 48.332 37.16c13.188 10.199 32.707 10.762 43.895-1.5352l71.398-78.762c1.8672-1.6523 4.3086-2.625 6.7852-2.5586h38.762c12.785 0 21.172-3.1992 26.309-7.2148 5.0781-4.0391 7.2383-8.7617 7.3086-14.039 0.066406-10.613-9.5859-25.066-34.668-30.547l-50.613-12.441c-8.4141 0.066406-16.465 3.1328-22.574 8.7617l-60.762 63.105c-3.5352 3.2656-9.0781 3.4805-12.906 0.42578l-81.535-63.535c-7.293-5.707-14.785-9.7188-25.215-9.7188z" fill="currentColor"/><path d="m363.29 706.35 76.465 108.41v138.12c0 61.879 98.465 61.879 98.465 0l0.003906-142.51-31.734-54.172c-5.1328-11.32 3.5352-15.266 10.414-6.1211l39.719 52.574c0.90625 1.5352 1.3867 3.1992 1.3867 5v145.21c0 61.879 97.586 61.879 97.586 0l0.003906-155.35c0-11.188-3.8281-22.148-10.84-30.973l-41.934-60.215h-239.54z" fill="currentColor"/><path d="m547.73 296.43c-20.84 47.559-76.734 69.441-125 48.895-48.121-20.426-70.281-75.691-49.508-123.13 20.84-47.574 76.734-69.441 124.85-48.961 48.27 20.547 70.414 75.695 49.656 123.2z" fill="currentColor" fill-rule="evenodd"/><path d="m109.27 452.67v282.77c0 20.973 13 39.785 32.785 47.508l137.85 53.48 35.266 207.69c9.1055 69.867 116.05 52.309 101.75-16.734l-40-236.11c-3.0547-17.586-15.148-32.375-31.945-38.895l-82.227-31.945 0.003906-167.99 31.879 41.387c8.2656 8.0547 19.453 12.574 31.039 12.574h113.12c58.762 0 58.762-87 0-87h-95.055l-87.309-95.215c-13.668-14.867-28.172-26.453-45.332-26.453h-50.156c-33.68-0.011719-51.668 30.812-51.668 54.922z" fill="currentColor"/><path d="m92.879 307.88c22.227 50.773 81.961 74.094 133.48 52.16 51.398-21.812 75-80.762 52.852-131.4-22.293-50.762-81.961-74.172-133.27-52.281-51.613 21.934-75.227 80.762-53.066 131.52z" fill="currentColor" fill-rule="evenodd"/><path d="m1105 307.88c-22.293 50.773-81.934 74.094-133.48 52.16-51.375-21.812-75-80.762-52.852-131.4 22.227-50.762 81.961-74.172 133.28-52.281 51.582 21.934 75.195 80.762 53.051 131.52z" fill="currentColor" fill-rule="evenodd"/><path d="m749.81 338.84c-11.309 0.42578-22.922-0.89453-34.652-3.9453-29.922-8.0547-53.266-26.547-67.691-50.078l-31.254 4.4414c-10.148 1.4531-14.094-8.1211-7.7188-16.254l23.68-30.281c-2.2266-15.133-1.5352-31.105 2.7188-47 16.32-60.762 76.734-97.012 139.09-80.281 62.359 16.734 96.586 78.332 80.332 139.09-13.254 49.371-55.613 82.586-104.51 84.305zm-62.707-92.348c11.801 0 21.32-9.5859 21.32-21.387 0-11.734-9.5078-21.32-21.32-21.32s-21.387 9.5859-21.387 21.32c0 11.801 9.5898 21.387 21.387 21.387zm57.496 0c11.828 0 21.332-9.5859 21.398-21.387-0.066406-11.734-9.5859-21.32-21.398-21.32-11.801 0-21.387 9.5859-21.387 21.32 0 11.801 9.5859 21.387 21.387 21.387zm57.52 0c11.734 0 21.32-9.5859 21.32-21.387 0-11.734-9.5859-21.32-21.32-21.32-11.879 0-21.387 9.5859-21.387 21.32 0 11.801 9.5039 21.387 21.387 21.387z" fill="currentColor" fill-rule="evenodd"/></svg><div class="empty-state-text"><p>' + uiStrings.emptyStateMessage
                .replace("{btnAddPbi}", uiStrings.btnAddPbi)
                .replace("{modalLabelComplexity}", uiStrings.modalLabelComplexity)
                .replace("{modalLabelEffort}", uiStrings.modalLabelEffort)
                .replace("{modalLabelDoubt}", uiStrings.modalLabelDoubt)
                .replace("{pbiInfoTshirtSize}", uiStrings.pbiInfoTshirtSize) +
            "</p></div>";

            if (config.showDemoDataLink === true && config.demoData) {
                var isLocal = window.location.protocol === 'file:';
                var disabledAttr = isLocal ? ' class="disabled" title="' + (uiStrings.demoDataTooltipDisabled || '') + '"' : '';
                var demoLinks = [];

                if (config.demoData.en && config.demoData.en.path) {
                    demoLinks.push('<a data-lang="en"' + disabledAttr + '>' + (uiStrings.demoDataLinkEN || 'EN') + '</a>');
                }
                if (config.demoData.de && config.demoData.de.path) {
                    demoLinks.push('<a data-lang="de"' + disabledAttr + '>' + (uiStrings.demoDataLinkDE || 'DE') + '</a>');
                }

                if (demoLinks.length > 0) {
                    emptyStateHtml += '<div class="empty-state-demo-data">' +
                        '<span>' + (uiStrings.demoDataLabel || 'Load Demo Data: ') + '</span>' +
                        demoLinks.join('<span>-</span>') +
                        '</div>';
                }
            }

            emptyStateHtml += '</div>';
            
        pbiListContainer.innerHTML = emptyStateHtml;
        var spacerItem = pbisForProcessing.find(function(p) { return p.isLastItem; }); 
        if (spacerItem) {
             var pbiItem = document.createElement("div");
             pbiItem.className = "pbi-item last-item";
             pbiItem.dataset.id = spacerItem.id;
             pbiItem.innerHTML = '<div class="pbi-item-details" style="height: 38px;"></div>';
             pbiListContainer.appendChild(pbiItem);
        }
        return; 
    }

    sortedPbisToRender.forEach(function(pbi) {
        var pbiItem = document.createElement("div");
        pbiItem.className = "pbi-item";
        pbiItem.dataset.id = pbi.id;

        if (pbi.isLastItem) {
            pbiItem.classList.add("last-item");
            pbiItem.innerHTML = '<div class="pbi-item-details" style="height: 38px;"></div>';
            pbiListContainer.appendChild(pbiItem);
            return;
        }

        if (pbi.isReference && !isWsjfTabActive && !isCustomSortActive) {
            pbiItem.classList.add("reference-item");
            if (pbi.referenceType === 'min') pbiItem.classList.add("ref-min");
            if (pbi.referenceType === 'max') pbiItem.classList.add("ref-max");
        }

        var isJobSizeComplete = pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0;
        var hasValidCod = (pbi.cod && pbi.cod > 0) && (pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0);
        var hasValidWsjf = isJobSizeComplete && hasValidCod;

        if (isWsjfTabActive && !hasValidWsjf) {
            pbiItem.classList.add("pbi-item-no-wsjf-rank");
        }

        var isIrrelevantToSort = false;
         if (!pbi.isReference) {
             if (currentSortCriteria === 'creationOrder' || currentSortCriteria === 'custom' || currentSortCriteria === 'lock') { isIrrelevantToSort = false; }
             else if (currentSortCriteria === "jobSize" && !isJobSizeComplete) { isIrrelevantToSort = true; }
             else if (currentSortCriteria === "cod" && !hasValidCod) { isIrrelevantToSort = true; }
             else if (currentSortCriteria === "wsjf" && !hasValidWsjf) { isIrrelevantToSort = true; }
             else if (currentSortCriteria === "tshirtSize" && !pbi.tshirtSize) { isIrrelevantToSort = true; }
             else if ((currentSortCriteria === "complexity" || currentSortCriteria === "effort" || currentSortCriteria === "doubt") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) { isIrrelevantToSort = true; }
             else if ((currentSortCriteria === "cod_bv" || currentSortCriteria === "cod_tc" || currentSortCriteria === "cod_rroe") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) { isIrrelevantToSort = true; }
        }
        if (isIrrelevantToSort) { pbiItem.classList.add("is-irrelevant-to-sort"); }

        var jobSize = isJobSizeComplete ? pbi.jobSize : null;
        var detailsText;
        if (hasValidWsjf) {
            var wsjfValue = (pbi.cod / jobSize).toFixed(2).replace(".", ",");
            detailsText = uiStrings.pbiInfoJobSize + ": " + jobSize + " - " + uiStrings.pbiInfoCoD + ": " + pbi.cod + " - " + uiStrings.pbiInfoWSJF + ": " + wsjfValue;
        } else {
            var jobSizeDisplay = jobSize !== null ? jobSize : uiStrings.pbiInfoNA;
            var codDisplay = hasValidCod ? pbi.cod : uiStrings.pbiInfoNA;
            detailsText = uiStrings.pbiInfoJobSize + ": " + jobSizeDisplay + " - " + uiStrings.pbiInfoCoD + ": " + codDisplay + " - " + uiStrings.pbiInfoWSJF + ": " + uiStrings.pbiInfoNA;
        }

        var tshirtSize = pbi.tshirtSize || "-";
        var tshirtClasses = "pbi-item-tshirt";
        var tshirtTooltip = "";
         if (!isJobSizeComplete) {
            tshirtClasses += " is-disabled";
            var missing = [];
            if (!pbi.complexity) missing.push(uiStrings.colComplexity);
            if (!pbi.effort) missing.push(uiStrings.colEffort);
            if (!pbi.doubt) missing.push(uiStrings.colDoubt);
            if (missing.length > 0) { tshirtTooltip = ' title="' + uiStrings.tooltipJobSizeNa.replace('{missingValues}', missing.join(', ')) + '"'; }
        }
        var tshirtHtml = '<div class="' + tshirtClasses + '"' + tshirtTooltip + '>' + tshirtSize + '</div>';

        var wsjfRankHtml = '';
        var rank = null;
        var rankBgColor = fallbackColor; 

        if (isWsjfTabActive && hasValidWsjf) {
            var styleInfo = pbiIdToStyleMap[pbi.id];
            if (styleInfo) {
                rank = styleInfo.rank;
                rankBgColor = styleInfo.color;
                 wsjfRankHtml = '<span class="wsjf-rank-tag" title="' + (uiStrings.tooltipWsjfRank || '') + '" style="background-color:' + rankBgColor + '; color: #333;">' + rank + '</span>';
            } else {
                 wsjfRankHtml = '<span class="wsjf-rank-tag" title="' + (uiStrings.tooltipWsjfRank || '') + '" style="background-color:' + fallbackColor + '; color: #333;">?</span>';
            }
        }

        var refBtnsHtml = '';
        if (!isWsjfTabActive) {
            var minBtnClass = "reference-btn ref-btn-min";
            if (pbi.isReference && pbi.referenceType === 'min') minBtnClass += " is-reference";
            var minBtnTitle = (pbi.isReference && pbi.referenceType === 'min') ? uiStrings.tooltipUnsetRefMin : uiStrings.tooltipSetRefMin;
            
            var maxBtnClass = "reference-btn ref-btn-max";
            if (pbi.isReference && pbi.referenceType === 'max') maxBtnClass += " is-reference";
            var maxBtnTitle = (pbi.isReference && pbi.referenceType === 'max') ? uiStrings.tooltipUnsetRefMax : uiStrings.tooltipSetRefMax;

            var minSvgInactive = '<svg class="icon-reference-unset" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M288-444h384v-72H288v72ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>';
            var minSvgActive = '<svg class="icon-reference-set" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M288-444h384v-72H288v72ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Z"/></svg>';

            var maxSvgInactive = '<svg class="icon-reference-unset" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M444-288h72v-156h156v-72H516v-156h-72v156H288v72h156v156Zm36.28 192Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>';
            var maxSvgActive = '<svg class="icon-reference-set" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M444-288h72v-156h156v-72H516v-156h-72v156H288v72h156v156Zm36.28 192Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>';

            refBtnsHtml = 
                '<button class="' + minBtnClass + '" title="' + minBtnTitle + '">' + minSvgInactive + minSvgActive + '</button>' +
                '<button class="' + maxBtnClass + '" title="' + maxBtnTitle + '">' + maxSvgInactive + maxSvgActive + '</button>';
        }

        pbiItem.innerHTML = tshirtHtml + wsjfRankHtml
            + '<div class="pbi-item-details">'
            + '<div><strong class="pbi-title-text">' + pbi.title + "</strong></div>"
            + "<div><small>" + detailsText + "</small></div>"
            + "</div>"
            + '<div id="btnBoxControls">'
            + refBtnsHtml
            + '<button class="edit">' + uiStrings.btnEdit + "</button>"
            + '<button class="delete">' + uiStrings.btnDelete + "</button>"
            + "</div>";

        var tshirtElement = pbiItem.querySelector(".pbi-item-tshirt");
        if (tshirtElement && (tshirtSize === "XXS" || tshirtSize === "XXL")) {
            tshirtElement.classList.add("is-wide");
        }

        pbiListContainer.appendChild(pbiItem);
    });
}


/**
 * Renders the graphical "Job Size" visualization column (Bubble Charts).
 * <br><b>Visual Alignment (The Grid System):</b>
 * This function creates a series of `story-visualization` blocks. Each block is a sibling 
 * to a PBI list item. The application uses a custom grid logic where `renderPbiList` 
 * (Left) and `renderAllVisualizations` (Right) must produce the exact same number of 
 * elements in the same order to maintain horizontal alignment.
 * * <br><b>State-Dependent Rendering:</b>
 * <ul>
 * <li><b>Reference Pinning:</b> Pinned items (Min/Max references) are highlighted with 
 * specific CSS classes to match the list's reference items.</li>
 * <li><b>Completeness Check:</b>
 * <ul>
 * <li><b>Complete:</b> If Complexity, Effort, and Doubt are set, `createStoryVisualization` 
 * draws the three-circle "Bubble" graphic.</li>
 * <li><b>Incomplete:</b> If any value is 0, `createPlaceholderVisualization` draws a 
 * grayed-out placeholder. The header now displays "Missing values" instead of a disabled T-Shirt.</li>
 * </ul>
 * </li>
 * <li><b>WSJF Integration:</b> If the WSJF view is active, the function injects ranking tags 
 * and specific WSJF metrics into the visualization card's header.</li>
 * </ul>
 * * <br><b>Interactive Elements:</b>
 * Each visualization card receives an "Edit" button (SVG) and a clickable T-Shirt badge (if complete), 
 * allowing the user to trigger actions directly from the graphical view without 
 * scrolling back to the text list.
 * * <br><b>Post-Rendering:</b>
 * Invokes `_equalizeGridRows()` to fix potential height discrepancies caused by 
 * multi-line titles, ensuring a perfect "Ruler" effect across the split-screen view.
 * * @global
 * @requires pbis - The global data source.
 * @requires currentSortCriteria - Used to determine the order and "irrelevant" status of items.
 */
function renderAllVisualizations() {
    var container = document.getElementById("visualization-container");
    container.innerHTML = ""; 

    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');

    var sortedPbis = getSortedPbis(pbis, currentSortCriteria, currentSortDirection, config, isWsjfTabActive);
    var uiStrings = config.uiStrings;
    var wsjfRanks = {}; 

    if (isWsjfTabActive && typeof calculateWsjfRanks === 'function') {
        wsjfRanks = calculateWsjfRanks(pbis);
    }

    sortedPbis.forEach(function(pbi) {
        var visualizationWrapper = document.createElement("div");
        visualizationWrapper.className = "story-visualization";
        visualizationWrapper.dataset.id = pbi.id;

        if (pbi.isLastItem) {
            visualizationWrapper.classList.add("last-item");
            container.appendChild(visualizationWrapper);
            return; 
        }

        if (pbi.isReference) {
            visualizationWrapper.classList.add("reference-item");
            if (pbi.referenceType === 'min') visualizationWrapper.classList.add("ref-min");
            if (pbi.referenceType === 'max') visualizationWrapper.classList.add("ref-max");
        }

        var isJobSizeComplete = pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0;
        var hasValidCod = (pbi.cod && pbi.cod > 0) && (pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0);
        var hasValidWsjf = isJobSizeComplete && hasValidCod;
        var isIrrelevant = false;
        
        if (isWsjfTabActive) {
            isIrrelevant = !hasValidWsjf;
        } else {
            if (!pbi.isReference) { 
                 if (currentSortCriteria === 'creationOrder' || currentSortCriteria === 'custom' || currentSortCriteria === 'lock') {
                    isIrrelevant = false; 
                } else if (currentSortCriteria === "jobSize" && !isJobSizeComplete) {
                    isIrrelevant = true;
                } else if (currentSortCriteria === "cod" && !hasValidCod) {
                    isIrrelevant = true;
                } else if (currentSortCriteria === "wsjf" && !hasValidWsjf) {
                    isIrrelevant = true;
                } else if (currentSortCriteria === "tshirtSize" && !pbi.tshirtSize) {
                     isIrrelevant = true;
                } else if ((currentSortCriteria === "complexity" || currentSortCriteria === "effort" || currentSortCriteria === "doubt") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) {
                     isIrrelevant = true;
                } else if ((currentSortCriteria === "cod_bv" || currentSortCriteria === "cod_tc" || currentSortCriteria === "cod_rroe") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) {
                     isIrrelevant = true;
                }
            }
        }

        if (isIrrelevant) {
            visualizationWrapper.classList.add("is-irrelevant-to-sort");
        }

        if (isJobSizeComplete) {
            createStoryVisualization(pbi, visualizationWrapper);
        } else {
            createPlaceholderVisualization(pbi, visualizationWrapper);
            var missingJs = [];
            if (!pbi.complexity) missingJs.push(uiStrings.colComplexity);
            if (!pbi.effort) missingJs.push(uiStrings.colEffort);
            if (!pbi.doubt) missingJs.push(uiStrings.colDoubt);
            if (missingJs.length > 0) {
                visualizationWrapper.title = uiStrings.tooltipJobSizeNa.replace('{missingValues}', missingJs.join(', '));
            }
        }

        var editButtonHtml = '<button class="visualization-edit-btn" title="' + uiStrings.btnEdit + '">' + '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666">' + '<path d="M160-400v-80h280v80H160Zm0-160v-80h440v80H160Zm0-160v-80h440v80H160Zm360 560v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T863-380L643-160H520Zm300-263-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/>' + '</svg>' + '</button>';
        visualizationWrapper.insertAdjacentHTML('beforeend', editButtonHtml);

        var storyTitleContainer = document.createElement("div");
        storyTitleContainer.className = "story-title";

        var metaTagsContainer = document.createElement("div");
        metaTagsContainer.style.display = "flex";
        metaTagsContainer.style.gap = "8px"; 
        metaTagsContainer.style.marginBottom = "6px";
        metaTagsContainer.style.alignItems = "center"; 

        var wsjfRankTag = document.createElement("span");
        wsjfRankTag.className = "wsjf-rank-tag hidden"; 

        if (isWsjfTabActive && wsjfRanks[pbi.id]) {
            wsjfRankTag.textContent = wsjfRanks[pbi.id];
            wsjfRankTag.title = uiStrings.tooltipWsjfRank || ''; 
            wsjfRankTag.classList.remove('hidden');
            wsjfRankTag.style.backgroundColor = '#e0e0e0'; 
        }
        metaTagsContainer.appendChild(wsjfRankTag); 

        if (isJobSizeComplete) {
            var tshirtElement = document.createElement("div");
            var tshirtClasses = "story-title-tshirt story-title-tshirt-clickable";
            
            tshirtElement.className = tshirtClasses;
            tshirtElement.textContent = pbi.tshirtSize || "-";
            tshirtElement.style.marginBottom = "0"; 
            metaTagsContainer.appendChild(tshirtElement);
        } else {
             var missingValuesElement = document.createElement("div");
             missingValuesElement.className = "story-title-wsjf";
             missingValuesElement.textContent = uiStrings.valuesMissing || "N/A";
             metaTagsContainer.appendChild(missingValuesElement);
        }

        var jobSize = isJobSizeComplete ? pbi.jobSize : null;
        if (hasValidWsjf) {
            var wsjfElement = document.createElement("div");
            wsjfElement.className = "story-title-wsjf";
            var wsjfValue = (pbi.cod / jobSize).toFixed(2).replace(".", ",");
            wsjfElement.textContent = uiStrings.pbiInfoWSJF + ": " + wsjfValue;
            metaTagsContainer.appendChild(wsjfElement);
        } else if (isWsjfTabActive) {
            var missingValuesElementWsjf = document.createElement("div");
            missingValuesElementWsjf.className = "story-title-wsjf";
            missingValuesElementWsjf.textContent = uiStrings.valuesMissing || "N/A";
            metaTagsContainer.appendChild(missingValuesElementWsjf);
        }

        storyTitleContainer.appendChild(metaTagsContainer);

        var titleElement = document.createElement("div");
        titleElement.className = "story-title-main";
        titleElement.textContent = pbi.title;
        storyTitleContainer.appendChild(titleElement);

        var metaElement = document.createElement("div");
        metaElement.className = "story-title-meta";
        var jobSizeText = uiStrings.pbiInfoJobSize + ": " + (jobSize !== null ? jobSize : uiStrings.pbiInfoNA);
        var codText = uiStrings.pbiInfoCoD + ": " + (hasValidCod ? pbi.cod : uiStrings.pbiInfoNA);
        metaElement.textContent = jobSizeText + " - " + codText;
        storyTitleContainer.appendChild(metaElement);

        visualizationWrapper.appendChild(storyTitleContainer);
        container.appendChild(visualizationWrapper);
    }); 

    if (window._equalizeGridRows) {
        window._equalizeGridRows();
    }
}


/**
 * Renders the "Cost of Delay" (CoD) visualization column.
 * <br><b>Purpose (Economic Transparency):</b>
 * This function visualizes the three components of Cost of Delay (BV, TC, RR/OE) as a 
 * cumulative bubble chart. It allows stakeholders to see at a glance why an item has a 
 * high economic priority—whether it's due to high user value or extreme time sensitivity.
 *
 * <br><b>Core Features:</b>
 * <ul>
 * <li><b>Data Synchronization:</b> Uses `getSortedPbis` to ensure the vertical sequence 
 * matches the main list exactly.</li>
 * <li><b>Validation & Feedback:</b>
 * <ul>
 * <li><b>Complete:</b> If all three CoD metrics are provided, `createCodVisualization` 
 * renders the colored bubble stack.</li>
 * <li><b>Incomplete:</b> Renders a placeholder. A dynamic tooltip lists the missing 
 * components (e.g., "Missing: Time Criticality") using the localized strings.</li>
 * </ul>
 * </li>
 * <li><b>Relevance Logic:</b> If an item cannot be meaningfully sorted by the current 
 * global criteria (e.g., sorting by WSJF but CoD is 0), the visualization is "ghosted" 
 * via the `is-irrelevant-to-sort` class.</li>
 * </ul>
 *
 * <br><b>UI Components:</b>
 * Each card includes:
 * <ul>
 * <li>A calculated **WSJF Badge** (if Job Size is also available).</li>
 * <li>The **Main Title** and a metadata row showing summary totals.</li>
 * <li>An **Edit Shortcut** (SVG icon) for quick access to the CoD parameters.</li>
 * <li><b>[NEW] Read-Only T-Shirt Badge:</b> Displays the T-Shirt size for reference, 
 * with a tooltip indicating it can only be changed in the Job Size view.</li>
 * </ul>
 *
 * <br><b>Post-Processing:</b>
 * Like the other columns, it triggers `_equalizeGridRows()` to ensure that the 
 * height of each CoD card matches its corresponding list item on the left.
 *
 * @global
 * @requires pbis - The source data array.
 * @requires currentSortCriteria - Determines the visual prominence of each card.
 */
function renderCodVisualizations() {
    var container = document.getElementById("cod-visualization-container");
    container.innerHTML = "";

    var sortedPbis = getSortedPbis(pbis, currentSortCriteria, currentSortDirection, config, false);
    var uiStrings = config.uiStrings;

    sortedPbis.forEach(function(pbi) {
        var visualizationWrapper = document.createElement("div");
        visualizationWrapper.className = "story-visualization";
        visualizationWrapper.dataset.id = pbi.id;

        if (pbi.isLastItem) {
            visualizationWrapper.classList.add("last-item");
            container.appendChild(visualizationWrapper);
            return;
        }

        if (pbi.isReference) {
            visualizationWrapper.classList.add("reference-item");
            if (pbi.referenceType === 'min') visualizationWrapper.classList.add("ref-min");
            if (pbi.referenceType === 'max') visualizationWrapper.classList.add("ref-max");
        }

        var isJobSizeComplete = pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0;
        var isCodComplete = pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0;
        var hasValidCod = (pbi.cod && pbi.cod > 0) && isCodComplete;
        var isIrrelevantToSort = false;

         if (!pbi.isReference) {
             if (currentSortCriteria === 'creationOrder') {
                isIrrelevantToSort = false;
            } else if (currentSortCriteria === "jobSize" && !isJobSizeComplete) {
                isIrrelevantToSort = true;
            } else if (currentSortCriteria === "cod" && !hasValidCod) {
                isIrrelevantToSort = true;
            } else if (currentSortCriteria === "wsjf" && (!isJobSizeComplete || !hasValidCod)) {
                isIrrelevantToSort = true;
            } else if (currentSortCriteria === "tshirtSize" && !pbi.tshirtSize) {
                 isIrrelevantToSort = true;
            } else if ((currentSortCriteria === "complexity" || currentSortCriteria === "effort" || currentSortCriteria === "doubt") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) {
                 isIrrelevantToSort = true;
            } else if ((currentSortCriteria === "cod_bv" || currentSortCriteria === "cod_tc" || currentSortCriteria === "cod_rroe") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) {
                 isIrrelevantToSort = true;
            }
        }

        if (isIrrelevantToSort) {
            visualizationWrapper.classList.add("is-irrelevant-to-sort");
        }

        var jobSize = isJobSizeComplete ? pbi.jobSize : null;

        if (isCodComplete) {
            createCodVisualization(pbi, visualizationWrapper);
        } else {
            createCodPlaceholderVisualization(pbi, visualizationWrapper);
            var missing = [];
            if (!pbi.cod_bv) missing.push(uiStrings.colBv);
            if (!pbi.cod_tc) missing.push(uiStrings.colTc);
            if (!pbi.cod_rroe) missing.push(uiStrings.colRrOe);
            if (missing.length > 0) {
                visualizationWrapper.title = uiStrings.tooltipCodNa.replace('{missingValues}', missing.join(', '));
            }
        }

        var editButtonHtml = '<button class="visualization-edit-btn" title="' + uiStrings.btnEdit + '">' + '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666">' + '<path d="M160-400v-80h280v80H160Zm0-160v-80h440v80H160Zm0-160v-80h440v80H160Zm360 560v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T863-380L643-160H520Zm300-263-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/>' + '</svg>' + '</button>';
        visualizationWrapper.insertAdjacentHTML('beforeend', editButtonHtml);

        var storyTitleContainer = document.createElement("div");
        storyTitleContainer.className = "story-title";

        var metaTagsContainer = document.createElement("div");
        metaTagsContainer.style.display = "flex";
        metaTagsContainer.style.gap = "8px";
        metaTagsContainer.style.marginBottom = "6px";
        metaTagsContainer.style.alignItems = "center"; 

        if (pbi.tshirtSize) {
             var tshirtElement = document.createElement("div");
             tshirtElement.className = "story-title-tshirt"; 
             tshirtElement.textContent = pbi.tshirtSize;
             tshirtElement.style.marginBottom = "0"; 
             tshirtElement.title = uiStrings.tooltipTshirtCodView || "The T-shirt size can only be set in the \"Job Size Visualization\" view.";
             //tshirtElement.style.cursor = "not-allowed"; 
             metaTagsContainer.appendChild(tshirtElement);
        }

        if (hasValidCod) {
            var wsjfElement = document.createElement("div");
            wsjfElement.className = "story-title-wsjf";
            if (isJobSizeComplete) {
                var wsjfValue = (pbi.cod / jobSize).toFixed(2).replace(".", ",");
                wsjfElement.textContent = uiStrings.pbiInfoWSJF + ": " + wsjfValue;
            } else {
                wsjfElement.textContent = uiStrings.pbiInfoWSJF + ": " + uiStrings.pbiInfoNA;
            }
            metaTagsContainer.appendChild(wsjfElement);
        } else {
            var missingValuesElement = document.createElement("div");
            missingValuesElement.className = "story-title-wsjf";
            missingValuesElement.textContent = uiStrings.valuesMissing;
            metaTagsContainer.appendChild(missingValuesElement);
        }


        storyTitleContainer.appendChild(metaTagsContainer);

        var titleElement = document.createElement("div");
        titleElement.className = "story-title-main";
        titleElement.textContent = pbi.title;

        var metaElement = document.createElement("div");
        metaElement.className = "story-title-meta";
        var jobSizeText = uiStrings.pbiInfoJobSize + ": " + (jobSize ? jobSize : uiStrings.pbiInfoNA);
        var codText = uiStrings.pbiInfoCoD + ": " + (hasValidCod ? pbi.cod : uiStrings.pbiInfoNA);
        metaElement.textContent = jobSizeText + " - " + codText;


        storyTitleContainer.appendChild(titleElement);
        storyTitleContainer.appendChild(metaElement);
        visualizationWrapper.appendChild(storyTitleContainer);
        container.appendChild(visualizationWrapper);

    });

    if (window._equalizeGridRows) {
        window._equalizeGridRows();
    }
}


/**
 * Renders the "Relative Sizing" table view, displaying all estimation metrics in a grid layout.
 * <br><b>Data Integrity & Feedback:</b>
 * This view serves as a technical summary of all PBIs. It provides deep insight into the 
 * components of each score.
 * <ol>
 * <li><b>Grid Reconstruction:</b> Clears and rebuilds the `#relative-sizing-list` 
 * container based on the current sorted order of PBIs.</li>
 * <li><b>Calculated vs. Input Cells:</b> 
 * <ul>
 * <li><b>Input Cells:</b> Display raw values for Complexity, Effort, BV, etc.</li>
 * <li><b>Calculated Cells:</b> Highlighted with the `.calculated` class (Job Size, CoD, WSJF). 
 * These cells automatically update based on the input values.</li>
 * </ul>
 * </li>
 * <li><b>Handling Incomplete Data:</b> 
 * If an aggregate value cannot be calculated (e.g., Job Size is missing 'Effort'), 
 * the cell displays "N/A" and provides a detailed tooltip explaining exactly 
 * which components are missing.</li>
 * </ol>
 *
 * <br><b>Visual Synchronization:</b>
 * <ul>
 * <li><b>Reference Pinning:</b> Like the main list, items marked as references are 
 * visually distinct with `.reference-item`, `.ref-min`, or `.ref-max` classes.</li>
 * <li><b>Column Highlighting:</b> Applies the `.highlighted` class to all cells 
 * within the column currently selected via `currentHighlightedColumn`.</li>
 * <li><b>Sort Relevance:</b> Items that lack data for the active global sort criteria 
 * are faded out using the `.is-irrelevant-to-sort` class.</li>
 * </ul>
 *
 * <br><b>Layout Management:</b>
 * Uses `requestAnimationFrame` to trigger `syncRelativeSizingHeaderPadding`, ensuring 
 * the table headers align perfectly with the scrollable body columns.
 *
 * @param {Array<Object>} [pbisToRender] - Optional array of items to render. Falls back to global `pbis`.
 */
function renderRelativeSizingList(pbisToRender) {
    const container = document.getElementById('relative-sizing-list');
    container.innerHTML = '';

    var pbisForProcessing = Array.isArray(pbisToRender) ? pbisToRender : (Array.isArray(pbis) ? pbis : []);

    const uiStrings = config.uiStrings;

    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');
    var isCustomSortActive = currentSortCriteria === 'custom'; 

    const sortedPbis = getSortedPbis(pbisForProcessing, currentSortCriteria, currentSortDirection, config, isWsjfTabActive); 

    const titleMap = {
        'complexity': uiStrings.tooltipComplexity,
        'effort': uiStrings.tooltipEffort,
        'doubt': uiStrings.tooltipDoubt,
        'jobSize': uiStrings.tooltipJobSize,
        'cod_bv': uiStrings.tooltipBv,
        'cod_tc': uiStrings.tooltipTc,
        'cod_rroe': uiStrings.tooltipRrOe,
        'cod': uiStrings.tooltipCoD
    };

    sortedPbis.forEach(function(pbi) {
        const item = document.createElement('div');
        item.className = 'rs-item rs-grid';
        item.dataset.id = pbi.id;

        if (pbi.isLastItem) {
            item.classList.add("last-item");
            item.innerHTML = '<div class="rs-cell"></div>' +
                             '<div class="rs-cell"></div>' +
                             '<div class="rs-cell"></div>' +
                             '<div class="rs-cell calculated"></div>' +
                             '<div class="rs-cell"></div>' +
                             '<div class="rs-cell"></div>' +
                             '<div class="rs-cell"></div>' +
                             '<div class="rs-cell calculated"></div>' +
                             '<div class="rs-cell calculated"></div>';
            container.appendChild(item);
            return;
        }

        if (pbi.isReference && !isWsjfTabActive && !isCustomSortActive) {
            item.classList.add("reference-item");
            if (pbi.referenceType === 'min') item.classList.add("ref-min");
            if (pbi.referenceType === 'max') item.classList.add("ref-max");
        }

        const isJobSizeComplete = pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0;
        const hasValidCod = (pbi.cod > 0) && (pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0);

        var isIrrelevantToSort = false;

        if (!pbi.isReference) {
             if (currentSortCriteria === 'creationOrder') {
                isIrrelevantToSort = false;
            } else if (currentSortCriteria === "jobSize" && !isJobSizeComplete) {
                isIrrelevantToSort = true;
            } else if (currentSortCriteria === "cod" && !hasValidCod) {
                isIrrelevantToSort = true;
            } else if (currentSortCriteria === "wsjf" && (!isJobSizeComplete || !hasValidCod)) {
                isIrrelevantToSort = true;
            } else if (currentSortCriteria === "tshirtSize" && !pbi.tshirtSize) {
                 isIrrelevantToSort = true;
            } else if ((currentSortCriteria === "complexity" || currentSortCriteria === "effort" || currentSortCriteria === "doubt") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) {
                 isIrrelevantToSort = true;
            } else if ((currentSortCriteria === "cod_bv" || currentSortCriteria === "cod_tc" || currentSortCriteria === "cod_rroe") && (!pbi[currentSortCriteria] || pbi[currentSortCriteria] <= 0)) {
                 isIrrelevantToSort = true;
            }
        }

        if (isIrrelevantToSort) {
            item.classList.add("is-irrelevant-to-sort");
        }

        const columns = {
            'complexity': pbi.complexity,
            'effort': pbi.effort,
            'doubt': pbi.doubt,
            'jobSize': isJobSizeComplete ? pbi.jobSize : null,
            'cod_bv': pbi.cod_bv,
            'cod_tc': pbi.cod_tc,
            'cod_rroe': pbi.cod_rroe,
            'cod': hasValidCod ? pbi.cod : null
        };

        for (const key in columns) {
            const cell = document.createElement('div');
            cell.className = 'rs-cell';
            if (key === 'jobSize' || key === 'cod') {
                cell.classList.add('calculated');
            }
            if (key === currentHighlightedColumn) {
                cell.classList.add('highlighted');
            }
            cell.dataset.pbiId = pbi.id;
            cell.dataset.valueType = key;

            const value = columns[key];
            const cellTitle = titleMap[key] || '';

            const displayValue = (typeof value === 'number' && value > 0) ? value :
                                 (typeof value === 'number' && value === 0 && key !== 'jobSize' && key !== 'cod') ? '-' : null;


            if (displayValue !== null) {
                 cell.textContent = displayValue;
                 cell.title = cellTitle;
            } else {
                if (key === 'jobSize') {
                    cell.textContent = uiStrings.pbiInfoNA;
                    cell.classList.add('is-na-value');
                    let missing = [];
                    if (!pbi.complexity || pbi.complexity <= 0) missing.push(uiStrings.colComplexity);
                    if (!pbi.effort || pbi.effort <= 0) missing.push(uiStrings.colEffort);
                    if (!pbi.doubt || pbi.doubt <= 0) missing.push(uiStrings.colDoubt);
                    if (missing.length > 0) {
                        cell.title = uiStrings.tooltipJobSizeNa.replace('{missingValues}', missing.join(', '));
                    } else {
                        cell.title = cellTitle;
                    }
                } else if (key === 'cod') {
                    cell.textContent = uiStrings.pbiInfoNA;
                    cell.classList.add('is-na-value');
                    let missing = [];
                    if (!pbi.cod_bv || pbi.cod_bv <= 0) missing.push(uiStrings.colBv);
                    if (!pbi.cod_tc || pbi.cod_tc <= 0) missing.push(uiStrings.colTc);
                    if (!pbi.cod_rroe || pbi.cod_rroe <= 0) missing.push(uiStrings.colRrOe);
                    if (missing.length > 0) {
                        cell.title = uiStrings.tooltipCodNa.replace('{missingValues}', missing.join(', '));
                    } else {
                        cell.title = cellTitle;
                    }
                } else {
                    cell.textContent = '-';
                    cell.title = cellTitle;
                }
            }
            item.appendChild(cell);
        }

        const wsjfCell = document.createElement('div');
        wsjfCell.className = 'rs-cell calculated';
        if ('wsjf' === currentHighlightedColumn) {
            wsjfCell.classList.add('highlighted');
        }
        if (hasValidCod && isJobSizeComplete) {
            wsjfCell.textContent = (pbi.cod / pbi.jobSize).toFixed(2).replace('.', ',');
            wsjfCell.title = uiStrings.tooltipWsjf;
        } else {
            wsjfCell.textContent = uiStrings.pbiInfoNA;
            wsjfCell.classList.add('is-na-value');
            let missing = [];
            if (!isJobSizeComplete) missing.push(uiStrings.groupJobSize);
            if (!hasValidCod) missing.push(uiStrings.groupCoD);
            if (missing.length > 0) {
                wsjfCell.title = uiStrings.tooltipWsjfNa.replace('{missingValues}', missing.join(', '));
            } else {
                wsjfCell.title = uiStrings.tooltipWsjf;
            }
        }
        item.appendChild(wsjfCell);

        container.appendChild(item);
    });
    requestAnimationFrame(syncRelativeSizingHeaderPadding);
}


/**
 * Manages the "Sticky Reference Slots" that keep Min/Max reference items visible.
 * <br><b>Concept: Persistent Anchors</b>
 * To facilitate relative sizing, users need to compare new items against their "Min" and "Max" anchors. 
 * This function dynamically moves or clones these anchor items into dedicated containers (#ref-slot-left and #ref-slot-right) 
 * that are typically fixed or positioned at the top of the viewport.
 *
 * <br><b>Operational Logic:</b>
 * <ol>
 * <li><b>Visibility Check:</b> Slots are hidden and cleared if the WSJF tab is active, if pinning is globally disabled in config, or if no references are set.</li>
 * <li><b>Target Identification:</b> Finds the PBIs currently designated as 'min' and 'max'.</li>
 * <li><b>Dynamic Positioning (Sort-Aware):</b>
 * <ul>
 * <li><b>Standard Sorting:</b> The original DOM elements are moved from the list directly into the slots. This ensures they "pop out" of the normal flow.</li>
 * <li><b>Custom/Manual Sorting:</b> Because manual reordering requires the items to stay within the SortableJS list for drag logic, the function <i>clones</i> the items into the slots instead of moving them. This maintains the "Sticky" visual while keeping the "Drag" functionality intact.</li>
 * </ul>
 * </li>
 * </ol>
 *
 * <br><b>UI States:</b>
 * Adds the `.has-content` class and toggles `display: block` to the slots only when they actually contain a reference item, 
 * ensuring the layout doesn't reserve empty space.
 *
 * @global
 * @requires pbis - The global data array to find reference items.
 * @requires currentSortCriteria - Determines whether to move or clone elements.
 */
function updateReferenceSlots() {
    var leftSlot = document.getElementById('ref-slot-left');
    var rightSlot = document.getElementById('ref-slot-right');

    if (!leftSlot && !rightSlot) { return; } 

    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');
    var isCustomSortActive = currentSortCriteria === 'custom';
    var isPinningGloballyDisabled = (typeof isPinReferenceEnabled === 'function' && !isPinReferenceEnabled(config));

    if (leftSlot) {
        leftSlot.innerHTML = '';
        leftSlot.classList.remove('has-content');
        leftSlot.style.display = 'none';
    }
    if (rightSlot) {
        rightSlot.innerHTML = '';
        rightSlot.classList.remove('has-content');
        rightSlot.style.display = 'none';
    }

    if (isPinningGloballyDisabled || isWsjfTabActive) {
        return;
    }

    var getRef = (typeof getReferencePbi === 'function') ? getReferencePbi : function(list, type) {
        return list.find(function(p) { return p.isReference && (!type || p.referenceType === type); });
    };

    var refMin = getReferencePbi(pbis, 'min');
    var refMax = getReferencePbi(pbis, 'max');

    if (!refMin && !refMax) {
        return;
    }

    var itemsToSlot = [];
    if (refMin) itemsToSlot.push(refMin);
    if (refMax) itemsToSlot.push(refMax);

    itemsToSlot.forEach(function(refPbi) {
        var refId = refPbi.id;

        if (isCustomSortActive) {
            if (leftSlot) {
                var originalLeftItem = document.querySelector('#pbi-list .pbi-item[data-id="' + refId + '"]');
                if (originalLeftItem) {
                    var cloneLeft = originalLeftItem.cloneNode(true); 
                    cloneLeft.classList.add('reference-item');
                    if (refPbi.referenceType === 'min') cloneLeft.classList.add('ref-min');
                    if (refPbi.referenceType === 'max') cloneLeft.classList.add('ref-max');
                    leftSlot.appendChild(cloneLeft);
                    leftSlot.classList.add('has-content');
                    leftSlot.style.display = 'block';
                }
            }
            if (rightSlot) {
                var originalRightItem = document.querySelector('#relative-sizing-list .rs-item[data-id="' + refId + '"]');
                if (originalRightItem) {
                    var cloneRight = originalRightItem.cloneNode(true);
                    cloneRight.classList.add('reference-item');
                    if (refPbi.referenceType === 'min') cloneRight.classList.add('ref-min');
                    if (refPbi.referenceType === 'max') cloneRight.classList.add('ref-max');
                    rightSlot.appendChild(cloneRight);
                    rightSlot.classList.add('has-content');
                    rightSlot.style.display = 'block';
                }
            }
        } else {
            if (leftSlot) {
                var leftItem = document.querySelector('#pbi-list .pbi-item[data-id="' + refId + '"]');
                if (leftItem && leftItem.classList.contains('reference-item')) { 
                     leftSlot.appendChild(leftItem);
                     leftSlot.classList.add('has-content');
                     leftSlot.style.display = 'block';
                }
            }
            if (rightSlot) {
                var rightItem = document.querySelector('#relative-sizing-list .rs-item[data-id="' + refId + '"]');
                if (rightItem && rightItem.classList.contains('reference-item')) {
                     rightSlot.appendChild(rightItem);
                     rightSlot.classList.add('has-content');
                     rightSlot.style.display = 'block';
                 }
            }
        }
    });
}


/**
 * Synchronizes the visual "active" state of the filter buttons with the current sorting criteria.
 * <br><b>UX Pattern (Visual Feedback):</b>
 * This function ensures that the user always has a clear visual indicator of which metric 
 * is currently driving the list's sort order. It handles the highlighting of toggle buttons 
 * in the main toolbar.
 *
 * <br><b>Logic Flow:</b>
 * <ol>
 * <li><b>Reset:</b> It first removes the `.active` class from all elements with the `.filter-btn` class to prevent multiple buttons from appearing selected.</li>
 * <li><b>Mapping:</b> Uses a lookup object (`criteriaToButtonId`) to resolve the internal `currentSortCriteria` string to its corresponding DOM element ID.</li>
 * <li><b>State Check:</b> A button is only marked as active if:
 * <ul>
 * <li>The filter is NOT currently locked (`isFilterLocked` is false).</li>
 * <li>The current criteria is NOT the default 'creationOrder' (which usually has no persistent button highlight).</li>
 * <li>The target button exists and is not currently disabled.</li>
 * </ul>
 * </li>
 * </ol>
 *
 * <br><b>Technical Note:</b>
 * This function is typically called inside the main `renderAll` loop to ensure the UI remains 
 * in sync after any state change (e.g., clicking a button, importing data, or resetting filters).
 *
 * @global
 * @requires currentSortCriteria - The global state variable tracking the active sort metric.
 * @requires isFilterLocked - Prevents visual updates if the view is currently "frozen".
 */
function updateActiveFilterButtonVisualState() {
    var filterButtons = document.querySelectorAll(".filter-btn");
    var criteriaToButtonId = {
        jobSize: "filter-job-size-btn",
        tshirtSize: "filter-tshirt-size-btn",
        cod: "filter-cod-btn",
        wsjf: "filter-wsjf-btn"
    };

    filterButtons.forEach(function(btn) {
        btn.classList.remove("active");
    });

    if (!isFilterLocked && currentSortCriteria !== 'creationOrder' && criteriaToButtonId[currentSortCriteria]) {
        var activeButton = document.getElementById(criteriaToButtonId[currentSortCriteria]);
        if (activeButton && !activeButton.disabled) {
            activeButton.classList.add("active");
        }
    }
}


/**
 * Updates the visual "active" state of the sort direction and custom sort buttons.
 * <br><b>Visual State Logic:</b>
 * This function manages the highlighting of the Ascending (↑), Descending (↓), and Custom Sort (drag-and-drop) buttons.
 * It ensures that the user can distinguish between mathematical sorting and manual reordering.
 * * <br><b>Operational Rules:</b>
 * <ol>
 * <li><b>Clean Slate:</b> Initially removes the `.active` class from all three buttons (`asc`, `desc`, `custom`) to ensure a fresh state.</li>
 * <li><b>Availability Check:</b> Actions are only visualized if real data exists (`hasPbis`) and the view is not currently "frozen" (`!isFilterLocked`).</li>
 * <li><b>Mode Differentiation:</b>
 * <ul>
 * <li><b>Custom Mode:</b> If `currentSortCriteria` is set to 'custom', only the `customSortBtn` is highlighted. Asc/Desc buttons remain inactive as they do not apply to manual orders.</li>
 * <li><b>Mathematical Mode:</b> If sorting by a specific metric (and NOT the default creation order), the function highlights either the `ascBtn` or `descBtn` based on the current `direction` parameter.</li>
 * </ul>
 * </li>
 * </ol>
 * * <br><b>Implementation Detail:</b>
 * This function handles the mutual exclusivity between manual sorting and automated sorting directions, preventing confusing UI states where a "Sort Ascending" button might appear active while the user is manually dragging items.
 *
 * @param {Array<Object>} pbisToCheck - The list of items to check for "real" content (ignoring placeholders).
 * @param {string} direction - The active sort direction ('asc' or 'desc').
 * @global
 */
function updateSortDirectionButtons(pbisToCheck, direction) {
    var hasPbis = (pbisToCheck || []).some(function(p) { return p && !p.isLastItem; }); 
    var ascBtn = document.getElementById("sort-asc-btn");
    var descBtn = document.getElementById("sort-desc-btn");
    var customSortBtn = document.getElementById("custom-sort-btn");

    if (ascBtn) ascBtn.classList.remove("active");
    if (descBtn) descBtn.classList.remove("active");
    if (customSortBtn) customSortBtn.classList.remove("active");

    if (hasPbis && !isFilterLocked) {
        if (currentSortCriteria === "custom") {
            if (customSortBtn) customSortBtn.classList.add("active");
        } else if (currentSortCriteria !== 'creationOrder' && currentSortCriteria !== 'lock') {
            if (direction === "asc") {
                if (ascBtn) ascBtn.classList.add("active");
            } else if (direction === "desc") {
                if (descBtn) descBtn.classList.add("active");
            }
        }
    }
}


/**
 * Updates the informational text string within the visualization legend.
 * <br><b>Purpose (Contextual Awareness):</b>
 * This function provides a textual "Source of Truth" for the current sorting state. 
 * Since the bubbles and list items change positions dynamically, the legend info helps 
 * the user understand the underlying logic (e.g., "Sorted by: Business Value - Descending").
 * * <br><b>Operational Logic:</b>
 * <ol>
 * <li><b>Visibility:</b> The info element is hidden (`display: none`) if the backlog is empty 
 * or using the default 'Creation Order', as no specific logic needs explanation.</li>
 * <li><b>Translation:</b> It maps the technical `currentSortCriteria` key (e.g., 'cod_bv') 
 * to its localized human-readable label (e.g., 'Business Value') using `config.uiStrings`.</li>
 * <li><b>State Complexity:</b> It handles several specific UI states:
 * <ul>
 * <li><b>Filter Lock:</b> If the view is "frozen", it explicitly shows the "Locked" status, 
 * even if a sub-sorting was active.</li>
 * <li><b>Custom Order:</b> Hides the direction (Asc/Desc) info, as manual sorting 
 * doesn't follow a mathematical direction.</li>
 * <li><b>Standard Metrics:</b> Concatenates the metric name and the direction 
 * (e.g., "Sorted by: Job Size - Ascending").</li>
 * </ul>
 * </li>
 * </ol>
 * * @global
 * @requires currentSortCriteria - The key being sorted by.
 * @requires currentSortDirection - The direction of the sort.
 * @requires isFilterLocked - Global flag for the locked view state.
 */
function updateLegendSortInfo() {
    var legendSortInfo = document.getElementById("legend-sort-info");
    if (!legendSortInfo) return;

    var hasPbis = (pbis || []).some(function(p) { return p && !p.isLastItem; }); 
    if (hasPbis && currentSortCriteria !== 'creationOrder') {
        legendSortInfo.style.display = ""; 
        var uiStrings = config.uiStrings;
        var sortCriteriaText = "";

        switch (currentSortCriteria) {
            case "jobSize":     sortCriteriaText = uiStrings.filterJobSize; break;
            case "cod":         sortCriteriaText = uiStrings.filterCoD; break;
            case "wsjf":        sortCriteriaText = uiStrings.filterWSJF; break;
            case "tshirtSize":  sortCriteriaText = uiStrings.filterTshirtSize; break;
            case "custom":      sortCriteriaText = uiStrings.filterCustomSort; break;
            case "complexity":  sortCriteriaText = uiStrings.colComplexity; break;
            case "effort":      sortCriteriaText = uiStrings.colEffort; break;
            case "doubt":       sortCriteriaText = uiStrings.colDoubt; break;
            case "cod_bv":      sortCriteriaText = uiStrings.colBv; break;
            case "cod_tc":      sortCriteriaText = uiStrings.colTc; break;
            case "cod_rroe":    sortCriteriaText = uiStrings.colRrOe; break;
            case "lock":        sortCriteriaText = uiStrings.tooltipFilterLock; break;
            default:            sortCriteriaText = currentSortCriteria;
        }

        var sortDirectionText = currentSortDirection === "asc" ? uiStrings.sortOptionAsc : uiStrings.sortOptionDesc;

      
        if (isFilterLocked) {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + uiStrings.tooltipFilterLock;
        } else if (currentSortCriteria === 'lock') {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + uiStrings.tooltipFilterLock;
        } else if (currentSortCriteria === 'custom') {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + sortCriteriaText;
        } else {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + sortCriteriaText + " - " + sortDirectionText;
        }

    } else {
        legendSortInfo.style.display = "none";
    }
}


/**
 * Updates the sort information text specifically for the Cost of Delay (CoD) visualization legend.
 * <br><b>Context (View Synchronization):</b>
 * The CoD visualization column needs to clearly state its sorting logic to avoid confusion when
 * the user switches between different estimation metrics (e.g., sorting by Business Value vs. Risk Reduction).
 * * <br><b>Operational Logic:</b>
 * <ol>
 * <li><b>Data Presence:</b> If the backlog is empty or the sort order is the default 'Creation Order', 
 * the info element is hidden to reduce UI clutter.</li>
 * <li><b>Label Mapping:</b> Uses a `switch` statement to map internal data keys (e.g., `cod_tc`) to 
 * localized, user-friendly strings (e.g., 'Time Criticality') provided by the configuration.</li>
 * <li><b>Status Formatting:</b>
 * <ul>
 * <li><b>Lock State:</b> If the filter is locked, it prioritizes showing the "Locked" status to 
 * indicate that drag-and-drop or automatic re-sorting is currently restricted.</li>
 * <li><b>Directional Feedback:</b> For mathematical sorts (Asc/Desc), it appends the 
 * direction (e.g., "Sorted by: Effort - Ascending").</li>
 * <li><b>Custom Order:</b> Omits the direction text, as manual reordering has no 
 * mathematical orientation.</li>
 * </ul>
 * </li>
 * </ol>
 * * <br><b>Technical Detail:</b>
 * This function targets the specific element `#cod-legend-sort-info`, ensuring that the 
 * CoD-specific legend is updated independently of the main Job Size legend.
 * * @global
 * @requires pbis - The global array of items to check for existence.
 * @requires currentSortCriteria - The metric currently driving the UI order.
 * @requires currentSortDirection - The active sort direction (ascending or descending).
 * @requires isFilterLocked - Global state flag for frozen views.
 */
function updateCodLegendSortInfo() {
    var legendSortInfo = document.getElementById("cod-legend-sort-info");
    if (!legendSortInfo) return;

    var hasPbis = (pbis || []).some(function(p) { return p && !p.isLastItem; }); 

    if (hasPbis && currentSortCriteria !== 'creationOrder') {
        legendSortInfo.style.display = ""; 
        var uiStrings = config.uiStrings;
        var sortCriteriaText = "";

        switch (currentSortCriteria) {
            case "jobSize":     sortCriteriaText = uiStrings.filterJobSize; break;
            case "cod":         sortCriteriaText = uiStrings.filterCoD; break;
            case "wsjf":        sortCriteriaText = uiStrings.filterWSJF; break;
            case "tshirtSize":  sortCriteriaText = uiStrings.filterTshirtSize; break;
            case "custom":      sortCriteriaText = uiStrings.filterCustomSort; break;
            case "complexity":  sortCriteriaText = uiStrings.colComplexity; break;
            case "effort":      sortCriteriaText = uiStrings.colEffort; break;
            case "doubt":       sortCriteriaText = uiStrings.colDoubt; break;
            case "cod_bv":      sortCriteriaText = uiStrings.colBv; break;
            case "cod_tc":      sortCriteriaText = uiStrings.colTc; break;
            case "cod_rroe":    sortCriteriaText = uiStrings.colRrOe; break;
            case "lock":        sortCriteriaText = uiStrings.tooltipFilterLock; break;
            default:            sortCriteriaText = currentSortCriteria;
        }

        var sortDirectionText = currentSortDirection === "asc" ? uiStrings.sortOptionAsc : uiStrings.sortOptionDesc;

        if (isFilterLocked) {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + uiStrings.tooltipFilterLock;
        } else if (currentSortCriteria === 'lock') {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + uiStrings.tooltipFilterLock;
        } else if (currentSortCriteria === 'custom') {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + sortCriteriaText;
        } else {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + sortCriteriaText + " - " + sortDirectionText;
        }
    } else {
        legendSortInfo.style.display = "none";
    }
}


/**
 * Updates the sort information text specifically for the WSJF (Weighted Shortest Job First) visualization legend.
 * <br><b>Context (Economic Prioritization):</b>
 * The WSJF view compares the current sequence of work against an economically optimal one. 
 * This function provides the necessary context by displaying exactly which metric is driving 
 * the "Current Order" chart, allowing users to see the cost impact of different sorting strategies.
 *
 * <br><b>Operational Logic:</b>
 * <ol>
 * <li><b>Visibility Check:</b> The info element is hidden if no items exist or if the list 
 * remains in its default 'Creation Order', as no complex sorting logic is active.</li>
 * <li><b>String Mapping:</b> Translates internal state keys (e.g., `cod_rroe`) into 
 * localized, human-readable labels (e.g., 'Risk Reduction') defined in `config.uiStrings`.</li>
 * <li><b>State-Dependent Formatting:</b>
 * <ul>
 * <li><b>Locked State:</b> If the view is "Frozen", it prioritizes the "Locked" label, 
 * signaling that manual or automatic re-sorting is currently disabled.</li>
 * <li><b>Custom Sort:</b> Indicates manual drag-and-drop order is active.</li>
 * <li><b>Standard Sorting:</b> Combines the criteria and direction (e.g., "Sorted by: WSJF Score - Descending").</li>
 * </ul>
 * </li>
 * </ol>
 *
 * <br><b>Technical Detail:</b>
 * This targets the specific DOM element `#wsjf-legend-sort-info`. It is part of a 
 * trio of functions (`updateLegendSortInfo`, `updateCodLegendSortInfo`) that ensure 
 * each visualization panel has its own independent and accurate status report.
 *
 * @global
 * @requires pbis - The global data array.
 * @requires currentSortCriteria - The active sorting parameter.
 * @requires currentSortDirection - The active direction (ascending/descending).
 * @requires isFilterLocked - Flag indicating if the UI view is currently frozen.
 */
function updateWsjfLegendSortInfo() {
    var legendSortInfo = document.getElementById("wsjf-legend-sort-info");
    if (!legendSortInfo) return;

    var hasPbis = (pbis || []).some(function(p) { return p && !p.isLastItem; });

    if (hasPbis && currentSortCriteria !== 'creationOrder') {
        legendSortInfo.style.display = "";
        var uiStrings = config.uiStrings;
        var sortCriteriaText = "";

        switch (currentSortCriteria) {
            case "jobSize":     sortCriteriaText = uiStrings.filterJobSize; break;
            case "cod":         sortCriteriaText = uiStrings.filterCoD; break;
            case "wsjf":        sortCriteriaText = uiStrings.filterWSJF; break;
            case "tshirtSize":  sortCriteriaText = uiStrings.filterTshirtSize; break;
            case "custom":      sortCriteriaText = uiStrings.filterCustomSort; break;
            case "complexity":  sortCriteriaText = uiStrings.colComplexity; break;
            case "effort":      sortCriteriaText = uiStrings.colEffort; break;
            case "doubt":       sortCriteriaText = uiStrings.colDoubt; break;
            case "cod_bv":      sortCriteriaText = uiStrings.colBv; break;
            case "cod_tc":      sortCriteriaText = uiStrings.colTc; break;
            case "cod_rroe":    sortCriteriaText = uiStrings.colRrOe; break;
            case "lock":        sortCriteriaText = uiStrings.tooltipFilterLock; break;
            default:            sortCriteriaText = currentSortCriteria;
        }

        var sortDirectionText = currentSortDirection === "asc" ? uiStrings.sortOptionAsc : uiStrings.sortOptionDesc;

        if (isFilterLocked) {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + uiStrings.tooltipFilterLock;
        } else if (currentSortCriteria === 'lock') {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + uiStrings.tooltipFilterLock;
        } else if (currentSortCriteria === 'custom') {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + sortCriteriaText;
        } else {
             legendSortInfo.textContent = uiStrings.legendSortBy + ": " + sortCriteriaText + " - " + sortDirectionText;
        }
    } else {
        legendSortInfo.style.display = "none";
    }
}


/**
 * Synchronizes the layout alignment between fixed headers and scrollable content.
 * <br><b>Problem (Scrollbar Offset):</b>
 * When a vertical scrollbar appears in the `#relative-sizing-list`, it consumes horizontal space.
 * Without compensation, the fixed headers (which are outside the scroll container) would be 
 * misaligned with the table columns below them.
 *
 * <br><b>Technical Solution:</b>
 * <ol>
 * <li><b>Measurement:</b> Calculates the exact width of the browser's scrollbar by 
 * subtracting `clientWidth` (content area) from `offsetWidth` (total element width).</li>
 * <li><b>Dynamic CSS Variable:</b> Reads the `--right-gutter` variable from the root 
 * stylesheet to maintain consistent design spacing.</li>
 * <li><b>Calculation:</b> Constructs a CSS `calc()` value: 
 * `calc([Scrollbar Width] + [Gutter])`.</li>
 * <li><b>Injection:</b> Applies this calculated padding to:
 * <ul>
 * <li>The <b>Table Header:</b> Ensures the column labels stay over the data.</li>
 * <li>The <b>View Tabs:</b> Aligns the navigation buttons with the content area.</li>
 * <li>The <b>Reference Slot (Right):</b> Ensures the sticky Max-Reference item doesn't 
 * overlap or misalign with the table grid.</li>
 * </ul>
 * </li>
 * </ol>
 *
 * <br><b>Performance:</b>
 * This function is frequently called via `requestAnimationFrame` and during window resize 
 * events to ensure a frame-perfect layout at all times.
 *
 * @global
 */
function syncRelativeSizingHeaderPadding() {
    var header = document.getElementById('relative-sizing-header');
    var list   = document.getElementById('relative-sizing-list');
    var tabs   = document.getElementById('view-tabs');
    var rightSlot = document.getElementById('ref-slot-right');
    if (!list) { return; }

    var scrollbarWidth = list.offsetWidth - list.clientWidth;
    var rs = getComputedStyle(document.documentElement);
    var gutterPx = parseInt(rs.getPropertyValue('--right-gutter'), 10);
    var gutter = isNaN(gutterPx) ? 5 : gutterPx;
    var pr = 'calc(' + Math.max(0, scrollbarWidth) + 'px + ' + gutter + 'px)';

    if (header) { header.style.paddingRight = pr; }
    if (tabs)   { tabs.style.paddingRight   = pr; }

    if (rightSlot) {
        if (rightSlot.classList.contains('has-content')) {
            rightSlot.style.paddingRight = pr;
        } else {
            rightSlot.style.paddingRight = '';
        }
    }
}


/**
 * Ensures that reference items (Min/Max) are positioned at the very top of the visualization containers.
 * <br><b>Architecture (Visual Alignment):</b>
 * The application relies on a strict 1:1 horizontal alignment between the text list (left) 
 * and the visualizations (right). Since the sorting engine (`getSortedPbis`) pins references 
 * to the top of the data array, this function performs the final DOM manipulation to ensure 
 * the physical HTML elements match that logical order.
 *
 * <br><b>Logic Flow:</b>
 * <ol>
 * <li><b>Identification:</b> Retrieves the current 'min' and 'max' reference PBIs from the global state.</li>
 * <li><b>Targeting:</b> Iterates through both the main Bubble container and the CoD container.</li>
 * <li><b>DOM Reordering:</b> 
 * <ul>
 * <li>Locates the existing DOM node for the reference item via its `data-id`.</li>
 * <li>Applies visual classes (`reference-item`, `ref-min/max`) to ensure consistent styling.</li>
 * <li>If the item is not already the first child, it uses `insertBefore` to move the 
 * element to the top.</li>
 * </ul>
 * </li>
 * </ol>
 *
 * <br><b>Note on Ordering:</b>
 * The function processes 'max' first and then 'min'. Because both are inserted at the 
 * top (`firstElementChild`), the final rendered order results in 'min' being the 
 * absolute first element, followed by 'max', followed by the rest of the backlog.
 *
 * @global
 * @requires getReferencePbi - Utility to find reference objects in the PBI array.
 * @requires pbis - The global data source.
 */
function ensureReferenceFirstInVisualizations() {
    var refMin = getReferencePbi(pbis, 'min');
    var refMax = getReferencePbi(pbis, 'max');
    
    if (!refMin && !refMax) { return; }

    var containers = [
        document.getElementById('visualization-container'),
        document.getElementById('cod-visualization-container')
    ];

    var processRef = function(container, pbi, type) {
        if (!pbi) return;
        var refNode = container.querySelector('.story-visualization[data-id="' + pbi.id + '"]');
        if (!refNode) return;
        
        refNode.classList.add('reference-item');
        if (type === 'min') refNode.classList.add('ref-min');
        if (type === 'max') refNode.classList.add('ref-max');
        
        if (container.firstElementChild !== refNode) {
            container.insertBefore(refNode, container.firstElementChild);
        }
    };

    for (var c = 0; c < containers.length; c++) {
        var cont = containers[c];
        if (!cont) { continue; }
        processRef(cont, refMax, 'max');
        processRef(cont, refMin, 'min');
    }
}


/**
 * Updates the user interface of the CSV Export Modal to reflect selected sort settings.
 * <br><b>Role (Contextual UI Logic):</b>
 * Before generating a CSV, the user can choose a specific sort order. This function 
 * synchronizes the visual state of the modal's buttons and status labels with the internal 
 * `exportSortCriteria` and `exportSortDirection` variables.
 * * <br><b>Functional Workflow:</b>
 * <ol>
 * <li><b>Criteria Buttons:</b> Iterates through a mapping of criteria (Job Size, CoD, etc.) 
 * to DOM IDs, adding the `.active` class to the currently selected sorting method.</li>
 * <li><b>Directional Controls:</b> 
 * <ul>
 * <li>Highlights the Ascending or Descending button based on the selection.</li>
 * <li><b>Constraint:</b> If "Custom Sort" is selected, the Asc/Desc buttons are 
 * automatically disabled, as manual ordering does not follow mathematical directions.</li>
 * </ul>
 * </li>
 * <li><b>Dynamic Status Label:</b> 
 * <ul>
 * <li>Maps technical keys to localized UI strings (e.g., 'wsjf' -> 'WSJF Score').</li>
 * <li>Constructs a human-readable summary (e.g., "Sorted by: Job Size - Ascending") 
 * and injects it into the `#csv-export-sort-status` element for final confirmation.</li>
 * </ul>
 * </li>
 * </ol>
 * * <br><b>Design Patterns:</b>
 * The function uses a <b>State-to-UI mapping</b> pattern, ensuring that the interface is 
 * strictly a visual representation of the underlying export configuration.
 * * @global
 * @requires exportSortCriteria - The criteria selected for the upcoming CSV export.
 * @requires exportSortDirection - The direction (asc/desc) selected for the export.
 * @requires config.uiStrings - The localization object for labels and tooltips.
 */
function updateExportModalUI() {
    var criteriaBtns = {
        'jobSize': 'csv-sort-btn-job-size',
        'tshirtSize': 'csv-sort-btn-tshirt-size',
        'cod': 'csv-sort-btn-cod',
        'wsjf': 'csv-sort-btn-wsjf',
        'custom': 'csv-sort-custom-btn'
    };

    for (var crit in criteriaBtns) {
        var btn = document.getElementById(criteriaBtns[crit]);
        if (btn) {
            if (crit === exportSortCriteria) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }

    var ascBtn = document.getElementById('csv-sort-asc-btn');
    var descBtn = document.getElementById('csv-sort-desc-btn');
    
    if (ascBtn && descBtn) {
        ascBtn.classList.remove('active');
        descBtn.classList.remove('active');
        
        if (exportSortCriteria !== 'custom') {
            if (exportSortDirection === 'asc') ascBtn.classList.add('active');
            if (exportSortDirection === 'desc') descBtn.classList.add('active');
            ascBtn.disabled = false;
            descBtn.disabled = false;
        } else {
            ascBtn.disabled = true;
            descBtn.disabled = true;
        }
    }

    var statusEl = document.getElementById('csv-export-sort-status');
    if (statusEl && config.uiStrings) {
        var s = config.uiStrings;
        var critLabel = "";
        
        switch(exportSortCriteria) {
            case 'jobSize': critLabel = s.filterJobSize; break;
            case 'cod': critLabel = s.filterCoD; break;
            case 'wsjf': critLabel = s.filterWSJF; break;
            case 'tshirtSize': critLabel = s.filterTshirtSize; break;
            case 'custom': critLabel = s.filterCustomSort; break;
            default: critLabel = exportSortCriteria;
        }
        
        var dirLabel = (exportSortDirection === 'asc') ? s.sortOptionAsc : s.sortOptionDesc;
        var prefixLabel = s.legendSortBy || "Sorted by";
        var labelHtml = '<span class="csv-sort-label-prefix">' + prefixLabel + ':</span> ';
        
        var valueText = "";
        if (exportSortCriteria === 'custom') {
             valueText = critLabel; 
        } else {
             valueText = critLabel + " - " + dirLabel;
        }
        
        statusEl.innerHTML = labelHtml + valueText;
    }
}


/**
 * @ignore
 * CommonJS Module Export Definition (UI & Rendering Core).
 * <br><b>Architecture (View Engine):</b>
 * This module acts as the central view-engine for the application. It exposes functions 
 * ranging from low-level DOM manipulation to high-level render orchestration.
 * * <br><b>Logical Grouping of Exports:</b>
 * <ul>
 * <li><b>Orchestration:</b> `renderAll` - The master function that triggers the entire UI update cycle.</li>
 * * <li><b>I18n & Localization:</b> `applyUiStrings` - Injects localized text into the DOM.</li>
 * * <li><b>Data Transformation:</b> `getSortedPbis` - The algorithmic core for ordering data before display.</li>
 * * <li><b>View Components:</b> 
 * <ul>
 * <li>`renderPbiList`: The primary backlog list.</li>
 * <li>`renderAllVisualizations` / `renderCodVisualizations` / `renderWsjfVisualization`: Graphical charts.</li>
 * <li>`renderRelativeSizingList`: The technical grid view.</li>
 * </ul>
 * </li>
 * * <li><b>UI Synchronizers:</b>
 * <ul>
 * <li>`updateFilterButtonStates` / `updateActiveFilterButtonVisualState`: Manages button interactivity.</li>
 * <li>`updateGlobalVisibility`: Handles empty states.</li>
 * <li>`updateLegendSortInfo` (Main, CoD, WSJF): Updates contextual status labels.</li>
 * <li>`updateReferenceSlots` / `ensureReferenceFirstInVisualizations`: Manages sticky UI elements.</li>
 * </ul>
 * </li>
 * * <li><b>Layout & Utilities:</b> 
 * <ul>
 * <li>`syncRelativeSizingHeaderPadding`: Fixes scrollbar-related alignment issues.</li>
 * <li>`createChartStructure`: A factory for visualization containers.</li>
 * <li>`updateExportModalUI`: Manages specific modal states.</li>
 * </ul>
 * </li>
 * </ul>
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyUiStrings,
        getSortedPbis,
        updateFilterButtonStates,
        updateGlobalVisibility,
        updateRelativeSizingHeaders,
        updateActiveFilterButtonVisualState,
        updateSortDirectionButtons,
        updateLegendSortInfo,
        updateCodLegendSortInfo,
        updateWsjfLegendSortInfo,
        renderAll,
        renderPbiList,
        renderAllVisualizations,
        renderCodVisualizations,
        renderWsjfVisualization,
        createChartStructure,
        renderRelativeSizingList,
        updateReferenceSlots,
        ensureReferenceFirstInVisualizations,
        syncRelativeSizingHeaderPadding, 
        updateExportModalUI
    };
}