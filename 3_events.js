// ===================================================================================
// 3_EVENTS.JS
// ===================================================================================


/**
 * @file 3_EVENTS.JS - The Interaction Controller & Event Hub
 * @description
 * This file serves as the Controller layer of the application. It captures user 
 * inputs from the DOM and translates them into state changes or logic executions.
 * * 
 *
 * <br><b>Core Responsibilities:</b>
 * <ul>
 * <li><b>Global Event Delegation:</b> Implements high-performance event listeners 
 * on parent containers to manage interactions for dynamic elements like PBI 
 * list items and visualization cards.</li>
 * <li><b>Drag-and-Drop Integration:</b> Initializes and manages <code>SortableJS</code> 
 * to enable manual reordering of backlog items, synchronizing the visual 
 * order with the internal <code>lockedPbiOrder</code> state.</li>
 * <li><b>Modal Management:</b> Controls the lifecycle of the PBI Editor and 
 * Settings modals, including data binding, validation, and submission 
 * handling.</li>
 * <li><b>Toolbar & Filtering Logic:</b> Connects UI buttons for sorting, 
 * filtering, and locking to the underlying data transformation engine.</li>
 * <li><b>Input Synchronization:</b> Manages real-time UI feedback, such as 
 * slider movements, numeric input validation, and rich-text editor 
 * commands.</li>
 * </ul>
 *
 * <br><b>Technical Approach:</b>
 * This module ensures a decoupled architecture by separating the detection 
 * of a user action (e.g., clicking a 'Delete' button) from the actual 
 * data deletion and re-rendering logic.
 */


// ===================================================================================
// EVENT INITIALIZATION
// ===================================================================================

let sortableInstance = null; 
let isDragging = false; 

/**
 * Initializes the drag-and-drop functionality for the Backlog Item list using the SortableJS library.
 * <br><b>Conditional Activation:</b>
 * The function creates a Sortable instance only if three strict conditions are met:
 * 1. <b>Custom Sort Order:</b> `currentSortCriteria` must be 'custom'. Dragging is disabled when sorting by Name, WSJF, or Job Size to prevent logical conflicts.
 * 2. <b>No Active Filter:</b> `isFilterLocked` must be false. You cannot reorder a filtered subset of the list, as this would corrupt the global index.
 * 3. <b>Singleton Pattern:</b> Checks `!sortableInstance` to ensure we don't attach multiple event listeners to the same DOM element.
 *
 * <br><b>Configuration Details:</b>
 * <ul>
 * <li><b>Animation:</b> 150ms transition for smooth visual swapping.</li>
 * <li><b>Filter:</b> Explicitly excludes the `.last-item` (the "Add New" placeholder) from being draggable.</li>
 * </ul>
 *
 * <br><b>Event Cycle:</b>
 * <ul>
 * <li><b>onStart:</b>
 * <ul>
 * <li>Sets the global `isDragging` flag to prevent hover effects or click events from firing during the drag operation.</li>
 * <li><b>Visual Cleanup:</b> Aggressively removes `highlighted` classes from all items (list items, visualizations, badges). This prevents "ghost" highlights from cluttering the UI while moving items.</li>
 * </ul>
 * </li>
 * <li><b>onEnd:</b>
 * <ul>
 * <li>Resets the `isDragging` flag.</li>
 * <li>Calls `handleSortEnd` to persist the new order to the internal data model and LocalStorage.</li>
 * </ul>
 * </li>
 * </ul>
 */
function initSortable() {
    if (currentSortCriteria === 'custom' && !isFilterLocked && !sortableInstance) {
        const pbiListElement = document.getElementById('pbi-list');
        if (pbiListElement) {
            sortableInstance = Sortable.create(pbiListElement, {
                animation: 150,
                draggable: '.pbi-item:not(.last-item)',
                filter: '.last-item', 
                preventOnFilter: true, 
                onStart: function(evt) {
                    isDragging = true;
                    pbiListElement.classList.add('pbi-list-is-dragging');

                    var highlightedItems = document.querySelectorAll('.pbi-item.highlighted, .story-visualization.highlighted, .rs-item.highlighted');
                    highlightedItems.forEach(function(item) {
                        item.classList.remove('highlighted');
                    });
                    var highlightedTShirts = document.querySelectorAll('.pbi-item-tshirt.highlighted, .story-title-tshirt.highlighted');
                     highlightedTShirts.forEach(function(tshirt) {
                        tshirt.classList.remove('highlighted');
                        tshirt.style.backgroundColor = '';
                        tshirt.style.borderColor = '';
                        tshirt.style.color = '';
                     });

                    if (evt.item) {
                         evt.item.classList.remove('highlighted');
                         const draggedId = evt.item.dataset.id;
                         if (draggedId) {
                            toggleHighlight(draggedId, false);
                         }
                    }
                },
                onEnd: function(evt) {
                    isDragging = false;
                    pbiListElement.classList.remove('pbi-list-is-dragging');
                    handleSortEnd(evt);
                }
            });
        } else {
            console.warn('Could not find #pbi-list to initialize SortableJS');
        }
    }
}


/**
 * Handles the "paste" event in the Rich Text Editor (Notes field).
 * <br><b>Purpose:</b>
 * Sanitizes pasted content to strip unwanted styles, scripts, and potentially malicious tags,
 * while preserving basic formatting like Bold, Italic, Underline, and Links.
 * * @param {Event} e - The clipboard paste event.
 */
function handlePasteInNote(e) {
    e.preventDefault(); 
    if (typeof markModalAsDirty === 'function') markModalAsDirty();
    
    var html = e.clipboardData.getData("text/html");
    var text = e.clipboardData.getData("text/plain");

    if (!html) {
        document.execCommand("insertText", false, text);
        return;
    }

    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function sanitizeNodes(parentNode) {
        var result = "";
        
        parentNode.childNodes.forEach(function(node) {
            if (node.nodeType === 3) { 
                result += escapeHtml(node.textContent);
            } 
            else if (node.nodeType === 1) { 

                var styleAttr = (node.getAttribute('style') || "").toLowerCase();
                var tagName = node.tagName;

                var isBold = (tagName === 'B' || tagName === 'STRONG') || 
                             (styleAttr.includes('font-weight') && (styleAttr.includes('bold') || styleAttr.includes('700')));
                
                var isItalic = (tagName === 'I' || tagName === 'EM') || 
                               (styleAttr.includes('font-style') && styleAttr.includes('italic'));
                
                var isUnderline = (tagName === 'U') || 
                                  (styleAttr.includes('text-decoration') && styleAttr.includes('underline'));
                
                var isLink = (tagName === 'A') && node.href;
                var isBr = (tagName === 'BR');

                var isBlock = ['DIV','P','H1','H2','H3','H4','H5','H6','LI','TR','BLOCKQUOTE','PRE'].includes(tagName);

                var childContent = sanitizeNodes(node);

                if (childContent || isBr) {
                    var formatted = childContent;

                    if (isLink) {
                        formatted = '<a href="' + node.href + '" target="_blank">' + formatted + '</a>';
                    }
                    if (isUnderline) { formatted = '<u>' + formatted + '</u>'; }
                    if (isItalic) { formatted = '<i>' + formatted + '</i>'; }
                    if (isBold) { formatted = '<b>' + formatted + '</b>'; }

                    if (isBr) {
                        formatted = '<br>';
                    }
                    else if (isBlock) {
                        formatted = formatted + '<br>';
                    }

                    if (tagName === 'HR' || tagName === 'STYLE' || tagName === 'SCRIPT' || tagName === 'META' || tagName === 'LINK') {
                        formatted = "";
                    }
                    
                    result += formatted;
                }
            }
        });
        return result;
    }

    var cleanHTML = sanitizeNodes(tempDiv);
    document.execCommand("insertHTML", false, cleanHTML);
}

/**
 * Handles input events on estimation sliders to enforce scale snapping.
 * <br><b>Logic:</b>
 * 1. Reads the raw slider value (step index).
 * 2. Maps it to the nearest valid value in the current scale (e.g., Fibonacci).
 * 3. Updates the slider's value and visual fill.
 * 4. Triggers modal validation/sync.
 * * @param {HTMLElement} slider - The input range element triggering the event.
 */
function handleSliderInput(slider) {
    if (typeof markModalAsDirty === 'function') markModalAsDirty();
    
    var scaleValues = SCALES[currentScale].values;
    var rawValue = parseInt(slider.value, 10);
    var snappedValue = (typeof findNearestScaleValue === 'function') 
        ? findNearestScaleValue(rawValue, scaleValues) 
        : rawValue; 
    
    slider.value = snappedValue;
    
    if (snappedValue > 0) { slider.dataset.zeroLocked = "true"; }
    
    if (snappedValue === 0 && slider.dataset.zeroLocked === "true") { 
        var minVal = (typeof scaleValues[1] === 'number') ? scaleValues[1] : 1;
        slider.value = String(minVal); 
    }
    
    slider.dataset.interacted = "true";
    
    if (typeof updateSliderValues === 'function') updateSliderValues();
    if (typeof updateSliderFill === 'function') updateSliderFill(slider);
    if (typeof validateAndSyncModal === 'function') validateAndSyncModal();
    if (typeof updateActiveScaleValue === 'function') updateActiveScaleValue(slider);
    if (typeof updateResetJobSizeButtonVisibility === 'function') updateResetJobSizeButtonVisibility();
    if (typeof updateResetCoDButtonVisibility === 'function') updateResetCoDButtonVisibility();
}


