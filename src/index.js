(function () {
  var RT_NS = "rtSelect";
  if (window[RT_NS] && window[RT_NS].__initialized) return;

  var DEFAULT_CHOICES_SCRIPT =
    "https://cdn.jsdelivr.net/npm/choices.js@11.1.0/public/assets/scripts/choices.min.js";
  var DEFAULT_CHOICES_STYLE =
    "https://cdn.jsdelivr.net/npm/choices.js@11.1.0/public/assets/styles/choices.min.css";

  var choicesScriptPromise = null;
  var choicesStylePromise = null;

  var state = {
    instances: {},
    skipped: {},
    order: [],
    ready: false,
    initStarted: false,
    errors: [],
  };

  function uid() {
    return "s" + Math.random().toString(36).slice(2);
  }

  function assignUID(el, attr) {
    if (!el.getAttribute(attr)) el.setAttribute(attr, uid());
    return el.getAttribute(attr);
  }

  function injectOnce(key, css) {
    var s = document.head.querySelector(
      '[data-rt-select-injected="' + key + '"]',
    );
    if (!s) {
      s = document.createElement("style");
      s.setAttribute("data-rt-select-injected", key);
      document.head.appendChild(s);
    }
    if (s.textContent !== css) s.textContent = css;
    return s;
  }

  function removeInjected(key) {
    var s = document.head.querySelector(
      '[data-rt-select-injected="' + key + '"]',
    );
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }

  function parseBool(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim().toLowerCase();
    if (s === "") return true;
    if (s === "true" || s === "1" || s === "yes" || s === "y" || s === "on")
      return true;
    if (s === "false" || s === "0" || s === "no" || s === "n" || s === "off")
      return false;
    return def;
  }

  function parseBoolOrAuto(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim().toLowerCase();
    if (s === "auto") return "auto";
    return parseBool(v, def);
  }

  function parseNum(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim();
    if (!s.length) return def;
    var n = Number(s);
    return Number.isFinite(n) ? n : def;
  }

  function parseStr(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim();
    return s.length ? s : def;
  }

  function parseJson(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim();
    if (!s.length) return def;
    try {
      var parsed = JSON.parse(s);
      return parsed && typeof parsed === "object" ? parsed : def;
    } catch (e) {
      return def;
    }
  }

  function cssSize(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim();
    if (!s.length) return def;
    if (/^-?\d+(\.\d+)?$/.test(s)) return s + "px";
    return s;
  }

  function attr(el, name) {
    return el.getAttribute("data-rt-select-" + name);
  }

  function attrAny(el, names, def) {
    for (var i = 0; i < names.length; i++) {
      var v = attr(el, names[i]);
      if (v !== null && v !== undefined) return v;
    }
    return def;
  }

  function isSelect(el) {
    return !!(
      el &&
      el.nodeType === 1 &&
      String(el.tagName || "").toLowerCase() === "select"
    );
  }

  function getPlatform() {
    var ua = navigator.userAgent || "";
    var platform = "";
    var maxTouchPoints = 0;

    try {
      if (navigator.userAgentData && navigator.userAgentData.platform) {
        platform = navigator.userAgentData.platform;
      }
    } catch (e) {}

    if (!platform) platform = navigator.platform || "";

    try {
      maxTouchPoints = navigator.maxTouchPoints || 0;
    } catch (e2) {
      maxTouchPoints = 0;
    }

    var windows = /win/i.test(platform) || /windows/i.test(ua);
    var android = /android/i.test(ua);
    var ipadOS = /mac/i.test(platform) && maxTouchPoints > 1;
    var ios = ipadOS || /iphone|ipad|ipod/i.test(ua);
    var mac = !ios && (/mac/i.test(platform) || /macintosh/i.test(ua));
    var linux = !android && /linux/i.test(platform);
    var mobile = android || ios || /mobile/i.test(ua);

    return {
      windows: windows,
      mac: mac,
      ios: ios,
      android: android,
      linux: linux,
      mobile: mobile,
      desktop: !mobile,
      touch: maxTouchPoints > 0,
    };
  }

  function isWindows() {
    return getPlatform().windows;
  }

  function tokenList(v) {
    if (v === null || v === undefined) return [];
    return String(v)
      .split(/[\s,|]+/)
      .map(function (x) {
        return x.trim().toLowerCase();
      })
      .filter(function (x) {
        return !!x;
      });
  }

  function platformMatchesToken(token, platform) {
    if (!token) return false;
    if (token === "all" || token === "any" || token === "everywhere") return true;
    if (token === "windows" || token === "win") return platform.windows;
    if (token === "mac" || token === "macos" || token === "osx") return platform.mac;
    if (token === "ios" || token === "iphone" || token === "ipad") return platform.ios;
    if (token === "android") return platform.android;
    if (token === "linux") return platform.linux;
    if (token === "mobile" || token === "touch") return platform.mobile || platform.touch;
    if (token === "desktop") return platform.desktop;
    if (token === "apple") return platform.mac || platform.ios;
    if (token === "non-windows" || token === "not-windows") return !platform.windows;
    return false;
  }

  function platformListMatches(value) {
    var tokens = tokenList(value);
    if (!tokens.length) return null;
    var platform = getPlatform();
    for (var i = 0; i < tokens.length; i++) {
      if (platformMatchesToken(tokens[i], platform)) return true;
    }
    return false;
  }

  function loadChoicesScript(src) {
    if (typeof window.Choices !== "undefined") return Promise.resolve();
    if (choicesScriptPromise) return choicesScriptPromise;

    choicesScriptPromise = new Promise(function (resolve, reject) {
      var existing =
        document.querySelector('script[data-rt-select-choices="true"]') ||
        document.querySelector('script[src*="choices"]');

      if (existing) {
        if (typeof window.Choices !== "undefined") {
          resolve();
          return;
        }
        existing.addEventListener("load", function () {
          if (typeof window.Choices !== "undefined") resolve();
          else reject(new Error("Choices loaded but window.Choices is missing"));
        });
        existing.addEventListener("error", function () {
          reject(new Error("Failed to load existing Choices script"));
        });
        return;
      }

      var s = document.createElement("script");
      s.src = src || DEFAULT_CHOICES_SCRIPT;
      s.async = true;
      s.setAttribute("data-rt-select-choices", "true");
      s.onload = function () {
        if (typeof window.Choices !== "undefined") resolve();
        else reject(new Error("Choices loaded but window.Choices is missing"));
      };
      s.onerror = function () {
        reject(new Error("Failed to load Choices script"));
      };
      document.head.appendChild(s);
    });

    return choicesScriptPromise;
  }

  function loadChoicesStyle(src, shouldLoad) {
    if (shouldLoad === false) return Promise.resolve();
    if (choicesStylePromise) return choicesStylePromise;

    choicesStylePromise = new Promise(function (resolve) {
      var finalSrc = src || DEFAULT_CHOICES_STYLE;
      if (!finalSrc || String(finalSrc).trim().toLowerCase() === "none") {
        resolve();
        return;
      }

      var existing =
        document.querySelector('link[data-rt-select-choices-css="true"]') ||
        Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(
          function (link) {
            return (link.getAttribute("href") || "").indexOf("choices") > -1;
          },
        )[0];

      if (existing) {
        resolve();
        return;
      }

      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = finalSrc;
      l.setAttribute("data-rt-select-choices-css", "true");
      l.onload = function () {
        resolve();
      };
      l.onerror = function () {
        resolve();
      };
      document.head.appendChild(l);
    });

    return choicesStylePromise;
  }

  function loadChoicesAssets(scriptSrc, styleSrc, shouldLoadStyle) {
    return Promise.all([
      loadChoicesStyle(styleSrc, shouldLoadStyle),
      loadChoicesScript(scriptSrc),
    ]).then(function () {});
  }

  function getConf(select) {
    var rawMode = parseStr(select.getAttribute("data-rt-select"), "");
    var mode = parseStr(attr(select, "mode"), rawMode || "windows");

    return {
      mode: String(mode || "windows").toLowerCase(),
      force: parseBool(attr(select, "force"), false),
      custom: parseBool(
        attrAny(select, ["custom", "choices", "enhance", "enhanced"], null),
        false,
      ),
      native: parseBool(attr(select, "native"), false),
      platforms: parseStr(attrAny(select, ["platforms", "platform", "os"], null), ""),
      scriptSrc: parseStr(attr(select, "script-src"), DEFAULT_CHOICES_SCRIPT),
      styleSrc: parseStr(attr(select, "style-src"), DEFAULT_CHOICES_STYLE),
      loadStyle: parseBool(attr(select, "load-style"), true),
    };
  }

  function getOptions(select) {
    var optionCount = 0;
    try {
      optionCount = select.querySelectorAll("option").length;
    } catch (e) {}

    var isMultiple = !!select.multiple;
    var searchRaw = attrAny(select, ["search", "search-enabled"], null);
    var searchDefault = isMultiple || optionCount > 8;
    var closeRaw = attr(select, "close-dropdown-on-select");
    var sortRaw = attrAny(select, ["sort", "should-sort"], null);
    var allowHtmlRaw = attrAny(select, ["allow-html", "allowhtml"], null);
    var duplicateRaw = attrAny(
      select,
      ["duplicate-items", "duplicate-items-allowed"],
      null,
    );
    var removeItemButtonDefault = isMultiple;
    var closeDropdownDefault = isMultiple ? false : "auto";

    var options = {
      silent: parseBool(attr(select, "silent"), true),
      allowHTML: parseBool(allowHtmlRaw, false),
      searchEnabled: parseBool(searchRaw, searchDefault),
      searchChoices: parseBool(attr(select, "search-choices"), true),
      searchDisabledChoices: parseBool(attr(select, "search-disabled-choices"), false),
      shouldSort: parseBool(sortRaw, false),
      shouldSortItems: parseBool(attr(select, "should-sort-items"), false),
      placeholder: parseBool(attr(select, "placeholder"), true),
      removeItemButton: parseBool(
        attr(select, "remove-item-button"),
        removeItemButtonDefault,
      ),
      itemSelectText: parseStr(attr(select, "item-select-text"), ""),
      noResultsText: parseStr(attr(select, "no-results-text"), "No results found"),
      noChoicesText: parseStr(attr(select, "no-choices-text"), "No choices to choose from"),
      loadingText: parseStr(attr(select, "loading-text"), "Loading..."),
      position: parseStr(attr(select, "position"), "auto"),
      resetScrollPosition: parseBool(attr(select, "reset-scroll-position"), true),
      renderSelectedChoices: parseStr(attr(select, "render-selected-choices"), "auto"),
      searchPlaceholderValue: parseStr(attr(select, "search-placeholder"), null),
      placeholderValue: parseStr(attr(select, "placeholder-value"), null),
      duplicateItemsAllowed: parseBool(duplicateRaw, true),
      paste: parseBool(attr(select, "paste"), true),
      removeItems: parseBool(attr(select, "remove-items"), true),
      addItems: parseBool(attr(select, "add-items"), true),
      closeDropdownOnSelect: parseBoolOrAuto(closeRaw, closeDropdownDefault),
    };

    if (isMultiple && !options.placeholderValue) {
      options.placeholderValue = parseStr(
        select.getAttribute("placeholder"),
        "Select options",
      );
    }

    var renderChoiceLimit = parseNum(attr(select, "render-choice-limit"), undefined);
    if (renderChoiceLimit !== undefined) options.renderChoiceLimit = renderChoiceLimit;

    var searchResultLimit = parseNum(attr(select, "search-result-limit"), undefined);
    if (searchResultLimit !== undefined) options.searchResultLimit = searchResultLimit;

    var searchFloor = parseNum(attr(select, "search-floor"), undefined);
    if (searchFloor !== undefined) options.searchFloor = searchFloor;

    var maxItemCount = parseNum(attr(select, "max-item-count"), undefined);
    if (maxItemCount !== undefined) options.maxItemCount = maxItemCount;

    var delimiter = parseStr(attr(select, "delimiter"), "");
    if (delimiter) options.delimiter = delimiter;

    var singleModeForMultiSelect = parseBool(
      attr(select, "single-mode-for-multi-select"),
      undefined,
    );
    if (singleModeForMultiSelect !== undefined)
      options.singleModeForMultiSelect = singleModeForMultiSelect;

    var jsonOpts = parseJson(attr(select, "options-json"), null);
    if (jsonOpts) {
      for (var key in jsonOpts) {
        if (Object.prototype.hasOwnProperty.call(jsonOpts, key)) {
          options[key] = jsonOpts[key];
        }
      }
    }

    return options;
  }

  function getStyleVars(select) {
    var text = parseStr(attrAny(select, ["text", "color"], null), "#111111");
    var border = parseStr(
      attrAny(select, ["border", "border-color"], null),
      "#d0d5dd",
    );
    var focus = parseStr(
      attrAny(select, ["focus", "focus-color", "focus-border", "focus-border-color"], null),
      "#111111",
    );
    var highlightBg = parseStr(
      attrAny(select, ["highlight", "highlight-bg", "option-hover-bg"], null),
      "#f2f4f7",
    );
    var highlightColor = parseStr(
      attrAny(select, ["highlight-color", "option-hover-color"], null),
      text,
    );
    var selectedBg = parseStr(
      attrAny(select, ["selected-bg", "option-selected-bg"], null),
      "#eef4ff",
    );
    var selectedColor = parseStr(
      attrAny(select, ["selected-color", "option-selected-color"], null),
      text,
    );
    var arrow = parseStr(attrAny(select, ["arrow", "arrow-color"], null), text);
    var fontSize = cssSize(attr(select, "font-size"), "inherit");
    var radius = cssSize(attr(select, "radius"), "8px");
    var itemRadius = cssSize(attr(select, "item-radius"), "6px");
    var tagRadius = cssSize(attr(select, "tag-radius"), "999px");
    var bg = parseStr(attr(select, "bg"), "#ffffff");
    var disabledBg = parseStr(attr(select, "bg-disabled"), "#f5f5f5");
    var dropdownBg = parseStr(attr(select, "dropdown-bg"), bg);
    var invalid = parseStr(attr(select, "invalid"), "#d92d20");
    var marginBottom = cssSize(attr(select, "margin-bottom"), "0px");

    return {
      "--rt-select-bg": bg,
      "--rt-select-bg-disabled": disabledBg,
      "--rt-select-dropdown-bg": dropdownBg,
      "--rt-select-text": text,
      "--rt-select-placeholder": parseStr(attr(select, "placeholder-color"), "#777777"),
      "--rt-select-border": border,
      "--rt-select-focus": focus,
      "--rt-select-highlight-bg": highlightBg,
      "--rt-select-highlight-color": highlightColor,
      "--rt-select-selected-bg": selectedBg,
      "--rt-select-selected-color": selectedColor,
      "--rt-select-tag-bg": parseStr(attr(select, "tag-bg"), focus),
      "--rt-select-tag-color": parseStr(attr(select, "tag-color"), "#ffffff"),
      "--rt-select-tag-border": parseStr(attr(select, "tag-border"), focus),
      "--rt-select-invalid": invalid,
      "--rt-select-radius": radius,
      "--rt-select-dropdown-radius": cssSize(attr(select, "dropdown-radius"), radius),
      "--rt-select-item-radius": itemRadius,
      "--rt-select-tag-radius": tagRadius,
      "--rt-select-min-height": cssSize(
        attrAny(select, ["height", "min-height"], null),
        "44px",
      ),
      "--rt-select-padding-x": cssSize(attr(select, "padding-x"), "12px"),
      "--rt-select-padding-y": cssSize(attr(select, "padding-y"), "10px"),
      "--rt-select-multi-padding-x": cssSize(attr(select, "multi-padding-x"), "8px"),
      "--rt-select-multi-padding-y": cssSize(attr(select, "multi-padding-y"), "7px"),
      "--rt-select-font-size": fontSize,
      "--rt-select-border-width": cssSize(attr(select, "border-width"), "1px"),
      "--rt-select-shadow": parseStr(attr(select, "shadow"), "none"),
      "--rt-select-focus-shadow": parseStr(attr(select, "focus-shadow"), "none"),
      "--rt-select-dropdown-shadow": parseStr(
        attr(select, "dropdown-shadow"),
        "0 12px 28px rgba(16, 24, 40, 0.12)",
      ),
      "--rt-select-dropdown-max-height": cssSize(
        attr(select, "dropdown-max-height"),
        "260px",
      ),
      "--rt-select-arrow": arrow,
      "--rt-select-arrow-size": cssSize(attr(select, "arrow-size"), "5px"),
      "--rt-select-arrow-right": cssSize(attr(select, "arrow-right"), "14px"),
      "--rt-select-z-index": parseStr(attr(select, "z-index"), "999"),
      "--rt-select-margin-bottom": marginBottom,
      "--rt-select-chip-gap": cssSize(attr(select, "chip-gap"), "6px"),
      "--rt-select-chip-padding-x": cssSize(attr(select, "chip-padding-x"), "9px"),
      "--rt-select-chip-padding-y": cssSize(attr(select, "chip-padding-y"), "5px"),
    };
  }

  function getNativeValue(select) {
    if (!select) return null;
    if (select.multiple) {
      var vals = [];
      var opts = select.options || [];
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].selected) vals.push(opts[i].value);
      }
      return vals;
    }
    return select.value;
  }

  function setNativeValue(select, value) {
    if (!select) return;
    if (select.multiple) {
      var values = Array.isArray(value) ? value.map(String) : [String(value)];
      var opts = select.options || [];
      for (var i = 0; i < opts.length; i++) {
        opts[i].selected = values.indexOf(String(opts[i].value)) > -1;
      }
    } else {
      select.value = value;
    }
  }

  function dispatchNativeChange(select) {
    if (!select) return;
    try {
      select.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (e) {
      var ev = document.createEvent("HTMLEvents");
      ev.initEvent("change", true, false);
      select.dispatchEvent(ev);
    }
  }

  function emit(el, name, detail) {
    if (!el) return;
    try {
      el.dispatchEvent(
        new CustomEvent(name, {
          bubbles: true,
          detail: detail || {},
        }),
      );
    } catch (e) {
      var ev = document.createEvent("CustomEvent");
      ev.initCustomEvent(name, true, false, detail || {});
      el.dispatchEvent(ev);
    }
  }

  function Select(select, id) {
    this.select = select;
    this.root = select;
    this.id = id;
    this.valid = isSelect(select);
    if (!this.valid) return;

    this.selectId = assignUID(this.select, "data-rt-select-id");
    this.uid = assignUID(this.select, "data-rt-select-uid");
    this.conf = getConf(this.select);
    this.choices = null;
    this.outer = null;
    this.inner = null;
    this.ready = false;
    this.destroyed = false;
    this.loading = false;
    this._injectedKey = null;
    this.eventBindings = [];
  }

  Select.prototype.isMultiple = function () {
    return !!(this.select && this.select.multiple);
  };

  Select.prototype.forceNativeByAttr = function () {
    return parseBool(this.select.getAttribute("data-rt-select-native"), false);
  };

  Select.prototype.shouldUpgrade = function () {
    if (!this.valid) return false;
    if (this.isMultiple()) return true;

    this.conf = getConf(this.select);

    if (this.conf.native) return false;
    if (this.forceNativeByAttr()) return false;
    if (this.conf.force || this.conf.custom) return true;

    var platformMatch = platformListMatches(this.conf.platforms);
    if (platformMatch !== null) return platformMatch;

    if (
      this.conf.mode === "all" ||
      this.conf.mode === "any" ||
      this.conf.mode === "custom" ||
      this.conf.mode === "choices" ||
      this.conf.mode === "choice" ||
      this.conf.mode === "enhance" ||
      this.conf.mode === "enhanced" ||
      this.conf.mode === "always" ||
      this.conf.mode === "force" ||
      this.conf.mode === "true" ||
      this.conf.mode === "1"
    ) {
      return true;
    }

    if (
      this.conf.mode === "none" ||
      this.conf.mode === "native" ||
      this.conf.mode === "off" ||
      this.conf.mode === "false" ||
      this.conf.mode === "0"
    ) {
      return false;
    }

    var modePlatformMatch = platformListMatches(this.conf.mode);
    if (modePlatformMatch !== null) return modePlatformMatch;

    return isWindows();
  };

  Select.prototype.getState = function () {
    return {
      id: this.selectId,
      element: this.select,
      choices: this.choices,
      value: this.getValue(),
      multiple: !!this.select.multiple,
      disabled: !!this.select.disabled,
      required: !!this.select.required,
      valid: this.isValid(),
      ready: !!this.ready,
      upgraded: !!this.choices,
      platform: getPlatform(),
    };
  };

  Select.prototype.isValid = function () {
    try {
      return this.select.checkValidity();
    } catch (e) {
      return true;
    }
  };

  Select.prototype.findOuter = function () {
    if (
      this.choices &&
      this.choices.containerOuter &&
      this.choices.containerOuter.element
    ) {
      return this.choices.containerOuter.element;
    }
    var parent = this.select.parentElement;
    if (parent && parent.classList && parent.classList.contains("choices")) return parent;
    var prev = this.select.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains("choices")) return prev;
    var next = this.select.nextElementSibling;
    if (next && next.classList && next.classList.contains("choices")) return next;
    return null;
  };

  Select.prototype.findInner = function () {
    if (
      this.choices &&
      this.choices.containerInner &&
      this.choices.containerInner.element
    ) {
      return this.choices.containerInner.element;
    }
    return this.outer ? this.outer.querySelector(".choices__inner") : null;
  };

  Select.prototype.applyStyleVars = function () {
    if (!this.outer) return;
    var vars = getStyleVars(this.select);
    for (var key in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, key)) {
        this.outer.style.setProperty(key, vars[key]);
      }
    }
  };

  Select.prototype.applyStyles = function () {
    if (!this.outer) return;

    var outerUID = assignUID(this.outer, "data-rt-select-choice-uid");
    this.outer.setAttribute("data-rt-select-owner", this.selectId);
    this.outer.setAttribute("data-rt-select-multiple", this.isMultiple() ? "true" : "false");
    this.outer.classList.add("rt-select-choice");

    var css =
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"]{box-sizing:border-box;width:100%;max-width:100%;margin-bottom:var(--rt-select-margin-bottom,0px);font-size:var(--rt-select-font-size,inherit);color:var(--rt-select-text,#111)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] *{box-sizing:border-box}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"].is-open{z-index:var(--rt-select-z-index,999)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__inner{width:100%;min-height:var(--rt-select-min-height,44px);background:var(--rt-select-bg,#fff);border:var(--rt-select-border-width,1px) solid var(--rt-select-border,#d0d5dd);border-radius:var(--rt-select-radius,8px);box-shadow:var(--rt-select-shadow,none);color:var(--rt-select-text,#111);font-size:var(--rt-select-font-size,inherit);line-height:1.4;padding:var(--rt-select-padding-y,10px) var(--rt-select-padding-x,12px);transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"].is-focused .choices__inner,[data-rt-select-choice-uid="' +
      outerUID +
      '"].is-open .choices__inner{border-color:var(--rt-select-focus,#111);box-shadow:var(--rt-select-focus-shadow,none)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"].is-disabled .choices__inner{background:var(--rt-select-bg-disabled,#f5f5f5);cursor:not-allowed;opacity:.75}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-rt-select-invalid="true"] .choices__inner{border-color:var(--rt-select-invalid,#d92d20)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list--single{padding:0 calc(var(--rt-select-arrow-right,14px) + var(--rt-select-arrow-size,5px) + 8px) 0 0}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__placeholder{opacity:1;color:var(--rt-select-placeholder,#777)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__input{background:transparent;color:var(--rt-select-text,#111);font-size:var(--rt-select-font-size,inherit);line-height:1.35;margin:0;min-width:9ch}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__input::placeholder{color:var(--rt-select-placeholder,#777);opacity:1}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-rt-select-multiple="true"] .choices__inner{display:flex;align-items:center;min-height:var(--rt-select-min-height,44px);padding:var(--rt-select-multi-padding-y,7px) var(--rt-select-multi-padding-x,8px)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-rt-select-multiple="true"] .choices__list--multiple{display:flex;align-items:center;align-content:center;gap:var(--rt-select-chip-gap,6px);flex-wrap:wrap;width:100%;padding:0;margin:0}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-rt-select-multiple="true"] .choices__input{display:inline-flex;align-items:center;flex:1 1 140px;width:auto!important;max-width:100%;min-height:28px;padding:0 4px;margin:0;border:0!important;box-shadow:none!important}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-rt-select-multiple="true"] .choices__list--multiple .choices__item{display:inline-flex;align-items:center;max-width:100%;min-height:28px;background:var(--rt-select-tag-bg,#111);border:1px solid var(--rt-select-tag-border,#111);border-radius:var(--rt-select-tag-radius,999px);color:var(--rt-select-tag-color,#fff);font-size:calc(var(--rt-select-font-size,14px) * .9);font-weight:500;line-height:1.15;margin:0;padding:var(--rt-select-chip-padding-y,5px) var(--rt-select-chip-padding-x,9px);vertical-align:middle;word-break:break-word}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-rt-select-multiple="true"] .choices__button{position:relative;width:16px;height:16px;min-width:16px;margin:0 0 0 7px;padding:0;border:0;border-left:0!important;background-size:8px;opacity:.85}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list--dropdown,[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list[aria-expanded]{background:var(--rt-select-dropdown-bg,#fff);border:var(--rt-select-border-width,1px) solid var(--rt-select-border,#d0d5dd);border-radius:var(--rt-select-dropdown-radius,8px);box-shadow:var(--rt-select-dropdown-shadow,0 12px 28px rgba(16,24,40,.12));color:var(--rt-select-text,#111);margin-top:6px;overflow:hidden;z-index:var(--rt-select-z-index,999)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list--dropdown .choices__list,[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list[aria-expanded] .choices__list{max-height:var(--rt-select-dropdown-max-height,260px);overflow:auto;-webkit-overflow-scrolling:touch}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list--dropdown .choices__item,[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list[aria-expanded] .choices__item{font-size:var(--rt-select-font-size,inherit);line-height:1.35;padding:10px 12px;color:var(--rt-select-text,#111)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list--dropdown .choices__item--selectable.is-highlighted,[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list[aria-expanded] .choices__item--selectable.is-highlighted{background:var(--rt-select-highlight-bg,#f2f4f7);color:var(--rt-select-highlight-color,#111)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list--dropdown .choices__item[aria-selected="true"],[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__list[aria-expanded] .choices__item[aria-selected="true"]{background:var(--rt-select-selected-bg,#eef4ff);color:var(--rt-select-selected-color,#111)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__heading{border-bottom-color:var(--rt-select-border,#d0d5dd);color:var(--rt-select-placeholder,#777);font-size:calc(var(--rt-select-font-size,14px) * .85);font-weight:600;padding:10px 12px}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"] .choices__item--disabled{opacity:.5;cursor:not-allowed}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-type*="select-one"]::after{border-color:var(--rt-select-arrow,#111) transparent transparent transparent;border-width:var(--rt-select-arrow-size,5px);right:var(--rt-select-arrow-right,14px);margin-top:calc(var(--rt-select-arrow-size,5px) * -.35)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-type*="select-one"].is-open::after{border-color:transparent transparent var(--rt-select-arrow,#111) transparent;margin-top:calc(var(--rt-select-arrow-size,5px) * -.85)}' +
      '[data-rt-select-choice-uid="' +
      outerUID +
      '"][data-type*="select-multiple"]::after{display:none!important}';

    this._injectedKey = "rt-select-" + outerUID;
    injectOnce(this._injectedKey, css);
    this.applyStyleVars();
  };

  Select.prototype.updateStateAttrs = function () {
    if (!this.outer) return;
    this.outer.setAttribute("data-rt-select-disabled", this.select.disabled ? "true" : "false");
    this.outer.setAttribute("data-rt-select-required", this.select.required ? "true" : "false");
    this.outer.setAttribute("data-rt-select-invalid", this.isValid() ? "false" : "true");
    this.outer.setAttribute("data-rt-select-multiple", this.isMultiple() ? "true" : "false");
  };

  Select.prototype.bind = function (el, type, fn, opts) {
    if (!el) return;
    el.addEventListener(type, fn, opts);
    this.eventBindings.push({ el: el, type: type, fn: fn, opts: opts });
  };

  Select.prototype.bindEvents = function () {
    var self = this;
    this.bind(this.select, "change", function () {
      self.updateStateAttrs();
    });
    this.bind(this.select, "invalid", function () {
      self.updateStateAttrs();
    });
    this.bind(this.select, "addItem", function () {
      self.updateStateAttrs();
    });
    this.bind(this.select, "removeItem", function () {
      self.updateStateAttrs();
    });
    this.bind(this.select, "showDropdown", function () {
      self.updateStateAttrs();
    });
    this.bind(this.select, "hideDropdown", function () {
      self.updateStateAttrs();
    });
  };

  Select.prototype.clearEvents = function () {
    for (var i = 0; i < this.eventBindings.length; i++) {
      var b = this.eventBindings[i];
      b.el.removeEventListener(b.type, b.fn, b.opts);
    }
    this.eventBindings = [];
  };

  Select.prototype.createChoices = function () {
    if (this.destroyed || this.choices) return;
    if (typeof window.Choices === "undefined") {
      this.loading = false;
      this.select.setAttribute("data-rt-select-active", "error");
      emit(this.select, "rtSelect:error", {
        id: this.selectId,
        error: "window.Choices is missing",
      });
      return;
    }

    try {
      this.choices = new window.Choices(this.select, getOptions(this.select));
    } catch (e) {
      this.loading = false;
      this.choices = null;
      this.select.setAttribute("data-rt-select-active", "error");
      state.errors.push(e && e.message ? e.message : String(e));
      emit(this.select, "rtSelect:error", {
        id: this.selectId,
        error: e,
      });
      return;
    }

    this.outer = this.findOuter();
    this.inner = this.findInner();

    if (!this.outer) {
      this.loading = false;
      this.select.setAttribute("data-rt-select-active", "error");
      emit(this.select, "rtSelect:error", {
        id: this.selectId,
        error: "Choices outer container not found",
      });
      return;
    }

    this.ready = true;
    this.loading = false;
    this.select.setAttribute("data-rt-select-active", "true");
    this.applyStyles();
    this.updateStateAttrs();
    this.bindEvents();
    emit(this.select, "rtSelect:ready", this.getState());
  };

  Select.prototype.init = function () {
    var self = this;
    if (!this.valid || this.destroyed || this.loading || this.choices) return;

    this.conf = getConf(this.select);

    if (!this.shouldUpgrade()) {
      this.select.setAttribute("data-rt-select-active", "native");
      return;
    }

    this.loading = true;
    this.select.setAttribute("data-rt-select-active", "loading");

    loadChoicesAssets(this.conf.scriptSrc, this.conf.styleSrc, this.conf.loadStyle)
      .then(function () {
        if (!self.destroyed) self.createChoices();
      })
      .catch(function (e) {
        self.loading = false;
        self.select.setAttribute("data-rt-select-active", "error");
        state.errors.push(e && e.message ? e.message : String(e));
        emit(self.select, "rtSelect:error", {
          id: self.selectId,
          error: e,
        });
      });
  };

  Select.prototype.destroyChoicesOnly = function () {
    this.clearEvents();

    if (this.choices) {
      try {
        this.choices.destroy();
      } catch (e) {}
      this.choices = null;
    }

    if (this._injectedKey) {
      removeInjected(this._injectedKey);
      this._injectedKey = null;
    }

    this.outer = null;
    this.inner = null;
    this.ready = false;
    this.loading = false;
  };

  Select.prototype.destroy = function () {
    this.destroyed = true;
    this.destroyChoicesOnly();
    if (this.select) this.select.setAttribute("data-rt-select-active", "destroyed");
  };

  Select.prototype.refresh = function () {
    if (this.destroyed) return;
    if (!this.choices) return;
    try {
      if (this.choices.refresh) this.choices.refresh(true, false);
    } catch (e) {}
    this.outer = this.findOuter();
    this.inner = this.findInner();
    this.applyStyles();
    this.updateStateAttrs();
  };

  Select.prototype.getValue = function () {
    if (this.choices && this.choices.getValue) {
      try {
        return this.choices.getValue(true);
      } catch (e) {}
    }
    return getNativeValue(this.select);
  };

  Select.prototype.setValue = function (value, silent) {
    if (this.choices) {
      try {
        if (this.select.multiple && this.choices.removeActiveItems) {
          this.choices.removeActiveItems();
        }
        if (this.choices.setChoiceByValue) {
          this.choices.setChoiceByValue(value);
        } else {
          setNativeValue(this.select, value);
        }
      } catch (e) {
        setNativeValue(this.select, value);
      }
    } else {
      setNativeValue(this.select, value);
    }
    this.updateStateAttrs();
    if (!silent) dispatchNativeChange(this.select);
  };

  Select.prototype.open = function () {
    if (!this.choices || !this.choices.showDropdown) return;
    try {
      this.choices.showDropdown();
    } catch (e) {}
  };

  Select.prototype.close = function () {
    if (!this.choices || !this.choices.hideDropdown) return;
    try {
      this.choices.hideDropdown();
    } catch (e) {}
  };

  function removeOrder(id) {
    var idx = state.order.indexOf(id);
    if (idx > -1) state.order.splice(idx, 1);
  }

  function init() {
    state.initStarted = true;
    var roots = document.querySelectorAll("select[data-rt-select]");

    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];
      var id = root.getAttribute("data-rt-select-id");

      if (!id) {
        id = "select-" + uid();
        root.setAttribute("data-rt-select-id", id);
      }

      if (state.instances[id]) continue;

      var inst = new Select(root, id);
      if (!inst.valid) continue;

      if (inst.shouldUpgrade()) {
        delete state.skipped[id];
        state.instances[id] = inst;
        state.order.push(id);
        inst.init();
      } else {
        state.skipped[id] = root;
        root.setAttribute("data-rt-select-active", "native");
      }
    }

    state.ready = true;
  }

  function refresh() {
    var keys = state.order.slice();
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      var inst = state.instances[id];
      if (!inst) continue;
      if (!document.documentElement.contains(inst.select)) {
        inst.destroy();
        delete state.instances[id];
        removeOrder(id);
        continue;
      }
      inst.refresh();
    }

    var skippedKeys = [];
    for (var key in state.skipped) {
      if (Object.prototype.hasOwnProperty.call(state.skipped, key)) {
        skippedKeys.push(key);
      }
    }

    for (var j = 0; j < skippedKeys.length; j++) {
      var sid = skippedKeys[j];
      var el = state.skipped[sid];
      if (!el || !document.documentElement.contains(el)) {
        delete state.skipped[sid];
        continue;
      }

      var next = new Select(el, sid);
      if (next.valid && next.shouldUpgrade()) {
        delete state.skipped[sid];
        state.instances[sid] = next;
        state.order.push(sid);
        next.init();
      }
    }
  }

  function makeApi() {
    return {
      __initialized: true,
      version: "0.1.0",
      platform: function () {
        return getPlatform();
      },
      isWindows: function () {
        return isWindows();
      },
      ids: function () {
        return state.order.slice();
      },
      skipped: function () {
        var keys = [];
        for (var key in state.skipped) {
          if (Object.prototype.hasOwnProperty.call(state.skipped, key)) keys.push(key);
        }
        return keys;
      },
      errors: function () {
        return state.errors.slice();
      },
      get: function (id) {
        return state.instances[id] || null;
      },
      getChoices: function (id) {
        var inst = state.instances[id];
        return inst ? inst.choices : null;
      },
      getValue: function (id) {
        var inst = state.instances[id];
        if (inst) return inst.getValue();
        if (state.skipped[id]) return getNativeValue(state.skipped[id]);
        return null;
      },
      setValue: function (id, value, silent) {
        var inst = state.instances[id];
        var el = state.skipped[id];
        if (inst) {
          inst.setValue(value, !!silent);
          return;
        }
        if (el) {
          setNativeValue(el, value);
          if (!silent) dispatchNativeChange(el);
        }
      },
      open: function (id) {
        var inst = state.instances[id];
        if (inst) inst.open();
      },
      close: function (id) {
        var inst = state.instances[id];
        if (inst) inst.close();
      },
      refresh: function () {
        init();
        refresh();
      },
      init: function () {
        init();
      },
      destroy: function (id) {
        if (typeof id === "string") {
          var inst = state.instances[id];
          if (inst) {
            inst.destroy();
            delete state.instances[id];
            removeOrder(id);
          }
          if (state.skipped[id]) delete state.skipped[id];
          return;
        }

        var keys = state.order.slice();
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (state.instances[k]) state.instances[k].destroy();
        }
        state.instances = {};
        state.skipped = {};
        state.order = [];
      },
    };
  }

  window[RT_NS] = makeApi();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
