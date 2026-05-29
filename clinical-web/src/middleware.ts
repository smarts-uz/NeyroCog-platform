import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (`/api/...`) — handled separately (better-auth)
  // - Next internals (`/_next/...`, `/_vercel/...`)
  // - Static files (with a dot in the path, e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