/**
 * Tears down the SortableJS instance and cleans up related state.
 * <br><b>Lifecycle Management:</b>
 * This function is the counterpart to `initSortable`. It is called whenever the application state changes such that drag-and-drop is no longer valid
 * (e.g., switching from "Custom Sort" to "Sort by Title").
 * <br><b>Operations:</b>
 * 1. <b>Library Cleanup:</b> Calls `sortableInstance.destroy()` to remove all event listeners attached by the library to the DOM.
 * 2. <b>Reference Nulling:</b> Sets `sortableInstance = null` to allow garbage collection and indicate to `initSortable` that a new instance can be created later.
 * 3. <b>Visual Reset:</b> Removes the `.pbi-list-is-dragging` class to ensure the cursor style reverts to default.
 * 4. <b>State Reset:</b> Forces `isDragging = false` to prevent the UI from getting stuck in a "drag state" if the sort mode is switched mid-interaction.
 */
function destroySortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
        const pbiListElement = document.getElementById('pbi-list');
        if (pbiListElement) {
            pbiListElement.classList.remove('pbi-list-is-dragging');
        }
        isDragging = false;
    }
}


/**
 * Event Handler: Finalizes the reordering process after a user drops an item.
 * <br><b>Data Flow (DOM -> Model):</b>
 * When SortableJS moves an element, only the HTML structure changes. This function bridges the gap back to the application state:
 * 1. <b>Scraping:</b> It queries the DOM for all `.pbi-item` elements to determine their new physical sequence.
 * 2. <b>Extraction:</b> It maps these DOM elements to an array of IDs (`newOrderIds`).
 * 3. <b>Persistence:</b> It overwrites the global `lockedPbiOrder` variable with this new sequence. This array is the "Source of Truth" for the 'Custom' sort mode.
 *
 * <br><b>UX Polish:</b>
 * <ul>
 * <li><b>Highlight Cleanup:</b> Removes any residual highlighting artifacts that might have stuck during the drag operation.</li>
 * <li><b>Focus Maintenance:</b> Sets `lastEditedPbiId` to the dropped item's ID. This ensures that when `renderAll()` is called next, the item the user just moved remains visually selected/highlighted, allowing them to track its new position easily.</li>
 * </ul>
 *
 * <br><b>Side Effects:</b>
 * - Triggers `saveToLocalStorage()` immediately to prevent data loss if the browser is closed.
 * - Calls `renderAll()` to ensure the right-hand Visualization column syncs its order to match the new left-hand List order.
 *
 * @param {Object} evt - The event object provided by SortableJS, containing details about the moved item (`evt.item`).
 */
function handleSortEnd(evt) {
    const pbiListElement = document.getElementById('pbi-list');
    if (!pbiListElement) return;

    const items = pbiListElement.querySelectorAll('.pbi-item:not(.reference-item):not(.last-item)');
    const newOrderIds = Array.from(items).map(function(item) {
        return parseInt(item.dataset.id, 10);
    });

    lockedPbiOrder = newOrderIds; 

    const droppedItemIdStr = evt.item.dataset.id; 

    var highlightedItems = document.querySelectorAll('.pbi-item.highlighted, .story-visualization.highlighted, .rs-item.highlighted');
    highlightedItems.forEach(function(item) {
        item.classList.remove('highlighted');
    });

    var highlightedTShirts = document.querySelectorAll('.pbi-item-tshirt.highlighted, .story-title-tshirt.highlighted');
     highlightedTShirts.forEach(function(tshirt) {
        tshirt.classList.remove('highlighted');
        tshirt.style.backgroundColor = '';
        tshirt.style.borderColor = '';
        tshirt.style.color = '';
     });

    if (droppedItemIdStr) {
        lastEditedPbiId = parseInt(droppedItemIdStr, 10);
    }

    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();

    renderAll();
}


/**
 * Toggles visual highlighting for a specific Backlog Item across all UI views simultaneously.
 * <br><b>UX Pattern (Cross-View Highlighting):</b>
 * Since the application represents the same data object (PBI) in multiple places (List, Job Size Cluster, CoD Cluster, WSJF Chart),
 * it is crucial to visually link them. This function acts as the central switch.
 *
 * <br><b>Scope of Effect:</b>
 * It queries and updates the class lists of:
 * <ul>
 * <li><b>The List Item:</b> The card in the main table (`.pbi-item`).</li>
 * <li><b>The Visualizations:</b> The bubble clusters in both the "Job Size" and "Cost of Delay" columns (`.story-visualization`).</li>
 * <li><b>The Reference Scale:</b> The corresponding item in the Reference Ruler (`.rs-item`), if visible.</li>
 * <li><b>The WSJF Chart:</b> The specific block representing this item in the cumulative cost chart (`.wsjf-delay-block`).</li>
 * </ul>
 *
 * <br><b>Technical Detail:</b>
 * Note that the WSJF chart blocks use a different CSS class (`highlighted-block`) than the other elements (`highlighted`)
 * due to specific styling requirements (e.g., border handling vs. background color changes).
 *
 * @param {number|string} pbiId - The unique identifier of the PBI to highlight.
 * @param {boolean} shouldHighlight - `true` to activate the highlight, `false` to remove it.
 */
function toggleHighlight(pbiId, shouldHighlight) {
    var stringPbiId = String(pbiId);

    var mainElementsSelector =
        '.pbi-item[data-id="' + stringPbiId + '"], ' +
        '#visualization-container .story-visualization[data-id="' + stringPbiId + '"], ' +
        '#cod-visualization-container .story-visualization[data-id="' + stringPbiId + '"], ' +
        '.rs-item[data-id="' + stringPbiId + '"]';

    var elementsToToggle = document.querySelectorAll(mainElementsSelector);

    elementsToToggle.forEach(function(el) {
        el.classList.toggle("highlighted", shouldHighlight);
    });

    var wsjfBlocksSelector = '.wsjf-delay-block[data-pbi-id="' + stringPbiId + '"]';
    var wsjfBlocksToToggle = document.querySelectorAll(wsjfBlocksSelector);

    wsjfBlocksToToggle.forEach(function(block) {
        block.classList.toggle("highlighted-block", shouldHighlight);
    });
}


/**
 * Updates the visual state of the "Filter Lock" toolbar button.
 * <br><b>Purpose:</b>
 * Reflects the global `isFilterLocked` state in the UI. When locked, the button appears pressed (active state) 
 * to indicate that the current view (search results) is "frozen" and drag-and-drop reordering is disabled.
 * <br><b>Operations:</b>
 * <ul>
 * <li><b>Class Toggling:</b> Adds or removes the `.active` CSS class to change the button's appearance (e.g., darker background).</li>
 * <li><b>Tooltip Update:</b> Dynamically switches the hover text (e.g., "Unlock Filter" vs. "Lock Filter") based on the current state, using localized strings from `config.uiStrings`.</li>
 * </ul>
 */
function updateFilterLockButtonState() {
    var lockBtn = document.getElementById('filter-lock-btn');
    if (!lockBtn) return;

    var s = config.uiStrings;

    lockBtn.classList.toggle('active', isFilterLocked);
    lockBtn.title = isFilterLocked ? s.tooltipFilterUnlock : s.tooltipFilterLock;
}


/**
 * Disables the "Filter Lock" mode and restores the previous list state.
 * <br><b>Context (State Restoration):</b>
 * When a user "locks" a search result, they are essentially creating a temporary, custom-sorted subset of the backlog.
 * This function undoes that operation.
 * <br><b>Operations:</b>
 * 1. <b>State Flag:</b> Sets `isFilterLocked = false`.
 * 2. <b>Sort Restoration:</b> Reverts `currentSortCriteria` and `currentSortDirection` to whatever they were *before* the lock was engaged (stored in `preLockSortCriteria`). This ensures the user lands back in a familiar context (e.g., "Sorted by WSJF").
 * 3. <b>UI Feedback:</b>
 * - Updates the lock button appearance via `updateFilterLockButtonState`.
 * - Removes the `.filter-locked` class from the main container (`#split-root`), which might have applied specific styling (like a border color change) to indicate the locked state.
 */
function deactivateFilterLock() {
    if (isFilterLocked) {
        isFilterLocked = false;
        currentSortCriteria = preLockSortCriteria;
        currentSortDirection = preLockSortDirection;
        updateFilterLockButtonState();
        var splitRootElement = document.getElementById('split-root');
        if (splitRootElement) {
            splitRootElement.classList.remove('filter-locked');
        }
    }
}


/**
 * Central Event Handler using Event Delegation for the entire Backlog Item list.
 * <br><b>Architecture (Performance):</b>
 * Instead of attaching individual event listeners to every button in every row (which would be slow and require re-attaching on every render),
 * this single function catches all clicks bubbling up from the list. It then routes the action based on the CSS class of the target element.
 *
 * <br><b>Supported Actions:</b>
 * <ul>
 * <li><b>Reference Selection (`.ref-btn-min`, `.ref-btn-max`):</b>
 * Toggles a PBI as the "Reference Min" or "Reference Max".
 * <i>Logic:</i> Enforces a "Mutual Exclusion" rule (Mutex) — checking a new item automatically unchecks the previous reference item of that type, ensuring there is only ever one Min and one Max.
 * </li>
 *
 * <li><b>Edit (`.edit`):</b> Opens the modal dialog populated with the item's data.</li>
 *
 * <li><b>Delete (`.delete`):</b>
 * <ul>
 * <li>Asks for browser confirmation (`confirm()`).</li>
 * <li>Removes the item from the data model (`pbis`).</li>
 * <li>Cleans up auxiliary state: removes it from the custom sort order (`lockedPbiOrder`) and deletes any custom color associations (`pbiIdToCustomColor`).</li>
 * <li>Triggers a full save and re-render.</li>
 * </ul>
 * </li>
 *
 * <li><b>Quick T-Shirt Size (`.pbi-item-tshirt`):</b> Opens the lightweight popup menu for setting size without entering the modal.</li>
 *
 * <li><b>WSJF Color Customization (`.wsjf-rank-tag`):</b>
 * <i>Easter Egg / Power User Feature:</i> If the WSJF tab is active, clicking the rank badge (e.g., "#1") generates a new random pastel color for that item.
 * This allows users to color-code specific items in the WSJF chart for better tracking during presentations.
 * </li>
 * </ul>
 *
 * @param {Event} e - The native DOM click event.
 */
