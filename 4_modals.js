// ===================================================================================
// 4_MODALS.JS
// ===================================================================================


/**
 * @file 4_MODALS.JS - The Dialog Controller & Data Entry Engine
 * @description
 * This file serves as the specialized controller for the application's modal system. 
 * It manages the complex data flow between the global state and the various overlay 
 * dialogs used for editing, configuration, and information display.
 * * 
 *
 * <br><b>Core Responsibilities:</b>
 * <ul>
 * <li><b>PBI Editor Lifecycle:</b> Handles opening, populating, and validating 
 * the main Edit Modal, ensuring that user inputs for metrics (Complexity, Effort, 
 * CoD) are synchronized with the data model.</li>
 * <li><b>Settings Management:</b> Manages the Settings Modal, allowing users 
 * to toggle application-wide preferences such as language, estimation scales, 
 * and visual markers.</li>
 * <li><b>Rich Text Integration:</b> Orchestrates the initialization and 
 * command-handling for the custom notes editor within the PBI details 
 * section.</li>
 * <li><b>Contextual Navigation:</b> Implements "Previous" and "Next" 
 * functionality within the editor to allow rapid batch-editing of backlog 
 * items without closing the dialog.</li>
 * <li><b>Validation & Safety:</b> Provides real-time feedback and confirmation 
 * prompts for destructive actions, such as resetting the application or 
 * deleting items.</li>
 * </ul>
 *
 * <br><b>Technical Approach:</b>
 * The module employs a <b>Dynamic Data-Binding</b> strategy, where DOM inputs 
 * are mapped to internal state variables on-the-fly, ensuring that the 
 * "Single Source of Truth" remains consistent even during complex multi-step 
 * edits.
 */


// ===================================================================================
// MODAL INITIALIZATION & LOGIC
// ===================================================================================


let isModalDirty = false;

/**
 * Retrieves the current "Dirty" state of the modal dialog.
 * <br><b>Concept (Data Safety):</b>
 * In UI terminology, a form is considered "dirty" if the user has modified any field (e.g., typed in a textarea, moved a slider) 
 * since the modal was opened or last saved.
 * <br><b>Use Case (Accidental Closure Protection):</b>
 * This accessor is typically called by the "Cancel" button or the background click handler. 
 * <ul>
 * <li><b>If true:</b> The application will interrupt the close action and show a "Discard Changes?" confirmation dialog.</li>
 * <li><b>If false:</b> The modal closes immediately, as there is no risk of data loss.</li>
 * </ul>
 *
 * @returns {boolean} <code>true</code> if there are unsaved changes, <code>false</code> otherwise.
 */
function getIsModalDirty() {
    return isModalDirty;
}


/**
 * Flags the currently open modal as having unsaved changes ("Dirty").
 * <br><b>Trigger Points:</b>
 * This function is attached to the `input`, `change`, or `click` events of every editable control inside the modal 
 * (sliders, text inputs, radio buttons).
 * <br><b>Side Effects (UX Feedback):</b>
 * Setting `isModalDirty = true` is not enough. The function immediately calls `updateModalNavButtons`.
 * <b>Why?</b> If a user has unsaved changes, the "Previous/Next Item" navigation buttons might need to change their behavior 
 * (e.g., become disabled or trigger a save prompt before switching) to prevent the user from accidentally navigating away and losing their work.
 */
function markModalAsDirty() {
    isModalDirty = true;
    if (currentEditingId) {
        updateModalNavButtons(currentEditingId);
    }
}


/**
 * Updates the interactive state of the "Reset CoD" button based on the current values of the inputs.
 * <br><b>UX Pattern (Layout Stability):</b>
 * Instead of hiding the button completely when it's not needed (which would cause the modal content to "jump" or shift layout, known as CLS),
 * this function simply toggles the <code>disabled</code> attribute.
 * <ul>
 * <li><b>Enabled:</b> If <i>any</i> of the three CoD sliders (BV, TC, RR/OE) has a value greater than 0. This allows the user to quickly clear their inputs.</li>
 * <li><b>Disabled:</b> If all sliders are at 0. The button remains visible but grayed out to indicate no action is possible.</li>
 * </ul>
 * <br><b>Layout Adjustment:</b>
 * It also dynamically adjusts the CSS class `no-margin` on the modal footer. This ensures consistent spacing specifically when the CoD tab is active, 
 * correcting for the visual presence of the reset button container.
 */
function updateResetCoDButtonVisibility() {
    const resetButton = document.querySelector('#reset-cod-btn');
    if (!resetButton) return;
    
    const resetButtonContainer = resetButton.parentElement;
    const codSliders = [
        document.getElementById('pbi-cod-bv'),
        document.getElementById('pbi-cod-tc'),
        document.getElementById('pbi-cod-rroe')
    ];

    if (!resetButtonContainer) {
        return;
    }

    const isAnyCoDValueSet = codSliders.some(function(slider) {
        return slider && parseInt(slider.value, 10) > 0;
    });
    
    resetButton.disabled = !isAnyCoDValueSet;
    resetButtonContainer.classList.remove('hidden');

    const footer = document.querySelector('#edit-modal .modal-footer');
    const tabContent = document.getElementById('tab-content-cod');

    if (footer && tabContent && !tabContent.classList.contains('hidden')) {
        footer.classList.add('no-margin');
    }
}


/**
 * Updates the state and text labels of the modal's navigation interface (Previous/Next buttons).
 * <br><b>Context-Sensitive Navigation:</b>
 * The definition of "Next Item" changes depending on the user's current view:
 * <ul>
 * <li><b>Standard View:</b> Follows the sorting order of the main list (e.g., sorted by Title or Custom Order).</li>
 * <li><b>WSJF View:</b> If the WSJF tab (`#panel-wsjf-viz`) is active, navigation follows the computed WSJF rank order (Rank 1 -> Rank 2 -> ...).</li>
 * </ul>
 * <br><b>UX Logic:</b>
 * 1. <b>List Filtering:</b> Filters out internal items (like spacers) to ensure smooth navigation.
 * 2. <b>Index Lookup:</b> Finds the position of the currently edited item within the context-aware list.
 * 3. <b>Button State:</b>
 * - Disables "Previous" if at the start of the list.
 * - Disables "Next" if at the end of the list.
 * 4. <b>Info Display:</b> Updates the counter (e.g., "Item 5 of 12") and injects special badges if the item is a Reference Anchor (Min/Max).
 * 5. <b>Label Reactivity (Dirty State):</b> If `isModalDirty` is true (unsaved changes), the button labels change from "Next Item" to "Save & Next".
 * This gives the user explicit feedback that navigating will automatically trigger a save operation.
 *
 * @param {string} currentId - The unique ID of the PBI currently being edited in the modal.
 */
