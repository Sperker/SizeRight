// ===================================================================================
// 6_UTILS.JS
// ===================================================================================


/**
 * @file 6_UTILS.JS - The Logic Toolbox & Data Utility Layer
 * @description
 * This file serves as the utility and support layer for the application. It contains 
 * stateless helper functions, mathematical algorithms, and data transformation 
 * logic that provide the "heavy lifting" for other modules.
 * * 
 *
 * <br><b>Core Responsibilities:</b>
 * <ul>
 * <li><b>Mathematical Computations:</b> Implements core algorithms for 
 * calculating aggregate scores such as Job Size, Cost of Delay, and 
 * Weighted Shortest Job First (WSJF).</li>
 * <li><b>Data Transformation:</b> Provides functions to convert raw input 
 * values into scaled metrics based on the active Fibonacci or SAFe 
 * estimation scales.</li>
 * <li><b>Persistence Logic:</b> Manages interaction with the browser's 
 * <code>LocalStorage</code> to ensure user data and preferences persist 
 * across sessions.</li>
 * <li><b>Array & Object Utilities:</b> Offers specialized logic for 
 * searching, filtering, and mapping PBI objects, such as finding 
 * specific reference items.</li>
 * <li><b>Validation & Formatting:</b> Ensures data integrity by sanitizing 
 * user inputs, generating unique IDs, and formatting numeric values 
 * for localized display.</li>
 * </ul>
 *
 * <br><b>Technical Approach:</b>
 * This module is designed with a <b>Functional Programming</b> mindset, 
 * focusing on pure functions that receive inputs and return predictable 
 * outputs. This architecture facilitates easier unit testing and 
 * ensures that the utility logic remains independent of the UI state.
 */


// ===================================================================================
// UTILITY & HELPER FUNCTIONS
// ===================================================================================


/**
 * Updates the interactive state and visibility of the "Reset Job Size" button.
 * <br><b>UX Pattern (Layout Stability):</b>
 * Instead of hiding the button completely when no values are set (which would cause the modal height to jump), 
 * this function toggles the `disabled` attribute. This ensures the modal footer remains at a consistent position.
 * * <br><b>Logic:</b>
 * 1. Scans the DOM for the Complexity, Effort, and Doubt sliders.
 * 2. Checks if any of these sliders have a value greater than 0.
 * 3. <b>Enabled:</b> If at least one value is set, the button becomes clickable.
 * 4. <b>Disabled:</b> If all values are 0, the button is grayed out (disabled).
 * * <br><b>Side Effects:</b>
 * - Removes the `hidden` class from the button container to ensure it's part of the layout flow.
 * - conditionally adds the `no-margin` class to the modal footer to adjust spacing when the Job Size tab is active.
 */
function updateResetJobSizeButtonVisibility() {
    const resetButton = document.querySelector('#reset-job-size-btn');
    if (!resetButton || !resetButton.parentElement) {
        return;
    }
    const resetButtonContainer = resetButton.parentElement;
    const jobSizeSliders = [
        document.getElementById('pbi-complexity'),
        document.getElementById('pbi-effort'),
        document.getElementById('pbi-doubt')
    ];

    const isAnyJobSizeValueSet = jobSizeSliders.some(function(slider) {
        return slider && parseInt(slider.value, 10) > 0;
    });

    resetButton.disabled = !isAnyJobSizeValueSet;
    resetButton.style.display = ''; 

    resetButtonContainer.classList.remove('hidden');

    const footer = document.querySelector('#edit-modal .modal-footer');
    const tabContent = document.getElementById('tab-content-jobsize');
    
    if (footer && tabContent && !tabContent.classList.contains('hidden')) {
        footer.classList.add('no-margin');
    }
}


/**
 * Smoothly scrolls a scrollable container to position a specific target item in the **center** of the visible area.
 * <br><b>Math Logic:</b>
 * The function calculates the ideal scroll position using the formula:
 * <code>TargetTop - (ContainerHeight / 2) + (ItemHeight / 2)</code>.
 * This ensures that the vertical center of the item aligns with the vertical center of the viewport, 
 * providing better focus than standard `scrollIntoView()`.
 *
 * @param {HTMLElement} container - The scrollable parent element (e.g., the list container).
 * @param {HTMLElement} item - The specific child element to scroll to.
 */
function scrollContainerToItem(container, item) {
    if (!container || !item) {
        return;
    }

    const containerHeight = container.clientHeight;
    const itemTop = item.offsetTop - container.offsetTop;
    const itemHeight = item.offsetHeight;
    const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);

    container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
    });
}


/**
 * Provides visual feedback by scrolling to and highlighting the item that was just created or edited.
 * <br><b>State Dependency:</b>
 * Reads and consumes (resets) the global variable <code>lastEditedPbiId</code>.
 * <br><b>Async Behavior (Rendering Wait):</b>
 * Uses <code>setTimeout(..., 0)</code> to push the execution to the end of the call stack. 
 * This ensures that the <code>renderAll()</code> function has fully completed and the DOM elements 
 * actually exist before we try to find and scroll to them.
 * <br><b>Sequence:</b>
 * 1. <b>Cleanup:</b> Removes any lingering hover effects or highlights from other items to avoid visual clutter.
 * 2. <b>Scroll:</b> Automatically scrolls the relevant containers (List, Charts) so the item becomes visible (unless Filters are locked).
 * 3. <b>Flash:</b> Applies the CSS class <code>is-just-edited</code> to trigger a temporary animation (e.g., a yellow flash), 
 * which is automatically removed after 2.5 seconds.
 */
function highlightAndScrollToLastEditedPbi() {
    if (lastEditedPbiId === null) {
        return;
    }

    const pbiIdToHighlight = lastEditedPbiId;
    lastEditedPbiId = null;

    setTimeout(function() {
        var currentHoverHighlights = document.querySelectorAll(
            '.pbi-item.highlighted, ' +
            '.story-visualization.highlighted, ' +
            '.rs-item.highlighted'
        );
        currentHoverHighlights.forEach(function(item) {
            var id = item.dataset.id;
            if (id && typeof toggleHighlight === 'function') {
                 toggleHighlight(id, false);
            } else {
                 item.classList.remove('highlighted');
            }
        });

        var currentTShirtHighlights = document.querySelectorAll(
            '.pbi-item-tshirt.highlighted, ' +
            '.story-title-tshirt.highlighted'
        );
        currentTShirtHighlights.forEach(function(tshirt) {
            tshirt.classList.remove('highlighted');
            tshirt.style.backgroundColor = '';
            tshirt.style.borderColor = '';
            tshirt.style.color = '';
        });

        const pbiItem = document.querySelector('.pbi-item[data-id="' + pbiIdToHighlight + '"]');
        const rsItem = document.querySelector('.rs-item[data-id="' + pbiIdToHighlight + '"]');
        const jobSizeVizItem = document.querySelector('#visualization-container .story-visualization[data-id="' + pbiIdToHighlight + '"]');
        const codVizItem = document.querySelector('#cod-visualization-container .story-visualization[data-id="' + pbiIdToHighlight + '"]');
        const pbiListContainer = document.getElementById('pbi-list');
        const jobSizeVizContainer = document.getElementById('visualization-container');
        const codVizContainer = document.getElementById('cod-visualization-container');

        if (!isFilterLocked) {
            if (pbiItem && pbiListContainer) {
                scrollContainerToItem(pbiListContainer, pbiItem);
            }
            if (jobSizeVizItem && jobSizeVizContainer) {
                scrollContainerToItem(jobSizeVizContainer, jobSizeVizItem);
            }
            if (codVizItem && codVizContainer) {
                scrollContainerToItem(codVizContainer, codVizItem);
            }
        }

        if (pbiItem) {
            pbiItem.classList.add('is-just-edited');
        }
        if (rsItem) {
            rsItem.classList.add('is-just-edited');
        }
        if (jobSizeVizItem) {
            jobSizeVizItem.classList.add('is-just-edited');
        }
        if (codVizItem) {
            codVizItem.classList.add('is-just-edited');
        }

        setTimeout(function() {
            if (pbiItem) pbiItem.classList.remove('is-just-edited');
            if (rsItem) rsItem.classList.remove('is-just-edited');
            if (jobSizeVizItem) jobSizeVizItem.classList.remove('is-just-edited');
            if (codVizItem) codVizItem.classList.remove('is-just-edited');
        }, 2500);

    }, 0);
}


/**
 * Calculates the Weighted Shortest Job First (WSJF) score based on raw values.
 * <br><b>Formula:</b> <code>Cost of Delay / Job Size</code>
 * <br><b>Business Context:</b>
 * WSJF is a prioritization metric used to sequence jobs (e.g., Features, Epics) to produce maximum economic benefit.
 * It ensures that items delivering the highest value (Cost of Delay) in the shortest time (Job Size) are done first.
 * <br><b>Safety Mechanism:</b>
 * Contains a guard clause to prevent <b>Division by Zero</b> (Infinity) or NaN results.
 * Returns <code>0</code> if:
 * <ul>
 * <li><code>cod</code> or <code>jobSize</code> are missing/null.</li>
 * <li><code>jobSize</code> is strictly 0 (which would otherwise result in Infinity).</li>
 * </ul>
 *
 * @param {number} cod - The total Cost of Delay.
 * @param {number} jobSize - The size or duration of the job.
 * @returns {number} The calculated score or 0 if inputs are invalid.
 */
function calculateWSJF(cod, jobSize) {
    if (!cod || !jobSize || jobSize === 0) {
        return 0;
    }
    return cod / jobSize;
}


/**
 * Renders a dismissible notification bar at the top of the UI to alert the user about a new application version.
 * <br><b>DOM & Layout Interaction:</b>
 * 1. Dynamically creates the notification DOM structure and appends it to `#update-notification-container`.
 * 2. Calculates the exact height of the rendered notification banner using <code>requestAnimationFrame</code>.
 * 3. Sets the CSS Custom Property <code>--update-bar-height</code> on the root element. This allows the main application layout to visually "push down" automatically to accommodate the bar without overlapping content.
 * <br><b>Persistence (UX):</b>
 * When the user clicks the "Close" button:
 * <ul>
 * <li>The notification is removed from the DOM.</li>
 * <li>The CSS variable <code>--update-bar-height</code> is reset to 0px.</li>
 * <li>The specific <code>latestVersion</code> string is saved to LocalStorage under the key <code>sizeRight_dismissedUpdateVersion</code>. This ensures the user is not prompted again for the <i>same</i> version in future sessions.</li>
 * </ul>
 *
 * @param {string} latestVersion - The version string of the available update (e.g., "1.2.0").
 * @param {string} downloadUrl - The URL where the user can download the new version.
 */
function showUpdateNotification(latestVersion, downloadUrl) {
  var container = document.getElementById('update-notification-container');
  if (!container) return;

  if (container.querySelector('.update-notification')) return;

  var box = document.createElement('div');
  box.className = 'update-notification';

  var p = document.createElement('p');
  p.textContent = (config.uiStrings.updateChecker && config.uiStrings.updateChecker.updateNotification)
      || 'This version of the application is obsolete!';

  var btn = document.createElement('a');
  btn.className = 'btn btn-primary';
  btn.href = downloadUrl || (config.updateChecker && config.updateChecker.downloadUrl) || '#';
  btn.target = '_blank';
  btn.rel = 'noopener';
  var raw = (config.uiStrings.updateChecker && config.uiStrings.updateChecker.updateButtonText)
      || 'Download latest version {version}';
  btn.textContent = raw.replace('{version}', latestVersion || '');

  var close = document.createElement('button');
  close.className = 'close-btn';
  close.title = (config.uiStrings.btnClose || 'Schließen');
  close.textContent = '×';

  var center = document.createElement('div');
  center.className = 'notification-center';
  center.appendChild(p);
  center.appendChild(btn);

  box.appendChild(center);
  box.appendChild(close);
  container.appendChild(box);

  requestAnimationFrame(function () {
    var h = box.offsetHeight || 0;
    document.documentElement.style.setProperty('--update-bar-height', h + 'px');
  });

  close.addEventListener('click', function () {
    box.remove();
    document.documentElement.style.setProperty('--update-bar-height', '0px');
    
    if (latestVersion && typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem('sizeRight_dismissedUpdateVersion', latestVersion);
        } catch (e) {
            console.warn('Could not save dismissed update version:', e);
        }
    }
  });
}