function handlePbiListClick(e) {

    var pbiItem = e.target.closest(".pbi-item");
    if (!pbiItem) {
        return;
    }
    var pbiId = parseInt(pbiItem.dataset.id, 10);
    
    var pbi = pbis.find(function(p) { return p.id == pbiId; });

    if (pbi && pbi.isLastItem) {
        return;
    }

    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');

    if (e.target.closest(".reference-btn")) {
        var clickedPbi = pbi;
        if (clickedPbi) {
            if (e.target.closest(".ref-btn-min")) {
                if (clickedPbi.referenceType === 'min') {
                    clickedPbi.referenceType = null;
                    clickedPbi.isReference = false;
                } else {
                    var existingMin = pbis.find(function(p) { return p.referenceType === 'min'; });
                    if (existingMin) {
                        existingMin.referenceType = null;
                        existingMin.isReference = false;
                    }
                    clickedPbi.referenceType = 'min';
                    clickedPbi.isReference = true;
                }
                if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
                renderAll();
            } 
            else if (e.target.closest(".ref-btn-max")) {
                if (clickedPbi.referenceType === 'max') {
                    clickedPbi.referenceType = null;
                    clickedPbi.isReference = false;
                } else {
                    var existingMax = pbis.find(function(p) { return p.referenceType === 'max'; });
                    if (existingMax) {
                        existingMax.referenceType = null;
                        existingMax.isReference = false;
                    }
                    clickedPbi.referenceType = 'max';
                    clickedPbi.isReference = true;
                }
                if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
                renderAll();
            }
        }
    }
    else if (e.target.classList.contains("edit")) {
        var pbiToEdit = pbi;
        if (pbiToEdit) {
            showModal(pbiToEdit);
        }
    }
    else if (e.target.classList.contains("delete")) {
        if (pbi && pbi.isLastItem) { return; }

        if (confirm(config.uiStrings.confirmDelete)) {
            var pbiToDelete = pbis.find(function(p) { return p.id == pbiId; });
            if (pbiToDelete && pbiToDelete.isReference) {
                pbiToDelete.isReference = false;
                pbiToDelete.referenceType = null;
            }
            pbis = pbis.filter(function(p) { return p.id != pbiId; });
            lockedPbiOrder = lockedPbiOrder.filter(id => id != pbiId);
            if (typeof pbiIdToCustomColor !== 'undefined') {
                 delete pbiIdToCustomColor[pbiId];
            }
            if (pbis.filter(p => !p.isLastItem && !p.isReference).length === 0) {
                 initialCustomOrderSet = false;
            }
            
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
            renderAll();
        }
    }
    else if (e.target.classList.contains("pbi-item-tshirt") && !e.target.classList.contains("is-disabled")) {
        showTshirtPopup(e.target);
    }
    else if (e.target.classList.contains("wsjf-rank-tag")) {
        if (isWsjfTabActive && typeof generatePastelColors === 'function' && typeof rgbToHex === 'function') {
            var currentElementStyle = window.getComputedStyle(e.target);
            var currentRgbColor = currentElementStyle.backgroundColor;
            var currentHexColor = rgbToHex(currentRgbColor);

            var newColors = generatePastelColors(1, currentHexColor);
            var newColor = (newColors && newColors.length > 0) ? newColors[0] : null;

            if (newColor) {
                e.target.style.backgroundColor = newColor;
                if (typeof pbiIdToCustomColor !== 'undefined') {
                    pbiIdToCustomColor[pbiId] = newColor;
                }
                
                if (typeof saveToLocalStorage === 'function') saveToLocalStorage();

                if (typeof renderWsjfVisualization === 'function') {
                    renderWsjfVisualization();
                }
            } else {
                console.warn("Could not generate a new color.");
            }
        }
    }
}


/**
 * Saves the current state of the Edit Modal to the global \`pbis\` array.
 * <br><b>Core Logic (Create vs. Update):</b>
 * Checks \`currentEditingId\` to determine the operation mode:
 * <ul>
 * <li><b>Update (Id exists):</b> Finds the existing PBI in the array and merges the new form data into it using \`Object.assign\`. Preserves existing properties not in the form (like \`isReference\`).</li>
 * <li><b>Create (Id is null):</b> Generates a new PBI with a timestamp-based ID (\`Date.now()\`), pushes it to \`pbis\`, and appends it to \`lockedPbiOrder\` if custom sorting is active.</li>
 * </ul>
 *
 * <br><b>Data Transformation:</b>
 * 1. <b>Scale Mapping:</b> Converts the raw slider positions (0-10) into actual estimation values using the active scale (Linear or Fibonacci).
 * 2. <b>Aggregation:</b>
 * - Calculates \`jobSize\` = Complexity + Effort + Doubt (only if all > 0).
 * - Calculates \`cod\` = BV + TC + RR/OE (only if all > 0).
 * 3. <b>T-Shirt Size Handling:</b> If the Job Size becomes incomplete (any component is 0), the T-Shirt size is forcibly invalidated (\`null\`).
 * 4. <b>Memory Synchronization (Fix):</b> Ensures that \`fibonacciValues\` and \`arithmeticValues\` are correctly updated so that reopening the modal loads the saved values.
 *
 * <br><b>Side Effects:</b>
 * - Updates \`lastEditedPbiId\` so the item is highlighted after render.
 * - Triggers \`saveToLocalStorage()\` to persist changes to the browser.
 * - Calls \`renderAll()\` to refresh the entire UI (List, Charts, Graphs).
 *
 * @param {boolean} shouldClose - If \`true\`, hides the modal after saving. If \`false\` (e.g., "Save & Next"), keeps it open.
 */
function savePbiFromModal(shouldClose) {
    var editModal = document.getElementById("edit-modal");
    var titleInput = document.getElementById("pbi-title");
    
    if (!titleInput) return;

    var title = titleInput.value.trim();
    var scaleValues = SCALES[currentScale].values;
    
    var isNumericScale = (scaleValues.length > 0 && typeof scaleValues[0] === 'number');
    
    var complexityInput = document.getElementById("pbi-complexity");
    var effortInput = document.getElementById("pbi-effort");
    var doubtInput = document.getElementById("pbi-doubt");
    var codBvInput = document.getElementById("pbi-cod-bv");
    var codTcInput = document.getElementById("pbi-cod-tc");
    var codRroeInput = document.getElementById("pbi-cod-rroe");
    var notesInput = document.getElementById("pbi-notes");

    function getVal(input) {
        if (!input) return 0;
        var raw = parseInt(input.value, 10);
        if (isNaN(raw)) return 0;
        
        if (isNumericScale) {
            return raw; 
        } else {
            return (scaleValues[raw] !== undefined) ? scaleValues[raw] : 0; 
        }
    }

    var complexity = getVal(complexityInput);
    var effort = getVal(effortInput);
    var doubt = getVal(doubtInput);
    var codBv = getVal(codBvInput);
    var codTc = getVal(codTcInput);
    var codRroe = getVal(codRroeInput);
    
    var notes = notesInput.innerHTML;

    var isJobSizeComplete = complexity > 0 && effort > 0 && doubt > 0;
    var jobSizeValue = isJobSizeComplete ? (complexity + effort + doubt) : null;

    var isCodComplete = codBv > 0 && codTc > 0 && codRroe > 0;
    var codValue = isCodComplete ? (codBv + codTc + codRroe) : null;

    // Helper to capture current inputs for memory buckets
    var currentInputValues = {
        complexity: complexity, effort: effort, doubt: doubt,
        cod_bv: codBv, cod_tc: codTc, cod_rroe: codRroe
    };

    var pbiData = {
        title: title,
        complexity: complexity,
        effort: effort,
        doubt: doubt,
        jobSize: jobSizeValue,
        cod_bv: codBv,
        cod_tc: codTc,
        cod_rroe: codRroe,
        cod: codValue,
        tshirtSize: null,
        notes: notes
    };

    if (!isJobSizeComplete) {
        pbiData.tshirtSize = null;
    } else if (currentEditingId) {
        var existingPbi = pbis.find(function(p) { return p.id === currentEditingId; });
        pbiData.tshirtSize = existingPbi ? existingPbi.tshirtSize : null;
    }

    if (currentEditingId) {
        lastEditedPbiId = currentEditingId;
        var pbiIndex = pbis.findIndex(function(p) { return p.id === currentEditingId; });
        
        if (pbiIndex > -1) {
            var pbiToUpdate = pbis[pbiIndex];

            // --- SYNC MEMORY BUCKETS (Start) ---
            if (!pbiToUpdate.arithmeticValues) pbiToUpdate.arithmeticValues = {};
            if (!pbiToUpdate.fibonacciValues) pbiToUpdate.fibonacciValues = {};

            if (currentScale === 'fibonacci' || currentScale === 'safe') {
                Object.assign(pbiToUpdate.fibonacciValues, currentInputValues);

                const props = ['complexity', 'effort', 'doubt', 'cod_bv', 'cod_tc', 'cod_rroe'];
                props.forEach(function(prop) {
                    var modalValue = Number(currentInputValues[prop]);
                    var activePbiValue = Number(pbiToUpdate[prop]);
                    var existingArithValue = pbiToUpdate.arithmeticValues[prop];

                    // Sync to arithmetic only if value changed or backup is missing
                    var hasChanged = (modalValue !== activePbiValue);
                    var isBackupMissing = (existingArithValue === undefined || existingArithValue === null);

                    if (hasChanged || isBackupMissing) {
                        pbiToUpdate.arithmeticValues[prop] = modalValue;
                    }
                });
            } 
            else if (currentScale === 'metric' || currentScale === 'arithmetic') {
                Object.assign(pbiToUpdate.arithmeticValues, currentInputValues);
            }
            else {
                // Fallback / Other scales
                Object.assign(pbiToUpdate.arithmeticValues, currentInputValues);
                Object.assign(pbiToUpdate.fibonacciValues, currentInputValues);
            }
            // --- SYNC MEMORY BUCKETS (End) ---

            // Merge main data
            pbis[pbiIndex] = Object.assign({}, pbiToUpdate, pbiData);
        }
    } else {
        // Create new item
        var newPbi = Object.assign({ 
            id: Date.now(), 
            isReference: false,
            // Initialize buckets for new item
            arithmeticValues: Object.assign({}, currentInputValues),
            fibonacciValues: Object.assign({}, currentInputValues)
        }, pbiData);

        pbis.push(newPbi);
        lastEditedPbiId = newPbi.id;

        if (currentSortCriteria === 'custom') {
            lockedPbiOrder.push(newPbi.id);
        } else if (isFilterLocked) {
            lockedPbiOrder.push(newPbi.id);
        }
    }

    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();

    if (shouldClose && editModal) {
        editModal.style.display = "none";
    }
    
    if (typeof renderAll === 'function') {
        renderAll();
    }
}