function updateModalNavButtons(currentId) {
    var prevBtn = document.getElementById('modal-prev-btn');
    var nextBtn = document.getElementById('modal-next-btn');
    var infoSpan = document.getElementById('modal-nav-info');
    var prevLabel = document.getElementById('modal-prev-label');
    var nextLabel = document.getElementById('modal-next-label');
    
    if (!prevBtn || !nextBtn) return;

    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');
    
    if (typeof getSortedPbis !== 'function') return;

    var sortedPbis = getSortedPbis(pbis, currentSortCriteria, currentSortDirection, config, isWsjfTabActive);
    
    var navigableItems = sortedPbis.filter(function(p) { 
        return !p.isLastItem; 
    });

    var currentIndex = navigableItems.findIndex(function(p) { return p.id === currentId; });
    var currentPbi = navigableItems[currentIndex];

    if (currentIndex === -1) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        if (infoSpan) infoSpan.textContent = '';
        return;
    }

    prevBtn.disabled = (currentIndex <= 0);
    nextBtn.disabled = (currentIndex >= navigableItems.length - 1);

    if (infoSpan && config && config.uiStrings) {
        var tpl = config.uiStrings.navItemCount || "Item {current} of {total}";
        var baseText = tpl.replace('{current}', currentIndex + 1).replace('{total}', navigableItems.length);

        if (currentPbi && currentPbi.isReference) {
            var refLabel = "";
            var refClass = "";

            if (currentPbi.referenceType === 'min') {
                refLabel = config.uiStrings.navRefMin || "REFERENCE ITEM MIN";
                refClass = "ref-min";
            } else if (currentPbi.referenceType === 'max') {
                refLabel = config.uiStrings.navRefMax || "REFERENCE ITEM MAX";
                refClass = "ref-max";
            }

            if (refLabel) {
                infoSpan.innerHTML = baseText + '<span class="nav-separator"> - </span><span class="ref-nav-label ' + refClass + '">' + refLabel + '</span>';
            } else {
                infoSpan.textContent = baseText;
            }
        } else {
            infoSpan.textContent = baseText;
        }
    }

    var s = config.uiStrings;
    if (prevLabel) {
        prevLabel.textContent = isModalDirty 
            ? (s.navPrevItemSave || "Save & Previous") 
            : (s.navPrevItem || "Previous Item");
    }
    if (nextLabel) {
        nextLabel.textContent = isModalDirty 
            ? (s.navNextItemSave || "Save & Next") 
            : (s.navNextItem || "Next Item");
    }
}


/**
 * Updates the visibility, target, and positioning of the help icons next to scale labels.
 * * <br><b>Logic:</b>
 * Implements a "Cascade of Availability" to determine how to render the help icon:
 * <ol>
 * <li><b>Priority 1 (External Link):</b> Checks `config.scaleHelpUrls`. If a URL exists for the current language (or English fallback), the icon becomes a clickable link (`<a href>`).</li>
 * <li><b>Priority 2 (Tooltip):</b> If no URL is found, checks `config.uiStrings` for a matching help text key. If found, the icon becomes a hover-trigger for an HTML tooltip.</li>
 * <li><b>Priority 3 (Hidden):</b> If neither a URL nor a tooltip text exists, the icon is hidden (`display: none`).</li>
 * </ol>
 * * <br><b>Interaction Update:</b>
 * The tooltip now opens either on <b>click</b> OR after hovering for <b>500ms</b>. It no longer opens immediately on hover via CSS.
 * * <br><b>DOM Manipulation & Visuals:</b>
 * To support the advanced CSS tooltip structure, this function performs several dynamic DOM operations:
 * <ul>
 * <li><b>Wrapper Generation:</b> Wraps the icon in a `div.help-icon-wrapper`. This wrapper handles the `z-index` stacking context.</li>
 * <li><b>Positioning Fixes:</b> Applies specific classes (`pos-top`, `pos-bottom`) based on list position.</li>
 * <li><b>Timer Logic:</b> Uses JS timeouts to handle the 500ms delay requirement.</li>
 * <li><b>State Cleanup:</b> Safely unwraps and resets elements before re-rendering.</li>
 * </ul>
 */
function updateHelpIcons() {
    if (!config) return;

    var backdrop = document.getElementById('tooltip-backdrop');

    var mapping = [
        { key: 'complexity', id: 'help-icon-complexity', langKey: 'scaleHelp_complexity', pos: 'pos-top' },
        { key: 'effort', id: 'help-icon-effort', langKey: 'scaleHelp_effort', pos: '' },
        { key: 'doubt', id: 'help-icon-doubt', langKey: 'scaleHelp_doubt', pos: 'pos-bottom' },
        
        { key: 'cod_bv', id: 'help-icon-cod_bv', langKey: 'scaleHelp_cod_bv', pos: 'pos-top' },
        { key: 'cod_tc', id: 'help-icon-cod_tc', langKey: 'scaleHelp_cod_tc', pos: '' },
        { key: 'cod_rroe', id: 'help-icon-cod_rroe', langKey: 'scaleHelp_cod_rroe', pos: 'pos-bottom' }
    ];

    mapping.forEach(function(item) {
        var iconElement = document.getElementById(item.id);
        if (!iconElement) return;

        var configEntry = config.scaleHelpUrls ? config.scaleHelpUrls[item.key] : null;
        var url = "";

        if (typeof configEntry === 'object' && configEntry !== null) {
            if (configEntry[currentLanguage]) {
                url = configEntry[currentLanguage];
            } else if (configEntry['en']) {
                url = configEntry['en'];
            }
        } else if (typeof configEntry === 'string') {
            url = configEntry;
        }

        var tooltipHtml = "";
        if (!url || url.trim() === "") {
             if (config.uiStrings && config.uiStrings[item.langKey]) {
                tooltipHtml = config.uiStrings[item.langKey];
            }
        }

        // Cleanup: Remove existing wrappers from previous renders
        var parent = iconElement.parentNode;
        if (parent && parent.classList.contains('help-icon-wrapper')) {
            var newParent = parent.cloneNode(true); 
            parent.parentNode.replaceChild(newParent, parent); 
            parent = newParent; 
            parent.parentNode.insertBefore(iconElement, parent); 
            parent.parentNode.removeChild(parent); 
        }

        // Reset icon properties
        iconElement.removeAttribute('href');
        iconElement.removeAttribute('target');
        iconElement.style.cursor = ''; 
        iconElement.onclick = null; 
        
        if (url && url.trim() !== "") {
            // Case 1: External Link
            iconElement.style.display = "inline-block";
            iconElement.href = url;
            iconElement.target = "_blank";
            
            // CHANGED: Set cursor to 'help' instead of 'pointer' for consistency
            iconElement.style.cursor = "help"; 

            var wrapper = document.createElement('div');
            wrapper.className = 'help-icon-wrapper';
            
            if (item.pos) {
                wrapper.classList.add(item.pos);
            }
            
            iconElement.parentNode.insertBefore(wrapper, iconElement);
            wrapper.appendChild(iconElement);
        } 
        else if (tooltipHtml && tooltipHtml.trim() !== "") {
            // Case 2: Tooltip
            iconElement.style.display = "inline-block";
            iconElement.style.cursor = "help"; 
            
            var wrapper = document.createElement('div');
            wrapper.className = 'help-icon-wrapper';
            
            if (item.pos) {
                wrapper.classList.add(item.pos);
            }
            
            iconElement.parentNode.insertBefore(wrapper, iconElement);
            wrapper.appendChild(iconElement);
            
            var tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'custom-tooltip';
            tooltipDiv.innerHTML = tooltipHtml;
            wrapper.appendChild(tooltipDiv);

            var hoverTimer = null;

            var showTooltip = function() {
                tooltipDiv.classList.add('is-visible');
                if (backdrop) backdrop.classList.add('active');
            };

            var hideTooltip = function() {
                tooltipDiv.classList.remove('is-visible');
                if (backdrop) backdrop.classList.remove('active');
            };

            wrapper.addEventListener('mouseenter', function() {
                hoverTimer = setTimeout(function() {
                    showTooltip();
                }, 500);
            });

            wrapper.addEventListener('mouseleave', function() {
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
                hideTooltip();
            });

            wrapper.addEventListener('click', function(e) {
                if (hoverTimer) clearTimeout(hoverTimer);
                showTooltip();
            });
        } 
        else {
            // Case 3: No help available
            iconElement.style.display = "none";
        }
    });
}