/**
 * Compares two semantic version strings to determine their precedence order.
 * <br><b>Logic:</b>
 * 1. Splits both version strings into segments (e.g., "1.2" -> `[1, 2]`).
 * 2. Iterates through the segments, padding missing values with <code>0</code> (so "1.0" equals "1.0.0").
 * 3. Compares corresponding segments numerically.
 * <br><b>Use Case:</b>
 * Used by the Update Checker to determine if the remote version found on the server is newer than the currently running version.
 *
 * @param {string|number} a - The first version string (e.g., "0.0.9").
 * @param {string|number} b - The second version string to compare against.
 * @returns {number} A number indicating the sort order:
 * <ul>
 * <li><b>&gt; 0</b>: if <code>a</code> is newer (greater) than <code>b</code>.</li>
 * <li><b>&lt; 0</b>: if <code>a</code> is older (smaller) than <code>b</code>.</li>
 * <li><b>0</b>: if both versions are equal.</li>
 * </ul>
 */
function compareSemver(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}


/**
 * Orchestrates the application update check mechanism.
 * <br><b>Process Flow:</b>
 * 1. <b>Local Version:</b> Reads the current running version from the HTML `<meta name="version">` tag.
 * 2. <b>Config Check:</b> Verifies `config.updateChecker.enabled`. If disabled, it simply renders the local version string and exits without network activity.
 * 3. <b>Remote Check:</b> Performs a `fetch` request to the configured `versionUrl` to get the latest manifest (bypassing browser cache via `no-store`).
 * 4. <b>Comparison:</b> Uses `compareSemver` to determine if `Remote > Local`.
 * <br><b>UI Feedback:</b>
 * <ul>
 * <li><b>If Outdated:</b>
 * <ul>
 * <li>Updates the Info Modal text to show the local version in <span style="color:#c0392b">Red</span> and the new version in <span style="color:#27ae60">Green</span>.</li>
 * <li>Checks <code>localStorage</code> to see if the user previously dismissed <i>this specific</i> update. If not, calls <code>showUpdateNotification</code> to display the top banner.</li>
 * </ul>
 * </li>
 * <li><b>If Up-to-date:</b> Updates the Info Modal text to show the version in <span style="color:#27ae60">Green</span> with a confirmation message.</li>
 * </ul>
 *
 * @returns {Promise<void>|undefined} Returns the fetch promise (for async tracking) or undefined if disabled/failed.
 */
function checkForUpdates() {
    try {
        var meta = document.querySelector('meta[name="version"]');
        var localVersion = meta ? meta.getAttribute('content') : null;

        var versionValueEl = document.getElementById('info-version-value');
        
        var isEnabled = true;
        if (config && config.updateChecker && typeof config.updateChecker.enabled === 'boolean') {
            isEnabled = config.updateChecker.enabled;
        }

        if (!isEnabled) {
            if (versionValueEl && localVersion) {
                versionValueEl.textContent = localVersion;
                versionValueEl.style.color = ''; 
            }
            return;
        }

        if (versionValueEl && localVersion) {
            versionValueEl.textContent = localVersion;
        }

        if (!config || !config.updateChecker || !config.updateChecker.versionUrl) {
            return;
        }

        var baseUrl = config.updateChecker.versionUrl;
        var separator = baseUrl.includes('?') ? '&' : '?';
        var timestamp = Math.floor(Date.now() / 1000); 
        
        var targetUrl = baseUrl + separator + 'nocache=' + timestamp;

        //console.log('Update Check URL:', targetUrl);

        return fetch(targetUrl, { cache: 'no-store' })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                
                var remoteVersion = (data && (data.version || data.latest)) || null;

                if (!remoteVersion || !localVersion) return;

                var comparison = compareSemver(remoteVersion, localVersion);

                if (comparison > 0) {
                    
                    var dismissedVersion = null;
                    if (typeof window !== 'undefined' && window.localStorage) {
                        dismissedVersion = window.localStorage.getItem('sizeRight_dismissedUpdateVersion');
                    }

                    if (versionValueEl) {
                        versionValueEl.textContent = '';
                        var localSpan = document.createElement('span');
                        localSpan.style.color = '#c0392b';
                        localSpan.textContent = localVersion + ' ';
                        
                        var msg = document.createTextNode((config.uiStrings.infoVersionOutdated || 'is outdated, current is:') + ' ');
                        
                        var remoteSpan = document.createElement('span');
                        remoteSpan.style.color = '#27ae60';
                        remoteSpan.textContent = remoteVersion;
                        
                        versionValueEl.appendChild(localSpan);
                        versionValueEl.appendChild(msg);
                        versionValueEl.appendChild(remoteSpan);
                    }

                    if (!dismissedVersion || compareSemver(remoteVersion, dismissedVersion) > 0) {
                        showUpdateNotification(remoteVersion, data && data.downloadUrl);
                    }

                } else {

                    if (versionValueEl) {
                        versionValueEl.textContent = '';
                        var okSpan = document.createElement('span');
                        okSpan.style.color = '#27ae60';
                        okSpan.textContent = localVersion + ' ';
                        var okMsg = document.createTextNode(config.uiStrings.infoVersionCurrent || 'is up-to-date');
                        versionValueEl.appendChild(okSpan);
                        versionValueEl.appendChild(okMsg);
                    }
                }
            })
            .catch(function(err){
                // Leises Scheitern oder minimaler Log bei Netzwerkfehlern
                console.warn('Update check failed:', err);
            });
    } catch (e) {
        console.error(e);
    }
}


/**
 * Helper: Snaps a raw input value to the nearest valid option within a specific scale.
 * <br><b>Logic:</b>
 * This function handles two types of scales differently:
 * <ul>
 * <li><b>Non-Numeric (e.g., T-Shirt Sizes):</b> Assumes <code>val</code> is an index position. It rounds the index and returns the element at that position (e.g., 1.8 becomes index 2 -> "L").</li>
 * <li><b>Numeric (e.g., Fibonacci):</b> Performs a mathematical "nearest neighbor" search. It iterates through the allowed values and returns the one with the smallest absolute difference to the input <code>val</code>.</li>
 * </ul>
 * <br><b>Use Case:</b>
 * Used during scale conversion (e.g., mapping a Metric "4" to a Fibonacci "5") or when slider inputs need to snap to specific grid points.
 *
 * @param {number} val - The raw input value (or index) to match.
 * @param {Array<number|string>} scaleValues - The array of valid values defined in the scale config.
 * @returns {number|string} The nearest valid value from the scale.
 */
function findNearestScaleValue(val, scaleValues) {
    if (typeof scaleValues[0] !== 'number') return scaleValues[Math.round(val)];
    
    return scaleValues.reduce(function(prev, curr) {
        return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
    });
}


/**
 * Synchronizes the text display of all estimation sliders with their current input values.
 * <br><b>Scope:</b>
 * Iterates through a predefined map of Slider IDs (Input) to Label IDs (Span) for both Job Size and Cost of Delay metrics.
 * <br><b>UX Feature (Ghost Values):</b>
 * Handles the visual distinction for <b>New Items</b> vs. <b>Edited Items</b>.
 * <ul>
 * <li>If creating a <b>New Item</b> and the slider hasn't been touched yet (`data-interacted="false"`), it adds the CSS class <code>initial-state</code>. This typically grays out the "0" value to indicate it is a default placeholder, not a deliberate estimate.</li>
 * <li>Once the user interacts with a slider, or if editing an existing item (where `currentEditingId` is set), the class is removed, making the value appear active and confirmed.</li>
 * </ul>
 * <br><b>State Dependency:</b>
 * Reads the global variable <code>currentEditingId</code> to determine the current mode (Create vs. Edit).
 */
function updateSliderValues() {
    var isNewItem = currentEditingId === null;
    var ids = {
        'complexity-value': 'pbi-complexity',
        'effort-value': 'pbi-effort',
        'doubt-value': 'pbi-doubt',
        'cod-bv-value': 'pbi-cod-bv',
        'cod-tc-value': 'pbi-cod-tc',
        'cod-rroe-value': 'pbi-cod-rroe'
    };

    for (var spanId in ids) {
        var sliderId = ids[spanId];
        var valueSpan = document.getElementById(spanId);
        var slider = document.getElementById(sliderId);

        if (valueSpan && slider) {
            var val = slider.value;
            valueSpan.textContent = val;

            var hasInteracted = slider.dataset.interacted === 'true';
            if (isNewItem && !hasInteracted) {
                valueSpan.classList.add('initial-state');
            } else {
                valueSpan.classList.remove('initial-state');
            }
        }
    }
}


/**
 * Dynamically updates the visual "fill" (colored track) of a range slider based on its current value.
 * <br><b>The Problem:</b>
 * Standard HTML Range inputs do not natively support separate styling for the "filled" part (left of thumb)
 * versus the "empty" part (right of thumb) consistently across all browsers.
 * <br><b>The Solution (CSS Bridge):</b>
 * This function calculates the exact percentage position of the thumb using the formula:
 * <code>((val - min) / (max - min)) * 100</code>
 * It then sets this value as a CSS Custom Property (<code>--pct</code>) directly on the element.
 * <br><b>Usage in CSS:</b>
 * The stylesheet uses this variable to draw a dynamic <code>linear-gradient</code> background, creating the illusion of a filled track:
 * <code>background: linear-gradient(to right, var(--color) var(--pct), var(--grey) var(--pct));</code>
 *
 * @param {HTMLInputElement} slider - The slider input element to update.
 */
function updateSliderFill(slider) {
    if (!slider) return;
    const min = Number(slider.min || 0);
    const max = Number(slider.max || 100);
    const val = Number(slider.value || 0);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--pct', pct + '%');
}


/**
 * Bulk-updates the visual "fill" (colored track) for ALL range sliders in the Edit Modal.
 * <br><b>Purpose (Orchestrator):</b>
 * This function acts as a central initialization routine. While the user interaction triggers updates for individual sliders,
 * this function is required when:
 * <ul>
 * <li>The Modal opens (initial state).</li>
 * <li>An existing PBI is loaded (values are set programmatically).</li>
 * <li>The "Reset" button is clicked (values jump to 0).</li>
 * </ul>
 * <br><b>Mechanism:</b>
 * It explicitly targets the 6 core estimation inputs (3 for Job Size, 3 for Cost of Delay)
 * and invokes the `updateSliderFill` calculation for each to ensure the CSS gradients match the numeric values.
 */
function updateAllSliderFills() {
    updateSliderFill(document.getElementById('pbi-complexity'));
    updateSliderFill(document.getElementById('pbi-effort'));
    updateSliderFill(document.getElementById('pbi-doubt'));
    updateSliderFill(document.getElementById('pbi-cod-bv'));
    updateSliderFill(document.getElementById('pbi-cod-tc'));
    updateSliderFill(document.getElementById('pbi-cod-rroe'));
}


/**
 * Synchronizes the `max` attribute of all range sliders to match the currently active scale configuration.
 * <br><b>Abstraction Layer:</b>
 * Since HTML `<input type="range">` elements only accept numerical values, this function bridges the gap between the UI and the Data Model:
 * <ul>
 * <li><b>Numeric Scales (Metric, Fibonacci):</b> The slider's `max` is set to the highest actual number in the scale (e.g., 8, 13, or 100). The slider value directly represents the estimate.</li>
 * <li><b>Abstract Scales (T-Shirt):</b> The slider's `max` is set to the <i>index</i> of the last item (e.g., if sizes are ["S", "M", "L"], max is 2). The slider value represents the array index.</li>
 * </ul>
 * <br><b>Safety Mechanism (Clamping):</b>
 * When switching from a "large" scale (e.g., Metric 0-10) to a "small" scale (e.g., T-Shirt 0-3), 
 * the current slider value might technically exceed the new maximum. This function detects this out-of-bounds state 
 * and actively clamps the value down to the new maximum to prevent UI bugs.
 */
