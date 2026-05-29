import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

// better-auth'ning barcha endpoint'lari: /api/auth/sign-in, /sign-up,
// /sign-out, /session, /verify-email, va h.k.
export const { GET, POST } = toNextJsHandler(auth);
