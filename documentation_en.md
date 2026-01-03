# SizeRight

**SizeRight** is an innovative tool for agile product development, designed specifically for product owners, product managers, and epic owners to simplify the estimation and prioritization of large, abstract backlog items such as features and epics.

It solves the challenge of lengthy and subjective “estimation meetings” with a structured, visual process that embodies the claim: “**Align fast. Decide with clarity.**”

This online guide outlines the integrated process that SizeRight facilitates, combining the "how" of using the tool with the "why" of its underlying strategic principles.

-----

## The "Why" and "How": An Integrated Estimation Process

SizeRight is a guided process built on two core principles of modern agile product development: **Relative Estimation** and **Economic Prioritization**. It helps you make complex decisions in two clear, sequential steps.

This integrated approach combines the **estimation** of the **effort size** ("Job Size") with the **determination** of the **business value** ("Cost of Delay") to enable **data-driven prioritization** via **Weighted Shortest Job First (WSJF)**. The application was primarily developed for estimating high-level backlog items like features and epics, which are often abstract and difficult to assess. SizeRight's structured process provides clarity in this early phase.

-----

## Step 1: "Align fast." - From Vague Ideas to Relative Job Size

### Why Not Just Use "Hours"?

The first challenge in any project is understanding the work. Traditionally, teams try to estimate in absolute units like "hours" or "days."

This approach has critical flaws:

  * **The Fallacy of Precision:** An estimate of "40 hours" feels precise but is highly subjective. It ignores individual skills, meetings, and unforeseen issues, creating a false sense of certainty.
  * **Cognitive Bias:** Humans are naturally poor at absolute estimation ("How many hours will this take?") but excellent at comparative estimation ("Is this task *bigger* or *smaller* than that task?").
  * **Psychological Pressure:** An hour-based estimate is often treated as a "blood oath" or deadline, leading to cut corners on quality.

The goal is not a flawed, pseudo-precise plan, but rather a **shared understanding** of the work at hand.

### The Process: Deconstructing Job Size

SizeRight solves this by guiding the discussion away from absolute values like time. The process begins with the question: “How big is the feature/epic?”

Instead of a single number, the application guides the joint discussion to evaluate the **Job Size** based on three tangible, relative dimensions:

  * **Complexity:** "How *difficult* is this?" (e.g., new technology, intricate logic)
  * **Effort:** "How *much* work is this?" (e.g., high volume of repetitive tasks)
  * **Uncertainty:** "What do we *not* know?" (e.g., unclear requirements, external dependencies)

### Categorization with T-Shirt Sizes (Affinity Estimation)

Once the numerical **Job Size** (e.g., 12) is calculated from these three dimensions, SizeRight supports the final step of alignment: categorization. This applies the principles of **Affinity Estimation**, where items are grouped into "buckets" of similar size.

Instead of getting lost in the minor difference between a "12" and a "13," the tool allows you to assign a **T-Shirt Size** (e.g., XS, S, M, L). This act of "bucketing" serves several business needs:

  * **Reduces False Precision:** It acknowledges that the number is a guide, not a perfect measurement.
  * **Speeds Up Communication:** It's faster to talk about "M-sized items" than "items between 11 and 15 points."
  * **Visual Grouping:** It allows the team to visually group and manage items of similar scale.

### The Result: Rapid Alignment

The primary goal of this estimation is not the final number itself, but the **conversation** it creates. When one person estimates "Complexity" as a 5 and another as a 2, the resulting discussion reveals hidden assumptions and aligns the team.

This is the "Align fast" philosophy. The visualization as a “bubble chart” in the tool immediately shows *why* something is large (e.g., high complexity but low effort), and the T-Shirt size provides a simple category for it, creating an objective basis for a rapid, joint decision.

-----

## Step 2: "Decide with clarity." - From Job Size to Economic Priority

### An Economic Viewpoint

Once the **Job Size** has been established as a stable basis, the focus shifts from size to **business value**. The key business question is: "What does it cost our business for every week or month we *delay* the delivery of this feature?"

This concept is the **Cost of Delay (CoD)**.

