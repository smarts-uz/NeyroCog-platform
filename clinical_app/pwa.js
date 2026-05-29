// PWA bootstrap — registers the Serwist service worker and wires the
// "Add to home screen" install flow. Loaded as a module so it can import
// @serwist/window from a CDN. All of this is feature-detected and wrapped in
// try/catch so non-PWA / sandboxed contexts (e.g. the in-app preview) no-op safely.

(async () => {
  // ---- Environment guard ----
  // Service workers can't register inside a sandboxed / cross-origin preview
  // iframe (opaque origin) — the browser logs "Failed to register a
  // ServiceWorker / Location" errors that try/catch can't suppress. Only
  // attempt registration when we're top-level AND in a secure context. On a
  // real HTTPS host (or localhost) this passes and the PWA works normally.
  const inIframe = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
  const canRegisterSW = "serviceWorker" in navigator && window.isSecureContext && !inIframe;

  // ---- Service worker registration (Serwist) ----
  if (canRegisterSW) {
    try {
      const { Serwist } = await import("https://esm.sh/@serwist/window@9");
      const sw = new Serwist("sw.js", { scope: "./", type: "module" });

      sw.addEventListener("waiting", () => {
        // A new version is ready — activate it on next load silently.
        try { sw.messageSkipWaiting(); } catch (e) {}
      });

      await sw.register();
    } catch (e) {
      // Fallback to the raw API if @serwist/window can't load (e.g. offline CDN).
      try {
        await navigator.serviceWorker.register("sw.js", { scope: "./", type: "module" });
      } catch (e2) {
        console.info("[PWA] service worker not registered:", e2 && e2.message);
      }
    }
  }

  // ---- Install prompt (beforeinstallprompt) ----
  let deferredPrompt = null;

  const makeButton = () => {
    if (document.getElementById("ktt-install-btn")) return document.getElementById("ktt-install-btn");
    const btn = document.createElement("button");
    btn.id = "ktt-install-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Ilovani o'rnatish");
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>' +
      "<span>Ilovani o'rnatish</span>";
    Object.assign(btn.style, {
      position: "fixed", right: "18px", bottom: "18px", zIndex: "300",
      display: "none", alignItems: "center", gap: "8px",
      padding: "11px 16px", borderRadius: "999px",
      background: "#0F766E", color: "#FFFFFF", border: "0",
      font: "600 13.5px/1 Outfit, system-ui, sans-serif",
      boxShadow: "0 8px 24px rgba(15,118,110,0.35)", cursor: "pointer",
    });
    btn.addEventListener("mouseenter", () => { btn.style.background = "#0E6B63"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = "#0F766E"; });
    btn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      btn.style.display = "none";
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) {}
      deferredPrompt = null;
    });
    document.body.appendChild(btn);
    return btn;
  };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = makeButton();
    btn.style.display = "inline-flex";
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    const btn = document.getElementById("ktt-install-btn");
    if (btn) btn.style.display = "none";
  });
})();