function syncSliderMax() {
    if (!SCALES || !SCALES[currentScale] || !SCALES[currentScale].values) {
        return;
    }

    var scaleValues = SCALES[currentScale].values;
    var isNumeric = typeof scaleValues[0] === 'number';

    var maxValue = isNumeric 
        ? Math.max.apply(null, scaleValues) 
        : scaleValues.length - 1;

    var allSliderIds = [
        'pbi-complexity', 'pbi-effort', 'pbi-doubt',
        'pbi-cod-bv', 'pbi-cod-tc', 'pbi-cod-rroe'
    ];

    allSliderIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.max = String(maxValue);
            if (parseInt(el.value, 10) > maxValue) {
                el.value = String(maxValue);
            }
        }
    });
}


/**
 * Initializes the resizable split-pane layout functionality.
 * <br><b>Interaction Model:</b>
 * Allows the user to drag the central divider (`#split-divider`) to adjust the width ratio between the left list pane and the right content pane.
 * <br><b>Logic & Constraints:</b>
 * <ul>
 * <li><b>Calculation:</b> Converts pixel movement into <code>flex-basis</code> percentages to maintain responsiveness.</li>
 * <li><b>Clamping:</b> Enforces a minimum width of <b>15%</b> and a maximum of <b>85%</b> for the left pane to prevent layout collapse.</li>
 * </ul>
 * <br><b>UX Handling (The Overlay Trick):</b>
 * During the drag operation, a temporary transparent overlay (`#split-drag-overlay`) is created covering the entire screen with a high z-index.
 * <b>Why?</b> This captures all mouse events, preventing the cursor from selecting text or getting "stuck" over iframes/buttons while dragging rapidly.
 * <br><b>Side Effects:</b>
 * Triggers `syncRowHeights()` continuously during drag to ensure the "Relative Sizing" grid rows stay visually aligned in real-time.
 */
function initSplit() {
    const root = document.getElementById('split-root');
    const left = root.querySelector('.pane-left');
    const divider = document.getElementById('split-divider');
    let dragging = false;
    let startCoord = 0;
    let startBasisPx = 0;

    const onMouseMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startCoord;
        const total = root.getBoundingClientRect().width;
        const newBasisPct = Math.min(Math.max(((startBasisPx + dx) / total) * 100, 15), 85);
        left.style.flexBasis = newBasisPct + '%';

        syncRowHeights();
    };

    const onMouseUp = () => {
        dragging = false;
        document.body.style.cursor = '';

        const overlay = document.getElementById('split-drag-overlay');
        if (overlay) {
            overlay.remove();
        }

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (window._equalizeGridRows) window._equalizeGridRows();
    };

    divider.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        e.preventDefault(); 
        dragging = true;
        startCoord = e.clientX;
        startBasisPx = left.getBoundingClientRect().width;
        document.body.style.cursor = 'col-resize';

        const overlay = document.createElement('div');
        overlay.id = 'split-drag-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '9999'; 
        overlay.style.cursor = 'col-resize';
        document.body.appendChild(overlay);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}


/**
 * Dynamically renders the interactive scale labels (ticks) below each range slider.
 * <br><b>Visual Layout Logic (Linear representation of Non-Linear scales):</b>
 * This function iterates from 0 to `maxValue` to generate the DOM elements.
 * <ul>
 * <li><b>Gaps (Fibonacci):</b> For scales like Fibonacci (1, 2, 3, 5, 8...), the function generates empty spacers (`empty-scale-step`) for missing numbers (e.g., 4, 6, 7). 
 * This ensures that the physical distance between "5" and "8" is visually larger than between "1" and "2", correctly representing the magnitude of effort.</li>
 * <li><b>Indices (T-Shirt):</b> Maps the slider's numeric index (0, 1, 2) to the corresponding string label ("S", "M", "L").</li>
 * </ul>
 * <br><b>Reference Anchoring:</b>
 * Checks if the currently pinned Reference Items (Min/Max) match a specific value on this scale.
 * If a match is found, it adds visual markers (`ref-marker-min/max`) to the tick label. This allows users to estimate "relative" to the defined anchors.
 * <br><b>Interaction:</b>
 * Makes every label clickable. Clicking on a number directly updates the linked slider to that value (Click-to-Snap).
 */
function generateSliderScales() {
    if (!SCALES || !SCALES[currentScale] || !SCALES[currentScale].values) return;

    var scaleValues = SCALES[currentScale].values;
    var isNumeric = typeof scaleValues[0] === 'number';
    var maxValue = isNumeric ? Math.max.apply(null, scaleValues) : scaleValues.length - 1;
    
    var refMin = (typeof getReferencePbi === 'function') ? getReferencePbi(pbis, 'min') : null;
    var refMax = (typeof getReferencePbi === 'function') ? getReferencePbi(pbis, 'max') : null;

    var sliderPropMap = {
        'pbi-complexity': 'complexity',
        'pbi-effort': 'effort',
        'pbi-doubt': 'doubt',
        'pbi-cod-bv': 'cod_bv',
        'pbi-cod-tc': 'cod_tc',
        'pbi-cod-rroe': 'cod_rroe'
    };

    document.querySelectorAll('.slider-scale').forEach(function(container) {
        container.innerHTML = '';
        var sliderId = container.dataset.sliderId;
        var propName = sliderPropMap[sliderId];

        for (var i = 0; i <= maxValue; i++) {
            var span = document.createElement('span');
            var isPresentInScale = isNumeric ? (scaleValues.indexOf(i) !== -1) : true;
            var displayValue = isNumeric ? i : scaleValues[i];

            if (isPresentInScale) {
                span.textContent = displayValue;
                
                if (propName && typeof window !== 'undefined' && window.showReferenceMarkers) {
                    if (refMin && refMin[propName] === displayValue) {
                        span.classList.add('ref-marker-min');
                        span.title = 'Reference Min: ' + (refMin.title || 'Item');
                    }
                    if (refMax && refMax[propName] === displayValue) {
                        span.classList.add('ref-marker-max');
                        span.title = 'Reference Max: ' + (refMax.title || 'Item');
                    }
                }

                span.addEventListener('click', function(val) {
                    return function() {
                        var slider = document.getElementById(sliderId);
                        if (slider) {
                            slider.value = val;
                            slider.dispatchEvent(new Event('input'));
                        }
                    };
                }(i));
            } else {
                span.innerHTML = '&nbsp;';
                span.classList.add('empty-scale-step');
            }

            container.appendChild(span);
        }
    });
}


/**
 * Updates the visibility and text content of the "Toggle Reference Markers" buttons in the Modal Footer.
 * <br><b>UX Pattern (Conditional Rendering):</b>
 * This function ensures that the UI remains clean by only showing the toggle buttons when they are relevant.
 * <ul>
 * <li><b>No References:</b> If no PBI is currently pinned as a Reference (Min or Max), the buttons are hidden (<code>display: none</code>). It makes no sense to toggle markers that don't exist.</li>
 * <li><b>References Exist:</b> The buttons are displayed, and their text is dynamically updated based on the <code>window.showReferenceMarkers</code> state (switching between "Show..." and "Hide...").</li>
 * </ul>
 * <br><b>Layout Synchronization:</b>
 * At the end, it explicitly calls `updateResetJobSizeButtonVisibility` and `updateResetCoDButtonVisibility`.
 * <b>Why?</b> Changing the display state of the Reference buttons alters the flow of elements in the modal footer. These calls ensure that margins and spacing for adjacent buttons (like "Reset") are recalculated to maintain a correct layout.
 */
function updateRefMarkerButtonState() {
    var btnJob = document.getElementById('toggle-ref-markers-btn');
    var btnCod = document.getElementById('toggle-ref-markers-cod-btn');

    var refMin = (typeof getReferencePbi === 'function') ? getReferencePbi(pbis, 'min') : null;
    var refMax = (typeof getReferencePbi === 'function') ? getReferencePbi(pbis, 'max') : null;
    var hasReferences = (refMin !== null || refMax !== null);

    var text = '';
    if (config && config.uiStrings && typeof window !== 'undefined') {
        text = window.showReferenceMarkers 
            ? config.uiStrings.btnHideRefMarkers 
            : config.uiStrings.btnShowRefMarkers;
    }

    if (btnJob) {
        if (!hasReferences) {
            btnJob.style.display = 'none';
        } else {
            btnJob.style.display = 'inline-block';
            if (text) btnJob.textContent = text;
        }
    }

    if (btnCod) {
        if (!hasReferences) {
            btnCod.style.display = 'none';
        } else {
            btnCod.style.display = 'inline-block';
            if (text) btnCod.textContent = text;
        }
    }
    
    updateResetJobSizeButtonVisibility();
    updateResetCoDButtonVisibility();
}


/**
 * Updates the interactive state and visibility of the "Reset Cost of Delay" (CoD) button.
 * <br><b>UX Pattern (Layout Stability):</b>
 * Similar to the Job Size reset logic, this function avoids hiding the button completely. 
 * Instead, it toggles the `disabled` attribute. This prevents the modal footer from "jumping" or resizing 
 * when the user adjusts values to zero, maintaining a consistent UI layout.
 * <br><b>Logic:</b>
 * 1. Scans the three specific Cost of Delay sliders (Business Value, Time Criticality, RR/OE).
 * 2. Checks if <b>any</b> slider has a value greater than 0.
 * 3. <b>Enabled:</b> If at least one value is set, the button allows resetting.
 * 4. <b>Disabled:</b> If all are 0, the button is visually present but unclickable.
 * <br><b>Side Effects:</b>
 * - Ensures the button container is visible (removes `hidden` class).
 * - Conditionally adds the `no-margin` class to the modal footer to fix specific spacing issues 
 * when the Cost of Delay tab (`#tab-content-cod`) is active.
 */
function updateResetCoDButtonVisibility() {
    const resetButton = document.querySelector('#reset-cod-btn');
    if (!resetButton || !resetButton.parentElement) return;
    
    const resetButtonContainer = resetButton.parentElement;
    const codSliders = [
        document.getElementById('pbi-cod-bv'),
        document.getElementById('pbi-cod-tc'),
        document.getElementById('pbi-cod-rroe')
    ];

    const isAnyCoDValueSet = codSliders.some(function(slider) {
        return slider && parseInt(slider.value, 10) > 0;
    });
    
    resetButton.disabled = !isAnyCoDValueSet;
    resetButton.style.display = ''; 

    resetButtonContainer.classList.remove('hidden');

    const footer = document.querySelector('#edit-modal .modal-footer');
    const tabContent = document.getElementById('tab-content-cod');

    if (footer && tabContent && !tabContent.classList.contains('hidden')) {
        footer.classList.add('no-margin');
    }
}


/**
 * Updates the visual highlighting of the specific scale label (tick) that matches the slider's current position.
 * <br><b>Visual Feedback:</b>
 * While the slider thumb shows the approximate position, this function highlights the actual number/text below the slider 
 * (by applying the <code>active-scale-value</code> CSS class) to give the user precise confirmation of the selected value.
 * <br><b>Zero Handling (UX):</b>
 * The logic specifically checks for <code>currentValue > 0</code>.
 * <b>Why?</b> In this application context, "0" represents an "Unset" or "Initial" state. Therefore, the "0" label is intentionally 
 * <b>NOT</b> highlighted. This creates a clear visual distinction between "No Estimate made yet" and "Lowest Estimate selected".
 * <br><b>DOM Connection:</b>
 * It dynamically finds the corresponding label container by matching the slider's ID with the container's <code>data-slider-id</code> attribute.
 *
 * @param {HTMLInputElement} slider - The slider input element that triggered the event.
 */
