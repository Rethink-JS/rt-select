# rt-select

![Platform: Web](https://img.shields.io/badge/platform-web-000000)
![JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E?logo=javascript)
[![npm version](https://img.shields.io/npm/v/%40rethink-js%2Frt-select.svg)](https://www.npmjs.com/package/@rethink-js/rt-select)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/@rethink-js/rt-select/badge)](https://www.jsdelivr.com/package/npm/@rethink-js/rt-select)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD632.svg)](https://opensource.org/licenses/MIT)

`rt-select` is a lightweight JavaScript utility that upgrades native `<select>` fields with a customizable Choices.js-powered dropdown when needed.

It is designed for browser-native behaviour where native selects already feel good, while improving the inconsistent default select experience on Windows and always replacing native multi-select fields.

- **Automatic dependency loading** (loads Choices.js automatically when required)
- **Smart native fallback** for single selects on non-Windows platforms
- **Always-custom multi-selects** for a better cross-browser experience
- Attribute-driven configuration
- Attribute-driven styling and theming
- Support for **multiple instances**
- A clean global API under `window.rtSelect`
- Defensive fallbacks if Choices.js fails to load
- Manual refresh support for dynamically added options

**Primary dependency:** <https://choices-js.github.io/Choices/>  
**Primary dependency (GitHub):** <https://github.com/Choices-js/Choices>

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
<script src="https://cdn.jsdelivr.net/npm/@rethink-js/rt-select@latest/dist/index.min.js"></script>
```

### 1.2 npm

```bash
npm install @rethink-js/rt-select
```

Then bundle or load `dist/index.min.js` as appropriate for your build setup.

---

## 2. Quick Start

Add the script to your page. To activate `rt-select`, add the `data-rt-select` attribute directly to a `<select>` element.

`rt-select` will:

- Auto-initialize on DOM ready
- Upgrade single selects on Windows by default
- Keep single selects native on non-Windows platforms by default
- Always upgrade multi-select fields
- Load Choices.js dynamically only when an upgraded select is needed
- Expose instance state and helpers through the global API

Example:

```html
<select data-rt-select name="package">
  <option value="">Choose package</option>
  <option value="rt-select">rt-select</option>
  <option value="rt-slider">rt-slider</option>
  <option value="rt-tabs">rt-tabs</option>
</select>

<script src="https://cdn.jsdelivr.net/npm/@rethink-js/rt-select@latest/dist/index.min.js"></script>
```

Force a custom dropdown on every operating system:

```html
<select data-rt-select data-rt-select-mode="all">
  <option value="">Choose option</option>
  <option value="alpha">Alpha</option>
  <option value="beta">Beta</option>
</select>
```

Multi-select fields are always upgraded:

```html
<select data-rt-select multiple name="features">
  <option value="search">Search</option>
  <option value="theming">Theming</option>
  <option value="api">JavaScript API</option>
</select>
```

---

## 3. Activation Rules

The library activates when **all** of the following are true:

- A `<select>` element with the attribute `data-rt-select` is found in the DOM.
- The select has not already been initialized.
- The select matches the upgrade rules for the current platform.

### Default behaviour

| Field type | Default behaviour |
| ---------- | ----------------- |
| Single select on Windows | Upgraded to Choices.js |
| Single select on macOS, iOS, Android, Linux, and other platforms | Kept native |
| Multi-select on any platform | Always upgraded to Choices.js |

### Force custom behaviour

Use any of these to force an upgraded custom dropdown on all platforms:

```html
<select data-rt-select="all"></select>
<select data-rt-select data-rt-select-mode="all"></select>
<select data-rt-select data-rt-select-force="true"></select>
<select data-rt-select data-rt-select-custom="true"></select>
<select data-rt-select data-rt-select-choices="true"></select>
```

### Platform-specific opt-in

```html
<select data-rt-select data-rt-select-platforms="apple"></select>
<select data-rt-select data-rt-select-platforms="mac,ios"></select>
<select data-rt-select data-rt-select-platforms="desktop"></select>
```

Supported platform tokens:

| Token | Matches |
| ----- | ------- |
| `windows`, `win` | Windows |
| `mac`, `macos`, `osx` | macOS |
| `ios`, `iphone`, `ipad` | iOS / iPadOS |
| `android` | Android |
| `linux` | Linux |
| `mobile`, `touch` | Mobile or touch-capable devices |
| `desktop` | Non-mobile devices |
| `apple` | macOS, iOS, or iPadOS |
| `non-windows`, `not-windows` | Any non-Windows platform |
| `all`, `any`, `everywhere` | Every platform |

---

## 4. Configuration (HTML Attributes)

### Basic Setup

```html
<select data-rt-select>
  <option value="">Choose option</option>
  <option value="one">One</option>
  <option value="two">Two</option>
</select>
```

### Core Attributes

| Attribute | Description | Default |
| --------- | ----------- | ------- |
| `data-rt-select` | Activates `rt-select` on the `<select>` element. Can also be set to `all`, `custom`, `choices`, `native`, `off`, or a platform token. | Required |
| `data-rt-select-id` | Optional identifier used by the global API. Auto-generated if missing. | Auto-generated |
| `data-rt-select-mode` | Controls platform upgrade behaviour. Supports `windows`, `all`, `custom`, `choices`, `native`, `off`, platform tokens, etc. | `windows` |
| `data-rt-select-force` | Forces a custom Choices.js dropdown. | `false` |
| `data-rt-select-custom` | Forces a custom Choices.js dropdown. | `false` |
| `data-rt-select-choices` | Alias for forcing a custom Choices.js dropdown. | `false` |
| `data-rt-select-enhance` | Alias for forcing a custom Choices.js dropdown. | `false` |
| `data-rt-select-enhanced` | Alias for forcing a custom Choices.js dropdown. | `false` |
| `data-rt-select-native` | Forces native behaviour for single selects. Multi-selects are still upgraded. | `false` |
| `data-rt-select-platforms` | Comma, pipe, or space-separated list of platform tokens where the select should be upgraded. | Empty |
| `data-rt-select-platform` | Alias for `data-rt-select-platforms`. | Empty |
| `data-rt-select-os` | Alias for `data-rt-select-platforms`. | Empty |

---

### Choices Behaviour Options

These attributes map to commonly used Choices.js options.

```html
<select
  data-rt-select="all"
  data-rt-select-search="true"
  data-rt-select-remove-item-button="true"
  data-rt-select-placeholder-value="Choose options"
></select>
```

| Attribute | Description | Default |
| --------- | ----------- | ------- |
| `data-rt-select-search` | Enables search UI. Defaults to `true` for multi-selects and long option lists. | Auto |
| `data-rt-select-search-enabled` | Alias for `data-rt-select-search`. | Auto |
| `data-rt-select-search-choices` | Whether choices are searchable. | `true` |
| `data-rt-select-search-disabled-choices` | Whether disabled choices are searchable. | `false` |
| `data-rt-select-sort` | Enables sorting. | `false` |
| `data-rt-select-should-sort` | Alias for `data-rt-select-sort`. | `false` |
| `data-rt-select-should-sort-items` | Sort selected items. | `false` |
| `data-rt-select-placeholder` | Enables placeholder behaviour. | `true` |
| `data-rt-select-placeholder-value` | Placeholder text. | Choices default / `Select options` for multi-selects |
| `data-rt-select-search-placeholder` | Placeholder text for search input. | Choices default |
| `data-rt-select-remove-item-button` | Shows remove buttons on selected items. Defaults to `true` for multi-selects. | Auto |
| `data-rt-select-item-select-text` | Text shown for selectable items. | Empty |
| `data-rt-select-no-results-text` | Text shown when search has no results. | `No results found` |
| `data-rt-select-no-choices-text` | Text shown when no choices are available. | `No choices to choose from` |
| `data-rt-select-loading-text` | Loading text. | `Loading...` |
| `data-rt-select-position` | Dropdown position. | `auto` |
| `data-rt-select-reset-scroll-position` | Resets dropdown scroll position after select. | `true` |
| `data-rt-select-render-selected-choices` | Controls rendering of selected choices. | `auto` |
| `data-rt-select-duplicate-items` | Allows duplicate selected items. | `true` |
| `data-rt-select-duplicate-items-allowed` | Alias for `data-rt-select-duplicate-items`. | `true` |
| `data-rt-select-paste` | Allows paste behaviour for text-style inputs. | `true` |
| `data-rt-select-remove-items` | Allows selected items to be removed. | `true` |
| `data-rt-select-add-items` | Allows items to be added. | `true` |
| `data-rt-select-close-dropdown-on-select` | `true`, `false`, or `auto`. Defaults to `false` for multi-selects. | Auto |
| `data-rt-select-render-choice-limit` | Maximum number of choices to render. | Choices default |
| `data-rt-select-search-result-limit` | Maximum number of search results. | Choices default |
| `data-rt-select-search-floor` | Minimum characters before search starts. | Choices default |
| `data-rt-select-max-item-count` | Maximum number of selected items. | Choices default |
| `data-rt-select-delimiter` | Delimiter for text-style values. | Choices default |
| `data-rt-select-single-mode-for-multi-select` | Enables single-selection behaviour for a multiple select. | Choices default |

---

### Advanced JSON Options

```html
<select
  data-rt-select="all"
  data-rt-select-options-json='{"searchEnabled":true,"shouldSort":false}'
></select>
```

`data-rt-select-options-json` can be used to pass advanced configuration directly to the underlying Choices.js instance.

Values passed through `data-rt-select-options-json` override the attribute-derived options.

---

### Styling Attributes

`rt-select` exposes theme attributes that are converted into scoped CSS variables per instance.

```html
<select
  data-rt-select="all"
  data-rt-select-bg="#ffffff"
  data-rt-select-text="#111111"
  data-rt-select-border="#d0d5dd"
  data-rt-select-focus="#111111"
  data-rt-select-radius="12"
  data-rt-select-dropdown-radius="12"
></select>
```

| Attribute | Description | Default |
| --------- | ----------- | ------- |
| `data-rt-select-bg` | Control background colour. | `#ffffff` |
| `data-rt-select-bg-disabled` | Disabled background colour. | `#f5f5f5` |
| `data-rt-select-dropdown-bg` | Dropdown background colour. | Same as background |
| `data-rt-select-text` | Text colour. | `#111111` |
| `data-rt-select-color` | Alias for text colour. | `#111111` |
| `data-rt-select-placeholder-color` | Placeholder text colour. | `#777777` |
| `data-rt-select-border` | Border colour. | `#d0d5dd` |
| `data-rt-select-border-color` | Alias for border colour. | `#d0d5dd` |
| `data-rt-select-focus` | Focus border colour. | `#111111` |
| `data-rt-select-focus-color` | Alias for focus colour. | `#111111` |
| `data-rt-select-focus-border` | Alias for focus colour. | `#111111` |
| `data-rt-select-focus-border-color` | Alias for focus colour. | `#111111` |
| `data-rt-select-highlight-bg` | Highlighted option background. | `#f2f4f7` |
| `data-rt-select-highlight` | Alias for highlighted option background. | `#f2f4f7` |
| `data-rt-select-option-hover-bg` | Alias for highlighted option background. | `#f2f4f7` |
| `data-rt-select-highlight-color` | Highlighted option text colour. | Text colour |
| `data-rt-select-option-hover-color` | Alias for highlighted option text colour. | Text colour |
| `data-rt-select-selected-bg` | Selected option background. | `#eef4ff` |
| `data-rt-select-option-selected-bg` | Alias for selected option background. | `#eef4ff` |
| `data-rt-select-selected-color` | Selected option text colour. | Text colour |
| `data-rt-select-option-selected-color` | Alias for selected option text colour. | Text colour |
| `data-rt-select-tag-bg` | Multi-select tag background. | Focus colour |
| `data-rt-select-tag-color` | Multi-select tag text colour. | `#ffffff` |
| `data-rt-select-tag-border` | Multi-select tag border colour. | Focus colour |
| `data-rt-select-invalid` | Invalid border colour. | `#d92d20` |
| `data-rt-select-radius` | Control border radius. Unitless values become pixels. | `8px` |
| `data-rt-select-dropdown-radius` | Dropdown border radius. | Same as radius |
| `data-rt-select-item-radius` | Option/item border radius. | `6px` |
| `data-rt-select-tag-radius` | Multi-select tag border radius. | `999px` |
| `data-rt-select-height` | Minimum control height. | `44px` |
| `data-rt-select-min-height` | Alias for minimum control height. | `44px` |
| `data-rt-select-padding-x` | Horizontal padding for single selects. | `12px` |
| `data-rt-select-padding-y` | Vertical padding for single selects. | `10px` |
| `data-rt-select-multi-padding-x` | Horizontal padding for multi-selects. | `8px` |
| `data-rt-select-multi-padding-y` | Vertical padding for multi-selects. | `7px` |
| `data-rt-select-font-size` | Font size. | `inherit` |
| `data-rt-select-small-font-size` | Small font size used by Choices variables. | `12px` |
| `data-rt-select-border-width` | Border width. | `1px` |
| `data-rt-select-shadow` | Control box shadow. | `none` |
| `data-rt-select-focus-shadow` | Focus box shadow. | `none` |
| `data-rt-select-dropdown-shadow` | Dropdown box shadow. | `0 12px 28px rgba(16, 24, 40, 0.12)` |
| `data-rt-select-dropdown-max-height` | Max dropdown list height. | `260px` |
| `data-rt-select-arrow` | Arrow colour. | Text colour |
| `data-rt-select-arrow-color` | Alias for arrow colour. | Text colour |
| `data-rt-select-arrow-size` | Arrow size. | `5px` |
| `data-rt-select-arrow-right` | Arrow right offset. | `14px` |
| `data-rt-select-z-index` | Open dropdown z-index. | `999` |
| `data-rt-select-margin-bottom` | Bottom margin for the Choices wrapper. | `0px` |
| `data-rt-select-chip-gap` | Gap between multi-select tags. | `6px` |
| `data-rt-select-chip-padding-x` | Horizontal padding for multi-select tags. | `9px` |
| `data-rt-select-chip-padding-y` | Vertical padding for multi-select tags. | `5px` |

#### Rounded dropdown example

```html
<select
  data-rt-select="all"
  data-rt-select-radius="16"
  data-rt-select-dropdown-radius="16"
>
  ...
</select>
```

#### Square dropdown example

```html
<select
  data-rt-select="all"
  data-rt-select-radius="0"
  data-rt-select-dropdown-radius="0"
>
  ...
</select>
```

---

### State Attributes

`rt-select` writes state attributes back to the original select and to the generated Choices wrapper.

#### Original select attributes

| Attribute | Description |
| --------- | ----------- |
| `data-rt-select-id` | Instance ID used by the global API. Auto-generated if missing. |
| `data-rt-select-uid` | Internal unique ID. |
| `data-rt-select-active="loading"` | Choices.js is being loaded or initialized. |
| `data-rt-select-active="true"` | The select has been upgraded. |
| `data-rt-select-active="native"` | The select is intentionally using native browser behaviour. |
| `data-rt-select-active="error"` | The select could not be upgraded. |
| `data-rt-select-active="destroyed"` | The instance was destroyed through the API. |

#### Choices wrapper attributes

| Attribute | Description |
| --------- | ----------- |
| `data-rt-select-owner` | ID of the original select. |
| `data-rt-select-multiple` | `true` for multi-selects. |
| `data-rt-select-disabled` | `true` when the original select is disabled. |
| `data-rt-select-required` | `true` when the original select is required. |
| `data-rt-select-invalid` | `true` when browser validation marks the select invalid. |

These attributes are useful for CSS-driven styling, validation UI, automated testing, and debugging.

---

### Custom Events

`rt-select` dispatches events from the original `<select>` element.

| Event | Description |
| ----- | ----------- |
| `rtSelect:ready` | Fires when an upgraded select has finished initializing. |
| `rtSelect:error` | Fires when Choices.js fails to load or the select cannot be upgraded. |

Example:

```js
const select = document.querySelector("[data-rt-select]");

select.addEventListener("rtSelect:ready", function (event) {
  console.log("rt-select ready:", event.detail);
});

select.addEventListener("rtSelect:error", function (event) {
  console.warn("rt-select error:", event.detail);
});
```

The underlying select still dispatches normal browser `change` events.

Choices.js events such as `addItem`, `removeItem`, `showDropdown`, and `hideDropdown` are also emitted by Choices.js on upgraded selects.

---

### Dependency Loader Overrides

The library automatically loads Choices.js from a CDN when an upgraded select is required.

You can rely on the default CDN paths or load your own version before `rt-select`.

| Attribute | Description |
| --------- | ----------- |
| `data-rt-select-script-src` | Override the Choices.js script URL. |
| `data-rt-select-style-src` | Override the Choices.js stylesheet URL. |
| `data-rt-select-load-style` | Set to `false` to prevent the default Choices.js stylesheet from loading. |

Example:

```html
<select
  data-rt-select="all"
  data-rt-select-script-src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"
  data-rt-select-style-src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"
></select>
```

You can also pre-load Choices.js yourself:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css">
<script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@rethink-js/rt-select@latest/dist/index.min.js"></script>
```

---

## 5. Multiple Instances

`rt-select` supports multiple independent instances on the same page.

Each instance:

- Has its own independent Choices.js instance when upgraded
- Keeps its own ID
- Applies scoped styles to its own generated wrapper
- Can be controlled through the global API
- Can remain native if it does not match the upgrade rules

Example:

```html
<select data-rt-select data-rt-select-id="package-select">...</select>
<select data-rt-select data-rt-select-id="theme-select" data-rt-select-mode="all">...</select>
<select data-rt-select data-rt-select-id="feature-select" multiple>...</select>
```

---

## 6. Global API

Once initialized:

```js
window.rtSelect;
```

### Common Methods

| Method | Description |
| ------ | ----------- |
| `platform()` | Returns detected platform flags. |
| `isWindows()` | Returns `true` on Windows. |
| `ids()` | Returns an array of upgraded select IDs. |
| `skipped()` | Returns an array of IDs that are currently using native browser behaviour. |
| `errors()` | Returns a list of loader or initialization errors. |
| `get(id)` | Returns the `rt-select` instance object for an upgraded select. |
| `getChoices(id)` | Returns the underlying Choices.js instance for an upgraded select. |
| `getValue(id)` | Returns the current value. Works for both upgraded and skipped native selects. |
| `setValue(id, value, silent?)` | Sets the selected value. Pass an array for multi-selects. |
| `open(id)` | Opens an upgraded dropdown. |
| `close(id)` | Closes an upgraded dropdown. |
| `refresh()` | Initializes new matching selects and refreshes existing upgraded instances. |
| `init()` | Initializes uninitialized matching selects. |
| `destroy(id?)` | Destroys a specific instance or all upgraded instances if no ID is given. |

Example usage:

```js
// Get all upgraded select IDs
const ids = window.rtSelect.ids();

// Read a value
const value = window.rtSelect.getValue("package-select");

// Set a single-select value
window.rtSelect.setValue("package-select", "rt-select");

// Set a multi-select value
window.rtSelect.setValue("feature-select", ["search", "theming"]);

// Refresh after adding options dynamically
window.rtSelect.refresh();

// Destroy a specific instance
window.rtSelect.destroy("package-select");
```

### Instance Helpers

When using `window.rtSelect.get(id)`, each upgraded instance exposes helper methods:

| Method | Description |
| ------ | ----------- |
| `getState()` | Returns state for the instance. |
| `getValue()` | Returns the current value. |
| `setValue(value, silent?)` | Sets the current value. |
| `refresh()` | Refreshes the underlying Choices.js instance. |
| `open()` | Opens the dropdown. |
| `close()` | Closes the dropdown. |
| `destroy()` | Destroys the instance. |

---

## 7. Console Logging

`rt-select` operates silently by default.

It does not rely on console output during normal use. If initialization fails, you can inspect:

```js
window.rtSelect.errors();
```

You can also listen for `rtSelect:error` on a specific select.

---

## 8. Troubleshooting

### Select not upgrading

- Ensure the element is a real `<select>` element.
- Ensure `data-rt-select` is present directly on the `<select>` element.
- Remember that single selects only upgrade on Windows by default.
- Use `data-rt-select-mode="all"`, `data-rt-select="all"`, or `data-rt-select-custom="true"` to force custom behaviour on all platforms.
- Check `window.rtSelect.skipped()` to see which selects are intentionally native.

### Multi-select is still native

- Multi-select fields should always upgrade.
- Ensure `data-rt-select` is on the `<select multiple>` element.
- Check `window.rtSelect.errors()` to confirm that Choices.js loaded successfully.

### Choices.js does not load

- Check your network tab for blocked CDN requests.
- If using a strict Content Security Policy, self-host Choices.js and pass custom paths with `data-rt-select-script-src` and `data-rt-select-style-src`.
- If you already load Choices.js globally, make sure `window.Choices` exists before `rt-select` initializes.

### Dynamic options are not appearing

If you add or remove options after initialization, call:

```js
window.rtSelect.refresh();
```

`rt-select` does not use an automatic mutation observer, so it will not repeatedly watch and re-render DOM changes in the background.

### Value is not updating programmatically

Use the global API:

```js
window.rtSelect.setValue("my-select-id", "value");
window.rtSelect.setValue("my-multi-select-id", ["one", "two"]);
```

For native skipped selects, `setValue()` still updates the original `<select>`.

### Validation state is not reflected visually

- Ensure the original `<select>` uses browser validation attributes such as `required`.
- The generated Choices wrapper receives `data-rt-select-invalid="true"` when the original select fails validity checks.
- Trigger validation with `form.reportValidity()` or by submitting the form.

### Dropdown style is not matching the design

- Check that the select is actually upgraded. Native selects cannot receive the full custom dropdown styling.
- For rounded dropdowns, set `data-rt-select-radius` and `data-rt-select-dropdown-radius`.
- For square dropdowns, set both values to `0`.
- If your site CSS overrides `.choices` classes, make sure your selectors are not stronger than the scoped styles injected by `rt-select`.

---

## 9. License

MIT License

Package: `@rethink-js/rt-select` <br>
GitHub: [https://github.com/Rethink-JS/rt-select](https://github.com/Rethink-JS/rt-select)

---

by **Rethink JS** <br>
[https://github.com/Rethink-JS](https://github.com/Rethink-JS)