/**
 * Handles the explicit submission of the Edit Modal (Clicking "Save").
 * <br><b>Core Responsibilities:</b>
 * This function orchestrates the entire lifecycle of saving a PBI:
 * <ol>
 * <li><b>Validation:</b> Ensures a Title is present (shows Alert if missing).</li>
 * <li><b>Data Extraction:</b> Reads all 6 slider inputs and the Rich Text notes field.</li>
 * <li><b>Scale Translation:</b> Uses `getVal` to convert the raw slider steps (0, 1, 2...) into meaningful values based on the active `currentScale` (e.g., Step 3 -> Value 5 in Fibonacci).</li>
 * <li><b>Derived Calculations:</b> Automatically computes the sums for Job Size (C+E+D) and Cost of Delay (BV+TC+RR/OE).</li>
 * <li><b>Dual-State Persistance (The "Memory" Feature):</b>
 * To support switching estimation scales without data loss, the function saves inputs into specific buckets:
 * <ul>
 * <li>If currently in <b>Fibonacci</b> mode: It updates `pbi.fibonacciValues`. Crucially, it <i>also</i> updates `pbi.arithmeticValues` if the values have changed, ensuring the linear scale stays in sync.</li>
 * <li>If currently in <b>Linear</b> mode: It updates `pbi.arithmeticValues`.</li>
 * </ul>
 * This allows a user to estimate in Linear, switch to Fibonacci, and switch back without their Linear values being "snapped" or corrupted.
 * </li>
 * <li><b>Create vs. Update:</b>
 * <ul>
 * <li><b>Edit:</b> Updates the existing object in the `pbis` array.</li>
 * <li><b>Create:</b> Instantiates a new PBI object with a timestamp ID and inserts it into the list (handling the special "Last Item" placeholder correctly).</li>
 * </ul>
 * </li>
 * <li><b>Cleanup:</b> Resets the `isModalDirty` flag, clears form inputs, and hides the modal.</li>
 * </ol>
 *
 * <br><b>Side Effects:</b>
 * - Triggers `saveToLocalStorage()` to persist data.
 * - Calls `renderAll()` to update the UI.
 * - Invokes `highlightAndScrollToLastEditedPbi()` to guide the user's eye to the item they just worked on.
 */
function handleSavePbi() {
    var titleInput = document.getElementById("pbi-title");
    var title = titleInput.value.trim();
    if (!title) {
        alert(config.uiStrings.alertTitleRequired || "Please enter a title.");
        return;
    }

    var scaleValues = SCALES[currentScale].values;
    var isNumericScale = (scaleValues.length > 0 && typeof scaleValues[0] === 'number');

    function getVal(id) {
        var el = document.getElementById(id);
        if (!el) return 0;
        var raw = parseInt(el.value, 10);
        if (isNaN(raw)) return 0;
        
        if (isNumericScale) {
            return raw; 
        } else {
            return (scaleValues[raw] !== undefined) ? scaleValues[raw] : 0; 
        }
    }

    var c = getVal('pbi-complexity');
    var e = getVal('pbi-effort');
    var d = getVal('pbi-doubt');
    var jobSize = c + e + d;

    var bv = getVal('pbi-cod-bv');
    var tc = getVal('pbi-cod-tc');
    var rroe = getVal('pbi-cod-rroe');
    var cod = bv + tc + rroe;

    var tshirtVal = null;
    if (isNumericScale) {
        if (typeof getTshirtSizeFromValue === 'function') {
            tshirtVal = getTshirtSizeFromValue(jobSize);
        } else if (typeof window.getTshirtSizeFromValue === 'function') {
            tshirtVal = window.getTshirtSizeFromValue(jobSize);
        }
    }

    var notesDiv = document.getElementById("pbi-notes");
    var notesHtml = notesDiv ? notesDiv.innerHTML : "";

    var currentInputValues = {
        complexity: c, effort: e, doubt: d,
        cod_bv: bv, cod_tc: tc, cod_rroe: rroe
    };

    if (currentEditingId) {
        var pbi = pbis.find(function(p) { return p.id === currentEditingId; });
        if (pbi) {
            if (!pbi.arithmeticValues) pbi.arithmeticValues = {};
            if (!pbi.fibonacciValues) pbi.fibonacciValues = {};

            if (currentScale === 'fibonacci' || currentScale === 'safe') {
                Object.assign(pbi.fibonacciValues, currentInputValues);

                const props = ['complexity', 'effort', 'doubt', 'cod_bv', 'cod_tc', 'cod_rroe'];
                props.forEach(function(prop) {
                    var modalValue = Number(currentInputValues[prop]);
                    var activePbiValue = Number(pbi[prop]);
                    var existingArithValue = pbi.arithmeticValues[prop];

                    var hasChanged = (modalValue !== activePbiValue);
                    var isBackupMissing = (existingArithValue === undefined || existingArithValue === null);

                    if (hasChanged || isBackupMissing) {
                        pbi.arithmeticValues[prop] = modalValue;
                    }
                });
            } 
            else if (currentScale === 'metric' || currentScale === 'arithmetic') {
                Object.assign(pbi.arithmeticValues, currentInputValues);
            }
            else {
                Object.assign(pbi.arithmeticValues, currentInputValues);
                Object.assign(pbi.fibonacciValues, currentInputValues);
            }

            pbi.title = title;
            pbi.complexity = c;
            pbi.effort = e;
            pbi.doubt = d;
            pbi.jobSize = jobSize;
            pbi.cod_bv = bv;
            pbi.cod_tc = tc;
            pbi.cod_rroe = rroe;
            pbi.cod = cod;
            pbi.notes = notesHtml;
            
            var isJobSizeComplete = c > 0 && e > 0 && d > 0;
            if (!isJobSizeComplete) {
                pbi.tshirtSize = null;
            } else if (tshirtVal) {
                pbi.tshirtSize = tshirtVal;
            }
            
            lastEditedPbiId = pbi.id;
        }
    } else {
        var newPbi = {
            id: Date.now(),
            title: title,
            complexity: c,
            effort: e,
            doubt: d,
            jobSize: jobSize,
            cod_bv: bv,
            cod_tc: tc,
            cod_rroe: rroe,
            cod: cod,
            tshirtSize: tshirtVal,
            notes: notesHtml,
            creationDate: new Date().toISOString(),
            arithmeticValues: Object.assign({}, currentInputValues),
            fibonacciValues: Object.assign({}, currentInputValues)
        };
        
        var lastIndex = pbis.length - 1;
        if (lastIndex >= 0 && pbis[lastIndex].isLastItem) {
            pbis.splice(lastIndex, 0, newPbi);
        } else {
            pbis.push(newPbi);
        }
        lastEditedPbiId = newPbi.id;
    }

    if (typeof markModalAsDirty === 'function') {
        isModalDirty = false; 
    }

    var modal = document.getElementById("edit-modal");
    modal.style.display = "none";
    
    titleInput.value = "";
    document.getElementById('pbi-complexity').value = "0";
    document.getElementById('pbi-effort').value = "0";
    document.getElementById('pbi-doubt').value = "0";
    
    document.getElementById('pbi-cod-bv').value = "0";
    document.getElementById('pbi-cod-tc').value = "0";
    document.getElementById('pbi-cod-rroe').value = "0";
    
    if (notesDiv) notesDiv.innerHTML = "";
    
    currentEditingId = null;

    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    
    renderAll();
    
    if (typeof highlightAndScrollToLastEditedPbi === 'function') {
        highlightAndScrollToLastEditedPbi();
    }
}


/**
 * Orchestrates the navigation between Backlog Items directly within the open modal.
 * <br><b>Feature: "Save & Navigate" Workflow</b>
 * This function implements a seamless editing flow. Before switching items, it checks the "Dirty State" via `getIsModalDirty()`:
 * <ul>
 * <li><b>If Dirty:</b> Calls `savePbiFromModal(false)` to persist changes to the current item <i>before</i> moving to the next one. This prevents data loss without pestering the user with "Do you want to save?" dialogs.</li>
 * <li><b>If Clean:</b> Simply switches the view to the target item.</li>
 * </ul>
 *
 * <br><b>Context-Aware Traversal:</b>
 * It relies on `getSortedPbis` to determine what the "Next" item actually is. This means navigation respects the user's current background context:
 * <ul>
 * <li><b>List View:</b> Navigates based on the visible list order (e.g., Sorted by Title or Custom Drag-Order).</li>
 * <li><b>WSJF View:</b> Navigates based on calculated economic rank (Rank 1 -> Rank 2), even if they are far apart in the ID list.</li>
 * </ul>
 *
 * @param {number} direction - The offset to move: `-1` for Previous, `+1` for Next.
 */