### The Process: Deconstructing Cost of Delay (CoD)

The “Cost of Delay” tab in SizeRight answers this question by guiding the discussion through three established scales, as defined, for example, in the SAFe Framework:

  * **(BV) User/Business Value:** What benefits does it provide? (e.g., revenue, market differentiation)
  * **(TC) Time Criticality:** How important is the time factor? (e.g., a fixed deadline, a market window)
  * **(RR/OE) Risk Reduction/Opportunity Enablement:** Does it reduce a risk or enable a future opportunity?

The **RR/OE component** in particular is strategically vital. It gives a voice to crucial infrastructure work, security fixes, or architectural enablers. Without it, the focus might be solely on short-term, visible features. RR/OE ensures that critical "enabler" tasks can compete on an equal economic footing with new features, balancing short-term delivery with long-term product health.

### The Result: Data-Driven Prioritization with WSJF

Once these values have been determined in dialogue, SizeRight automatically calculates the **Weighted Shortest Job First (WSJF)** value. This formula provides a simple, rational algorithm for optimizing value flow.

The original formula is:
WSJF = Cost of Delay / Duration

The SizeRight formula is:
WSJF = Cost of Delay / Job Size

The goal is to identify the "Quick Wins" - the items that deliver the **highest value (CoD) for the least amount of effort (Job Size)**.

This formula often leads to counter-intuitive but economically optimal decisions. A massive feature with a high CoD may be deprioritized in favor of a smaller feature with a medium CoD, because the smaller item delivers its value *faster*. This "power of the denominator" provides a clear, economically sound recommendation for prioritization.

Decisions no longer have to be made based on gut feeling or the "loudest voice". Priorities are justified objectively, allowing you to "**Decide with clarity**."

-----

## Analysis from Different Perspectives

An essential part of decision-making is considering the results from different perspectives. To support this, SizeRight provides **four distinct views** for analysis, accessible via tabs on the main panel: a **Job Size Visualization** (bubble chart), a **Cost of Delay (CoD) Visualization** (bubble chart), a **WSJF Visualization** (Cost of Delay chart), and a **Relative Estimation Table** view. This grid-based list view allows for direct comparison and sorting of all metrics side-by-side, and simplifies **relative estimation**.

Users can dynamically switch between these views and sort the entire backlog by different metrics:

  * **Sorting by "Job Size":** Which features/epics are the biggest chunks?
  * **Sorting by "T-shirt size":** How are the sizes we assign distributed?
  * **Sorting by "Cost of Delay":** Which items have the highest business value or the greatest urgency?
  * **Sorting by WSJF:** What is the most economically sensible order for implementation?

This dynamic change of perspective enables a deeper analysis and helps to validate and communicate prioritization decisions. The entire workflow - from the initial discussion about size to the final list, analyzed and prioritized from different angles - takes place seamlessly in one application. This integrated process leads in a structured way from a quick agreement to a clear decision - **Align fast. Decide with clarity**.

-----

# Positioning Statement

## What SizeRight Is

SizeRight is a purpose-built **facilitation and visualization tool** designed to be displayed on a "big screen" (large meeting room monitor or projector) during interactive **planning sessions**. Its primary mission is to support the team to "**Align fast. Decide with clarity.**" by turning abstract discussions into tangible **data-driven** metrics. It serves as a temporary workspace to bridge the gap between vague ideas and concrete **economic prioritization** using **WSJF** (Weighted Shortest Job First).

## What SizeRight Is Not

SizeRight is **not an Enterprise Solution** or a "System of Record" (like Jira or Azure DevOps). It is explicitly **not designed** to be a long-term **documentation archive** or a database for managing the lifecycle of **Backlog Items**. It does not replace your ALM (Application Lifecycle Management) tool but acts as a tactical pre-processor for it.

