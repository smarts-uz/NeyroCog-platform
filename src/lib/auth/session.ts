import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./server";

/**
 * Server-side sessiya o'qish — RSC va Server Actions'da ishlatiladi.
 * `cache()` bitta request davomida bir necha chaqiriqlarda bitta natijani qaytaradi.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Sessiya yoki redirect — page guard'larida ishlatiladi.
 * Login bo'lmagan bo'lsa null qaytaradi, chaqiruvchi tomon redirect qiladi.
 */
export async function requireSession() {
  const session = await getSession();
  return session;
}
