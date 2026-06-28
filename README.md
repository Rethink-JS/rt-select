# rt-package-name

![Platform: Web](https://img.shields.io/badge/platform-web-000000)
![JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E?logo=javascript)
[![npm version](https://img.shields.io/npm/v/%40rethink-js%2Frt-<package-name>.svg)](https://www.npmjs.com/package/@rethink-js/rt-<package-name>)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/@rethink-js/rt-<package-name>/badge)](https://www.jsdelivr.com/package/npm/@rethink-js/rt-<package-name>)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD632.svg)](https://opensource.org/licenses/MIT)

`rt-package-name` is a lightweight JavaScript utility that <one-sentence clear purpose> with:

- **Automatic dependency loading** (no manual installs)
- **Zero-config defaults** (works out of the box)
- Attribute-driven configuration
- Support for **multiple instances**
- A clean global API under `window.rt<PackageName>`
- Defensive fallbacks to avoid runtime crashes
- Clear console logs for debugging and verification

**Primary dependency (GitHub):** <https://github.com/author/repo>

---

# Table of Contents

- [1. Installation](#1-installation)
  - [1.1 CDN (jsDelivr)](#11-cdn-jsdelivr)
  - [1.2 npm](#12-npm)
- [2. Quick Start](#2-quick-start)
- [3. Activation Rules](#3-activation-rules)
- [4. Configuration (HTML Attributes)](#4-configuration-html-attributes)
- [5. Multiple Instances](#5-multiple-instances)
- [6. Global API](#6-global-api)
- [7. Console Logging](#7-console-logging)
- [8. Troubleshooting](#8-troubleshooting)
- [9. License](#9-license)

---

## 1. Installation

### 1.1 CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/@rethink-js/rt-<package-name>@latest/dist/index.min.js"></script>
```

### 1.2 npm

```bash
npm install @rethink-js/rt-<package-name>
```

Then bundle or load `dist/index.min.js` as appropriate for your build setup.

---

## 2. Quick Start

Add the script to your page. With no configuration provided, `rt-<package-name>` will:

* Auto-initialize itself when applicable
* Load required dependencies dynamically
* Apply safe defaults
* Expose the global API

Example:

```html
<script src="https://cdn.jsdelivr.net/npm/@rethink-js/rt-<package-name>@latest/dist/index.min.js"></script>
```

> Note: If you do not provide any `rt-<package-name>-*` attributes, the library runs using its internal defaults.

---

## 3. Activation Rules

The library activates when **any** of the following are true:

* A root attribute exists (e.g. `rt-<package-name>` on `<html>` or `<body>`)
* One or more instance elements are detected
* No explicit opt-out is defined (auto-enable fallback)

If none are found, the library may defensively attach itself to a sensible default to ensure functionality.

---

## 4. Configuration (HTML Attributes)

### Root Activation

```html
<body rt-<package-name></body>
```

### Global Options

```html
<body
  rt-<package-name>
  rt-<package-name>-option-a="value"
  rt-<package-name>-option-b="value"
></body>
```

### Core Attributes

| Attribute                   | Description            |
| --------------------------- | ---------------------- |
| `rt-<package-name>`         | Enables root behavior  |
| `rt-<package-name>-id`      | Optional identifier    |
| `rt-<package-name>-enabled` | Enable / disable       |
| `rt-<package-name>-debug`   | Enable console logging |

(Add / remove rows as required per package.)

---

### Per-Instance Configuration

```html
<div
  rt-<package-name>-instance
  rt-<package-name>-id="example"
></div>
```

| Attribute                    | Description            |
| ---------------------------- | ---------------------- |
| `rt-<package-name>-instance` | Marks instance element |
| `rt-<package-name>-id`       | Instance identifier    |

---

### Advanced JSON Options

```html
<body
  rt-<package-name>
  rt-<package-name>-options-json='{"key":"value"}'
></body>
```

Used for advanced or dependency-specific configuration that doesn’t warrant individual attributes.

---

### Dependency Loader Overrides

| Attribute                             | Description             |
| ------------------------------------- | ----------------------- |
| `rt-<package-name>-src`               | Override dependency CDN |
| `rt-<package-name>-observe-resize`    | Enable ResizeObserver   |
| `rt-<package-name>-observe-mutations` | Enable MutationObserver |

---

## 5. Multiple Instances

`rt-<package-name>` supports multiple independent instances on the same page.

Each instance:

* Has its own configuration
* Is registered internally
* Can be controlled individually via the API

---

## 6. Global API

Once initialized:

```js
window.rt<PackageName>;
```

### Common Methods

| Method         | Description          |
| -------------- | -------------------- |
| `ids()`        | Returns instance IDs |
| `get(id)`      | Get instance         |
| `start(id?)`   | Start                |
| `stop(id?)`    | Stop                 |
| `toggle(id?)`  | Toggle               |
| `destroy(id?)` | Cleanup              |

If a root instance exists, it may also be exposed directly:

```js
window.<dependencyName>;
```

---

## 7. Console Logging

When enabled, the library logs:

* Instance ID
* Target element
* Resolved configuration
* Dependency load status

This makes debugging transparent and predictable.

---

## 8. Troubleshooting

### Feature not activating

* Ensure the correct `rt-*` attribute exists
* Confirm the script loaded successfully
* Check console logs for resolved config

### Dependency failed to load

* Verify CDN URLs
* Ensure network access
* Override source via attribute if required

### Unexpected behavior

* Check for conflicting scripts
* Verify attribute spelling
* Confirm instance isolation

---

## 9. License

MIT License

Package: `@rethink-js/rt-<package-name>` <br>
GitHub: [https://github.com/Rethink-JS/rt-package-name](https://github.com/Rethink-JS/rt-package-name)

---

by **Rethink JS** <br>
[https://github.com/Rethink-JS](https://github.com/Rethink-JS)