function updateActiveScaleValue(slider) {
    if (!slider) return;
    var scaleContainer = document.querySelector('.slider-scale[data-slider-id="' + slider.id + '"]');
    if (!scaleContainer) return;

    var currentValue = slider.value;

    scaleContainer.querySelectorAll('span').forEach(function(span) {
        var isActive = (currentValue > 0 && span.textContent == currentValue);
        span.classList.toggle('active-scale-value', isActive);
    });
}


/**
 * Dynamically generates and opens the Application Documentation in a new browser tab.
 * <br><b>Architecture (Single-File Distribution):</b>
 * Since this application is designed to run offline without a backend, the documentation HTML is stored as a string 
 * inside the `config` object (`config.languages[lang].documentationHtml`) rather than a separate .html file.
 * <br><b>The Build Process:</b>
 * 1. <b>Template Splitting:</b> It looks for the `<!DOCTYPE html>` marker to separate the "Body Content" from the "HTML Skeleton/Template".
 * 2. <b>Auto-TOC Algorithm:</b> It parses the body content into a temporary DOM to find all `H1` and `H2` tags. 
 * - It injects unique `id` attributes into these headers.
 * - It constructs a nested <b>Table of Contents</b> list based on the hierarchy (H1 = Parent, H2 = Child).
 * 3. <b>Injection:</b> Merges the Header, TOC, and Content, then injects them into the `<div id="wrapper">` of the template.
 * 4. <b>Rendering:</b> Opens a new `window` and uses `document.write` to render the final HTML.
 * <br><b>Error Handling:</b>
 * Detects if a Popup Blocker prevented the window from opening and alerts the user.
 */
function openDocumentation() {
    var documentationString = config.languages[currentLanguage].documentationHtml;
    if (!documentationString) {
        console.error('Documentation HTML for language "' + currentLanguage + '" not found in config.');
        alert("Documentation could not be opened.");
        return;
    }

    var splitMarker = '<!DOCTYPE html>';
    var parts = documentationString.split(splitMarker);
    var contentHtml = parts[0];
    var templateHtml = parts.length > 1 ? splitMarker + parts[1] : '<html><head><title>Documentation</title></head><body><div id="wrapper"></div></body></html>';

    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;

    var headerHtml = '<div class="doc-header">' +
                        '<h1>' + config.uiStrings.mainHeader + '</h1>' +
                        '<p>' + config.uiStrings.mainClaim + '</p>' +
                     '</div>';

    var headings = tempDiv.querySelectorAll('h1, h2');
    var tocHtml = '';
    if (headings.length > 0) {
        var tocTitle = config.uiStrings.tocTitle || 'Table of Contents';
        tocHtml = '<div class="toc"><h2>' + tocTitle + '</h2><ul>';

        var i = 0;
        while (i < headings.length) {
            var heading = headings[i];
            var text = heading.textContent;
            var id = 'toc-heading-' + i;
            heading.id = id;

            if (heading.tagName === 'H1') {
                tocHtml += '<li><a href="#' + id + '"><strong>' + text + '</strong></a>';

                if (i + 1 < headings.length && headings[i + 1].tagName === 'H2') {
                    tocHtml += '<ul>';
                    i++;
                    while (i < headings.length && headings[i].tagName === 'H2') {
                        var subHeading = headings[i];
                        var subText = subHeading.textContent;
                        var subId = 'toc-heading-' + i;
                        subHeading.id = subId;
                        tocHtml += '<li><a href="#' + subId + '">' + subText + '</a></li>';
                        i++;
                    }
                    tocHtml += '</ul>';
                } else {
                    i++;
                }

                tocHtml += '</li>';

            } else {
                tocHtml += '<li><a href="#' + id + '">' + text + '</a></li>';
                i++;
            }
        }

        tocHtml += '</ul></div>';
    }

    var finalContent = headerHtml + tocHtml + tempDiv.innerHTML;
    var finalHtml = templateHtml.replace('<div id="wrapper"></div>', '<div id="wrapper">' + finalContent + '</div>');

    var docWindow = window.open("", "_blank");
    if (docWindow) {
        docWindow.document.write(finalHtml);
        docWindow.document.close();
    } else {
        alert("Could not open documentation window. Please check your popup blocker settings.");
    }
}


/**
 * Serializes and persists the complete application state to the browser's LocalStorage.
 * <br><b>Storage Key:</b> <code>'sizeRight_autosave_v1'</code>
 * <br><b>Data Scope:</b>
 * The function creates a snapshot object containing two main sections:
 * <ol>
 * <li><b>Settings:</b> Current configuration including Language, Scale, Colors, Sort Criteria, and UI flags (e.g., Reference Markers visibility).</li>
 * <li><b>Backlog Items (PBIs):</b> The actual user data.</li>
 * </ol>
 * <br><b>Data Transformation & Cleanup:</b>
 * Before saving, the PBI list undergoes specific processing:
 * <ul>
 * <li><b>Filtering:</b> Removes the internal "Spacer Item" (`isLastItem: true`) to prevent duplicates upon reloading.</li>
 * <li><b>Enrichment (Custom Sort):</b> Maps the current position from `lockedPbiOrder` into a `customSortIndex` property on each PBI. This ensures the Drag-and-Drop order is restored correctly after a page reload.</li>
 * <li><b>Visuals:</b> Persists custom WSJF rank colors if they were modified by the user.</li>
 * </ul>
 * <br><b>Error Handling:</b>
 * Wraps the storage operation in a <code>try-catch</code> block to handle potential <code>QuotaExceededError</code> (storage full) or security restrictions (Private Browsing modes).
 */
function saveToLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
        var markersState = true;
        if (typeof window.showReferenceMarkers === 'boolean') {
            markersState = window.showReferenceMarkers;
        }

        var settings = {
            language: currentLanguage,
            scale: currentScale,
            tshirtSizes: config.tshirtSizes,
            colors: config.colors,
            editorColors: config.editorColors || config.defaultEditorColors,
            sortCriteria: currentSortCriteria,
            sortDirection: currentSortDirection,
            preLockSortCriteria: preLockSortCriteria, 
            preLockSortDirection: preLockSortDirection,
            showReferenceMarkers: markersState,
            isResolutionWarningDismissed: window.isResolutionWarningDismissed 
        };

        var pbisToSave = pbis.filter(function(pbi) {
            return pbi && !pbi.isLastItem;
        }).map(function(pbi) {
            var savePbi = JSON.parse(JSON.stringify(pbi));
            
            if (typeof pbiIdToCustomColor !== 'undefined' && pbiIdToCustomColor[savePbi.id]) {
                savePbi.wsjfRankColor = pbiIdToCustomColor[savePbi.id];
            }

            var indexInCustomOrder = lockedPbiOrder.indexOf(savePbi.id);
            if (indexInCustomOrder !== -1) {
                savePbi.customSortIndex = indexInCustomOrder;
            }
            return savePbi;
        });

        var state = {
            timestamp: Date.now(),
            settings: settings,
            backlogItems: pbisToSave
        };

        window.localStorage.setItem('sizeRight_autosave_v1', JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}


/**
 * Hydrates the application state by retrieving and parsing data from the browser's LocalStorage.
 * <br><b>Storage Key:</b> <code>'sizeRight_autosave_v1'</code>
 * <br><b>Purpose:</b>
 * Restores the user's session exactly as they left it. This includes the content (Backlog Items) 
 * and the configuration (Language, Colors, Sorting).
 *
 * <h3>Data Restoration Logic:</h3>
 * <ul>
 * <li><b>Sanitization:</b> Checks if the loaded data is valid JSON and contains an array of PBIs.</li>
 * <li><b>Settings Merge:</b> Uses <code>Object.assign</code> to merge saved settings with the current <code>config.default...</code>. 
 * <i>Why?</i> This ensures backward compatibility. If a newer version of the app introduces new color keys, 
 * loading an old save file won't crash the app because missing keys are filled with defaults.</li>
 * <li><b>Visual State:</b> Restores specific UI flags like <code>showReferenceMarkers</code> and <code>isResolutionWarningDismissed</code>.</li>
 * </ul>
 *
 * <h3>Custom Sort Reconstruction:</h3>
 * The function performs a complex reconstruction of the <code>lockedPbiOrder</code> array (used for Drag-and-Drop):
 * <ol>
 * <li>It separates PBIs into those that have a saved <code>customSortIndex</code> and those that don't.</li>
 * <li>It sorts the indexed items to restore the user's exact manual order.</li>
 * <li>It appends any new/unindexed items to the end of the order.</li>
 * <li>Finally, it rebuilds the global <code>lockedPbiOrder</code> array so the "Custom Sort" view works immediately.</li>
 * </ol>
 *
 * @returns {boolean} <code>true</code> if data was successfully loaded and applied, <code>false</code> if no data was found or an error occurred.
 */
function loadFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    try {
        var jsonStr = window.localStorage.getItem('sizeRight_autosave_v1');
        if (!jsonStr) return false;

        var data = JSON.parse(jsonStr);
        
        var importedSettings = data.settings;
        var importedPbis = data.backlogItems;

        if (!Array.isArray(importedPbis)) return false;

        if (typeof pbiIdToCustomColor !== 'undefined') pbiIdToCustomColor = {};
        if (typeof lockedPbiOrder !== 'undefined') lockedPbiOrder = [];
        if (typeof initialCustomOrderSet !== 'undefined') initialCustomOrderSet = false;

        var pbisWithSortIndex = [];
        var pbisWithoutSortIndex = [];

        importedPbis.forEach(function(pbi) {
            if (!pbi) return;

            if (pbi.isReference === true && !pbi.referenceType) {
                pbi.referenceType = 'min';
            }
            pbi.isReference = (pbi.referenceType === 'min' || pbi.referenceType === 'max');

            if (pbi.wsjfRankColor && typeof pbiIdToCustomColor !== 'undefined') {
                pbiIdToCustomColor[pbi.id] = pbi.wsjfRankColor;
            }

            if (typeof pbi.customSortIndex === 'number' && pbi.customSortIndex >= 0) {
                pbisWithSortIndex.push(pbi);
                initialCustomOrderSet = true;
            } else {
                pbisWithoutSortIndex.push(pbi);
            }
        });

        if (initialCustomOrderSet && typeof lockedPbiOrder !== 'undefined') {
            pbisWithSortIndex.sort(function(a, b) {
                return a.customSortIndex - b.customSortIndex;
            });
            lockedPbiOrder = pbisWithSortIndex.map(function(pbi) { return pbi.id; });
            pbisWithoutSortIndex.forEach(function(pbi) {
                lockedPbiOrder.push(pbi.id);
            });
        }

        if (importedSettings) {
            currentLanguage = importedSettings.language || config.defaultSettings.language;
            currentScale = importedSettings.scale || config.defaultSettings.scale;
            config.tshirtSizes = Array.isArray(importedSettings.tshirtSizes) ? importedSettings.tshirtSizes : config.defaultSettings.tshirtSizes;
            
            if (importedSettings.colors) config.colors = importedSettings.colors;
            if (importedSettings.editorColors) config.editorColors = importedSettings.editorColors;

            if (typeof window !== 'undefined') {
                if (typeof importedSettings.showReferenceMarkers === 'boolean') {
                    window.showReferenceMarkers = importedSettings.showReferenceMarkers;
                } else {
                    window.showReferenceMarkers = true;
                }
            }
            
            if (typeof importedSettings.isResolutionWarningDismissed === 'boolean') {
                window.isResolutionWarningDismissed = importedSettings.isResolutionWarningDismissed;
            }

            if (importedSettings.colors) {
                    config.colors = Object.assign({}, config.defaultColors, importedSettings.colors);
                } else if (config.defaultColors) {
                    config.colors = JSON.parse(JSON.stringify(config.defaultColors));
                }
                
                if (importedSettings.editorColors) {
                    config.editorColors = Object.assign({}, config.defaultEditorColors, importedSettings.editorColors);
                } else if (config.defaultEditorColors) {
                    config.editorColors = JSON.parse(JSON.stringify(config.defaultEditorColors));
                }

            if (config.languages && config.languages[currentLanguage]) {
                config.uiStrings = config.languages[currentLanguage];
            }

            currentSortCriteria = importedSettings.sortCriteria || 'creationOrder';
            currentSortDirection = importedSettings.sortDirection || 'asc';
            isFilterLocked = (currentSortCriteria === 'lock');
            
            preLockSortCriteria = importedSettings.preLockSortCriteria || (isFilterLocked ? 'creationOrder' : currentSortCriteria);
            preLockSortDirection = importedSettings.preLockSortDirection || (isFilterLocked ? 'asc' : currentSortDirection);
        }

        pbis = importedPbis;
        return true;

    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return false;
    }
}


