import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// Uptime monitoring uchun — DB ulanishini tekshiradi. Auth talab qilmaydi,
// sezgir ma'lumot qaytarmaydi.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({
      status: "ok",
      db: "up",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
}
