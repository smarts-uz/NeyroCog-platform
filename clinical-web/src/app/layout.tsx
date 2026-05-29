/**
 * Root layout — minimal HTML shell.
 *
 * `[locale]/layout.tsx`'da real <html>/<body> chiqariladi, chunki har til
 * uchun `lang` atributini next-intl boshqaradi. Bu yerdagi layout faqat
 * Next.js'ning required tree'siga moslash uchun.
 */

import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
