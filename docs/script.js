/* =========================================================
   BEAMTYPE — script.js
   JavaScript puro, sem dependências.
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. Imagem do hero com fallback ilustrado
     --------------------------------------------------------- */
  (function heroImage() {
    var fig = document.getElementById("heroFigure");
    var img = document.getElementById("heroPhoto");
    if (!fig || !img) return;

    function fallback() { fig.classList.add("is-mock"); }
    img.addEventListener("error", fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  })();

  /* ---------------------------------------------------------
     2. Menu mobile
     --------------------------------------------------------- */
  (function menu() {
    var burger = document.getElementById("burger");
    var links = document.getElementById("menu");
    if (!burger || !links) return;

    function setOpen(open) {
      links.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  })();

  /* ---------------------------------------------------------
     3. Revelação no scroll
     --------------------------------------------------------- */
  var observe = (function () {
    if (!("IntersectionObserver" in window) || reduced) {
      return function (el, cb) { cb(el); };
    }
    return function (el, cb) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            cb(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
      io.observe(el);
    };
  })();

  Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el, i) {
    observe(el, function (target) {
      target.style.transitionDelay = reduced ? "0ms" : (i % 5) * 90 + "ms";
      target.classList.add("is-in");
    });
  });

  /* ---------------------------------------------------------
     4. Teclado virtual
     --------------------------------------------------------- */
  var LAYOUT = [
    [
      { label: "ESC", code: "Escape", w: 1.6, wide: true },
      { label: "1", code: "Digit1" }, { label: "2", code: "Digit2" },
      { label: "3", code: "Digit3" }, { label: "4", code: "Digit4" },
      { label: "5", code: "Digit5" }, { label: "6", code: "Digit6" },
      { label: "7", code: "Digit7" }, { label: "8", code: "Digit8" },
      { label: "9", code: "Digit9" }, { label: "0", code: "Digit0" },
      { label: "BACKSPACE", code: "Backspace", w: 2.4, wide: true }
    ],
    [
      { label: "TAB", code: "Tab", w: 1.8, wide: true },
      { label: "Q", code: "KeyQ" }, { label: "W", code: "KeyW" }, { label: "E", code: "KeyE" },
      { label: "R", code: "KeyR" }, { label: "T", code: "KeyT" }, { label: "Y", code: "KeyY" },
      { label: "U", code: "KeyU" }, { label: "I", code: "KeyI" }, { label: "O", code: "KeyO" },
      { label: "P", code: "KeyP" }
    ],
    [
      { label: "CAPS", code: "CapsLock", w: 2.1, wide: true, toggle: true },
      { label: "A", code: "KeyA" }, { label: "S", code: "KeyS" }, { label: "D", code: "KeyD" },
      { label: "F", code: "KeyF" }, { label: "G", code: "KeyG" }, { label: "H", code: "KeyH" },
      { label: "J", code: "KeyJ" }, { label: "K", code: "KeyK" }, { label: "L", code: "KeyL" },
      { label: "ENTER", code: "Enter", w: 2.4, wide: true }
    ],
    [
      { label: "SHIFT", code: "ShiftLeft", w: 2.6, wide: true, toggle: true },
      { label: "Z", code: "KeyZ" }, { label: "X", code: "KeyX" }, { label: "C", code: "KeyC" },
      { label: "V", code: "KeyV" }, { label: "B", code: "KeyB" }, { label: "N", code: "KeyN" },
      { label: "M", code: "KeyM" },
      { label: "SHIFT", code: "ShiftRight", w: 2.6, wide: true, toggle: true }
    ],
    [
      { label: "CTRL", code: "ControlLeft", w: 1.6, wide: true },
      { label: "ALT", code: "AltLeft", w: 1.4, wide: true },
      { label: "SPACE", code: "Space", w: 8, wide: true },
      { label: "ALT", code: "AltRight", w: 1.4, wide: true },
      { label: "CTRL", code: "ControlRight", w: 1.6, wide: true }
    ]
  ];

  var board = document.getElementById("board");
  var keysHost = document.getElementById("keys");
  var out = document.getElementById("saida");
  var counter = document.getElementById("contador");
  var clearBtn = document.getElementById("limpar");
  var keyMap = {};
  var shift = false;
  var caps = false;

  function isLetter(def) { return /^Key/.test(def.code); }

  function buildKeyboard() {
    if (!keysHost) return;
    LAYOUT.forEach(function (row, rowIndex) {
      var rowEl = document.createElement("div");
      rowEl.className = "krow";

      row.forEach(function (def, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key" + (def.wide ? " key--wide" : "");
        btn.style.setProperty("--w", def.w || 1);
        btn.style.animationDelay = reduced ? "0ms" : (rowIndex * 70 + i * 18) + "ms";
        btn.dataset.code = def.code;
        btn.textContent = def.label;
        btn.setAttribute("aria-label", "Tecla " + def.label);
        if (def.toggle) btn.setAttribute("aria-pressed", "false");

        btn.addEventListener("click", function () { press(def, btn); });
        rowEl.appendChild(btn);
        keyMap[def.code] = { el: btn, def: def };
      });

      keysHost.appendChild(rowEl);
    });
  }

  function refreshLetters() {
    var upper = shift !== caps; /* XOR */
    Object.keys(keyMap).forEach(function (code) {
      var item = keyMap[code];
      if (isLetter(item.def)) {
        item.el.textContent = upper ? item.def.label : item.def.label.toLowerCase();
      }
    });
  }

  function setToggle(code, state) {
    var item = keyMap[code];
    if (!item) return;
    item.el.classList.toggle("is-active", state);
    item.el.setAttribute("aria-pressed", String(state));
  }

  function syncShiftKeys() {
    setToggle("ShiftLeft", shift);
    setToggle("ShiftRight", shift);
    refreshLetters();
  }

  function updateCounter() {
    if (!counter || !out) return;
    var n = out.value.length;
    counter.textContent = n + (n === 1 ? " caractere" : " caracteres");
  }

  function insert(text) {
    if (!out) return;
    out.value += text;
    out.scrollTop = out.scrollHeight;
    updateCounter();
  }

  function press(def, el) {
    flash(el);

    switch (def.code) {
      case "Backspace":
        out.value = out.value.slice(0, -1);
        updateCounter();
        return;
      case "Enter":
        insert("\n");
        return;
      case "Space":
        insert(" ");
        return;
      case "Tab":
        insert("    ");
        return;
      case "CapsLock":
        caps = !caps;
        setToggle("CapsLock", caps);
        refreshLetters();
        return;
      case "ShiftLeft":
      case "ShiftRight":
        shift = !shift;
        syncShiftKeys();
        return;
      case "Escape":
      case "ControlLeft":
      case "ControlRight":
      case "AltLeft":
      case "AltRight":
        return;
    }

    if (isLetter(def)) {
      var upper = shift !== caps;
      insert(upper ? def.label : def.label.toLowerCase());
      if (shift) { shift = false; syncShiftKeys(); }
      return;
    }

    insert(def.label); /* dígitos */
  }

  function flash(el) {
    if (!el) return;
    el.classList.add("is-down");
    window.setTimeout(function () { el.classList.remove("is-down"); }, 130);
  }

  buildKeyboard();
  refreshLetters();
  updateCounter();

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      out.value = "";
      updateCounter();
      out.focus();
    });
  }

  if (out) {
    out.addEventListener("input", updateCounter);
  }

  /* --- teclado físico --------------------------------------- */
  document.addEventListener("keydown", function (e) {
    var item = keyMap[e.code];
    if (!item) return;

    var typingInField = document.activeElement === out;

    if (item.el) {
      item.el.classList.add("is-down");
    }

    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      shift = true;
      syncShiftKeys();
      return;
    }
    if (e.code === "CapsLock") {
      caps = typeof e.getModifierState === "function" ? e.getModifierState("CapsLock") : !caps;
      setToggle("CapsLock", caps);
      refreshLetters();
      return;
    }

    /* Quando o campo está focado, o navegador já escreve o texto.
       Fora dele, replicamos a digitação no campo de demonstração. */
    if (typingInField) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === "Tab") return; /* Tab continua navegando pela página */

    var active = document.activeElement;
    var interactive = active && /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(active.tagName);
    if (interactive) return; /* não roubar Espaço/Enter de outro controle */

    if (e.code === "Backspace" || e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
    }

    press(item.def, null);
  });

  document.addEventListener("keyup", function (e) {
    var item = keyMap[e.code];
    if (item && item.el) item.el.classList.remove("is-down");

    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      shift = false;
      syncShiftKeys();
    }
  });

  window.addEventListener("blur", function () {
    Object.keys(keyMap).forEach(function (c) { keyMap[c].el.classList.remove("is-down"); });
  });

  /* --- sequência de projeção ao entrar na tela --------------- */
  if (board) {
    observe(board, function (el) { el.classList.add("is-on"); });
    window.setTimeout(function () { board.classList.add("is-on"); }, 2500); /* garantia */
  }

  /* ---------------------------------------------------------
     5. Trackpad
     --------------------------------------------------------- */
  (function trackpad() {
    var surface = document.getElementById("padSurface");
    var cursor = document.getElementById("padCursor");
    var status = document.getElementById("padStatus");
    if (!surface || !cursor) return;

    var clicks = 0;

    function move(x, y) {
      cursor.style.transform = "translate(" + x + "px," + y + "px)";
    }

    function fromEvent(e) {
      var r = surface.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return {
        x: Math.max(0, Math.min(r.width, p.clientX - r.left)),
        y: Math.max(0, Math.min(r.height, p.clientY - r.top))
      };
    }

    function activate(e) {
      surface.classList.add("is-live");
      var p = fromEvent(e);
      move(p.x, p.y);
      if (status && clicks === 0) status.textContent = "Cursor ativo — clique para registrar um toque";
    }

    surface.addEventListener("pointermove", activate);
    surface.addEventListener("pointerdown", function (e) {
      activate(e);
      var p = fromEvent(e);
      var ring = document.createElement("span");
      ring.className = "pad__ring";
      ring.style.left = p.x + "px";
      ring.style.top = p.y + "px";
      surface.appendChild(ring);
      window.setTimeout(function () { ring.remove(); }, 600);

      clicks += 1;
      if (status) status.textContent = clicks === 1 ? "1 toque registrado" : clicks + " toques registrados";
    });

    surface.addEventListener("pointerleave", function () {
      surface.classList.remove("is-live");
    });

    /* acessível pelo teclado: setas movem o cursor de demonstração */
    var kx = 0, ky = 0;
    surface.addEventListener("keydown", function (e) {
      var step = 16;
      var r = surface.getBoundingClientRect();
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) === -1) return;
      e.preventDefault();
      surface.classList.add("is-live");
      if (e.key === "ArrowUp") ky -= step;
      if (e.key === "ArrowDown") ky += step;
      if (e.key === "ArrowLeft") kx -= step;
      if (e.key === "ArrowRight") kx += step;
      kx = Math.max(0, Math.min(r.width, kx));
      ky = Math.max(0, Math.min(r.height, ky));
      move(kx, ky);
    });
  })();

  /* ---------------------------------------------------------
     6. Comparador
     --------------------------------------------------------- */
  (function comparator() {
    var range = document.getElementById("balanca");
    var fill = document.getElementById("sliderFill");
    var trad = document.getElementById("cmpTrad");
    var beam = document.getElementById("cmpBeam");
    if (!range || !trad || !beam) return;

    function apply() {
      var v = Number(range.value);
      if (fill) fill.style.width = v + "%";

      trad.classList.toggle("is-lead", v < 42);
      trad.classList.toggle("is-off", v > 58);
      beam.classList.toggle("is-lead", v > 58);
      beam.classList.toggle("is-off", v < 42);
    }

    range.addEventListener("input", apply);
    apply();
  })();

  /* ---------------------------------------------------------
     7. CTA final
     --------------------------------------------------------- */
  (function cta() {
    var btn = document.getElementById("ctaBtn");
    var target = document.getElementById("teclado");
    if (!btn || !target) return;

    btn.addEventListener("click", function () {
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      window.setTimeout(function () { if (out) out.focus({ preventScroll: true }); }, reduced ? 0 : 700);
    });
  })();

})();