/**
 * Opens the main Edit Modal for a specific PBI or creates a new one.
 * <br><b>Initialization Flow:</b>
 * 1. <b>Reset:</b> Clears all previous validation states and error messages.
 * 2. <b>Mode Detection:</b>
 * - If \`pbi\` is provided: Updates \`currentEditingId\` and populates fields (Edit Mode).
 * - If \`pbi\` is null: Sets \`currentEditingId\` to null and clears fields (Create Mode).
 * 3. <b>Data Binding:</b> Maps the PBI's values (0-10) to the input sliders and updates the output numbers.
 * 4. <b>Rich Text:</b> Initializes the notes editor with the stored HTML.
 * 5. <b>Navigation:</b> Updates the "Prev/Next" buttons based on the item's position in the list.
 * 6. <b>Help Icons:</b> Calls \`updateHelpIcons\` to show/hide documentation links based on config.
 *
 * @param {Object|null} pbi - The Backlog Item object to edit, or \`null\` to create a new one.
 * @param {Object} [options] - Optional settings (e.g., \`{ defaultTab: 'cod' }\` to open specific tab).
 */
function showModal(pbi, options) {
    var modal = document.getElementById("edit-modal");
    var titleInput = document.getElementById("pbi-title");
    var modalTitle = document.getElementById("modal-title");
    var complexityInput = document.getElementById("pbi-complexity");
    var effortInput = document.getElementById("pbi-effort");
    var doubtInput = document.getElementById("pbi-doubt");
    var codBvInput = document.getElementById("pbi-cod-bv");
    var codTcInput = document.getElementById("pbi-cod-tc");
    var codRroeInput = document.getElementById("pbi-cod-rroe");
    var notesDiv = document.getElementById("pbi-notes");
    var tshirtDisplay = document.getElementById("modal-tshirt-display");

    if (typeof isModalDirty !== 'undefined') {
        isModalDirty = false; 
    }

    if (typeof syncSliderMax === 'function') syncSliderMax();
    if (typeof generateSliderScales === 'function') generateSliderScales();

    if (pbi) {
        currentEditingId = pbi.id;
        
        if (modalTitle) modalTitle.textContent = (config.uiStrings && config.uiStrings.modalTitleEdit) ? config.uiStrings.modalTitleEdit : "Edit PBI";
        
        titleInput.value = pbi.title || "";
        
        var useFib = (currentScale === 'fibonacci' || currentScale === 'safe');
        var sourceVals = useFib ? (pbi.fibonacciValues || {}) : (pbi.arithmeticValues || {});
        
        complexityInput.value = (sourceVals.complexity !== undefined) ? sourceVals.complexity : (pbi.complexity || "0");
        effortInput.value = (sourceVals.effort !== undefined) ? sourceVals.effort : (pbi.effort || "0");
        doubtInput.value = (sourceVals.doubt !== undefined) ? sourceVals.doubt : (pbi.doubt || "0");
        
        codBvInput.value = (sourceVals.cod_bv !== undefined) ? sourceVals.cod_bv : (pbi.cod_bv || "0");
        codTcInput.value = (sourceVals.cod_tc !== undefined) ? sourceVals.cod_tc : (pbi.cod_tc || "0");
        codRroeInput.value = (sourceVals.cod_rroe !== undefined) ? sourceVals.cod_rroe : (pbi.cod_rroe || "0");
        
        if (notesDiv) {
            notesDiv.innerHTML = pbi.notes || "";
        }

        if (tshirtDisplay) {
            if (pbi.tshirtSize) {
                var label = tshirtDisplay.querySelector('.modal-tag-label');
                var val = tshirtDisplay.querySelector('.modal-tag-value');
                var labelText = (config.uiStrings && config.uiStrings.pbiInfoTshirtSize) ? config.uiStrings.pbiInfoTshirtSize : "Size";
                if(label) label.textContent = labelText + ":";
                if(val) val.textContent = pbi.tshirtSize;
                tshirtDisplay.style.display = "inline-flex";
            } else {
                tshirtDisplay.style.display = "none";
            }
        }
        
    } else {
        currentEditingId = null;
        
        if (modalTitle) modalTitle.textContent = (config.uiStrings && config.uiStrings.modalTitleNew) ? config.uiStrings.modalTitleNew : "New PBI";

        titleInput.value = "";
        complexityInput.value = "0";
        effortInput.value = "0";
        doubtInput.value = "0";
        codBvInput.value = "0";
        codTcInput.value = "0";
        codRroeInput.value = "0";
        if (notesDiv) notesDiv.innerHTML = "";
        
        if (tshirtDisplay) {
            tshirtDisplay.style.display = "none";
        }
    }

    [complexityInput, effortInput, doubtInput, codBvInput, codTcInput, codRroeInput].forEach(function(el) {
        if (el) {
            el.dataset.interacted = (el.value !== "0") ? "true" : "false";
            el.dataset.zeroLocked = (el.value !== "0") ? "true" : "false";
            if (typeof updateSliderFill === 'function') updateSliderFill(el);
            if (typeof updateActiveScaleValue === 'function') updateActiveScaleValue(el);
        }
    });

    if (typeof updateAllSliderFills === 'function') updateAllSliderFills();

    if (typeof updateSliderValues === 'function') updateSliderValues();
    if (typeof validateAndSyncModal === 'function') validateAndSyncModal();
    if (typeof updateModalNavButtons === 'function') updateModalNavButtons(currentEditingId);
    
    if (typeof updateResetJobSizeButtonVisibility === 'function') updateResetJobSizeButtonVisibility();
    if (typeof updateResetCoDButtonVisibility === 'function') updateResetCoDButtonVisibility();

    if (typeof updateRefMarkerButtonState === 'function') updateRefMarkerButtonState();

    updateHelpIcons();

    var tabJobSize = document.getElementById("tab-btn-jobsize");
    var tabCoD = document.getElementById("tab-btn-cod");
    var contentJobSize = document.getElementById("tab-content-jobsize");
    var contentCoD = document.getElementById("tab-content-cod");

    if (options && options.defaultTab === 'cod') {
        if (tabCoD) tabCoD.classList.add("active");
        if (tabJobSize) tabJobSize.classList.remove("active");
        if (contentCoD) contentCoD.classList.remove("hidden");
        if (contentJobSize) contentJobSize.classList.add("hidden");
    } else {
        if (tabJobSize) tabJobSize.classList.add("active");
        if (tabCoD) tabCoD.classList.remove("active");
        if (contentJobSize) contentJobSize.classList.remove("hidden");
        if (contentCoD) contentCoD.classList.add("hidden");
    }

    modal.style.display = "flex";
    titleInput.focus();
}


