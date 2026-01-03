# Configuration Guide

The `config.json` file controls the behavior of SizeRight. These settings are baked directly into the application during the build process. Additionally, certain settings can be overridden at runtime via URL parameters.

## 1. Language Settings & URL Parameters

By default, the application supports German (`de`) and English (`en`). The language is determined based on the following priority:

1. **URL Parameter** (Highest priority)
2. **Configuration** (`config.json`)
3. **Browser Language** (Fallback)

### A) Runtime Control (URL)

You can force the application to load in a specific language without modifying the configuration file. Simply append `?lang=en` or `?lang=de` to the URL.

* **Force English:** `SizeRight.html?lang=en`
* **Force German:** `SizeRight.html?lang=de`

### B) Default Setting (`config.json`)

Defines the fallback language if no URL parameter is provided and the browser language cannot be detected.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultSettings.language` | `string` | `"en"` | The default language of the application (`"de"` or `"en"`). |

---

## 2. Feature: Update Checker (`updateChecker`)

The Update Checker automatically notifies users when a newer version of the software is available.

> **Note:** This feature is **disabled** by default in the public GitHub distribution (`enabled: false`).

### Configuration

```json
"updateChecker": {
    "enabled": false,
    "versionUrl": "https://.../SizeRightVersion.txt",
    "downloadUrl": "https://..."
}

```

### How it works with `SizeRightVersion.txt`

1. On startup, the app requests the `versionUrl`.
2. It expects a JSON file containing the latest version number:
```json
{"version":"0.0.9"}

```


3. If the remote version is higher than the internal HTML version, a notification banner with a link to the `downloadUrl` is displayed.

---

## 3. Feature: Demo Data (`showDemoDataLink`)

This feature enables a link in the welcome message in the left sidebar ("Load Demo Data") to quickly load example values for demonstrate the software.

### Configuration

```json
"showDemoDataLink": true,
"demoData": {
    "en": { "path": "Business Example - Values (EN).json" },
    "de": { "path": "Business Example - Values (DE).json" }
}

```

### ⚠️ Important Note for Local Use

If you open the file locally by double-clicking it (address starts with `file://`), loading demo data will **fail** in most modern browsers.

* **Cause:** Security policies (CORS - Cross-Origin Resource Sharing) block the loading of external files when no web server is used.
* **Solution:** To load demo data, the HTML file must be served via a local web server (e.g., VS Code "Live Server" extension or Python `http.server`).

## 4. Settings Persistence

SizeRight automatically remembers your preferences to ensure a seamless experience across sessions.

Any changes made within the **"Settings Modal"** (e.g., switching the estimation scale, changing T-Shirt sizes, etc.") are saved to the browser's **Local Storage** and also in the **saved file**.

* **Behavior:** When you reopen the application, your last used settings are automatically restored.
* **Storage:** These settings are stored locally on your device and are not sent to any server.