function handleModalNavClick(direction) {
    if (!currentEditingId) return;

    if (typeof getIsModalDirty === 'function' && getIsModalDirty()) {
        savePbiFromModal(false); 
    }

    var wsjfPanel = document.getElementById('panel-wsjf-viz');
    var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');
    var sortedPbis = getSortedPbis(pbis, currentSortCriteria, currentSortDirection, config, isWsjfTabActive);
    
    var navigableItems = sortedPbis.filter(function(p) { return !p.isLastItem; });
    var currentIndex = navigableItems.findIndex(function(p) { return p.id === currentEditingId; });

    if (currentIndex === -1) return;

    var newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < navigableItems.length) {
        showModal(navigableItems[newIndex]);
    }
}


/**
 * Initializes all global DOM event listeners for the application.
 * <br><b>Role (The Bootstrapper):</b>
 * This monolithic function is responsible for wiring up user interactions to the business logic. It runs once when the application starts.
 *
 * <br><b>Functional Areas:</b>
 * <ol>
 * <li><b>Modal & Form Interactions:</b>
 * <ul>
 * <li>Sets up the <b>Rich Text Editor</b> (Toolbar commands like Bold/Italic, Color Picker, Link insertion).</li>
 * <li>Implements the <b>Shared Slider Handler</b> (`handleSliderInput`) which enforces scale snapping (e.g., locking to Fibonacci numbers) and updates "Job Size" / "CoD" totals in real-time.</li>
 * <li>Manages the "Reset" buttons for clearing estimation groups.</li>
 * </ul>
 * </li>
 *
 * <li><b>Navigation & View Control:</b>
 * <ul>
 * <li>Binds clicks for the main View Tabs (Job Size, CoD, WSJF, Relative Sizing).</li>
 * <li>Handles the <b>Filter & Sorting Toolbar</b> (Asc/Desc, Filter by Metric, Custom Sort).</li>
 * <li>Implements the <b>Filter Lock</b> logic (`isFilterLocked`), which prevents sorting while a filter is active to preserve index integrity.</li>
 * </ul>
 * </li>
 *
 * <li><b>Cross-View Highlighting (Pointer Events):</b>
 * Adds global `pointerover` and `pointerout` listeners.
 * <i>Logic:</i> When the user hovers over an item in the List, this code immediately finds and highlights the corresponding bubbles in the Visualization columns, creating a cohesive visual experience.
 * </li>
 *
 * <li><b>Data Management:</b>
 * Wires up JSON Import/Export, CSV Export configuration, and the "Factory Reset" modal.
 * </li>
 *
 * <li><b>Responsiveness:</b>
 * Sets up `ResizeObserver` and window resize listeners to keep the grid layout (Equal Height Rows) synchronized.
 * </li>
 * </ol>
 *
 * <br><b>Architecture Note:</b>
 * Uses <b>Event Delegation</b> for the main PBI list (`#pbi-list`) and Visualization containers to ensure high performance even with hundreds of items.
 */