/**
 * Prepares and displays the global application settings modal.
 * <br><b>Purpose:</b>
 * Before showing the modal, this function ensures that every form control (radio button, checkbox, color picker) 
 * accurately reflects the current internal state of the application (`config` object and global variables).
 * <br><b>Initialization Logic:</b>
 * 1. <b>Language & Scale:</b> Iterates through radio groups to check the active `currentLanguage` and `currentScale`.
 * 2. <b>T-Shirt Sizes (Dynamic Rendering):</b> 
 * - Clears the previous list.
 * - <b>Sorting:</b> Uses a `correctOrderMap` to enforce a logical clothing size order (XXS -> XXL) instead of alphabetical sorting. Unknown sizes are pushed to the end.
 * - <b>Generation:</b> Dynamically builds checkboxes based on `config.allTshirtSizes` and checks them if they are active in `config.tshirtSizes`.
 * 3. <b>Color Configuration:</b> 
 * - <b>Visualization Colors:</b> Populates inputs for the Bubble Cluster (Complexity, Effort, Doubt) and WSJF charts (BV, TC, RR/OE).
 * - <b>Editor Colors:</b> Populates the 4 highlight colors used in the rich-text editor, falling back to defaults if undefined.
 * 4. <b>Feature Toggles:</b> 
 * - Syncs the "Reference Markers" checkbox with `window.showReferenceMarkers`.
 * - Syncs the "Resolution Warning" checkbox (Inverted logic: Checked means the warning is <i>not</i> dismissed).
 */
function openSettingsModal() {
    document.querySelectorAll('input[name="language-setting"]').forEach(radio => {
        radio.checked = radio.value === currentLanguage;
    });

    const tshirtOptionsContainer = document.getElementById('tshirt-sizes-options');
    tshirtOptionsContainer.innerHTML = '';

    const correctOrderMap = { "XXS": 1, "XS": 2, "S": 3, "M": 4, "L": 5, "XL": 6, "XXL": 7 };
    const sortedSizes = config.allTshirtSizes.slice().sort((a, b) => {
        const orderA = correctOrderMap[a] || 99;
        const orderB = correctOrderMap[b] || 99;
        return orderA - orderB;
    });

    sortedSizes.forEach(size => {
        const isChecked = config.tshirtSizes.includes(size);
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tshirt-size-setting';
        checkbox.value = size;
        checkbox.checked = isChecked;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + size));
        tshirtOptionsContainer.appendChild(label);
    });

    document.querySelectorAll('input[name="scale-setting"]').forEach(radio => {
        radio.checked = radio.value === currentScale;
    });

    document.getElementById('color-complexity-setting').value = config.colors.complexity;
    document.getElementById('color-effort-setting').value = config.colors.effort;
    document.getElementById('color-doubt-setting').value = config.colors.doubt;
    document.getElementById('color-total-setting').value = config.colors.total;
    document.getElementById('color-number-complexity-setting').value = config.colors.numberComplexity;
    document.getElementById('color-number-effort-setting').value = config.colors.numberEffort;
    document.getElementById('color-number-doubt-setting').value = config.colors.numberDoubt;
    document.getElementById('color-bv-setting').value = config.colors.bv;
    document.getElementById('color-tc-setting').value = config.colors.tc;
    document.getElementById('color-rroe-setting').value = config.colors.rroe;
    document.getElementById('color-number-bv-setting').value = config.colors.numberBv;
    document.getElementById('color-number-tc-setting').value = config.colors.numberTc;
    document.getElementById('color-number-rroe-setting').value = config.colors.numberRrOe;

    var ec = config.editorColors || config.defaultEditorColors || { "1": "#279745", "2": "#2560d1", "3": "#937404", "4": "#c90000" };
    
    var inpC1 = document.getElementById('setting-editor-c1');
    var inpC2 = document.getElementById('setting-editor-c2');
    var inpC3 = document.getElementById('setting-editor-c3');
    var inpC4 = document.getElementById('setting-editor-c4');

    if(inpC1) inpC1.value = ec["1"];
    if(inpC2) inpC2.value = ec["2"];
    if(inpC3) inpC3.value = ec["3"];
    if(inpC4) inpC4.value = ec["4"];

    var refMarkerCheckbox = document.getElementById('setting-show-ref-markers');
    if (refMarkerCheckbox && typeof window !== 'undefined') {
        refMarkerCheckbox.checked = window.showReferenceMarkers;
    }

    var resWarningCheckbox = document.getElementById('setting-show-res-warning');
    if (resWarningCheckbox && typeof window !== 'undefined') {
        resWarningCheckbox.checked = !window.isResolutionWarningDismissed;
    }

    document.getElementById('settings-modal').style.display = 'flex';
}


/**
 * Restores all user-configurable settings in the Settings Modal to their factory defaults.
 * <br><b>Scope of Reset:</b>
 * This function affects multiple distinct configuration areas simultaneously:
 * <ul>
 * <li><b>Visualization Colors:</b> Resets all color pickers (Complexity, Effort, Doubt, WSJF metrics) to the values defined in `config.defaultColors`.</li>
 * <li><b>Application Preferences:</b> Restores default Language (e.g., English) and Estimation Scale (e.g., Fibonacci).</li>
 * <li><b>T-Shirt Sizes:</b> Checks/unchecks boxes to match the standard set (e.g., S, M, L, XL) defined in `config.defaultSettings.tshirtSizes`.</li>
 * <li><b>Rich Text Editor:</b> Resets the 4 custom highlight colors for the Quill editor back to the default palette (Green, Blue, Gold, Red).</li>
 * <li><b>Feature Toggles:</b>
 * <ul>
 * <li>Reference Markers: Re-enables visual indicators for reference items (default: true).</li>
 * <li>Resolution Warning: Re-enables the screen size warning (checking the box implies "Yes, show me warnings", effectively clearing the dismissed flag).</li>
 * </ul>
 * </li>
 * </ul>
 * <br><b>UX Note:</b>
 * This function only updates the <i>UI state</i> (the inputs in the modal). It does not immediately save these values to `localStorage` or apply them to the live application.
 * The user must still click the "Save" button in the modal to confirm the reset.
 */
