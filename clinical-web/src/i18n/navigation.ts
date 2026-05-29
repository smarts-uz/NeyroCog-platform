import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Wrapped navigation primitives that automatically prefix locale.
// Use these instead of `next/link` and `next/navigation` inside the app.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
