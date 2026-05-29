import { defineConfig } from "drizzle-kit";

// .env.local ni yuklash (Node 20.12+ / 24)
try {
  process.loadEnvFile(".env.local");
} catch {
  // fayl yo'q yoki muhit allaqachon yuklangan — e'tiborsiz qoldiramiz
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in your Supabase Postgres connection string.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