function resetSettingsToDefault() {
    document.getElementById('color-complexity-setting').value = config.defaultColors.complexity;
    document.getElementById('color-effort-setting').value = config.defaultColors.effort;
    document.getElementById('color-doubt-setting').value = config.defaultColors.doubt;
    document.getElementById('color-total-setting').value = config.defaultColors.total;
    document.getElementById('color-number-complexity-setting').value = config.defaultColors.numberComplexity;
    document.getElementById('color-number-effort-setting').value = config.defaultColors.numberEffort;
    document.getElementById('color-number-doubt-setting').value = config.defaultColors.numberDoubt;
    document.getElementById('color-bv-setting').value = config.defaultColors.bv;
    document.getElementById('color-tc-setting').value = config.defaultColors.tc;
    document.getElementById('color-rroe-setting').value = config.defaultColors.rroe;
    document.getElementById('color-number-bv-setting').value = config.defaultColors.numberBv;
    document.getElementById('color-number-tc-setting').value = config.defaultColors.numberTc;
    document.getElementById('color-number-rroe-setting').value = config.defaultColors.numberRrOe;

    document.querySelector('input[name="language-setting"][value="' + config.defaultSettings.language + '"]').checked = true;
    document.querySelector('input[name="scale-setting"][value="' + config.defaultSettings.scale + '"]').checked = true;

    const defaultTshirts = config.defaultSettings.tshirtSizes;
    document.querySelectorAll('input[name="tshirt-size-setting"]').forEach(function(checkbox) {
        checkbox.checked = defaultTshirts.indexOf(checkbox.value) !== -1;
    });

    var dec = config.defaultEditorColors || { "1": "#279745", "2": "#2560d1", "3": "#937404", "4": "#c90000" };
    var inpC1 = document.getElementById('setting-editor-c1');
    var inpC2 = document.getElementById('setting-editor-c2');
    var inpC3 = document.getElementById('setting-editor-c3');
    var inpC4 = document.getElementById('setting-editor-c4');
    
    if(inpC1) inpC1.value = dec["1"];
    if(inpC2) inpC2.value = dec["2"];
    if(inpC3) inpC3.value = dec["3"];
    if(inpC4) inpC4.value = dec["4"];

    var refMarkerCheckbox = document.getElementById('setting-show-ref-markers');
    if (refMarkerCheckbox) {
        var defaultState = (config.defaultSettings.showReferenceMarkers !== false);
        refMarkerCheckbox.checked = defaultState;
    }

    var resWarningCheckbox = document.getElementById('setting-show-res-warning');
    if (resWarningCheckbox) {
        resWarningCheckbox.checked = true;
    }
}


/**
 * Persists changes made in the Settings Modal and performs necessary data migrations.
 * <br><b>Complexity: High</b> - This function handles the global state transition for the entire application.
 *
 * <br><b>Key Operations:</b>
 * <ol>
 * <li><b>T-Shirt Size Validation:</b> Ensures at least one size is selected. If the user unchecks all, it reverts to the default set.</li>
 *
 * <li><b>Scale Migration Strategy (Data Quantization):</b>
 * If the estimation scale changes (e.g., from Linear 1-10 to Fibonacci):
 * <ul>
 * <li><b>Snapshotting:</b> Caches the current values into `arithmeticValues` or `fibonacciValues` to preserve precision if the user switches back later.</li>
 * <li><b>Snapping:</b> Uses `getNextHigherValue` to force existing values to align with the new scale's grid.
 * <i>Example:</i> A value of "4" in Linear becomes "5" in Fibonacci. This acts like a step function.
 * 
 * </li>
 * <li><b>Recalculation:</b> Automatically sums up `jobSize` (Complexity + Effort + Doubt) and `cod` based on the new snapped values.</li>
 * </ul>
 * </li>
 *
 * <li><b>Language Switching:</b> Swaps the `config.uiStrings` pointer and triggers a UI refresh.</li>
 *
 * <li><b>Editor Color Refactoring (Global Find & Replace):</b>
 * If the user changes one of the 4 highlighter colors for the rich-text editor:
 * <ul>
 * <li>It detects the change by comparing `oldColors` vs `newColors`.</li>
 * <li>It creates a Regex based on the OLD hex code.</li>
 * <li>It iterates through <b>every PBI's notes</b> and replaces the old hex string with the new one. This ensures that previously highlighted text updates its color dynamically.</li>
 * </ul>
 * </li>
 * </ol>
 *
 * <br><b>Finalization:</b>
 * Applies CSS variables (`applyColorSettings`), saves the new state to LocalStorage, and forces a full re-render (`renderAll`).
 */
function saveAndCloseSettings() {
    const selectedTshirtSizes = [];
    document.querySelectorAll('input[name="tshirt-size-setting"]:checked').forEach(function(checkbox) {
        selectedTshirtSizes.push(checkbox.value);
    });
    if (selectedTshirtSizes.length > 0) {
        config.tshirtSizes = selectedTshirtSizes;
    } else {
        config.tshirtSizes = config.defaultSettings.tshirtSizes;
    }

    const oldScale = currentScale;
    const newScale = document.querySelector('input[name="scale-setting"]:checked').value;
    
    if (oldScale !== newScale) {
        const newScaleValues = SCALES[newScale].values;
        const propertiesToUpdate = ['complexity', 'effort', 'doubt', 'cod_bv', 'cod_tc', 'cod_rroe'];
        
        const getNextHigherValue = function(val, scaleVals) {
            if (val === 0) return 0;
            if (scaleVals.includes(val)) return val;
            const nextVal = scaleVals.find(v => v >= val);
            return nextVal !== undefined ? nextVal : scaleVals[scaleVals.length - 1];
        };

        pbis.forEach(function(pbi) {
            if (!pbi.arithmeticValues) pbi.arithmeticValues = {};
            if (!pbi.fibonacciValues) pbi.fibonacciValues = {};

            if (newScale === 'fibonacci' || newScale === 'safe') {
                propertiesToUpdate.forEach(function(prop) {
                     pbi.arithmeticValues[prop] = pbi[prop];
                });

                propertiesToUpdate.forEach(function(prop) {
                    const currentVal = pbi[prop];
                    const newVal = getNextHigherValue(currentVal, newScaleValues);
                    pbi[prop] = newVal;
                    pbi.fibonacciValues[prop] = newVal;
                });
            }
            else if (newScale === 'metric' || newScale === 'arithmetic') { 
                 propertiesToUpdate.forEach(function(prop) {
                     pbi.fibonacciValues[prop] = pbi[prop];
                 });

                 propertiesToUpdate.forEach(function(prop) {
                     if (pbi.arithmeticValues && pbi.arithmeticValues[prop] !== undefined) {
                         pbi[prop] = pbi.arithmeticValues[prop];
                     } else {
                         pbi.arithmeticValues[prop] = pbi[prop];
                     }
                 });
            }
            else {
                 propertiesToUpdate.forEach(function(prop) {
                    const currentVal = pbi[prop];
                    if (typeof currentVal === 'number' && newScaleValues.indexOf(currentVal) === -1) {
                         pbi[prop] = getNextHigherValue(currentVal, newScaleValues);
                    }
                 });
            }

            if (pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0) {
                 pbi.jobSize = pbi.complexity + pbi.effort + pbi.doubt;
            } else {
                pbi.jobSize = null;
            }

            if (pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0) {
                pbi.cod = pbi.cod_bv + pbi.cod_tc + pbi.cod_rroe;
            } else {
                pbi.cod = null;
            }
            
            if (typeof window.getTshirtSizeFromValue === 'function' && typeof SCALES[newScale].values[0] === 'number') {
                 pbi.tshirtSize = pbi.jobSize ? window.getTshirtSizeFromValue(pbi.jobSize) : null;
            }
        });
    }

    const selectedLanguage = document.querySelector('input[name="language-setting"]:checked').value;
    if (currentLanguage !== selectedLanguage) {
        currentLanguage = selectedLanguage;
        config.uiStrings = config.languages[currentLanguage];
        const notificationContainer = document.getElementById('update-notification-container');
        if (notificationContainer) {
            notificationContainer.innerHTML = '';
        }
        checkForUpdates();
    }

    config.colors.complexity = document.getElementById('color-complexity-setting').value;
    config.colors.effort = document.getElementById('color-effort-setting').value;
    config.colors.doubt = document.getElementById('color-doubt-setting').value;
    config.colors.total = document.getElementById('color-total-setting').value;
    config.colors.numberComplexity = document.getElementById('color-number-complexity-setting').value;
    config.colors.numberEffort = document.getElementById('color-number-effort-setting').value;
    config.colors.numberDoubt = document.getElementById('color-number-doubt-setting').value;
    config.colors.bv = document.getElementById('color-bv-setting').value;
    config.colors.tc = document.getElementById('color-tc-setting').value;
    config.colors.rroe = document.getElementById('color-rroe-setting').value;
    config.colors.numberBv = document.getElementById('color-number-bv-setting').value;
    config.colors.numberTc = document.getElementById('color-number-tc-setting').value;
    config.colors.numberRrOe = document.getElementById('color-number-rroe-setting').value;

    if (!config.editorColors) config.editorColors = {};
    
    var inputIds = { "1": 'setting-editor-c1', "2": 'setting-editor-c2', "3": 'setting-editor-c3', "4": 'setting-editor-c4' };
    var oldColors = Object.assign({}, config.editorColors);
    var newColors = {};

    for (var key in inputIds) {
        var el = document.getElementById(inputIds[key]);
        if (el) newColors[key] = el.value;
        else newColors[key] = oldColors[key];
    }

    for (var key in newColors) {
        var oldC = oldColors[key];
        var newC = newColors[key];

        if (oldC && newC && oldC.toLowerCase() !== newC.toLowerCase()) {
            pbis.forEach(function(pbi) {
                if (pbi.notes) {
                    var re = new RegExp(oldC, 'gi');
                    pbi.notes = pbi.notes.replace(re, newC);
                }
            });
        }
        config.editorColors[key] = newC;
    }

    var refMarkerCheckbox = document.getElementById('setting-show-ref-markers');
    if (refMarkerCheckbox && typeof window !== 'undefined') {
        window.showReferenceMarkers = refMarkerCheckbox.checked;
    }

    var resWarningCheckbox = document.getElementById('setting-show-res-warning');
    if (resWarningCheckbox && typeof window !== 'undefined') {
        window.isResolutionWarningDismissed = !resWarningCheckbox.checked;
        if (typeof checkScreenResolution === 'function') {
            checkScreenResolution();
        }
    }

    applyColorSettings(config.colors);

    currentScale = newScale;
    document.getElementById('settings-modal').style.display = 'none';
    syncSliderMax();
    generateSliderScales(); 
    applyUiStrings();
    
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();

    renderAll();
}