Similarly, SizeRight is **not a controlling tool**. It uses **relative proxies** for the **Weighted Shortest Job First (WSJF)** calucluation (proxy metrics: **Job Size**, consisting of *Complexity*, *Effort*, and *Uncertainty*, as a proxy metric **for Duration**. **Cost of Delay**, consisting of *(BV) User/Business Value*, *(TC) Time Criticality*, and *(RR/OE) Risk Reduction and/or Opportunity Enablement*) to make the essentially “inestimable” quantifiable and comparable. These values serve tactical alignment and prioritization; they are **not** suitable for accounting purposes, performance reviews, budgeting, or exact reporting.

-----

# User manual: **SizeRight**

This is the user guide for SizeRight, a tool for simplifying **agile estimates** and **data-driven prioritization**. This guide describes all the features needed to use the application.

**System Requirement Note:** SizeRight is designed for desktop use. If your screen resolution is below the recommended minimum (e.g., on mobile devices or very small windows), a warning overlay will appear to ensure you have the necessary space for the visualizations. Please maximize your browser window or use a larger screen.

## 1\. Core concepts

Before using the application, it is important to **understand the underlying estimation concepts** as well as **the three key metrics**.

### Absolute vs. Relative Estimation

  * **Absolute Estimation:** This approach attempts to determine a precise, absolute value for an item (e.g., "This task will take 20 hours" or "This is 8 story points"). This type of estimation is often difficult, time-consuming, and subjective, especially for large, abstract backlog items like features or epics.
  * **Relative Estimation:** With this approach, items are not evaluated in isolation but are compared with one another. The central question is: "Is Feature A larger or smaller than Feature B?" or "How much larger is A compared to B?". This method is more intuitive for people, faster, and leads to better common understanding (alignment) within the team.

**SizeRight is fundamentally based on the principle of relative estimation.** Instead of guessing an absolute number, the application guides the team to discuss items based on tangible dimensions (like **complexity**, **effort** and **uncertainty**) and to relate them to each other visually (see Section 8.4, "Relative Estimation Table").

### The Three Key Metrics

SizeRight uses three key metrics to structure this process:

  * **Job Size:** This is not a direct estimate, but rather the sum of three dimensions:
      * **Complexity:** How difficult is the implementation?
      * **Effort:** How much work is required?
      * **Uncertainty:** How many unknowns are there?
  * **Cost of Delay:** This metric quantifies the business value and urgency. It is the sum of:
      * **User/Business Value (BV):** The benefit to customers or the company.
      * **Time Criticality (TC):** Does the item lose value if it is delayed/deferred?
      * **Risk Reduction / Opportunity Enablement (RR/OE):** Does it reduce risks or open up new opportunities?
  * **Weighted Shortest Job First (WSJF):** The final prioritization value, which is calculated automatically: `WSJF = Cost of Delay / Job Size`.

## 2\. Getting started: Creating a backlog item

1.  Clicking on the **"Add New Backlog Item"** button starts the process.
2.  A dialog box **Create New BI** opens. Enter a meaningful **title** for the feature/epic in the top input field.
3.  Then proceed with the estimation.

**Loading Demo Data:** If you are new to SizeRight and the list is empty, you will see an option to **"Load Demo Data"** in the main view. Clicking this link (e.g., for EN or DE) will populate the application with example items, allowing you to explore the features and visualizations immediately.

## 3\. The estimation process in detail

The estimation process is divided into two phases. The first, fundamental phase is determining the **Job Size**. This forms the basis for discussion and the subsequent assignment of a **T-shirt size**. The second phase, determining the **Cost of Delay**, is *optional*. It is only required if the **WSJF value** is to be calculated for economic prioritization and is not necessary for assigning T-shirt sizes.

**Dialog structure**

The **"Edit BI"** dialog has an expanded layout. The **title** spans the entire width. Below that, the dialog is divided into two columns: on the left are the estimation controls, and on the right is a **rich text editor** for notes and assumptions.

**Step A: Determine the Job Size**
1.  The **"Job Size"** tab must be active.
2.  The three sliders are moved to determine the joint assessment for **Complexity**, **Effort**, and **Uncertainty**.
    * **Clickable Scale:** Instead of dragging the slider, you can also **click directly on the numbers** below the slider line to set the value. The currently selected number is highlighted with a **black circle**.

*Triangulation (Reference Markers):*

