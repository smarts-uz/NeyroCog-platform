// NeyroCog service worker — built on Serwist (https://serwist.pages.dev).
// Module service worker: loaded with { type: "module" } and imports Serwist from a CDN.
// Provides offline app-shell precaching + runtime caching for CDN deps, fonts and images.
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from "https://esm.sh/serwist@9";

const REV = "v1-2026-05";

// App shell — precached so the whole tool works offline after first visit.
const precacheEntries = [
  { url: "Analytics.jsx", revision: REV },
  { url: "AnalyticsROC.jsx", revision: REV },
  { url: "AnalyticsReports.jsx", revision: REV },
  { url: "AnalyticsTreatment.jsx", revision: REV },
  { url: "App.jsx", revision: REV },
  { url: "Composite.jsx", revision: REV },
  { url: "DoctorProfileModal.jsx", revision: REV },
  { url: "Login.jsx", revision: REV },
  { url: "PNBForecast.jsx", revision: REV },
  { url: "PatientView.jsx", revision: REV },
  { url: "PatientsList.jsx", revision: REV },
  { url: "Results.jsx", revision: REV },
  { url: "TMT.jsx", revision: REV },
  { url: "_shared.jsx", revision: REV },
  { url: "app.css", revision: REV },
  { url: "index.html", revision: REV },
  { url: "knbt.js", revision: REV },
  { url: "manifest.webmanifest", revision: REV },
  { url: "prediction.js", revision: REV },
  { url: "stats.js", revision: REV },
  { url: "tests/Audio.jsx", revision: REV },
  { url: "tests/DST.jsx", revision: REV },
  { url: "tests/EEG.jsx", revision: REV },
  { url: "tests/LMWT.jsx", revision: REV },
  { url: "tests/NS.jsx", revision: REV },
  { url: "tests/Stroop.jsx", revision: REV },
  { url: "tests/_TestShell.jsx", revision: REV },
  { url: "training/NBack.jsx", revision: REV },
  { url: "training/ReactionTime.jsx", revision: REV },
  { url: "training/RehabHub.jsx", revision: REV },
  { url: "training/TaskSwitch.jsx", revision: REV },
  { url: "training/Tracking.jsx", revision: REV },
  { url: "training/VisualSearch.jsx", revision: REV },
  { url: "training/_TrainingShell.jsx", revision: REV },
  { url: "training/_meta.js", revision: REV },
  { url: "training/adaptive.js", revision: REV },
  { url: "training/engines_core.jsx", revision: REV },
  { url: "training/engines_extra.jsx", revision: REV },
  { url: "training/engines_unique.jsx", revision: REV },
  { url: "icons/apple-touch-icon.png", revision: REV },
  { url: "icons/icon-192.png", revision: REV },
  { url: "icons/icon-512.png", revision: REV },
  { url: "icons/icon-maskable-512.png", revision: REV }
];

const serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 3rd-party scripts (React, Babel, Lucide) — cache-first, long-lived.
    {
      matcher: ({ url }) => url.origin === "https://unpkg.com",
      handler: new CacheFirst({
        cacheName: "ktt-cdn",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 60 }),
        ],
      }),
    },
    // Google Fonts (stylesheet + font files).
    {
      matcher: ({ url }) =>
        url.origin === "https://fonts.googleapis.com" ||
        url.origin === "https://fonts.gstatic.com",
      handler: new StaleWhileRevalidate({
        cacheName: "ktt-fonts",
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      }),
    },
    // Any images (icons, generated assets).
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: "ktt-images",
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    // Everything else same-origin — network-first, fall back to cache offline.
    {
      matcher: ({ url }) => url.origin === self.location.origin,
      handler: new NetworkFirst({
        cacheName: "ktt-app",
        networkTimeoutSeconds: 4,
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      }),
    },
  ],
  // SPA fallback: serve index.html for navigations when offline.
  fallbacks: {
    entries: [
      { url: "index.html", matcher: ({ request }) => request.mode === "navigate" },
    ],
  },
});

serwist.addEventListeners();