/**
 * Pure Business Logic: Validates user inputs and calculates derived metrics (Job Size, CoD, WSJF).
 * <br><b>Architecture (Separation of Concerns):</b>
 * This function decouples the <i>calculation rules</i> from the <i>DOM manipulation</i>.
 * It takes raw values as input and returns a state object. This makes the logic unit-testable without requiring a browser environment (JSDOM).
 *
 * <br><b>Validation Rules:</b>
 * <ul>
 * <li><b>Saveability:</b> The only hard requirement to enable the "Save" button is a non-empty <b>Title</b> (`isSaveDisabled`). Incomplete estimates do <i>not</i> block saving (allowing drafts).</li>
 * <li><b>Job Size Completion:</b> Requires Complexity, Effort, and Doubt to all be > 0.</li>
 * <li><b>CoD Completion:</b> Requires BV, TC, and RR/OE to all be > 0.</li>
 * </ul>
 *
 * <br><b>Calculation Logic (WSJF):</b>
 * Weighted Shortest Job First is calculated only if both the Numerator (CoD) and Denominator (Job Size) are fully estimated.
 * <br><b>Formatting:</b>
 * The function includes specific string manipulation for the WSJF score:
 * <ul>
 * <li>Truncates trailing zeros (e.g., `5.50` -> `5.5`, `4.00` -> `4`).</li>
 * <li>Replaces decimal dots with commas for European locale consistency (`.` -> `,`).</li>
 * </ul>
 *
 * @param {Object} inputs - The raw form values (title, slider numbers, localization strings).
 * @returns {Object} A state object containing boolean flags (e.g., `isSaveDisabled`), status messages (`jobsizeHintText`), and calculated values.
 */
function validateAndSyncModalLogic(inputs) {
    var title = inputs.title;
    var complexityVal = inputs.complexityVal;
    var effortVal = inputs.effortVal;
    var doubtVal = inputs.doubtVal;
    var codBvVal = inputs.codBvVal;
    var codTcVal = inputs.codTcVal;
    var codRroeVal = inputs.codRroeVal;
    var uiStrings = inputs.uiStrings;

    var hasTitle = title.trim() !== '';
    var isJobsizeComplete = complexityVal > 0 && effortVal > 0 && doubtVal > 0;
    var jobSize = isJobsizeComplete ? (complexityVal + effortVal + doubtVal) : null;

    var jobsizeHintText = uiStrings.jobsizeHint;
    var jobsizeHintIsComplete = false;
    if (isJobsizeComplete) {
        jobsizeHintText = uiStrings.jobsizeHintComplete.replace('{jobSize}', jobSize);
        jobsizeHintIsComplete = true;
    }

    var isSaveDisabled = !hasTitle;
    var isCoDComplete = codBvVal > 0 && codTcVal > 0 && codRroeVal > 0;
    var codTotal = isCoDComplete ? (codBvVal + codTcVal + codRroeVal) : null;

    var codHintText = uiStrings.codHint;
    var codHintIsComplete = false;
    if (isCoDComplete) {
        codHintText = uiStrings.codHintComplete.replace('{codSize}', codTotal);
        codHintIsComplete = true;
    }

    var wsjfValue = null;
    if (isCoDComplete && jobSize !== null && jobSize > 0 && codTotal !== null) {
        var score = (codTotal / jobSize).toFixed(2);
        if (score.endsWith('.00')) {
            score = score.slice(0, -3);
        } else if (score.endsWith('0')) {
            score = score.slice(0, -1);
        }
        wsjfValue = score.replace('.', ',');
    }

    return {
        isSaveDisabled: isSaveDisabled,
        jobsizeHintText: jobsizeHintText,
        jobsizeHintIsComplete: jobsizeHintIsComplete,
        codHintText: codHintText,
        codHintIsComplete: codHintIsComplete,
        wsjfValue: wsjfValue,
        jobSizeTotal: jobSize,
        codTotal: codTotal
    };
}


/**
 * UI Controller: Synchronizes the modal's visual state with the underlying data model.
 * <br><b>Role (The Bridge):</b>
 * Unlike `validateAndSyncModalLogic` (which is pure math), this function deals with the dirty reality of the DOM.
 * It reads the raw HTML input values, converts them into meaningful numbers, and updates the visibility/content of hints, buttons, and totals.
 *
 * <br><b>Scale Abstraction (`getSliderValue`):</b>
 * The slider inputs always return a simple integer step (0, 1, 2, 3...).
 * This function translates that step into the actual estimation value based on the `currentScale`:
 * <ul>
 * <li><b>Numeric Scale:</b> Step 5 = Value 5.</li>
 * <li><b>Fibonacci Scale:</b> Step 5 = Value 13 (the 5th index in the sequence).</li>
 * </ul>
 *
 * <br><b>Visual Feedback Cycles:</b>
 * 1. <b>Validation:</b> Enables/Disables the "Save" button based on the logic result (e.g., missing Title).
 * 2. <b>Totals:</b> Updates the "Job Size" and "CoD" sum displays, adding a `has-value` class for styling when non-zero.
 * 3. <b>Hints:</b> Shows contextual help text (e.g., "Add Effort to complete Job Size") and marks them as green/complete when specific thresholds are met.
 * 4. <b>WSJF Score:</b> If all metrics are present, displays the calculated score tag; otherwise hides it.
 * 5. <b>Reset Buttons:</b> Triggers visibility updates for the "Reset" buttons to ensure they only appear when values exist.
 */