/**
 * Asynchronously bundles the current application state and triggers a file download (JSON).
 * <br><b>Data Scope:</b>
 * The export includes both the <b>Backlog Items</b> and the <b>Global Configuration</b> (Settings, Colors, View Preferences).
 * This allows a complete state restoration when importing the file later.
 *
 * <h3>Data Preparation Logic:</h3>
 * <ul>
 * <li><b>Spacer Removal:</b> Filters out the internal "Last Item" (Spacer) to prevent duplication on import.</li>
 * <li><b>Sort Order Persistence:</b> The application holds the Drag-and-Drop order in a temporary global array (`lockedPbiOrder`). 
 * During export, this order is mapped into a persistent property `customSortIndex` on each PBI object, ensuring the manual order is saved.</li>
 * <li><b>Color Merging:</b> Merges transient `wsjfRankColor` definitions from the `pbiIdToCustomColor` lookup table directly into the PBI objects.</li>
 * </ul>
 *
 * <h3>Save Strategy (Progressive Enhancement):</h3>
 * This function utilizes the modern <b>File System Access API</b> (`showSaveFilePicker`) if supported by the browser.
 * <ul>
 * <li><b>Modern Browsers:</b> Opens a native "Save As" dialog, allowing the user to choose the directory and filename directly.</li>
 * <li><b>Legacy / Fallback:</b> If the API is unsupported (or if the user cancels/fails the modern dialog), it falls back to the traditional method: 
 * creating a temporary `<a>` tag with a `blob:` URL and triggering a click to download to the default "Downloads" folder.</li>
 * </ul>
 *
 * <h3>Filename Logic:</h3>
 * <ul>
 * <li>If the current session was loaded from a file, it suggests the original filename (overwriting workflow).</li>
 * <li>Otherwise, it generates a timestamped filename (e.g., `2023-10-27_14-30 - Backlog & Settings.json`).</li>
 * </ul>
 */
async function exportPbisAsJson() {
    var markersState = true;
    if (typeof window !== 'undefined' && typeof window.showReferenceMarkers === 'boolean') {
        markersState = window.showReferenceMarkers;
    }

    var settings = {
        language: currentLanguage,
        scale: currentScale,
        tshirtSizes: config.tshirtSizes,
        colors: config.colors,
        editorColors: config.editorColors || config.defaultEditorColors,
        sortCriteria: currentSortCriteria,
        sortDirection: currentSortDirection,
        preLockSortCriteria: preLockSortCriteria, 
        preLockSortDirection: preLockSortDirection,
        showReferenceMarkers: markersState,
        isResolutionWarningDismissed: window.isResolutionWarningDismissed 
    };

    var pbisToExport = pbis.filter(function(pbi) {
        return pbi && !pbi.isLastItem;
    }).map(function(pbi) {

        var exportPbi = JSON.parse(JSON.stringify(pbi));

        if (typeof pbiIdToCustomColor !== 'undefined' && pbiIdToCustomColor[exportPbi.id]) {
            exportPbi.wsjfRankColor = pbiIdToCustomColor[exportPbi.id];
        } else {
             delete exportPbi.wsjfRankColor;
        }

        var indexInCustomOrder = lockedPbiOrder.indexOf(exportPbi.id);
        if (indexInCustomOrder !== -1) {
            exportPbi.customSortIndex = indexInCustomOrder;
        } else {
             delete exportPbi.customSortIndex;
        }

        return exportPbi;
    });

    var exportData = {
        settings: settings,
        backlogItems: pbisToExport
    };

    var dataStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([dataStr], { type: 'application/json' });

    var fileName;
    if (lastImportedFileName) {
        fileName = lastImportedFileName.endsWith('.json') ? lastImportedFileName : lastImportedFileName + '.json';
    } else {
        var timestamp = new Date();
        var pad = function(num) { return num.toString().padStart(2, '0'); };
        fileName = timestamp.getFullYear() + '-' + pad(timestamp.getMonth() + 1) + '-' + pad(timestamp.getDate()) + '_' + (pad(timestamp.getHours()) + '-' + pad(timestamp.getMinutes())) + ' - Backlog & Settings.json';
    }

    var fallbackSave = function() {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (window.showSaveFilePicker) {
        try {
            var handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            var writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('showSaveFilePicker failed, falling back to traditional download.', err);
                fallbackSave();
            } else {
                console.log('User cancelled the save file dialog.');
            }
        }
    } else {
        console.warn('File System Access API not supported, falling back to traditional download.');
        fallbackSave();
    }
}


/**
 * Core logic for ingesting external JSON data into the application state.
 * <br><b>Format Support (Backward Compatibility):</b>
 * This function intelligently handles two file structures:
 * <ul>
 * <li><b>Modern Format (State Object):</b> An object containing <code>{ settings: {...}, backlogItems: [...] }</code>. This restores the full environment including language, colors, and sort preferences.</li>
 * <li><b>Legacy Format (Array):</b> A simple array of PBI objects. In this case, the Backlog is populated, but all Settings (Colors, Scale) are reset to application defaults to ensure a clean state.</li>
 * </ul>
 *
 * <h3>Restoration Logic:</h3>
 * <ul>
 * <li><b>Custom Sort Reconstruction:</b> The function reads the <code>customSortIndex</code> from each imported item to rebuild the global <code>lockedPbiOrder</code> array. This ensures that a list manually sorted via Drag-and-Drop looks exactly the same after import.</li>
 * <li><b>Visual State:</b> Restores custom colors (WSJF Ranks) and Reference Markers.</li>
 * <li><b>Global Reset:</b> Before applying, it clears specific global state variables (`pbiIdToCustomColor`, `lockedPbiOrder`) to prevent mixing old and new data traces.</li>
 * </ul>
 *
 * <br><b>User Interaction:</b>
 * If the current session already contains data (non-spacer items), it triggers a browser <code>confirm()</code> dialog to prevent accidental data loss.
 * Upon success, it updates <code>lastImportedFileName</code>, triggers a full re-render, and forces a save to LocalStorage.
 *
 * @param {object|Array} data - The parsed JSON data from the file.
 * @param {string} [fileName] - The name of the file (used for tracking and defaulting future exports).
 */
function applyImportedData(data, fileName) {
    try {
        var importedPbis;
        var importedSettings = null;

        if (data.hasOwnProperty('settings') && data.hasOwnProperty('backlogItems')) {
            importedSettings = data.settings;
            importedPbis = data.backlogItems;
            if (!Array.isArray(importedPbis)) {
                throw new Error("Invalid backlogItems format in new structure");
            }
        }
        else if (Array.isArray(data)) {
            importedPbis = data;
            importedSettings = null;
            console.warn("Importing old format (array of PBIs). Settings will be reset to defaults.");
        }
        else {
            throw new Error("Unrecognized file format");
        }

        if (importedPbis.length > 0 && (!importedPbis[0] || !importedPbis[0].hasOwnProperty('title'))) {
             throw new Error("Invalid backlog item structure in data");
        }

        var applyImport = function() {
            if (typeof pbiIdToCustomColor !== 'undefined') {
                pbiIdToCustomColor = {};
            }
            if (typeof lockedPbiOrder !== 'undefined') {
                lockedPbiOrder = [];
            }
            if (typeof initialCustomOrderSet !== 'undefined') {
                initialCustomOrderSet = false;
            }

            var pbisWithSortIndex = [];
            var pbisWithoutSortIndex = [];

            importedPbis.forEach(function(pbi) {
                if (!pbi) return;

                if (pbi.isReference === true && !pbi.referenceType) {
                    pbi.referenceType = 'min';
                }

                pbi.isReference = (pbi.referenceType === 'min' || pbi.referenceType === 'max');

                if (pbi.wsjfRankColor && typeof pbi.wsjfRankColor === 'string' && typeof pbiIdToCustomColor !== 'undefined') {
                    pbiIdToCustomColor[pbi.id] = pbi.wsjfRankColor;
                }

                if (typeof pbi.customSortIndex === 'number' && pbi.customSortIndex >= 0) {
                    pbisWithSortIndex.push(pbi);
                    initialCustomOrderSet = true;
                } else {
                    pbisWithoutSortIndex.push(pbi);
                }
            });

            if (initialCustomOrderSet && typeof lockedPbiOrder !== 'undefined') {
                pbisWithSortIndex.sort(function(a, b) {
                    return a.customSortIndex - b.customSortIndex;
                });
                lockedPbiOrder = pbisWithSortIndex.map(function(pbi) { return pbi.id; });
                pbisWithoutSortIndex.forEach(function(pbi) {
                    lockedPbiOrder.push(pbi.id);
                });
            }

            if (importedSettings) {
                currentLanguage = importedSettings.language || config.defaultSettings.language;
                currentScale = importedSettings.scale || config.defaultSettings.scale;
                config.tshirtSizes = Array.isArray(importedSettings.tshirtSizes) && importedSettings.tshirtSizes.length > 0
                                     ? importedSettings.tshirtSizes
                                     : config.defaultSettings.tshirtSizes;
                
                if (typeof window !== 'undefined') {
                    if (typeof importedSettings.showReferenceMarkers === 'boolean') {
                        window.showReferenceMarkers = importedSettings.showReferenceMarkers;
                    } else {
                        window.showReferenceMarkers = true;
                    }
                }

                if (typeof importedSettings.isResolutionWarningDismissed === 'boolean') {
                    window.isResolutionWarningDismissed = importedSettings.isResolutionWarningDismissed;
                }

                if (importedSettings.colors) {
                    config.colors = importedSettings.colors;
                } else if (config.defaultColors) {
                    config.colors = JSON.parse(JSON.stringify(config.defaultColors));
                }
                
                if (importedSettings.editorColors) {
                    config.editorColors = importedSettings.editorColors;
                } else if (config.defaultEditorColors) {
                    config.editorColors = JSON.parse(JSON.stringify(config.defaultEditorColors));
                }

                if (config.languages && config.languages[currentLanguage]) {
                    config.uiStrings = config.languages[currentLanguage];
                }

                currentSortCriteria = importedSettings.sortCriteria || 'creationOrder';
                currentSortDirection = importedSettings.sortDirection || 'asc';
                isFilterLocked = (currentSortCriteria === 'lock');

                preLockSortCriteria = importedSettings.preLockSortCriteria || (isFilterLocked ? 'creationOrder' : currentSortCriteria);
                preLockSortDirection = importedSettings.preLockSortDirection || (isFilterLocked ? 'asc' : currentSortDirection);

                if (currentSortCriteria !== 'custom' && currentSortCriteria !== 'lock') {
                   lockedPbiOrder = [];
                   initialCustomOrderSet = false;
                }

                if (typeof applyColorSettings === 'function') {
                    applyColorSettings(config.colors);
                }
                if (typeof applyUiStrings === 'function') {
                    applyUiStrings();
                }
            } else {
                currentLanguage = config.defaultSettings.language;
                currentScale = config.defaultSettings.scale;
                config.tshirtSizes = config.defaultSettings.tshirtSizes;
                
                if (typeof window !== 'undefined') {
                    window.showReferenceMarkers = config.defaultSettings.showReferenceMarkers !== undefined ? config.defaultSettings.showReferenceMarkers : true;
                }
                
                if (config.defaultColors) {
                    config.colors = JSON.parse(JSON.stringify(config.defaultColors));
                }
                if (config.defaultEditorColors) {
                    config.editorColors = JSON.parse(JSON.stringify(config.defaultEditorColors));
                }

                if (config.languages && config.languages[currentLanguage]) {
                    config.uiStrings = config.languages[currentLanguage];
                }

                currentSortCriteria = 'creationOrder';
                currentSortDirection = 'asc';
                isFilterLocked = false;
                lockedPbiOrder = []; 
                preLockSortCriteria = 'creationOrder';
                preLockSortDirection = 'asc';
                initialCustomOrderSet = false; 
                window.isResolutionWarningDismissed = false;

                if (typeof applyColorSettings === 'function') {
                    applyColorSettings(config.colors);
                }
                if (typeof applyUiStrings === 'function') {
                    applyUiStrings();
                }
            }

            pbis = importedPbis;

            if (typeof syncSliderMax === 'function') syncSliderMax();
            if (typeof generateSliderScales === 'function') generateSliderScales();
            if (typeof renderAll === 'function') renderAll(); 
            if (typeof updateFilterLockButtonState === 'function') updateFilterLockButtonState();
            if (typeof updateRefMarkerButtonState === 'function') updateRefMarkerButtonState();
            
           var splitRootElement = document.getElementById('split-root');
            if (splitRootElement) {
                splitRootElement.classList.toggle('filter-locked', isFilterLocked);
            }
            
            if (typeof checkScreenResolution === 'function') {
                checkScreenResolution();
            }

            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
        };

        if (typeof pbis !== 'undefined' && pbis.length > 0 && !pbis.every(function(p) { return p.isLastItem; })) {
            if (confirm(config.uiStrings.confirmImport)) {
                lastImportedFileName = fileName || null;
                applyImport();
                alert(config.uiStrings.importSuccess);
            } else {
                 if (fileName) {
                    lastImportedFileName = null; 
                 }
            }
        } else {
            lastImportedFileName = fileName || null;
            applyImport();
            alert(config.uiStrings.importSuccess);
        }

    } catch (error) {
        console.error("Import failed:", error);
        alert((config && config.uiStrings ? config.uiStrings.importError : "Error") + "\n" + error.message);
        lastImportedFileName = null;
    }
}