To support better relative estimation, SizeRight uses **Triangulation**. If you have defined Reference Items (Minimum/Maximum, see Section 6), their values will appear as colored **markers directly on the scales** of the sliders. This allows you to instantly see how the current item compares to your baseline (e.g., "Is this complexity higher than our Reference Max?"). 
* Markers only appear if you have actively set a **Minimum** (Orange) or **Maximum** (Blue) reference item.
* You can toggle these markers on/off using the **"Show/Hide Markers"** button below the sliders.
* This preference is saved globally in your settings and included in exports.

*Important notes on "Job Size" estimation:*

  * **Saving:** To save a new backlog item, **only a title is required**. First, a list of items can be created, which will then be estimated at a later date. However, a "Job Size" value (and T-Shirt size) will only be calculated once all three values (Complexity, Effort, Uncertainty) are set to a value greater than 0.
  * **Minimum value:** Once a slider has been moved away from 0, the **lowest possible value per scale is 1**.
  * **Reset Button:** You can use the "**Reset Job Size**" button to set all three "Job Size" sliders back to zero.
  * **Scale:** By default, the tool uses the **SAFe Fibonacci scale** (1, 2, 3, 5, 8). This can be changed in the settings (see section 11).

**Step B: Determine the "Cost of Delay" for WSJF prioritization**

1.  Clicking on the "**Cost of Delay**" tab changes the view.
2.  The three sliders are moved to determine the joint assessment for **User/Business Value (BV)**, **Time Criticality (TC)** and **Risk Reduction/Opportunity Enablement (RR/OE)**.
3.  Once all three **CoD values** and the **Job Size values** have been set, the calculated WSJF value will automatically appear in the upper right corner of the dialog box.
4.  *Note:* Reference markers (Triangulation) are also available on these scales if the corresponding reference items are set.

*Important note:* \* **The WSJF value** cannot be calculated without a completed "Job Size" and "Cost of Delay" estimate.

  * **Reset Button:** You can use the "**Reset Cost of Delay**" button to set all three "Cost of Delay" sliders back to zero.

**Enter additional information**
There is a **rich text editor** in the right-hand column of the dialog box. Context-related information such as **assumptions, risks, or open questions** can be documented here.

  * **Formatting:** You can format text (bold, italic, underline, strikethrough) and **insert hyperlinks**.
  * **Colors:** You can apply one of **four preset highlight colors** (e.g., for warnings or important info) to text. These specific colors can be customized in the global **Settings** and are saved with your project data.
  * **Paste Sanitization:** When pasting content from external sources (Word, Websites), the editor automatically cleans up the text, removing unsupported styles while preserving the basic structure.

**Completing the estimation and Navigation**

  * Clicking "**Save**" creates or updates the backlog item. The button is active as long as a **title** has been entered.
  * **Rapid Navigation:** You can switch directly to the **Previous** or **Next** item in the backlog using the arrow buttons in the dialog header.
      * **Auto-Save:** If you have made changes to the current item, the button label will change to **"Save & Next"** (or "Save & Previous"). Clicking it will automatically save your changes and immediately load the next item, allowing for a very fast workflow without closing the dialog.
  * Clicking **"Cancel"** closes the Dialog without saving.

## 4\. Overview of the user interface

The main view of SizeRight is divided into two main panes:

  * The **"Backlog Item List"** (left pane), where items are created and managed.
  * The **"Main Display Area"** (right pane), which is organized into **four tabs** for different analysis perspectives:
    1.  **Job Size Visualization:** A bubble-chart view focusing on "Job Size" (Complexity, Effort, Uncertainty).
    2.  **CoD Visualization:** A bubble-chart view focusing on "Cost of Delay" (BV, TC, RR/OE).
    3.  **WSJF Visualization:** A chart view visualizing the economic impact (Cost of Delay) over time for different sequences.
    4.  **Relative Estimation Table:** A powerful grid view that displays all items and their metrics in a sortable, comparable table.

The size of these two panes can be adjusted by moving the **divider line** in the middle with the mouse to focus on the more important view.

## 5\. Manage backlog items