function validateAndSyncModal() {
    var scaleValues = SCALES[currentScale].values;
    var isNumericScale = (scaleValues.length > 0 && typeof scaleValues[0] === 'number');

    function getSliderValue(id) {
        var el = document.getElementById(id);
        if (!el) return 0;
        var rawVal = parseInt(el.value, 10);
        if (isNaN(rawVal)) return 0;

        if (isNumericScale) {
            return rawVal; 
        } else {
            var lookedUp = scaleValues[rawVal];
            return (lookedUp !== undefined) ? lookedUp : 0; 
        }
    }
    
    var inputs = {
        title: document.getElementById('pbi-title').value,
        complexityVal: getSliderValue('pbi-complexity'),
        effortVal: getSliderValue('pbi-effort'),
        doubtVal: getSliderValue('pbi-doubt'),
        codBvVal: getSliderValue('pbi-cod-bv'),
        codTcVal: getSliderValue('pbi-cod-tc'),
        codRroeVal: getSliderValue('pbi-cod-rroe'),
        uiStrings: config.uiStrings
    };

    var results = validateAndSyncModalLogic(inputs);
    var naText = config.uiStrings.pbiInfoNA || "na";

    var saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.disabled = results.isSaveDisabled;

    var totalSpan = document.getElementById('job-size-total');
    if (totalSpan) {
        if (results.jobSizeTotal !== null && results.jobSizeTotal > 0) {
            totalSpan.textContent = results.jobSizeTotal;
            totalSpan.classList.add('has-value');
        } else {
            totalSpan.textContent = naText;
            totalSpan.classList.remove('has-value');
        }
    }

    var codTotalSpan = document.getElementById('cod-total');
    if (codTotalSpan) {
        if (results.codTotal !== null && results.codTotal > 0) {
            codTotalSpan.textContent = results.codTotal;
            codTotalSpan.classList.add('has-value');
        } else {
            codTotalSpan.textContent = naText;
            codTotalSpan.classList.remove('has-value');
        }
    }

    var jobsizeHint = document.getElementById('jobsize-hint'); 
    if (jobsizeHint) {
        if (results.jobsizeHintText) {
            jobsizeHint.textContent = results.jobsizeHintText;
            jobsizeHint.style.display = 'block';
            
            if (results.jobsizeHintIsComplete) {
                jobsizeHint.classList.add('is-complete');
            } else {
                jobsizeHint.classList.remove('is-complete');
            }
        } else {
            jobsizeHint.style.display = 'none';
        }
    }
    
    var codHint = document.getElementById('cod-hint'); 
    if (codHint) {
        if (results.codHintText) {
            codHint.textContent = results.codHintText;
            codHint.style.display = 'block';
            
            if (results.codHintIsComplete) {
                codHint.classList.add('is-complete');
            } else {
                codHint.classList.remove('is-complete');
            }
        } else {
            codHint.style.display = 'none';
        }
    }

    var wsjfDisplay = document.getElementById('modal-wsjf-display');
    var wsjfValueSpan = document.getElementById('wsjf-value');
    
    if (wsjfValueSpan) {
        if (results.wsjfValue !== null) {
            wsjfValueSpan.textContent = results.wsjfValue;
            wsjfValueSpan.classList.add('has-value');
        } else {
            wsjfValueSpan.textContent = "0";
            wsjfValueSpan.classList.remove('has-value');
        }
    }
    
    if (wsjfDisplay) {
         if (results.wsjfValue !== null) {
            wsjfDisplay.querySelector('.modal-tag-label').textContent = config.uiStrings.pbiInfoWSJF + ":";
            wsjfDisplay.querySelector('.modal-tag-value').textContent = results.wsjfValue;
            wsjfDisplay.style.display = 'inline-flex';
        } else {
            wsjfDisplay.style.display = 'none';
        }
    }
    
    if (typeof updateResetJobSizeButtonVisibility === 'function') updateResetJobSizeButtonVisibility();
    if (typeof updateResetCoDButtonVisibility === 'function') updateResetCoDButtonVisibility();
}


/**
 * Opens a lightweight context menu (popup) for quickly assigning a T-Shirt Size to an item.
 * <br><b>UX Pattern (Quick Action):</b>
 * Unlike the full edit modal, this popup allows users to change a single property (T-Shirt Size) instantly without losing context or screen position.
 * <br><b>Visual Feedback (Cross-Highlighting):</b>
 * While the popup is open, it highlights both representations of the item:
 * <ul>
 * <li><b>List Item:</b> Adds `is-selecting` class to the PBI card in the left column.</li>
 * <li><b>Visualization:</b> Adds `is-selecting` class to the corresponding bubble chart in the right column.</li>
 * </ul>
 * This helps the user verify they are editing the correct item.
 *
 * <br><b>Architecture (Overlay):</b>
 * 1. <b>Creation:</b> Dynamically creates a DOM element `.tshirt-popup` and a transparent `.popup-overlay`.
 * 2. <b>Positioning:</b> Calculates coordinates to center the popup exactly over the clicked trigger element (`clickedElement`).
 * 3. <b>Interaction:</b>
 * - <b>Selection:</b> Clicking an option saves the size, closes the popup, and triggers a re-render.
 * - <b>Cancellation:</b> Clicking the background overlay (outside the popup) invokes `closePopup()` to discard the action cleanly.
 *
 * @param {HTMLElement} clickedElement - The DOM element (usually a badge or button) that triggered the popup. Used for positioning.
 */