/**
 * Event handler triggered when a user selects a file via the `<input type="file">` element.
 * <br><b>Responsibilities:</b>
 * Acts as the entry point for the file import workflow. It orchestrates reading the file from the disk
 * and preparing the data for the core logic function (`applyImportedData`).
 *
 * <br><b>Technical Workflow:</b>
 * 1. <b>File Access:</b> Retrieves the first file object from `event.target.files`.
 * 2. <b>Asynchronous Reading:</b> Instantiates a `FileReader` to read the file content as text without blocking the UI thread.
 * 3. <b>Parsing & Validation:</b> Inside the `onload` callback, it attempts to `JSON.parse` the content.
 * - If parsing fails (SyntaxError), it alerts the user and aborts.
 * 4. <b>Delegation:</b> If valid JSON is obtained, it calls `applyImportedData(data, filename)` to handle the state restoration.
 *
 * <br><b>UX Pattern (Input Reset):</b>
 * Immediately after initiating the read, it executes `event.target.value = ''`.
 * <b>Why?</b> By clearing the input value, we allow the `change` event to fire again even if the user selects the <i>exact same file</i> immediately afterwards (e.g., if the first attempt failed or if they modified the file externally and want to reload it).
 *
 * @param {Event} event - The DOM `change` event triggered by the file input.
 */
function handleImport(event) {
    var file = event.target.files[0];
    if (!file) {
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var data;
        try {
            data = JSON.parse(e.target.result);
        } catch (error) {
             console.error("Import failed (JSON parse):", error);
             alert((config && config.uiStrings ? config.uiStrings.importError : "Error") + "\n" + error.message);
             lastImportedFileName = null;
             if (event.target) {
                 event.target.value = '';
             }
             return;
        }
        
        if (typeof applyImportedData === 'function') {
            applyImportedData(data, file.name);
        } else {
            console.error('applyImportedData function is not defined.');
            alert('A critical error occurred. Please reload the application.');
        }
    };

    reader.onerror = function(e) {
        console.error("File reading error:", e);
        alert((config && config.uiStrings ? config.uiStrings.importError : "Error") + "\n" + "File could not be read.");
        lastImportedFileName = null;
    };

    reader.readAsText(file);

    if (event.target) {
         event.target.value = '';
    }
}


/**
 * Fetches and injects a predefined demo dataset based on the user's selected language.
 * <br><b>Architecture (Remote Loading):</b>
 * Instead of hardcoding demo data into the JavaScript (which would bloat the application size), this function fetches an external JSON file from the server.
 * The path is resolved dynamically via `config.demoData[lang].path`.
 * <br><b>Mechanism (Reuse):</b>
 * Once the JSON is fetched, it treats the data exactly like a user-uploaded file. It passes the result to `applyImportedData`, 
 * ensuring that all validation, sanitization, and setting-restoration logic is applied consistently, regardless of the source.
 * <br><b>Network Strategy:</b>
 * Uses <code>fetch(path, { cache: 'no-store' })</code> to bypass the browser cache. This is critical to ensure that if the demo file is updated on the server 
 * (e.g., to fix a typo or update the data structure), the user immediately gets the new version without needing to clear their cache.
 *
 * @param {string} lang - The language code (e.g., 'en', 'de') to determine which demo file to load.
 */
function loadDemoData(lang) {
    if (!config || !config.demoData || !config.demoData[lang] || !config.demoData[lang].path) { // <-- Änderung: Prüfung auf 'path' hinzugefügt
        console.error('Demo data configuration not found for language: ' + lang);
        alert('Could not find the demo data file path.');
        return;
    }

    var path = config.demoData[lang].path;

    fetch(path, { cache: 'no-store' })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText + ' (' + path + ')');
            }
            return response.json();
        })
        .then(function(data) {
            if (typeof applyImportedData === 'function') {
                applyImportedData(data, path);
            } else {
                console.error('applyImportedData function is not defined.');
                alert('A critical error occurred. Please reload the application.');
            }
        })
        .catch(function(error) {
            console.error('Demo data fetch failed:', error);
            alert(config.uiStrings.importError + "\n" + error.message);
        });
}


/**
 * Establishes a synchronized scrolling link between the main PBI List and the Relative Sizing List.
 * <br><b>UX Goal:</b>
 * When the user scrolls in the main list, the secondary list (used for relative comparison) automatically moves with it, 
 * keeping the items visually aligned across both panels.
 *
 * <br><b>Technical Challenge (The Scroll Loop):</b>
 * Naively setting <code>target.scrollTop = source.scrollTop</code> inside a scroll event listener triggers a <i>new</i> scroll event on the target.
 * Since the target also listens for scroll events to sync back to the source, this creates an infinite loop (List A updates B -> B updates A -> A updates B...).
 *
 * <br><b>The Solution (Debounce/Lock):</b>
 * Uses a boolean lock <code>isSyncing</code> combined with <code>requestAnimationFrame</code>.
 * 1. When a scroll event fires, it checks if a sync is already in progress.
 * 2. If not, it sets the lock to <code>true</code> and updates the target position.
 * 3. The lock is released only in the next animation frame. This ensures that the "echo" event generated by the programmatic scroll is ignored.
 */
function initSyncScroll() {
    const list1 = document.getElementById('pbi-list');
    const list2 = document.getElementById('relative-sizing-list');
    let isSyncing = false;

    function syncScroll(source, target) {
        if (!isSyncing) {
            isSyncing = true;
            target.scrollTop = source.scrollTop;
            requestAnimationFrame(() => { isSyncing = false; });
        }
    }

    list1.addEventListener('scroll', () => syncScroll(list1, list2));
    list2.addEventListener('scroll', () => syncScroll(list2, list1));
}


/**
 * Enforces visual alignment between the Left Pane (PBI List) and the Right Pane (Relative Sizing) 
 * by synchronizing the height of corresponding items.
 * <br><b>The Problem:</b>
 * In a split-view layout, an item on the left might have a long title (wrapping to 3 lines), while the corresponding 
 * visualization on the right is short. Without synchronization, the rows would drift apart, breaking the visual 1-to-1 relationship.
 * * <br><b>Algorithm (Two-Pass Layout):</b>
 * 1. <b>Reset:</b> Temporarily disables CSS transitions and removes any existing `min-height` constraints. This returns elements to their "natural" content height.
 * 2. <b>Force Reflow:</b> Accesses `.offsetHeight` (using the `void` operator to ignore the result). This forces the browser to immediately flush pending style changes and recalculate the layout <i>before</i> we start measuring. Without this, `getBoundingClientRect` might return old, cached values.
 * 3. <b>Measure & Expand:</b> Compares the natural height of the Left vs. Right item, finds the maximum, and applies it as the new `min-height` to both.
 * 4. <b>Restore:</b> Re-enables CSS transitions in the next animation frame so that hover effects (like growing on mouseover) still work smoothly afterwards.
 * * <br><b>Performance Note:</b>
 * This function forces a synchronous layout (Reflow), which can be expensive. It is batched to minimize DOM thrashing 
 * but should still be called sparingly (e.g., only on window resize, drag-split end, or content changes).
 */
function syncRowHeights() {
    const pairs = [
        { leftId: "ref-slot-left", rightId: "ref-slot-right" },
        { leftId: "pbi-list", rightId: "relative-sizing-list" }
    ];

    pairs.forEach(function(pair) {
        var leftContainer = document.getElementById(pair.leftId);
        var rightContainer = document.getElementById(pair.rightId);

        if (leftContainer && rightContainer) {
            var leftItems = Array.from(leftContainer.children).filter(e => e.classList.contains("pbi-item"));
            var rightItems = Array.from(rightContainer.children).filter(e => e.classList.contains("rs-item"));
            
            var rightMap = {};
            rightItems.forEach(e => {
                var id = e.getAttribute("data-id");
                if (id) rightMap[id] = e;
            });

            var resetStyle = function(el) {
                el.style.transition = "none"; 
                el.style.minHeight = "";
                el.style.height = "";
            };

            leftItems.forEach(resetStyle);
            rightItems.forEach(resetStyle);

            void leftContainer.offsetHeight;
            void rightContainer.offsetHeight;

            leftItems.forEach(function(leftItem) {
                var id = leftItem.getAttribute("data-id");
                var rightItem = rightMap[id];

                if (rightItem) {
                    var hLeft = leftItem.getBoundingClientRect().height;
                    var hRight = rightItem.getBoundingClientRect().height;
                    var maxHeight = Math.max(hLeft, hRight);

                    leftItem.style.boxSizing = "border-box";
                    rightItem.style.boxSizing = "border-box";
                    
                    leftItem.style.minHeight = maxHeight + "px";
                    rightItem.style.minHeight = maxHeight + "px";
                }
            });
        }
    });

    requestAnimationFrame(function() {
        var allItems = document.querySelectorAll('.pbi-item, .rs-item');
        allItems.forEach(function(el) {
            el.style.transition = "";
        });
    });
}


/**
 * Helper function to retrieve a specific Reference Item (Anchor) from the backlog list.
 * <br><b>Concept (Relative Estimation):</b>
 * In relative estimation (like Magic Estimation), it is crucial to have baseline items to compare against. 
 * These items serve as fixed "Anchors" in the UI to help the team triangulate new estimates:
 * <ul>
 * <li><b>Min Reference:</b> Represents the smallest unit of work (e.g., a "1" or "XS").</li>
 * <li><b>Max Reference:</b> Represents the largest known unit of work (e.g., a "100" or "XL").</li>
 * </ul>
 * <br><b>Polymorphic Behavior:</b>
 * The function behaves differently based on the second argument:
 * <ul>
 * <li><b>With Type ('min'/'max'):</b> Returns the specific reference item matching that type (strict filter).</li>
 * <li><b>Without Type:</b> Returns the <i>first</i> item marked as a reference found in the list (generic lookup).</li>
 * </ul>
 *
 * @param {Array<Object>} list - The array of PBI objects to search.
 * @param {string} [type] - Optional. The specific reference type to look for (usually 'min' or 'max').
 * @returns {Object|null} The found PBI object, or <code>null</code> if no matching reference exists or the list is invalid.
 */