Backlog items can be edited in two ways:

  * Via the **Backlog Item List**: Clicking on the **Edit** button for an item opens the "Edit BI"-dialog.
  * Via the **Visualization Area**: When you move the mouse pointer over a visualization card ("Job Size Visualization" or "CoD Visualization") an edit icon appears in the upper right corner. Clicking on it also opens the “Edit BI” dialog box.

To remove an item, use the **"Delete"** button in the **Backlog Item List**. A confirmation message appears first.

## 6\. Setting a Reference Item

A core part of **relative estimation** is comparing new items to a known reference item. SizeRight allows you to set any backlog item as a **Reference Item**. This system supports two types of references to frame your estimation scale:

1.  **Minimum Reference (-):** Represents a small or simple item (your baseline for "Low").
2.  **Maximum Reference (+):** Represents a large or complex item (your baseline for "High").

**How to set a reference:**

  * In the **Backlog Item List** (left pane), each item has two small icons:
      * Click the **Orange Minus (-)** icon to set the item as the **Minimum Reference**.
      * Click the **Blue Plus (+)** icon to set the item as the **Maximum Reference**.
  * You can choose to set only a Minimum, only a Maximum, both, or neither.

**Effect of setting a reference:**

1.  **Highlighting:** Reference items are highlighted in the list and pinned to the top of all standard display views ("Job Size Visualization", "CoD Visualization", and "Relative Estimation Table").
2.  **Triangulation:** Setting a reference activates the corresponding markers on the estimation scales in the "Edit BI" dialog (see Section 3).

**Removing a reference:**
Simply click the highlighted Minus (-) or Plus (+) icon again to unset the reference.

*Important Note on Reference Item Behavior:*

  * **Standard Views:** In the Job Size, CoD, and Relative Estimation Table views, the reference item is physically moved to the top.
  * **WSJF Visualization View:** In this view, the reference item is **not** pinned to the top, as the sequence shown in the charts is crucial.
  * **"Custom Sort" Mode:** When using "Custom Sort" (see Section 9), the reference item remains in its defined position within the list. However, a **non-interactive clone** of the reference item is displayed in the top slot for comparison purposes.

While an item is pinned as a reference (in standard views), its values cannot be edited directly in the grid of the "Relative Estimation table" view. This prevents accidental changes to the reference. To edit the reference item, use the **Edit** button (either in the list or in the visualization) to open the "Edit BI" dialog.

## 7\. Assign T-shirt sizes

Once the **“Job Size”** has been calculated, a relative **T-shirt size** can be assigned.

1.  This is done by clicking either on the **gray button with the “-” or size in it** (e.g., “[ M ]”) in the **backlog item list** or directly on the corresponding **T-shirt size label** on the **visualization card** in the **Job Size Visualization** tab.

2.  A pop-up menu appears in which the appropriate size (e.g., S, M, L, XL) can be selected. The selection is saved immediately.

This assignment is not final. The **T-shirt size** can be changed again at any time in the same way if the assessment is adjusted over time.

## 8\. Using the Display Views

The main display area provides four tabs to analyze the backlog.

### 8.1 Job Size Visualization

This tab (the default view) displays a **graphical representation of each backlog item** in card form.

The cards contain:

  * A “**bubble chart**”, whose outer circle represents the **“Job Size”** and whose inner circles represent the proportions of **Complexity**, **Effort** and **Uncertainty**.
  * A **T-shirt size label** for quick classification (clickable if Job Size is complete).
  * A **WSJF value indicator** displayed next to the **T-shirt size**, provided that a WSJF value has been calculated.
  * An **edit icon** that appears when the mouse is moved to the upper right corner of the map.

This allows you to visually compare *how* an item is sized.

### 8.2 CoD Visualization

This tab shows a graphical representation of each backlog item. The cards contain:

  * A **bubble chart**, whose outer circle represents the **Cost of Delay** and whose inner circles represent the proportions of **(BV) User/Business Value**, **(TC) Time Criticality**, and **(RR/OE)Risk Reduction/Opportunity Enablement**.
  * A **WSJF value indicator** provided that a WSJF value has been calculated.
  * An **edit icon** that appears when the mouse is moved to the upper right corner of the map.

