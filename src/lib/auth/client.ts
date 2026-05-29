"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Server URL — relative, current origin
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "",
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