function setupEventListeners() {
    var editModal = document.getElementById("edit-modal");
    var pbiTitleInput = document.getElementById("pbi-title");
    var jobSizeSliders = [document.getElementById("pbi-complexity"), document.getElementById("pbi-effort"), document.getElementById("pbi-doubt")];
    var codSliders = [document.getElementById("pbi-cod-bv"), document.getElementById("pbi-cod-tc"), document.getElementById("pbi-cod-rroe")];
    var splitRootElement = document.getElementById('split-root');
    var pbiListContainerElement = document.getElementById('pbi-list-container');
    var modalPrevBtn = document.getElementById('modal-prev-btn');
    var modalNextBtn = document.getElementById('modal-next-btn');

    if (modalPrevBtn) {
        modalPrevBtn.addEventListener('click', function() {
            handleModalNavClick(-1);
        });
    }
    if (modalNextBtn) {
        modalNextBtn.addEventListener('click', function() {
            handleModalNavClick(1);
        });
    }
    
    var ignoreResolutionBtn = document.getElementById("resolution-warning-ignore-btn");
    if (ignoreResolutionBtn) {
        ignoreResolutionBtn.addEventListener("click", function() {
            window.isResolutionWarningDismissed = true; 
            if (typeof checkScreenResolution === 'function') {
                checkScreenResolution();
            }
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
        });
    }

    document.getElementById("export-btn").addEventListener("click", exportPbisAsJson);
    document.getElementById("import-btn").addEventListener("click", function() {
        document.getElementById("import-file-input").click()
    });
    document.getElementById("import-file-input").addEventListener("change", handleImport);
    document.getElementById("add-pbi-btn").addEventListener("click", function() {
        showModal()
    });
    document.getElementById("cancel-btn").addEventListener("click", function() {
        editModal.style.display = "none"
    });
    
    pbiTitleInput.addEventListener("input", function() {
        if (typeof validateAndSyncModal === 'function') validateAndSyncModal();
        if (typeof markModalAsDirty === 'function') markModalAsDirty();
    });

    var toolbar = document.getElementById('editor-toolbar');
    
    function updateEditorToolbarState() {
        if (!toolbar) return;

        var selection = window.getSelection();
        var isLink = false;
        if (selection.rangeCount > 0) {
            var node = selection.getRangeAt(0).startContainer;
            while (node) {
                if (node.nodeType === 1 && node.tagName === 'A') {
                    isLink = true;
                    break;
                }
                if (node.id === 'pbi-notes' || !node.parentNode) break;
                node = node.parentNode;
            }
        }

        var commands = ['bold', 'italic', 'underline', 'strikeThrough'];
        commands.forEach(function(cmd) {
            var btn = document.getElementById('btn-editor-' + (cmd === 'strikeThrough' ? 'strike' : cmd));
            if (btn) {
                if (document.queryCommandState(cmd)) {
                    if (cmd === 'underline' && isLink) {
                        btn.classList.remove('active');
                    } else {
                        btn.classList.add('active');
                    }
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        var linkBtn = toolbar.querySelector('.editor-btn[data-cmd="createLink"]');
        if (linkBtn) {
            if (isLink) {
                linkBtn.classList.add('active');
            } else {
                linkBtn.classList.remove('active');
            }
        }

        var currentColor = document.queryCommandValue('foreColor');
        function toHexLocal(col) {
            if (!col) return null;
            if (col.startsWith('#')) return col.toUpperCase();
            var rgb = col.match(/\d+/g);
            if (!rgb || rgb.length < 3) return null;
            function componentToHex(c) {
                var hex = parseInt(c).toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }
            return ("#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2])).toUpperCase();
        }

        var currentHex = toHexLocal(currentColor);
        var edColors = config.editorColors || config.defaultEditorColors || {};
        
        for (var i = 1; i <= 4; i++) {
            var btn = document.getElementById('btn-editor-c' + i);
            if (btn) btn.classList.remove('active');
        }

        if (currentHex) {
            for (var key in edColors) {
                if (edColors[key] && edColors[key].toUpperCase() === currentHex) {
                    var targetBtn = document.getElementById('btn-editor-c' + key);
                    if (targetBtn) targetBtn.classList.add('active');
                }
            }
        }
    }

    if (toolbar) {
        toolbar.addEventListener('click', function(e) {
            var btn = e.target.closest('.editor-btn');
            if (!btn) return;
            
            e.preventDefault(); 
            var cmd = btn.dataset.cmd;
            var arg = btn.dataset.arg || null;

            if (cmd === 'foreColor') {
                var idx = btn.dataset.colorIndex;
                var edColors = config.editorColors || config.defaultEditorColors || {};
                var color = edColors[idx] ? edColors[idx] : '#000000';
                document.execCommand('foreColor', false, color);
            } 
            else if (cmd === 'createLink') {
                var selection = window.getSelection();
                var anchorNode = null;
                if (selection.rangeCount > 0) {
                    var node = selection.getRangeAt(0).commonAncestorContainer;
                    while (node) {
                        if (node.nodeType === 1 && node.tagName === 'A') { anchorNode = node; break; }
                        node = node.parentNode;
                    }
                }
                var initialUrl = anchorNode ? anchorNode.href : 'https://';
                var url = prompt(config.uiStrings.linkPrompt || 'URL:', initialUrl);
                if (url) {
                    if (anchorNode) { anchorNode.href = url; } 
                    else { document.execCommand(cmd, false, url); }
                } else if (url === "") {
                    if (anchorNode) {
                        while (anchorNode.firstChild) { anchorNode.parentNode.insertBefore(anchorNode.firstChild, anchorNode); }
                        anchorNode.parentNode.removeChild(anchorNode);
                    }
                }
            } else if (cmd === 'removeFormat') {
                document.execCommand('removeFormat', false, null);
                document.execCommand('unlink', false, null);
                document.execCommand('formatBlock', false, 'div'); 
            } else {
                document.execCommand(cmd, false, arg);
            }
            
            var editor = document.getElementById('pbi-notes');
            if(editor) {
                editor.focus();
                if (typeof markModalAsDirty === 'function') markModalAsDirty();
                setTimeout(updateEditorToolbarState, 10);
            }
        });
    }

    var editorDiv = document.getElementById("pbi-notes");
    if (editorDiv) {
        editorDiv.addEventListener('keyup', updateEditorToolbarState);
        editorDiv.addEventListener('mouseup', updateEditorToolbarState);
        editorDiv.addEventListener('input', function() {
             if (typeof markModalAsDirty === 'function') markModalAsDirty();
        });

        editorDiv.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (link && editorDiv.contains(link)) {
                window.open(link.href, '_blank');
            }
        });

        editorDiv.addEventListener("paste", handlePasteInNote);
    }

    jobSizeSliders.forEach(function(slider) {
        if (slider) {
            slider.addEventListener("input", function() { handleSliderInput(slider); });
        }
    });

    codSliders.forEach(function(slider) {
        if (slider) {
            slider.addEventListener("input", function() { handleSliderInput(slider); });
        }
    });

    document.getElementById("reset-job-size-btn").addEventListener("click", function() {
        if (typeof markModalAsDirty === 'function') markModalAsDirty();
        jobSizeSliders.forEach(function(slider) {
            if (slider) {
                slider.value = 0;
                slider.dataset.interacted = "false";
                slider.dataset.zeroLocked = "false";
                if (typeof updateActiveScaleValue === 'function') updateActiveScaleValue(slider);
            }
        });
        if (typeof updateAllSliderFills === 'function') updateAllSliderFills();
        if (typeof updateSliderValues === 'function') updateSliderValues();
        if (typeof validateAndSyncModal === 'function') validateAndSyncModal();
        if (typeof updateResetJobSizeButtonVisibility === 'function') updateResetJobSizeButtonVisibility();
        document.getElementById('modal-tshirt-display').style.display = 'none';
    });

    var toggleRefMarkersBtn = document.getElementById("toggle-ref-markers-btn");
    if (toggleRefMarkersBtn) {
        toggleRefMarkersBtn.addEventListener("click", function() {
            window.showReferenceMarkers = !window.showReferenceMarkers;
            if (typeof generateSliderScales === 'function') generateSliderScales();
            if (typeof updateRefMarkerButtonState === 'function') updateRefMarkerButtonState();
            [].concat(jobSizeSliders, codSliders).forEach(function(s) { if(s && typeof updateActiveScaleValue === 'function') updateActiveScaleValue(s); });
        });
    }

    document.getElementById("reset-cod-btn").addEventListener("click", function() {
        if (typeof markModalAsDirty === 'function') markModalAsDirty();
        codSliders.forEach(function(slider) {
            if (slider) {
                slider.value = 0;
                slider.dataset.interacted = "false";
                slider.dataset.zeroLocked = "false";
                if (typeof updateActiveScaleValue === 'function') updateActiveScaleValue(slider);
            }
        });
        if (typeof updateAllSliderFills === 'function') updateAllSliderFills();
        if (typeof updateSliderValues === 'function') updateSliderValues();
        if (typeof validateAndSyncModal === 'function') validateAndSyncModal();
        if (typeof updateResetCoDButtonVisibility === 'function') updateResetCoDButtonVisibility();
    });

    document.getElementById("save-btn").addEventListener("click", handleSavePbi);
    document.getElementById("pbi-list").addEventListener("click", handlePbiListClick);

    if (pbiListContainerElement) {
        pbiListContainerElement.addEventListener("click", function(e) {
            var demoLink = e.target.closest(".empty-state-demo-data a[data-lang]:not(.disabled)");
            if (demoLink) {
                e.preventDefault();
                var lang = demoLink.dataset.lang;
                if (typeof loadDemoData === 'function') {
                    loadDemoData(lang);
                } else {
                    console.error('loadDemoData function is not defined.');
                }
            }
        });
    }

    document.getElementById("visualization-container").addEventListener("click", function(e) {
        if (e.target.closest('.last-item')) { return; }
        if (e.target.classList.contains("story-title-tshirt-clickable")) {
            showTshirtPopup(e.target);
        } else {
            var editButton = e.target.closest('.visualization-edit-btn');
            if (editButton) {
                var card = e.target.closest('.story-visualization');
                var pbiId = parseInt(card.dataset.id, 10);
                var pbiToEdit = pbis.find(function(p) { return p.id === pbiId; });
                if (pbiToEdit) { showModal(pbiToEdit); }
            }
        }
    });
    document.getElementById("cod-visualization-container").addEventListener("click", function(e) {
        if (e.target.closest('.last-item')) { return; }
        var editButton = e.target.closest('.visualization-edit-btn');
        if (editButton) {
            var card = e.target.closest('.story-visualization');
            var pbiId = parseInt(card.dataset.id, 10);
            var pbiToEdit = pbis.find(function(p) { return p.id === pbiId; });
            if (pbiToEdit) { showModal(pbiToEdit, { defaultTab: "cod" }); }
        }
    });
    var wsjfContainer = document.getElementById('wsjf-visualization-container');
    if (wsjfContainer) {
        wsjfContainer.addEventListener("click", function(e) {
            if (e.target.closest('.last-item')) { return; }
            if (e.target.classList.contains("story-title-tshirt-clickable")) {
                 showTshirtPopup(e.target);
            } else {
                var editButton = e.target.closest('.visualization-edit-btn');
                if (editButton) {
                    var card = e.target.closest('.story-visualization');
                    var pbiId = parseInt(card.dataset.id, 10);
                    var pbiToEdit = pbis.find(function(p) { return p.id === pbiId; });
                    if (pbiToEdit) { showModal(pbiToEdit); }
                }
            }
        });
    }

    document.getElementById('relative-sizing-list').addEventListener('click', function(e) {
        const cell = e.target.closest('.rs-cell');
        if (e.target.closest('.last-item')) { return; }
        if (cell && !cell.classList.contains('calculated')) {
            showValuePopup(cell);
        }
    });

    document.addEventListener("pointerover", function(e) {
        if (isDragging) { return; }
        var isHighlightEffectActive = document.querySelector('.is-just-edited');
        if (isHighlightEffectActive) { return; }
        var item = e.target.closest(".pbi-item, .story-visualization, .rs-item");
        if (item && item.dataset.id) {
            if (item.classList.contains('last-item')) { return; }
            if (parseInt(item.dataset.id, 10) === activePopupPbiId) { return; }
            if (item.classList.contains('is-just-edited')) { return; }
            toggleHighlight(item.dataset.id, true);
        }
     });
    document.addEventListener("pointerout", function(e) {
        var item = e.target.closest(".pbi-item, .story-visualization, .rs-item");
        if (item && item.dataset.id) {
            if (item.classList.contains('last-item')) { return; }
            if (parseInt(item.dataset.id, 10) === activePopupPbiId) { return; }
            var related = e.relatedTarget;
            if (!item.contains(related)) {
                toggleHighlight(item.dataset.id, false);
            }
        }
    });

    var wsjfVisContainer = document.getElementById('wsjf-visualization-container');
    if (wsjfVisContainer) {
        wsjfVisContainer.addEventListener("pointerover", function(e) {
            if (isDragging) { return; }
            var isHighlightEffectActive = document.querySelector('.is-just-edited');
            if (isHighlightEffectActive) { return; }

            var block = e.target.closest(".wsjf-delay-block");
            if (block && block.dataset.pbiId) {
                var pbiId = parseInt(block.dataset.pbiId, 10);
                if (pbiId === activePopupPbiId) { return; }
                toggleHighlight(pbiId, true);
            }
        });

        wsjfVisContainer.addEventListener("pointerout", function(e) {
            var block = e.target.closest(".wsjf-delay-block");
            if (block && block.dataset.pbiId) {
                var pbiId = parseInt(block.dataset.pbiId, 10);
                if (pbiId === activePopupPbiId) { return; }
                var related = e.relatedTarget;
                var relatedPbiId = null;
                if (related) {
                    var closestPbi = related.closest('[data-pbi-id]') || related.closest('[data-id]');
                    if (closestPbi) {
                         relatedPbiId = closestPbi.dataset.pbiId || closestPbi.dataset.id;
                    }
                }

                if (!block.contains(related) && String(pbiId) !== String(relatedPbiId) ) {
                    toggleHighlight(pbiId, false);
                }
            }
        });
    }

    var wsjfPanelContainer = document.getElementById('panel-wsjf-viz');
    if (wsjfPanelContainer) {
        wsjfPanelContainer.addEventListener('click', function(e) {
            var optimalTitle = e.target.closest('#wsjf-chart-optimal-title');
            if (optimalTitle) {
                var optimalWrapper = document.getElementById('wsjf-chart-optimal-wrapper');
                var mainWsjfContainer = document.getElementById('wsjf-visualization-container');

                if (optimalWrapper && mainWsjfContainer) { 
                    isOptimalChartCollapsed = !isOptimalChartCollapsed;
                    optimalWrapper.classList.toggle('collapsed', isOptimalChartCollapsed);
                    mainWsjfContainer.classList.toggle('wsjf-chart-compact', !isOptimalChartCollapsed);
                } else {
                    console.error("Could not find optimal chart wrapper or main WSJF container to collapse/expand.");
                }
            }
        });
    } else {
        console.warn("WSJF Panel container not found, cannot add collapse listener.");
    }

    var settingsModal = document.getElementById("settings-modal");
    document.getElementById("settings-btn").addEventListener("click", openSettingsModal);
    document.getElementById("help-btn").addEventListener("click", openDocumentation);
    document.getElementById("settings-cancel-btn").addEventListener("click", function() { settingsModal.style.display = "none" });
    document.getElementById("settings-save-btn").addEventListener("click", saveAndCloseSettings);
    document.getElementById("reset-settings-btn").addEventListener("click", resetSettingsToDefault);
    var infoModal = document.getElementById("info-modal");
    document.getElementById("info-btn").addEventListener("click", function() {
        infoModal.style.display = "flex";
     });
    document.getElementById("info-close-btn").addEventListener("click", function() { infoModal.style.display = "none" });

    var infoTabSoftware = document.getElementById("info-tab-btn-software");
    var infoTabThirdParty = document.getElementById("info-tab-btn-thirdparty");
    var infoContentSoftware = document.getElementById("info-tab-content-software");
    var infoContentThirdParty = document.getElementById("info-tab-content-thirdparty");

    if (infoTabSoftware && infoTabThirdParty && infoContentSoftware && infoContentThirdParty) {
        infoTabSoftware.addEventListener("click", function() {
            infoTabSoftware.classList.add("active");
            infoTabThirdParty.classList.remove("active");
            infoContentSoftware.classList.remove("hidden");
            infoContentThirdParty.classList.add("hidden");
        });

        infoTabThirdParty.addEventListener("click", function() {
            infoTabThirdParty.classList.add("active");
            infoTabSoftware.classList.remove("active");
            infoContentSoftware.classList.add("hidden");
            infoContentThirdParty.classList.remove("hidden");
        });
    }


    var filterButtons = document.querySelectorAll(".filter-btn");

    function setActiveFilterButton(clickedButton) {
        filterButtons.forEach(function(btn) {
            btn.classList.remove("active")
        });
        if (clickedButton) {
            clickedButton.classList.add("active");
        }
    }

    document.getElementById("filter-job-size-btn").addEventListener("click", function(e) {
        if (isFilterLocked) return;
        destroySortable();
        deactivateFilterLock();
        currentSortCriteria = "jobSize";
        setActiveFilterButton(e.target);
        renderAll();
    });
    document.getElementById("filter-cod-btn").addEventListener("click", function(e) {
        if (isFilterLocked) return;
        destroySortable();
        deactivateFilterLock();
        currentSortCriteria = "cod";
        setActiveFilterButton(e.target);
        renderAll();
    });
    document.getElementById("filter-wsjf-btn").addEventListener("click", function(e) {
        if (isFilterLocked) return;
        destroySortable();
        deactivateFilterLock();
        currentSortCriteria = "wsjf";
        setActiveFilterButton(e.target);
        renderAll();
    });
    document.getElementById("filter-tshirt-size-btn").addEventListener("click", function(e) {
        if (isFilterLocked) return;
        destroySortable();
        deactivateFilterLock();
        currentSortCriteria = "tshirtSize";
        setActiveFilterButton(e.target);
        renderAll();
    });

    document.getElementById("custom-sort-btn").addEventListener("click", function() {
        if (isFilterLocked) return;
        destroySortable();
        deactivateFilterLock();

        if (!initialCustomOrderSet || lockedPbiOrder.length === 0) {
            var wsjfPanel = document.getElementById('panel-wsjf-viz');
            var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');

            var previouslySortedPbis = getSortedPbis(
                pbis,
                currentSortCriteria !== 'custom' ? currentSortCriteria : (preLockSortCriteria || 'creationOrder'),
                currentSortDirection,
                config,
                isWsjfTabActive
            );
            lockedPbiOrder = previouslySortedPbis
                .filter(function(pbi) { return !pbi.isReference && !pbi.isLastItem; })
                .map(function(pbi) { return pbi.id; });
            initialCustomOrderSet = true;
        }
        currentSortCriteria = "custom";
        currentSortDirection = 'asc';
        setActiveFilterButton(null);
        renderAll();
    });

    document.getElementById("sort-asc-btn").addEventListener("click", function() {
        if (isFilterLocked) return;
        destroySortable();

        if (currentSortCriteria === 'lock' || currentSortCriteria === 'creationOrder') {
            currentSortCriteria = 'jobSize';
        }
        currentSortDirection = "asc";
        renderAll();
    });

    document.getElementById("sort-desc-btn").addEventListener("click", function() {
        if (isFilterLocked) return;
        destroySortable();

        if (currentSortCriteria === 'lock' || currentSortCriteria === 'creationOrder') {
            currentSortCriteria = 'jobSize';
        }
        currentSortDirection = "desc";
        renderAll();
    });

    document.getElementById("reset-filters-btn").addEventListener("click", function () {

         currentHighlightedColumn = null;

         if (currentSortCriteria === 'custom') {
             // Logic when resetting from custom sort...
         } else {
             destroySortable();
             if (isFilterLocked) {
                isFilterLocked = false;
                 var splitRootElement = document.getElementById('split-root');
                 if (splitRootElement) { splitRootElement.classList.remove('filter-locked'); }
             }
             currentSortCriteria = 'creationOrder';
             currentSortDirection = 'asc';
             preLockSortCriteria = currentSortCriteria;
             preLockSortDirection = currentSortDirection;
         }

         if (currentSortCriteria === 'creationOrder') {
            setActiveFilterButton(null);
         }
         
         updateFilterButtonStates();
         updateSortDirectionButtons(pbis, currentSortDirection);
         updateFilterLockButtonState();
         renderAll();
    });

    document.getElementById("filter-lock-btn").addEventListener("click", function() {
        isFilterLocked = !isFilterLocked;
        if (isFilterLocked) {
            destroySortable();
            preLockSortCriteria = currentSortCriteria;
            preLockSortDirection = currentSortDirection;

            var wsjfPanel = document.getElementById('panel-wsjf-viz');
            var isWsjfTabActive = wsjfPanel && !wsjfPanel.classList.contains('hidden');

            let pbisInCurrentOrder;
            if (currentSortCriteria === 'custom' || currentSortCriteria === 'lock') {
                 const pbiMap = pbis.reduce((map, pbi) => { if(pbi && !pbi.isLastItem) map[pbi.id] = pbi; return map; }, {});
                 pbisInCurrentOrder = lockedPbiOrder
                                        .map(id => pbiMap[id])
                                        .filter(pbi => pbi !== undefined);
                 const currentOrderIds = lockedPbiOrder.reduce((set, id) => { set[id] = true; return set; }, {});
                 const newPbis = pbis.filter(pbi => pbi && !pbi.isLastItem && !pbi.isReference && !currentOrderIds[pbi.id]);
                 pbisInCurrentOrder = pbisInCurrentOrder.concat(newPbis);
            } else {
                 pbisInCurrentOrder = getSortedPbis(pbis, preLockSortCriteria, preLockSortDirection, config, isWsjfTabActive);
            }
            lockedPbiOrder = pbisInCurrentOrder
                 .filter(function(pbi) { return pbi && !pbi.isReference && !pbi.isLastItem; })
                 .map(function(pbi) { return pbi.id; });
            setActiveFilterButton(null);
            currentSortCriteria = 'lock';
            if (splitRootElement) { splitRootElement.classList.add('filter-locked'); }
        } else {
            currentSortCriteria = preLockSortCriteria;
            currentSortDirection = preLockSortDirection;
            if (splitRootElement) { splitRootElement.classList.remove('filter-locked'); }
        }
        updateFilterLockButtonState();
        renderAll();
    });

    var tabJobSize = document.getElementById("tab-btn-jobsize");
    var tabCoD = document.getElementById("tab-btn-cod");
    var contentJobSize = document.getElementById("tab-content-jobsize");
    var contentCoD = document.getElementById("tab-content-cod");
    tabJobSize.addEventListener("click", function() {
        tabJobSize.classList.add("active");
        tabCoD.classList.remove("active");
        contentJobSize.classList.remove("hidden");
        contentCoD.classList.add("hidden");
        if (typeof updateResetJobSizeButtonVisibility === 'function') updateResetJobSizeButtonVisibility();
    });
    tabCoD.addEventListener("click", function() {
        tabCoD.classList.add("active");
        tabJobSize.classList.remove("active");
        contentCoD.classList.remove("hidden");
        contentJobSize.classList.add("hidden");
        if (typeof updateResetCoDButtonVisibility === 'function') updateResetCoDButtonVisibility();
    });

    const viewTabs = {
        'view-tab-job-size-viz': 'panel-job-size-viz',
        'view-tab-cod-viz': 'panel-cod-viz',
        'view-tab-wsjf-viz': 'panel-wsjf-viz',
        'view-tab-relative-sizing': 'panel-relative-sizing'
    };

    Object.keys(viewTabs).forEach(function(tabId) {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.addEventListener('click', function() {
                Object.keys(viewTabs).forEach(function(tId) {
                    var currentTab = document.getElementById(tId);
                    if (currentTab) currentTab.classList.remove('active');
                    var currentPanel = document.getElementById(viewTabs[tId]);
                    if (currentPanel) currentPanel.classList.add('hidden');
                });

                tab.classList.add("active");
                var targetPanel = document.getElementById(viewTabs[tabId]);
                if (targetPanel) targetPanel.classList.remove('hidden');

                var isWsjfNowActive = (tabId === 'view-tab-wsjf-viz');
                if (pbiListContainerElement) {
                     pbiListContainerElement.classList.toggle('wsjf-tab-view-active', isWsjfNowActive);
                }

                 if (typeof renderAll === 'function') {
                    renderAll();
                 } else {
                     console.error("renderAll function is not defined!");
                 }
            });
        } else {
             console.warn("Tab button with ID '" + tabId + "' not found.");
        }
    });

    document.getElementById('relative-sizing-header').addEventListener('click', function(e) {
        const header = e.target.closest('.rs-col-header');
        if (!header) return;
        const highlightBtn = e.target.closest('.highlight-btn');
        const sortBy = header.dataset.sortBy;

        var isCustomSortActive = currentSortCriteria === 'custom';

        if (highlightBtn) {
            e.stopPropagation(); 
            if (currentHighlightedColumn === sortBy) {
                currentHighlightedColumn = null;
            } else {
                currentHighlightedColumn = sortBy;
            }
            renderAll();
            return; 
        }

        if (isCustomSortActive || isFilterLocked) {
            return; 
        }

        destroySortable();
        deactivateFilterLock();

        if (currentSortCriteria === sortBy) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortCriteria = sortBy;
            currentSortDirection = 'asc';
        }
        renderAll();
    });

    if (typeof initSyncScroll === 'function') initSyncScroll();
    var resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (typeof syncRowHeights === 'function') syncRowHeights();
            if (typeof syncRelativeSizingHeaderPadding === 'function') syncRelativeSizingHeaderPadding();
            if (window._equalizeGridRows) { window._equalizeGridRows(); }
        }, 100);
    });
    (function() {
        const list = document.getElementById('relative-sizing-list');
        if (!list) return;
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(() => { requestAnimationFrame(function() {
                if (typeof syncRelativeSizingHeaderPadding === 'function') syncRelativeSizingHeaderPadding();
            }); });
            ro.observe(list);
            window._rsListResizeObserver = ro;
        }
        const mo = new MutationObserver(() => { requestAnimationFrame(function() {
            if (typeof syncRelativeSizingHeaderPadding === 'function') syncRelativeSizingHeaderPadding();
        }); });
        mo.observe(list, { childList: true, subtree: false });
        window._rsListMutationObserver = mo;
    })();
    window.addEventListener('beforeunload', function(event) {
        var hasRealPbis = pbis.some(function(p) { return !(p.isLastItem || p.id === -1); });
        if (config && config.defaultSettings && config.defaultSettings.confirmOnExit === true && hasRealPbis) {
            event.preventDefault();
            event.returnValue = config.uiStrings.confirmExit || 'You have unsaved changes. Are you sure you want to leave?';
        }
    });

    var resetAppModal = document.getElementById("reset-app-modal");
    
    document.getElementById("reset-app-btn").addEventListener("click", function() {
        if (resetAppModal) resetAppModal.style.display = "flex";
    });

    document.getElementById("reset-app-cancel-btn").addEventListener("click", function() {
        if (resetAppModal) resetAppModal.style.display = "none";
    });

    document.getElementById("reset-app-export-btn").addEventListener("click", function() {
        if (typeof exportPbisAsJson === 'function') {
            exportPbisAsJson();
        }
    });

    document.getElementById("reset-app-confirm-btn").addEventListener("click", function() {
        if (typeof clearLocalStorageAndReset === 'function') {
            clearLocalStorageAndReset();
        } else {
            if (window.localStorage) {
                window.localStorage.clear();
                window.location.reload();
            }
        }
    });

    var csvModal = document.getElementById("csv-export-modal");
    
    document.getElementById("btn-csv-export").addEventListener("click", function() {
        if (csvModal) {
            if (['jobSize', 'cod', 'wsjf', 'tshirtSize', 'custom'].includes(currentSortCriteria)) {
                exportSortCriteria = currentSortCriteria;
                exportSortDirection = currentSortDirection;
            } else {
                exportSortCriteria = 'jobSize';
                exportSortDirection = 'asc';
            }
            
            if (typeof updateExportModalUI === 'function') {
                updateExportModalUI();
            }
            csvModal.style.display = "flex";
        }
    });

    document.getElementById("btn-csv-export-cancel").addEventListener("click", function() {
        if (csvModal) csvModal.style.display = "none";
    });
 
    function setExportSort(crit) {
        exportSortCriteria = crit;
        updateExportModalUI();
    }

    document.getElementById("csv-sort-btn-job-size").addEventListener("click", function() { setExportSort('jobSize'); });
    document.getElementById("csv-sort-btn-tshirt-size").addEventListener("click", function() { setExportSort('tshirtSize'); });
    document.getElementById("csv-sort-btn-cod").addEventListener("click", function() { setExportSort('cod'); });
    document.getElementById("csv-sort-btn-wsjf").addEventListener("click", function() { setExportSort('wsjf'); });
    
    document.getElementById("csv-sort-custom-btn").addEventListener("click", function() { 
        setExportSort('custom'); 
        exportSortDirection = 'asc'; 
        updateExportModalUI();
    });

    document.getElementById("csv-sort-asc-btn").addEventListener("click", function() { 
        exportSortDirection = 'asc'; 
        updateExportModalUI(); 
    });
    
    document.getElementById("csv-sort-desc-btn").addEventListener("click", function() { 
        exportSortDirection = 'desc'; 
        updateExportModalUI(); 
    });

    document.getElementById("btn-csv-export-confirm").addEventListener("click", function() {
        if (typeof exportPbisAsCsv === 'function' && typeof getSortedPbis === 'function') {
            
            var sortedList = getSortedPbis(pbis, exportSortCriteria, exportSortDirection, config, false);
            
            exportPbisAsCsv(sortedList);
            
        } else {
            console.error("Export functions not found!");
        }
        
        if (csvModal) csvModal.style.display = "none";
    });
}