This allows for a visual comparison of *why* an item is valuable, separate from its size.

### 8.3 WSJF Visualization

This new tab provides a powerful way to visualize the economic impact of different implementation sequences using **Cost of Delay charts**. It displays two charts side-by-side:

  * **Optimal Order (by WSJF):** This chart shows the sequence that minimizes the total accumulated Cost of Delay, based purely on the calculated WSJF values (highest WSJF first). This represents the economically ideal order.
      * You can **collapse or expand** this top chart by clicking on its title bar to focus on the current order comparison.
  * **Current Order/Sorting:** This chart shows the sequence based on the **currently selected sort order** in the filter bar (e.g., sorted by Job Size, CoD, T-Shirt Size, or Custom Order).

**Understanding the Charts:**

  * **X-Axis:** Represents the **Cumulative Job Size** as items are completed in sequence.
  * **Y-Axis:** Represents the **Cost of Delay** (value per unit of time, e.g., per week). The height of the bars indicates the CoD of individual items.
  * **Colored Blocks:** Represent an item being **processed**. The number inside is the item's **WSJF Rank** (1 being the highest WSJF). You can click the rank number in the Backlog Item List (when this tab is active) to change its color for visual grouping.
  * **Gray Blocks:** Represent items **waiting** while another item is being processed. The number inside shows the **Accumulated Cost of Delay** incurred by \<em\>that specific item\</em\> up to that point in time.
  * **Total Delay Cost:** Displayed above each chart, this number represents the sum of all accumulated delay costs for \<em\>all\</em\> items in that specific sequence. Comparing the total cost of the "Current Order" to the "Optimal Order" shows the economic impact of deviating from the pure WSJF sequence.

This view helps answer questions like: "How much does it cost us \<em\>economically\</em\> if we implement items in our current preferred order compared to the mathematically optimal WSJF order?"

**WSJF Rank Display:** When this tab is active, the calculated **WSJF Rank** (based on the optimal order) is also displayed as a colored tag next to the T-Shirt size in the **Backlog Item List**. Clicking this tag cycles through different background colors, allowing you to visually group or highlight items across the application based on their WSJF rank. These custom colors are saved during export.

### 8.4 Relative Estimation Table

The central view for **relative estimation**. It provides a tabular overview of all items and their metrics.

  * **Columns:** Displays all metrics side by side (**Complexity**, **Effort**, **Uncertainty**, **Job Size**, **BV**, **TC**, **RR/OE**, **CoD**, and **WSJF**).
  * **Sorting:** Clicking on the **column header** of a metric sorts the entire list accordingly (unless "Custom Sort" or "Lock Sort Order" is active). Indicators in the header show the active sort column and direction.
  * **Column highlighting:** Clicking on the **eye icon** in a header highlights the column for that specific metric across all rows, making it easier to compare values vertically.
  * **Direct editing:** Non-calculated cells (such as “Complexity,” “Effort,” etc.) can be quickly changed via a pop-up by clicking on them without having to open the "Edit BI" dialog.
  * **Calculated values:** **Job Size**, **CoD**, and **WSJF** are automatically calculated and displayed. If data is missing, the cell shows ‘na’ (not available) and a tooltip explains which values are still needed.

## 9\. Filtering and sorting the view

Above the **Backlog Item List** are filters for customizing the view.

  * **Change sorting criteria:** Clicking on the **Job Size**, **T-Shirt Size**, **Cost of Delay**, or **WSJF** buttons changes the sorting criterion.
  * **Change sorting direction:** The arrow buttons (ascending and descending) reverse the order.
  * **Custom Sort Order:** Clicking the **"Custom Sort" button** (icon with people/bars) activates drag & drop mode for the **Backlog Item List**. You can now manually rearrange the items into any desired sequence. This custom order is then reflected in all views.
  * **Effect:** The selected sorting, direction, or custom order is applied **globally to all display views** ("Job Size Visualization", "CoD Visualization", "WSJF Visualization", and "Relative Estimation Table").
  * **Reset Sort & Filter:** Clicking the **Reset Filters & Sort** button (the circular "x" icon) will remove all active sorting and filters, **excluding any custom order**. The backlog will revert to its **original creation order**.
  * **Locking Sort Order:** Once a sorting order (standard or custom) has been agreed upon, click on the **lock icon**. This will freeze the current order of the items and prevent accidental changes during analysis or editing via sorting buttons or drag & drop. Clicking on the lock again will unlock the items.