function getReferencePbi(list, type) {
    if (!Array.isArray(list)) { return null; }
    for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (p && p.isReference === true) {
            if (type) {
                if (p.referenceType === type) return p;
            } else {
                return p; 
            }
        }
    }
    return null;
}


/**
 * Convenience Wrapper: Retrieves the unique Identifier (ID) of a specific Reference Item from the list.
 * <br><b>Abstraction Layer:</b>
 * This function simplifies the access pattern. Instead of the caller having to:
 * 1. Call `getReferencePbi`
 * 2. Check if the result is not null
 * 3. Access `.id`
 * ...this function handles the existence check internally and directly returns the ID string or <code>null</code>.
 * <br><b>Use Case:</b>
 * Primarily used for DOM selections (e.g., finding the HTML element <code>[data-id="..."]</code> associated with the reference) 
 * or for logical comparisons (e.g., "Is the item currently being edited the Min-Reference?").
 *
 * @param {Array<Object>} list - The backlog list to search.
 * @param {string} [type] - The reference type ('min' or 'max').
 * @returns {string|null} The ID of the reference item, or <code>null</code> if none exists.
 */
function getReferencePbiId(list, type) {
    var ref = getReferencePbi(list, type);
    return ref ? ref.id : null;
}


/**
 * Determines whether the "Pin as Reference" feature is currently enabled based on the provided configuration.
 * <br><b>Feature Flag Logic (Opt-Out Strategy):</b>
 * This function implements a "True by Default" strategy to ensure the feature remains available unless explicitly disabled.
 * <ul>
 * <li><b>Explicit Disable:</b> The feature is only turned off if the config object <i>specifically</i> contains <code>pinReferenceEnabled: false</code>.</li>
 * <li><b>Default Enable:</b> In all other cases (config is missing, null, not an object, or the property is undefined), the function returns <code>true</code>.</li>
 * </ul>
 * <br><b>Use Case:</b>
 * Used by the UI rendering logic (specifically the Context Menu builder) to decide whether to render the "Pin as Min/Max Reference" options.
 * This allows administrators to simplify the UI by hiding advanced features via configuration if needed.
 *
 * @param {object} cfg - The configuration object to check.
 * @returns {boolean} <code>true</code> if the feature is allowed, <code>false</code> otherwise.
 */
function isPinReferenceEnabled(cfg) {
    if (!cfg || typeof cfg !== 'object') { return true; }
    if (typeof cfg.pinReferenceEnabled === 'boolean') { return cfg.pinReferenceEnabled; }
    return true;
}


/**
 * Computes the relative rank (1, 2, 3...) for all valid PBIs based on their calculated WSJF score.
 * <br><b>Business Logic (Prioritization):</b>
 * WSJF (Weighted Shortest Job First) dictates that items with the highest score deliver the most economic value per unit of time.
 * Therefore, the list is sorted in <b>Descending Order</b>:
 * <ul>
 * <li><b>Rank #1:</b> The item with the highest WSJF score (Highest Priority).</li>
 * <li><b>Rank #N:</b> The item with the lowest WSJF score.</li>
 * </ul>
 * <br><b>Filtering (Data Integrity):</b>
 * Not all items in the backlog are ranked. An item is strictly <b>excluded</b> from ranking if:
 * <ul>
 * <li>It is the internal "Last Item" (Spacer).</li>
 * <li>It has incomplete data (missing Cost of Delay or Job Size).</li>
 * <li>It has a value of 0 for either metric (prevents Division by Zero and ignores unestimated items).</li>
 * </ul>
 * <br><b>Output Format:</b>
 * Returns a Lookup Object (Hash Map) mapping <code>PBI ID -> Rank Number</code>.
 * This structure allows the UI renderer to check <code>ranks[id]</code> in O(1) time without looping through arrays.
 *
 * @param {Array<Object>} pbiList - The raw list of all backlog items.
 * @returns {Object} A map where keys are PBI IDs and values are their calculated rank (e.g., <code>{ "id_123": 1, "id_456": 2 }</code>).
 */
function calculateWsjfRanks(pbiList) {
    if (!pbiList || pbiList.length === 0) {
        return {};
    }

    var pbisWithWsjf = pbiList.filter(function(pbi) {
        return pbi &&
               !pbi.isLastItem &&
               typeof pbi.cod === 'number' && pbi.cod > 0 &&
               typeof pbi.jobSize === 'number' && pbi.jobSize > 0;
    }).map(function(pbi) {
        return {
            id: pbi.id,
            wsjf: pbi.cod / pbi.jobSize
        };
    });

    pbisWithWsjf.sort(function(a, b) {
        return b.wsjf - a.wsjf; 
    });

    var ranks = {};
    pbisWithWsjf.forEach(function(pbi, index) {
        ranks[pbi.id] = index + 1;
    });

    return ranks;
}


/**
 * Utility: Generates one or more colors from the configured global pastel palette.
 * <br><b>Modes of Operation:</b>
 * The function behaves differently depending on the input parameters:
 * <ol>
 * <li><b>Fallback Mode:</b> If the global `config.pastelColorPalette` is missing or empty, it returns a safe default gray (`#e0e0e0`) to prevent UI crashes.</li>
 * <li><b>Smart Single Mode (Anti-Collision):</b> If `count` is 1 and a `currentColor` is provided, it returns a random color from the palette excluding the current one.
 * <i>Why?</i> This is used when the user clicks a "Change Color" button. It ensures the color actually changes and doesn't randomly pick the same one again.</li>
 * <li><b>Sequential Mode:</b> If generating multiple colors or starting from a specific index, it uses modulo arithmetic (`%`) to loop through the fixed palette array. This ensures deterministic and evenly distributed colors for lists.</li>
 * </ol>
 *
 * @param {number} count - The number of colors to generate.
 * @param {string} [currentColor] - Optional. The current hex color to avoid (only used when count is 1).
 * @param {number} [startIndex] - Optional. The index in the palette array to start from (useful for sequential coloring of list items).
 * @returns {Array<string>} An array of hex color strings.
 */
function generatePastelColors(count, currentColor, startIndex) {
    var palette = (config && config.pastelColorPalette) || [];
    var result = [];
    var fallbackColor = '#e0e0e0';

    if (palette.length === 0) {
        console.warn("Pastel color palette is empty or not found in config. Using fallback.");
        for (var k = 0; k < count; k++) {
            result.push(fallbackColor);
        }
        return result;
    }

    if (count === 1 && currentColor) {
        var availableColors = [];
        for (var i = 0; i < palette.length; i++) {
            if (palette[i].toUpperCase() !== currentColor.toUpperCase()) {
                availableColors.push(palette[i]);
            }
        }
        if (availableColors.length > 0) {
            var randomIndex = Math.floor(Math.random() * availableColors.length);
            result.push(availableColors[randomIndex]);
        }
        else if (palette.length > 0) {
             result.push(palette[0]);
        } else {
             result.push(fallbackColor);
        }
        return result;
    }

    var actualStartIndex = (typeof startIndex === 'number' && startIndex >= 0) ? startIndex : 0;
    for (var j = 0; j < count; j++) {
        var colorIndex = (actualStartIndex + j) % palette.length;
        result.push(palette[colorIndex]);
    }

    return result;
}


/**
 * Utility: Converts a CSS RGB color string into its Hexadecimal representation.
 * <br><b>The Problem:</b>
 * When reading styles from the DOM (e.g., via `getComputedStyle`), browsers typically return colors in the format <code>rgb(255, 0, 0)</code>, 
 * even if the developer originally defined them as <code>#FF0000</code>. This makes strict string comparison difficult.
 * <br><b>Logic:</b>
 * 1. <b>Validation:</b> Checks if the input is a valid string.
 * 2. <b>Pattern Matching:</b> Uses a Regex to extract the three numeric components (Red, Green, Blue) from the string.
 * 3. <b>Conversion:</b> Converts each number to Base-16, pads it with a leading zero if necessary (e.g., 'A' -> '0A'), and concatenates them.
 * <br><b>Idempotency:</b>
 * If the input string is <i>already</i> a valid Hex code (e.g., "#ffffff"), the function detects this and simply returns it in uppercase format ("#FFFFFF"), acting as a pass-through normalizer.
 *
 * @param {string} rgbString - The color string to convert (e.g., "rgb(255, 99, 71)" or "#ff6347").
 * @returns {string|null} The normalized Hex string (e.g., "#FF6347") or <code>null</code> if the input format was invalid.
 */
function rgbToHex(rgbString) {
    if (!rgbString || typeof rgbString !== 'string') {
        return null;
    }
    
    var rgbMatch = rgbString.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i); 
    
    if (!rgbMatch) {
        if (/^#[0-9A-F]{6}$/i.test(rgbString)) {
            return rgbString.toUpperCase();
        }
        return null; 
    }

    function hex(x) {
        return ("0" + parseInt(x, 10).toString(16)).slice(-2);
    }

    return ("#" + hex(rgbMatch[1]) + hex(rgbMatch[2]) + hex(rgbMatch[3])).toUpperCase();
}


/**
 * Attaches an optimized event listener to the window's `resize` event to handle responsive layout adjustments.
 * <br><b>Performance Pattern (Throttling/Debouncing):</b>
 * Resize events fire extremely rapidly while the user drags the window edge. Executing heavy DOM calculations (`syncRowHeights`) 
 * on every single event would cause "jank" (visual stuttering).
 * <br><b>The Logic:</b>
 * 1. <b>Cancellation:</b> If a frame is already requested but hasn't executed yet, it is cancelled (`cancelAnimationFrame`). This ensures we don't stack up pending updates.
 * 2. <b>Scheduling:</b> The layout update logic is scheduled for the next available paint frame (`requestAnimationFrame`). 
 * This effectively limits the update rate to the screen's refresh rate (usually 60fps), keeping the UI smooth.
 * <br><b>Tasks executed on resize:</b>
 * <ul>
 * <li><b>Header Sync:</b> Re-calculates padding to account for scrollbar appearance/disappearance (`syncRelativeSizingHeaderPadding`).</li>
 * <li><b>Row Alignment:</b> Enforces height equality between the PBI list and the Relative Sizing visualization (`syncRowHeights`).</li>
 * <li><b>Grid Equalization:</b> Updates any grid layouts (if `_equalizeGridRows` exists).</li>
 * <li><b>Resolution Check:</b> Re-evaluates if the screen is too small and toggles the warning banner (`checkScreenResolution`).</li>
 * </ul>
 * <br><b>Initialization:</b>
 * Calls `checkScreenResolution()` immediately on invocation to handle the initial page load state.
 */
function initResizeHandler() {
    let resizeRequestId;
    window.addEventListener('resize', function() {
        if (resizeRequestId) {
            window.cancelAnimationFrame(resizeRequestId);
        }

        resizeRequestId = window.requestAnimationFrame(function() {
            if (typeof syncRelativeSizingHeaderPadding === 'function') {
                syncRelativeSizingHeaderPadding();
            }
            
            syncRowHeights();
            
            if (window._equalizeGridRows) {
                window._equalizeGridRows();
            }

            checkScreenResolution();
        });
    });

    checkScreenResolution();
}


/**
 * Checks the current browser viewport dimensions against the configured minimum requirements.
 * <br><b>UX Pattern (Feature Gating):</b>
 * Since this application uses a complex, multi-column "Split View" layout with extensive data visualization, 
 * it requires a certain amount of screen real estate to function usable.
 * <br><b>Logic:</b>
 * 1. <b>Thresholds:</b> Retrieves minimum width/height from `config.resolutionSettings` (Default: 1468px x 658px).
 * 2. <b>Validation:</b> Compares `window.innerWidth` and `window.innerHeight`.
 * 3. <b>State Check:</b> Respects the user's choice. If `window.isResolutionWarningDismissed` is true (set via the "Ignore" button), the check is bypassed.
 * <br><b>Visual Handling:</b>
 * <ul>
 * <li><b>Too Small:</b> Shows the `#resolution-warning` overlay (removes `hidden` class) and likely locks body scrolling (removes `scroll-active`).</li>
 * <li><b>Adequate Size:</b> Hides the overlay and restores normal interaction.</li>
 * </ul>
 */
