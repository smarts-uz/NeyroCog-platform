import "server-only";

import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// `prepare: false` — Supabase pgBouncer (transaction mode) prepared statement'ni qo'llamaydi
const queryClient = postgres(env.DATABASE_URL, { prepare: false, max: 10 });

export const db = drizzle({ client: queryClient, schema });
export type Database = typeof db;