function showTshirtPopup(clickedElement) {
    const pbiItem = clickedElement.closest('[data-id]');
    if (!pbiItem) return;

    const id = parseInt(pbiItem.dataset.id, 10);
    const pbi = pbis.find(p => p.id === id);
    if (!pbi) return;
    
    activePopupPbiId = id;
    clickedElement.classList.add('popup-trigger-active'); 

    const listItem = document.querySelector('.pbi-item[data-id="' + id + '"]');
    const vizItem = document.querySelector('.story-visualization[data-id="' + id + '"]');

    if (listItem) listItem.classList.add('is-selecting');
    if (vizItem) vizItem.classList.add('is-selecting');

    const sizes = config.tshirtSizes.slice().sort((a, b) => {
        const indexA = config.allTshirtSizes.indexOf(a);
        const indexB = config.allTshirtSizes.indexOf(b);
        return indexA - indexB;
    });
    
    const sizesWithOptions = ['-'].concat(sizes);
    
    const popup = document.createElement('div');
    popup.className = 'tshirt-popup';

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const closePopup = function() {
        activePopupPbiId = null;
        clickedElement.classList.remove('popup-trigger-active');
        if (listItem) listItem.classList.remove('is-selecting');
        if (vizItem) vizItem.classList.remove('is-selecting');

        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
        }
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
        toggleHighlight(id, false);
    };

    overlay.addEventListener('click', closePopup);
    sizesWithOptions.forEach(function(size) {
        const option = document.createElement('div');
        option.className = 'tshirt-option';
        option.textContent = size;
        option.addEventListener('click', function() {
            pbi.tshirtSize = (size === '-') ? null : size;
            lastEditedPbiId = pbi.id;
            activePopupPbiId = null; 
            closePopup();
            renderAll();
        });
        popup.appendChild(option);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    const rect = clickedElement.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    const centeredLeft = rect.left + window.scrollX + (rect.width / 2) - (popupRect.width / 2);
    const centeredTop = rect.top + window.scrollY + (rect.height / 2) - (popupRect.height / 2);

    popup.style.left = Math.max(0, centeredLeft) + 'px';
    popup.style.top = Math.max(0, centeredTop) + 'px';
}


/**
 * Opens a quick-select popup for editing individual numeric estimation values directly from the list view.
 * <br><b>UX Pattern (Inline Editing):</b>
 * This function provides a shortcut to edit specific metrics (like Complexity, Effort, BV, TC) without opening the full-screen modal.
 * It is triggered by clicking on the respective number cell in the PBI list.
 *
 * <br><b>Dynamic Context:</b>
 * The function determines what to edit based on the dataset attributes of the clicked cell:
 * <ul>
 * <li>`data-pbi-id`: Identifies the target Backlog Item.</li>
 * <li>`data-value-type`: Identifies the property to modify (e.g., 'complexity', 'cod_bv').</li>
 * </ul>
 *
 * <br><b>Auto-Calculation Logic:</b>
 * When a new value is selected, the function immediately updates dependent aggregates to keep the data consistent:
 * <ul>
 * <li><b>Job Size Group:</b> If updating Complexity, Effort, or Doubt, it checks if all three are now present. If so, it sums them up to update `pbi.jobSize`. If any becomes 0, `jobSize` is invalidated (set to null).</li>
 * <li><b>CoD Group:</b> If updating BV, TC, or RR/OE, it performs a similar check and summation for `pbi.cod`.</li>
 * <li><b>Data Sync:</b> Crucially, it updates `pbi.arithmeticValues` and `pbi.fibonacciValues` to ensure the Edit Modal reflects these changes later.</li>
 * </ul>
 *
 * <br><b>Rendering:</b>
 * Uses the same Overlay/Popup positioning logic as `showTshirtPopup` to center the menu over the clicked cell.
 * Populates the menu options based on the currently active `SCALES[currentScale].values` (e.g., Fibonacci numbers).
 *
 * @param {HTMLElement} clickedCell - The table cell element (td or div) that was clicked.
 */
function showValuePopup(clickedCell) {
    const pbiId = parseInt(clickedCell.dataset.pbiId, 10);
    const valueType = clickedCell.dataset.valueType;
    const pbi = pbis.find(function(p) { return p.id === pbiId; });

    if (!pbi) return;

    activePopupPbiId = pbiId;
    clickedCell.classList.add('popup-trigger-active'); 

    const values = SCALES[currentScale].values;
    
    const popup = document.createElement('div');
    popup.className = 'tshirt-popup'; 

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const closePopup = function() {
        activePopupPbiId = null;
        clickedCell.classList.remove('popup-trigger-active'); 
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
        }
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }

        if (activePopupPbiId === null) {
            toggleHighlight(pbiId, false);
        }
    };

    overlay.addEventListener('click', closePopup);

    values.forEach(function(value) {
        const option = document.createElement('div');
        option.className = 'tshirt-option';    
        option.textContent = (value === 0) ? '-' : value;

        option.addEventListener('click', function() {
            pbi[valueType] = value;
            
            if (!pbi.arithmeticValues) { pbi.arithmeticValues = {}; }
            if (!pbi.fibonacciValues) { pbi.fibonacciValues = {}; }
            
            pbi.arithmeticValues[valueType] = value;
            pbi.fibonacciValues[valueType] = value;

            if (['complexity', 'effort', 'doubt'].indexOf(valueType) > -1) {
                if (pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0) {
                    pbi.jobSize = pbi.complexity + pbi.effort + pbi.doubt;
                } else {
                    pbi.jobSize = null;
                    pbi.tshirtSize = null;
                }
            }
            if (['cod_bv', 'cod_tc', 'cod_rroe'].indexOf(valueType) > -1) {
                if (pbi.cod_bv > 0 && pbi.cod_tc > 0 && pbi.cod_rroe > 0) {
                    pbi.cod = pbi.cod_bv + pbi.cod_tc + pbi.cod_rroe;
                } else {
                    pbi.cod = null;
                }
            }

            lastEditedPbiId = pbi.id; 
            activePopupPbiId = null; 
            closePopup();
            renderAll();
            
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
        });
        popup.appendChild(option);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    const rect = clickedCell.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const centeredLeft = window.scrollX + rect.left + (rect.width / 2) - (popupRect.width / 2);
    const centeredTop = window.scrollY + rect.top + (rect.height / 2) - (popupRect.height / 2);

    popup.style.left = Math.max(0, centeredLeft) + 'px';
    popup.style.top = Math.max(0, centeredTop) + 'px';
}


/**
 * @ignore
    * CommonJS Module Export Definition (UI Interaction Controllers).
 * <br><b>Architecture (Interaction Layer):</b>
 * This block exposes the functions responsible for managing the application's interactive state and user flow.
 * Exporting these allows for "Headless Testing" of the user interface logic.
 * <br><b>Categorization of Exports:</b>
 * <ul>
 * <li><b>Modal Lifecycle:</b> `showModal`, `getIsModalDirty`, `markModalAsDirty` - Verifies that the edit dialog opens with the correct data and tracks unsaved changes.</li>
 * <li><b>Settings Management:</b> `openSettingsModal`, `saveAndCloseSettings`, `resetSettingsToDefault` - Allows testing the configuration subsystem, including complex migrations (like scale changes) and color theming.</li>
 * <li><b>Popup Controls:</b> `showTshirtPopup`, `showValuePopup` - Tests the logic behind context menus and inline editing.</li>
 * <li><b>Validation Logic:</b> `validateAndSyncModalLogic` - Crucial for unit testing. It allows verifying that invalid inputs correctly disable the "Save" button without needing to instantiate a real button in the DOM.</li>
 * </ul>
 * <br><b>Testing Strategy:</b>
 * By mocking the DOM (e.g., using JSDOM), developers can write test cases like:
 * <i>"When `showModal(null)` is called, does `currentEditingId` become null (indicating 'Create Mode')?"</i> or
 * <i>"Does `validateAndSyncModalLogic` correctly calculate WSJF given specific inputs?"</i>
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateResetCoDButtonVisibility,
        validateAndSyncModalLogic,
        showModal,
        openSettingsModal,
        resetSettingsToDefault,
        saveAndCloseSettings,
        showTshirtPopup,
        showValuePopup,
        getIsModalDirty,
        markModalAsDirty,
        updateModalNavButtons,
        validateAndSyncModal,
        updateHelpIcons
    };
}