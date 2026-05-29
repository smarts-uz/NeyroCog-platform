import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set. See .env.local.example.");
}

// `prepare: false` — Supabase pgBouncer (transaction mode) prepared statement'ni qo'llamaydi
const queryClient = postgres(url, { prepare: false, max: 10 });

export const db = drizzle({ client: queryClient, schema });
export type Database = typeof db;
