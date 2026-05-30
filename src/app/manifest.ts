import type { MetadataRoute } from "next";

// PWA manifest — 2-dastur (reabilitatsiya) bola uyda telefonda bajaradi,
// shuning uchun o'rnatiladigan (installable) bo'lishi muhim.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeyroCog — Kognitiv Test Tizimi",
    short_name: "NeyroCog",
    description:
      "Pediatrik operatsiyadan keyingi kognitiv buzilishlarni (POCD) diagnostika, bashorat va reabilitatsiya tizimi.",
    start_url: "/uz/bemorlar",
    display: "standalone",
    background_color: "#F1F5F9",
    theme_color: "#0F766E",
    lang: "uz",
    dir: "ltr",
    orientation: "any",
    categories: ["medical", "health", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Bemorlar ro'yxati", short_name: "Bemorlar", url: "/uz/bemorlar" },
      { name: "Tahlil — ROC", short_name: "Tahlil", url: "/uz/tahlil" },
    ],
  };
}