/**
 * Initialization: Attaches event listeners to the "Reference Slot (Left)" container.
 * <br><b>Context (UI Zones):</b>
 * The application allows items to be displayed in a dedicated "Reference Dock" (specifically `#ref-slot-left`), separate from the main backlog list.
 * Since these items exist outside the main `#pbi-list` DOM structure, they require a dedicated Event Delegation handler to capture user interactions.
 *
 * <br><b>Mirrored Functionality:</b>
 * This handler replicates the logic found in `handlePbiListClick` to ensure a consistent user experience. Whether an item is clicked in the main list or the reference dock, the behavior is identical:
 * <ul>
 * <li><b>Reference Toggling (Mutex):</b>
 * Checks for clicks on `.ref-btn-min` or `.ref-btn-max`.
 * Enforces the "Mutual Exclusion" rule: If a new item is set as Min, the old Min is automatically deselected.
 * </li>
 *
 * <li><b>Edit (`.edit`):</b>
 * Opens the central Edit Modal for the clicked item.
 * </li>
 *
 * <li><b>Delete (`.delete`):</b>
 * Performs the full deletion routine:
 * 1. Confirmation prompt.
 * 2. Removal from the `pbis` data array.
 * 3. Cleanup of the `lockedPbiOrder` (Custom Sort) array.
 * 4. Cleanup of Reference flags (if the deleted item was a reference).
 * </li>
 * </ul>
 *
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
    var slotLeft = document.getElementById('ref-slot-left');
    if (!slotLeft) { return; }

    slotLeft.addEventListener('click', function(e) {
        var pbiItem = e.target.closest('.pbi-item');
        if (!pbiItem) { return; }
        var pbiId = parseInt(pbiItem.dataset.id, 10);

        if (pbiId === -1) {
            return;
        }
        var pbi = pbis.find(function(p) { return p.id === pbiId; });
        if (pbi && pbi.isLastItem) {
            return;
        }

        if (e.target.closest('.reference-btn')) {
            var clickedPbi = pbis.find(function(p) { return p.id === pbiId; });
            if (clickedPbi) {
                if (e.target.closest(".ref-btn-min")) {
                    if (clickedPbi.referenceType === 'min') {
                        clickedPbi.referenceType = null;
                        clickedPbi.isReference = false;
                    } else {
                        var existingMin = pbis.find(function(p) { return p.referenceType === 'min'; });
                        if (existingMin) { existingMin.referenceType = null; existingMin.isReference = false; }
                        clickedPbi.referenceType = 'min';
                        clickedPbi.isReference = true;
                    }
                    renderAll();
                } 
                else if (e.target.closest(".ref-btn-max")) {
                    if (clickedPbi.referenceType === 'max') {
                        clickedPbi.referenceType = null;
                        clickedPbi.isReference = false;
                    } else {
                        var existingMax = pbis.find(function(p) { return p.referenceType === 'max'; });
                        if (existingMax) { existingMax.referenceType = null; existingMax.isReference = false; }
                        clickedPbi.referenceType = 'max';
                        clickedPbi.isReference = true;
                    }
                    renderAll();
                }
            }
            return;
        }

        if (e.target.classList.contains('edit')) {
            var toEdit = pbis.find(function(p) { return p.id === pbiId; });
            if (toEdit) { showModal(toEdit); }
            return;
        }

        if (e.target.classList.contains('delete')) {
            var pbiToDelete = pbis.find(function(p) { return p.id === pbiId; });
            if (pbiToDelete && pbiToDelete.isLastItem) {
                return;
            }

            if (confirm(config.uiStrings.confirmDelete)) {
                var pbiToDelete = pbis.find(function(p) { return p.id === pbiId; });
                if (pbiToDelete && pbiToDelete.isReference) {
                    pbiToDelete.isReference = false;
                    pbiToDelete.referenceType = null;
                }
                pbis = pbis.filter(function(p) { return p.id !== pbiId; });
                 lockedPbiOrder = lockedPbiOrder.filter(id => id !== pbiId);
                 if (pbis.filter(p => !p.isLastItem && !p.isReference).length === 0) {
                      initialCustomOrderSet = false;
                 }
                renderAll();
            }
        }
    });
});


/**
 * @ignore
 * CommonJS Module Export Definition (Main App Controllers).
 * <br><b>Architecture (The Core):</b>
 * This block exposes the primary "wiring" functions of the application. These are the functions that glue the UI, the Data Model, and the User Input together.
 * Exporting them allows for integration testing of the application's main workflows.
 *
 * <br><b>Categorization of Exports:</b>
 * <ul>
 * <li><b>Bootstrapping:</b> `setupEventListeners` - The single entry point that brings the static HTML to life.</li>
 *
 * <li><b>Drag-and-Drop Subsystem:</b> `initSortable`, `destroySortable`, `handleSortEnd` - These three form a complete lifecycle for managing the "Custom Sort" feature. Tests can verify that sorting is correctly enabled/disabled when switching filters.</li>
 *
 * <li><b>Global Event Handling:</b>
 * <ul>
 * <li>`handlePbiListClick`: The central router for all list interactions (Edit, Delete, Reference).</li>
 * <li>`toggleHighlight`: The visual sync engine connecting List, Bubbles, and Charts.</li>
 * <li>`updateFilterLockButtonState` / `deactivateFilterLock`: Controls the "Freeze View" logic.</li>
 * </ul>
 * </li>
 *
 * <li><b>Data Persistance Workflow:</b>
 * <ul>
 * <li>`handleSavePbi`: The robust save handler (Validation -> Calculation -> Storage -> Render).</li>
 * <li>`savePbiFromModal`: The silent/auto-save handler used during navigation.</li>
 * <li>`handleModalNavClick`: The navigation logic linking saving and view switching.</li>
 * </ul>
 * </li>
 * </ul>
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupEventListeners,
        toggleHighlight,
        updateFilterLockButtonState,
        deactivateFilterLock,
        handlePbiListClick,
        initSortable,
        destroySortable,
        handleSortEnd,
        handleSavePbi,
        handleModalNavClick,
        savePbiFromModal,
        handlePasteInNote,
        handleSliderInput
    };
}