The currently active sorting is displayed for orientation in the header of the **visualization area** next to the legend (e.g., "Sorted by: WSJF - Descending" or "Sorted by: Custom Sort Order").

**Sorting from the Grid:** In the **Relative Estimation Table** view, you can also sort by clicking on the column header of a metric (unless Custom Sort or Lock Sort is active).

**Graying out irrelevant items:** If values for a sorting criterion are missing (e.g., sorting by **WSJF**, but the **cost of delay** has not been estimated for an item), **these backlog items are grayed out in all views**. This means that they are excluded from the current sorting, but remain visible for context. This visual cue is vital: it shows which items are excluded from the current sorting due to missing data. Reference items are generally excluded from being grayed out based on sorting relevance.

## 10\. Importing and exporting data

SizeRight offers options to save your work or export data for external use.

  * **JSON Export (Backup):** Clicking on the **Export** icon (floppy disk) saves the entire work status in a `.json` file. This file contains **all backlog items** as well as **all current application settings** (such as **language**, selected **scale type**, **T-shirt size** definitions, **color settings**, defined **Editor Colors**, **Triangulation/Marker settings**, the current **sort criteria and direction**, any defined **custom sort order**, and custom **WSJF rank colors**).
  * **CSV Export (Table):** Clicking on the **CSV** button opens a dialog to export your backlog as a `.csv` file. This format is ideal for opening data in Excel, Numbers, or Google Sheets.
      * **CSV Options:** Before exporting, you can choose the **Sorting** for the export file (e.g., sort by WSJF or Job Size).
      * **Data Content:** The CSV includes all metrics, calculated values, and your **Notes & Assumptions**. Note that text formatting from the rich text editor (like bold or lists) is automatically converted to **Markdown** format for better readability in text cells.
  * **Import:** Clicking on the import icon (open folder) allows you to load a previously exported `.json` file. During import, **both the backlog and all saved settings are restored**, so that the entire workspace can be shared with others or backed up.

## 11\. Adjust settings

The settings can be accessed via the gear icon, where the tool can be customized to suit your needs:

  * **Language:** A choice can be made between German and English.
  * **Scale:** The global scale for all sliders is set here. A choice can be made between **Arithmetic (1-8)** and **SAFe Fibonacci (1, 2, 3, 5, 8)**.
  * **Reference Markers:** Check "Show reference markers on scales" to enable the **Triangulation** feature globally. This preference is saved and exported.
  * **T-shirt sizes:** Different **T-shirt sizes** can be activated or deactivated.
  * **Color settings:** A section allows you to change the colors of the circles, including numbers for **complexity**, **effort**, **uncertainty**, **(BV) user and business value**, **(TC) time criticality**, **(RR/OE) risk reduction and/or opportunity creation**, and the outer circle of the visualizations via the color picker.
  * **Editor Colors:** Customize the four preset colors available in the "Notes & Assumptions" rich text editor. These are also saved/exported.
  * **Reset settings:** This button resets **all** options in this dialog to their original default values.

## 12\. Reset Application

If you wish to completely clear all data and start fresh, you can use the **"Reset App"** button (located in the header area).

  * This action performs a **Factory Reset**: it clears all backlog items, deletes all custom settings, and removes any data stored in your browser's Local Storage.
  * **Warning:** This action is irreversible. The application will prompt you to **Export** your data as a JSON backup before confirming the deletion.

## 13\. Information and updates

Clicking on the **info icon (“i”)** displays details about the software version, contact information, and the software license. This dialog also includes an **update check**.
The application automatically checks whether a new version is available and displays a notification bar at the top of the browser when an update is found.
Clicking the **help icon ("?")** opens this user manual in a new browser tab.

