import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // 3 til — har biri URL prefix bilan (/uz, /ru, /en).
  // ru/en tarjimalari AI-draft — klinik atamalar shifokor tomonidan
  // tasdiqlanishi kerak (messages/ru.json, messages/en.json'dagi $meta.status).
  locales: ["uz", "ru", "en"],
  // Default: o'zbek (URL'da `/uz/...` ko'rinadi — "always" rejimi)
  defaultLocale: "uz",
  // Har locale URL'da bo'ladi, hatto default ham
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