function checkScreenResolution() {
    var warningOverlay = document.getElementById('resolution-warning');
    if (!warningOverlay) return;

    var minWidth = (config && config.resolutionSettings && config.resolutionSettings.minWidth) || 1468;
    var minHeight = (config && config.resolutionSettings && config.resolutionSettings.minHeight) || 658;

    var width = window.innerWidth;
    var height = window.innerHeight;

    if ((width < minWidth || height < minHeight) && !window.isResolutionWarningDismissed) {
        warningOverlay.classList.remove('hidden');
        document.body.classList.remove('scroll-active'); 
    } else {
        warningOverlay.classList.add('hidden');
        document.body.classList.add('scroll-active');
    }
}


/**
 * Hard resets the application by clearing all persisted local data and reloading the page.
 * <br><b>Scope of Deletion:</b>
 * Specifically targets and removes:
 * <ul>
 * <li><code>'sizeRight_autosave_v1'</code>: The user's main data (PBIs, Settings, Sort Order).</li>
 * <li><code>'sizeRight_dismissedUpdateVersion'</code>: Any flags related to update notifications/changelogs.</li>
 * </ul>
 * <br><b>Mechanism:</b>
 * After removing the keys from `localStorage`, it forces a browser reload (`window.location.reload()`).
 * This ensures the application re-initializes from a clean slate (using default config values) without any "ghost" state lingering in JavaScript variables.
 * <br><b>Use Case:</b>
 * Triggered by the "Factory Reset" button in the settings menu, typically used when the application state is corrupted or the user wants to start completely fresh.
 */
function clearLocalStorageAndReset() {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('sizeRight_autosave_v1');
        window.localStorage.removeItem('sizeRight_dismissedUpdateVersion');
        
        window.location.reload();
    }
}


/**
 * Utility: Converts an HTML string into Markdown format.
 * <br><b>Purpose:</b>
 * Used when switching between rich-text contexts (e.g., `contenteditable` divs) and plain-text storage or export formats.
 * <br><b>Algorithm (Recursive Traversal):</b>
 * 1. <b>Parsing:</b> Injects the HTML string into a temporary, disconnected DOM element (`temp`) to leverage the browser's native parser.
 * 2. <b>Tree Walking:</b> The inner `traverse` function recursively visits every node.
 * - <b>Text Nodes:</b> Returned as-is.
 * - <b>Element Nodes:</b> Their children are processed first (`content`), and then the resulting string is wrapped in specific Markdown delimiters based on the tag type.
 * <br><b>Whitespace Handling (The Regex Trick):</b>
 * The function uses `content.match(/^(\s*)(.*?)(\s*)$/s)` before wrapping text in bold/italic markers.
 * <b>Why?</b> Markdown parsers are strict. `** Text**` (space inside) is often rendered literally, whereas ` **Text** ` (space outside) renders correctly as bold.
 * This logic extracts leading/trailing whitespace and places the Markdown delimiters <i>inside</i> the whitespace envelope.
 * <br><b>Supported Tags:</b>
 * <ul>
 * <li>Formatting: `<b>`, `<strong>`, `<i>`, `<em>`, `<s>`, `<strike>`, `<del>`</li>
 * <li>Structure: `<p>`, `<div>`, `<br>`, `<ul>`, `<ol>`, `<li>`</li>
 * <li>Links: `<a>` (converts to `[text](href)`)</li>
 * </ul>
 *
 * @param {string} html - The input HTML string.
 * @returns {string} The converted Markdown string, with excessive newlines trimmed.
 */
function htmlToMarkdown(html) {
    if (!html) return "";
    
    var temp = document.createElement("div");
    temp.innerHTML = html;

    function traverse(node) {
        if (node.nodeType === 3) { 
            return node.nodeValue;
        }
        if (node.nodeType !== 1) { 
            return "";
        }

        var tagName = node.tagName.toLowerCase();
        var content = "";
        
        for (var i = 0; i < node.childNodes.length; i++) {
            content += traverse(node.childNodes[i]);
        }

        function wrap(wrapper) {
            if (!content.trim()) return content;
            var match = content.match(/^(\s*)(.*?)(\s*)$/s);
            return match[1] + wrapper + match[2] + wrapper + match[3];
        }

        switch (tagName) {
            case "b":
            case "strong":
                return wrap("**");
            case "i":
            case "em":
                return wrap("_");
            case "u": 
                return content; 
            case "s":
            case "strike":
            case "del":
                return wrap("~~");
            case "br":
                return "\n";
            case "div":
                return content.trim() ? content.trim() + "\n" : "";
            case "p":
                return content.trim() ? content.trim() + "\n\n" : "";
            case "li":
                return "- " + content.trim() + "\n";
            case "ul":
            case "ol":
                return "\n" + content.trim() + "\n";
            case "a":
                var href = node.getAttribute("href") || "";
                return "[" + content.trim() + "](" + href + ")";
            default:
                return content;
        }
    }

    var markdown = traverse(temp);

    return markdown.replace(/\n{3,}/g, "\n\n").trim();
}


/**
 * Generates and downloads a CSV file containing the provided Backlog Items.
 * <br><b>Excel Compatibility Strategy:</b>
 * This export is specifically tuned to open correctly in Microsoft Excel (especially in European locales):
 * <ul>
 * <li><b>BOM (\uFEFF):</b> Prepends a Byte Order Mark. This forces Excel to recognize the file as UTF-8 (rendering Emojis and special characters correctly).</li>
 * <li><b>Separator (;):</b> Uses a semicolon instead of a comma. This is the standard delimiter for regions that use a comma as a decimal separator (e.g., Germany), preventing column shifting.</li>
 * <li><b>Decimals:</b> Explicitly converts the WSJF score to use a comma (<code>.replace('.', ',')</code>) to ensure it is recognized as a number in these locales.</li>
 * </ul>
 * <br><b>Data Transformation:</b>
 * <ul>
 * <li><b>Notes Cleaning:</b> Calls <code>htmlToMarkdown</code> to convert the rich-text notes into readable plain text/markdown, removing HTML tags that would clutter the spreadsheet.</li>
 * <li><b>Escaping:</b> Wraps fields containing the separator, quotes, or newlines in double quotes (`"..."`) and escapes internal quotes (`""`) to adhere to the CSV standard.</li>
 * </ul>
 * <br><b>Filename Logic:</b>
 * Tries to preserve the name of the last imported file (swapping extension to .csv) to maintain project context. If no file was loaded, generates a timestamped default name.
 *
 * @param {Array<Object>} pbisToList - The list of PBI objects to export.
 */
function exportPbisAsCsv(pbisToList) {
    if (!pbisToList || pbisToList.length === 0) return;

    var s = config.uiStrings;
    var sep = ";"; 
    var lineBreak = "\r\n";

    var headers = [
        s.modalPlaceholderTitle || "Title",
        s.colComplexity || "Complexity",
        s.colEffort || "Effort",
        s.colDoubt || "Uncertainty",
        s.colJobSize || "Job Size",
        s.pbiInfoTshirtSize || "T-Shirt Size", 
        s.modalLabelCodBv || "BV",
        s.modalLabelCodTc || "TC",
        s.modalLabelCodRroe || "RR/OE",
        s.pbiInfoCoD || "CoD",
        s.colWsjf || "WSJF",
        s.modalLabelNotes || "Notes",
        s.csvHeaderRef || "Reference Item"
    ];

    var csvContent = "\uFEFF"; 
    csvContent += headers.join(sep) + lineBreak;

    function escapeCsv(val) {
        if (val === null || val === undefined) return "";
        var stringVal = String(val);
        if (stringVal.indexOf(sep) > -1 || stringVal.indexOf('"') > -1 || stringVal.indexOf('\n') > -1) {
            return '"' + stringVal.replace(/"/g, '""') + '"';
        }
        return stringVal;
    }

    pbisToList.forEach(function(pbi) {
        if (!pbi || pbi.isLastItem) return;

        var isJobSizeComplete = pbi.complexity > 0 && pbi.effort > 0 && pbi.doubt > 0;
        
        var jobSize = isJobSizeComplete ? pbi.jobSize : "";
        var cod = (pbi.cod && pbi.cod > 0) ? pbi.cod : "";
        
        var wsjf = "";
        if (isJobSizeComplete && cod !== "") {
            wsjf = (pbi.cod / pbi.jobSize).toFixed(2).replace('.', ',');
        }

        var refType = "";
        if (pbi.isReference) {
            refType = pbi.referenceType || "yes";
        }

        var notesMarkdown = htmlToMarkdown(pbi.notes);

        var row = [
            escapeCsv(pbi.title),
            pbi.complexity || 0,
            pbi.effort || 0,
            pbi.doubt || 0,
            jobSize,
            pbi.tshirtSize || "-", 
            pbi.cod_bv || 0,
            pbi.cod_tc || 0,
            pbi.cod_rroe || 0,
            cod,
            wsjf,
            escapeCsv(notesMarkdown),
            refType
        ];

        csvContent += row.join(sep) + lineBreak;
    });

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    var fileName;
    if (lastImportedFileName) {
        var baseName = lastImportedFileName.replace(/\.[^/.]+$/, "");
        fileName = baseName + ".csv";
    } else {
        var timestamp = new Date();
        var pad = function(num) { return num.toString().padStart(2, '0'); };
        fileName = timestamp.getFullYear() + '-' + pad(timestamp.getMonth() + 1) + '-' + pad(timestamp.getDate()) + '_' + (pad(timestamp.getHours()) + '-' + pad(timestamp.getMinutes())) + ' - Backlog.csv';
    }

    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}



/**
 * @ignore
 * CommonJS Module Export Definition.
 * <br><b>Architecture (Dual-Environment Support):</b>
 * This block implements a conditional export pattern to make the application logic accessible in two different contexts:
 * <ol>
 * <li><b>Browser Context (Production):</b> Browsers typically do not define `module` (unless using a bundler). The `if` condition returns `false`, preventing ReferenceErrors, and the functions remain available in the global scope (or file scope) as defined above.</li>
 * <li><b>Node.js / Test Runner Context (Development):</b> When running unit tests (e.g., via Jest or Mocha), `module` is defined. The block exports all critical internal functions, allowing the test suite to import and verify logic like `calculateWSJF`, `rgbToHex`, or `generatePastelColors` in isolation without a DOM.</li>
 * </ol>
 * <br><b>Purpose:</b>
 * Facilitates <b>Test-Driven Development (TDD)</b> and automated regression testing for a project structure that is otherwise designed as a "Single File Application".
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveToLocalStorage,
        loadFromLocalStorage,
        calculateWSJF,
        updateSliderFill,
        updateResetJobSizeButtonVisibility,
        scrollContainerToItem,
        highlightAndScrollToLastEditedPbi,
        showUpdateNotification,
        compareSemver,
        checkForUpdates,
        updateSliderValues,
        updateAllSliderFills,
        syncSliderMax,
        initSplit,
        generateSliderScales,
        updateActiveScaleValue,
        openDocumentation,
        exportPbisAsJson,
        applyImportedData,
        handleImport,
        loadDemoData,
        initSyncScroll,
        syncRowHeights,
        getReferencePbi,
        getReferencePbiId,
        isPinReferenceEnabled,
        calculateWsjfRanks,
        generatePastelColors,
        rgbToHex,
        initResizeHandler,
        checkScreenResolution,
        updateRefMarkerButtonState,
        clearLocalStorageAndReset,
        htmlToMarkdown,
        exportPbisAsCsv,
        updateResetCoDButtonVisibility
    };
}