-----

# FAQ

## Q: Why does SizeRight lack API integrations with enterprise tools

**A:** SizeRight is designed as a focused, session-based tool, not an integrated enterprise platform. The workflow is intentional: A facilitator acts as the scribe, entering **Backlog Items** before or during the session. The tool creates a visual environment to enable **Relative Estimation** and discussion. Once the **Job Size** and **Cost of Delay** are determined and the planning session concludes, the results are exported via the standard **CSV export** feature. This file is then used to update your primary System of Record.

## Q: Is the math behind the calculation reliable?

**A:** The application does not claim absolute mathematical precision (e.g., hours or days). Instead, it strictly follows the principles of **Relative Estimation**. To ensure accuracy within this relative framework, SizeRight supports the definition of **Reference Items** (Min/Max). This allows the team to **triangulate** new items against known baselines, ensuring that the relationships between items are consistent and valid for prioritization.

## Q: Why are the scales limited to a maximum value of 8?

**A:** SizeRight utilizes **Relative Estimation**, meaning a value of 8 represents a magnitude **8x larger** than a value of **1**. Since this tool targets strategic **Backlog Items** (like Features or Epics), it is unrealistic for a single item to be more than 8 times larger than the smallest reference item. If an item exceeds this ratio, it usually indicates the need to **split** the item into smaller pieces. Conversely, if you frequently hit the upper limit, it may indicate that your baseline item (the value of 1) is sliced too granularly (e.g., estimating tasks instead of features). Furthermore, the combined score for **Job Size** or **Cost of Delay** can reach up to 24 units. The use of the **Fibonacci scale** (1, 2, 3, 5, 8) prevents "false precision" by forcing teams to **bucket** estimates into larger categories as uncertainty increases.

## Q: Why does the application require a high screen resolution?

**A:** SizeRight is optimized for 1920x1080 or higher resolution to serve as a **visual radiator** on a large meeting room monitor or projector. It is designed to show the "Big Picture", including **Bubble Charts**, **WSJF** rankings, and the **Relative Estimation Table** side-by-side, to facilitate group discussion. This is also why the software is explicitly **not responsive** or optimized for mobile devices. The core value of the tool lies in this simultaneous juxtaposition of data; adapting the layout for smaller screens would destroy this comparability and thus nullify the software's primary benefit.

## Q: Is my data secure? Is it sent to a server?

**A:** SizeRight operates entirely as a client-side application within your browser. No data is transmitted to any external server or cloud service. The **Backlog Items** are stored temporarily in your browser's local storage solely for session persistence. You maintain full control over your data via the local **JSON/CSV Export** functionality. Additionally, as **Open Source** software, the source code is fully transparent and can be audited or modified. The tool consists of a single, lightweight file, ensuring easy distribution and maximum compatibility with almost any browser from the last years. This architecture eliminates external dependencies, making it safe for use even in high-security environments with strict compliance requirements.

## Q: Why use "Bubble Charts" instead of a simple spreadsheet?

**A:** To achieve the goal to "**Align fast**," visual perception is faster than processing numbers. The **Bubble Charts** allow the team to instantly recognize *why* a **Job Size** is large (e.g., small **Effort** but massive **Uncertainty**). This visualization exposes hidden assumptions and drives the conversation more effectively than a tabular list.

## Q: How do we prioritize architectural work or "Enablers" against business features?

**A:** Use the **RR/OE** (Risk Reduction / Opportunity Enablement) scale within the **Cost of Delay** estimation. This component ensures that technical items, such as infrastructure updates or security fixes, receive a quantified economic value. This allows them to compete fairly for **WSJF** priority against standard features based on **User/Business Value**.

## Q: How is data persisted, and what happens if the browser crashes?

**A:** Data persistence in the browser's local storage serves a single, safety-critical purpose: to prevent data loss in the event of an accidental page refresh during a live session. It is **not** intended for long-term archiving or historical documentation. For saving progress or sharing results, users should rely on the **Export** (JSON/CSV) functionality.










