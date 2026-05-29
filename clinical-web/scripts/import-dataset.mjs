/**
 * import-dataset.mjs — "Dataset ALL N.xlsx" dan haqiqiy ma'lumotlarni Supabase'ga yuklaydi.
 *
 * Parser = Dataset Read Rule 36 ga muvofiq:
 *   - Kanonik ishtirokchi bloki: rows 2–207 (206 bemor), `all` qamrovi
 *   - Demografiya: ALL varaq primary bloki (jinsi + tug'ilgan faqat shu yerda)
 *   - Test ballari: 7 instrument varag'i, ustunlar row-1 sarlavhasidan aniqlanadi
 *   - Absent-combination: Audio/EEG → PreOp yo'q; Sog'lom → PostTx yo'q (bo'sh katak skip)
 *   - № (col A) — barcha varaqlar bo'ylab join kaliti
 *
 * Foydalanish:
 *   npm run import:dataset -- "D:\...\Dataset ALL 70.xlsx"
 *   (argument berilmasa standart yo'l ishlatiladi)
 *
 * Bemorlar SEED_EMAIL (default doktor@klinika.uz) shifokoriga biriktiriladi.
 * Mavjud bemorlar (shu shifokorники) avval o'chiriladi — toza qayta yuklash.
 */

import ExcelJS from "exceljs";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("✗ DATABASE_URL yo'q. --env-file=.env.local bilan ishga tushiring.");
  process.exit(1);
}
const FILE =
  process.argv[2] ??
  "D:\\Humans\\Medicine\\Disserta\\Projects\\Durdona\\Patients\\Dataset ALL 70.xlsx";
const DOCTOR_EMAIL = process.env.SEED_EMAIL ?? "doktor@klinika.uz";

const DATA_FIRST = 2;
const DATA_LAST = 207; // kanonik `all` bloki (Dataset Read Rule)
const TIMEPOINTS = ["PreOp", "PostOp", "PostTx"];
const TESTS = ["Stroop", "TMT", "DST", "LMWT", "NS", "EEG", "Audio"];

// ─── Engine bilan bir xil: Cognitive Health label + NORM (knbt.ts ko'chirmasi) ───
const COG_LABELS = [
  { min: 90, max: 101, label: "A'lo", tone: "great" },
  { min: 80, max: 90, label: "Yaxshi", tone: "good" },
  { min: 70, max: 80, label: "O'rtacha", tone: "ok" },
  { min: 60, max: 70, label: "Pastroq", tone: "warn" },
  { min: 50, max: 60, label: "Past", tone: "warn" },
  { min: 40, max: 50, label: "Juda past", tone: "bad" },
  { min: 0, max: 40, label: "Jiddiy buzilish", tone: "bad" },
];
function cogLabel(score) {
  if (score == null || Number.isNaN(score)) return { label: "—", tone: "neutral" };
  for (const b of COG_LABELS) if (score >= b.min && score < b.max) return { label: b.label, tone: b.tone };
  return { label: "Jiddiy buzilish", tone: "bad" };
}
const NORM = {
  Stroop: { PreOp: { m: 80, sd: 10 }, PostOp: { m: 60, sd: 12 }, PostTx: { m: 75, sd: 11 } },
  TMT: { PreOp: { m: 78, sd: 11 }, PostOp: { m: 58, sd: 13 }, PostTx: { m: 72, sd: 12 } },
  DST: { PreOp: { m: 76, sd: 10 }, PostOp: { m: 60, sd: 12 }, PostTx: { m: 73, sd: 11 } },
  LMWT: { PreOp: { m: 75, sd: 11 }, PostOp: { m: 55, sd: 14 }, PostTx: { m: 72, sd: 12 } },
  NS: { PreOp: { m: 82, sd: 8 }, PostOp: { m: 72, sd: 10 }, PostTx: { m: 80, sd: 9 } },
  EEG: { PreOp: { m: 78, sd: 9 }, PostOp: { m: 72, sd: 10 }, PostTx: { m: 80, sd: 9 } },
  Audio: { PreOp: { m: 80, sd: 10 }, PostOp: { m: 68, sd: 12 }, PostTx: { m: 76, sd: 11 } },
};

// ─── Helpers ──────────────────────────────────────────────────
const raw = (v) => {
  if (v && typeof v === "object" && !(v instanceof Date)) {
    if ("result" in v) return v.result;
    if ("text" in v) return v.text;
  }
  return v;
};
const num = (v) => {
  const n = Number(raw(v));
  return Number.isFinite(n) ? n : null;
};
function normHeader(s) {
  return String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}
function mapJinsi(v) {
  const s = String(raw(v));
  if (s === "O'g'il bola" || s === "O‘g‘il bola") return "Erkak";
  if (s === "Qiz bola") return "Ayol";
  return null;
}
// Timepoint chronologiyasi (latest = eng yangi completedAt)
function completedAt(tp) {
  const base = new Date("2024-01-01T09:00:00Z");
  const off = tp === "PreOp" ? 0 : tp === "PostOp" ? 10 : 40;
  return new Date(base.getTime() + off * 86400000);
}

// Test varag'ida row-1 sarlavhalaridan ustunlarni aniqlash
function resolveTestColumns(ws) {
  const r1 = ws.getRow(1);
  const headerToCol = new Map();
  for (let c = 1; c <= ws.columnCount; c++) {
    headerToCol.set(normHeader(raw(r1.getCell(c).value)), c);
  }
  const cols = {};
  for (const tp of TIMEPOINTS) {
    const cog = headerToCol.get(normHeader(`Cognitive Score (${tp})`));
    const z = headerToCol.get(normHeader(`Z-Score (${tp})`));
    const isp = headerToCol.get(normHeader(`ISPOCD ID (${tp})`));
    if (cog) cols[tp] = { cog, z: z ?? null, isp: isp ?? null };
  }
  return cols;
}

async function main() {
  console.log(`→ Fayl: ${FILE}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  // ── Demografiya: ALL primary bloki (№ → demo) ──
  const all = wb.getWorksheet("ALL");
  const demoByNo = new Map();
  for (let r = DATA_FIRST; r <= DATA_LAST; r++) {
    const row = all.getRow(r);
    const no = num(row.getCell(1).value);
    const fish = raw(row.getCell(2).value);
    const jinsi = mapJinsi(row.getCell(5).value);
    const tug = row.getCell(16).value;
    if (no == null || !fish || !jinsi || !(tug instanceof Date)) continue;
    const davom = num(row.getCell(12).value) ?? 0;
    const prep = num(row.getCell(13).value) ?? 0;
    const premBool = raw(row.getCell(6).value);
    demoByNo.set(no, {
      fish: String(fish).trim(),
      jinsi,
      tugilgan: tug,
      premorbid: premBool === true || premBool === "true" || Number(premBool) > 0 ? 1 : 0,
      davom: davom > 0 ? Math.round(davom) : 0,
      prep: prep >= 0 ? Math.round(prep) : 0,
      boshlanish: row.getCell(29).value instanceof Date ? row.getCell(29).value : null,
      tugash: row.getCell(30).value instanceof Date ? row.getCell(30).value : null,
    });
  }
  console.log(`→ Demografiya (ALL 2–207): ${demoByNo.size} bemor`);

  // ── Test varaqlari: № → { tp → {cog,z,isp} } ──
  const testData = {}; // test → Map(no → {tp:{cog,z,isp}})
  const testCols = {};
  for (const test of TESTS) {
    const ws = wb.getWorksheet(test);
    if (!ws) {
      console.warn(`  ⚠ '${test}' varag'i yo'q — o'tkazib yuborildi`);
      continue;
    }
    const cols = resolveTestColumns(ws);
    testCols[test] = Object.keys(cols);
    const map = new Map();
    for (let r = DATA_FIRST; r <= DATA_LAST; r++) {
      const row = ws.getRow(r);
      const no = num(row.getCell(1).value);
      if (no == null) continue;
      const perTp = {};
      for (const [tp, cc] of Object.entries(cols)) {
        const cog = num(row.getCell(cc.cog).value);
        if (cog == null) continue; // bo'sh katak — absent (Sog'lom PostTx, va h.k.)
        perTp[tp] = {
          cog,
          z: cc.z ? num(row.getCell(cc.z).value) : null,
          isp: cc.isp ? num(row.getCell(cc.isp).value) : null,
        };
      }
      if (Object.keys(perTp).length) map.set(no, perTp);
    }
    testData[test] = map;
  }
  console.log("→ Test ustunlari aniqlandi:");
  for (const t of TESTS) if (testCols[t]) console.log(`    ${t}: ${testCols[t].join(", ")}`);

  // ── DB ──
  const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });
  try {
    const [doctor] = await sql`select id from "user" where email = ${DOCTOR_EMAIL} limit 1`;
    if (!doctor) {
      console.error(`✗ Shifokor topilmadi: ${DOCTOR_EMAIL}. Avval 'npm run seed'.`);
      process.exit(1);
    }
    console.log(`→ Shifokor: ${DOCTOR_EMAIL}`);

    const del = await sql`delete from patient where doctor_id = ${doctor.id}`;
    console.log(`→ Eski bemorlar o'chirildi: ${del.count}`);

    // ── 1) Bemorlarni bulk insert (tartib saqlanadi) ──
    const entries = [...demoByNo.entries()].sort((a, b) => a[0] - b[0]);
    const patientRows = entries.map(([, d]) => ({
      doctor_id: doctor.id,
      fish: d.fish,
      jinsi: d.jinsi,
      tugilgan: d.tugilgan,
      premorbid: d.premorbid,
      davom: d.davom,
      prep: d.prep,
      boshlanish: d.boshlanish,
      tugash: d.tugash,
    }));
    const insertedPatients = await sql`insert into patient ${sql(patientRows)} returning id`;
    const noToPid = new Map();
    entries.forEach(([no], i) => noToPid.set(no, insertedPatients[i].id));
    console.log(`→ ${insertedPatients.length} ta bemor qo'shildi`);

    // ── 2) Test natijalarini yig'ish ──
    const testRows = [];
    for (const [no] of entries) {
      const pid = noToPid.get(no);
      for (const test of TESTS) {
        const perTp = testData[test]?.get(no);
        if (!perTp) continue;
        for (const [tp, sc] of Object.entries(perTp)) {
          const lbl = cogLabel(sc.cog);
          const normRef = NORM[test]?.[tp] ?? { m: 75, sd: 12 };
          testRows.push({
            patient_id: pid,
            doctor_id: doctor.id,
            test,
            timepoint: tp,
            raw: sql.json({ source: "Dataset ALL 70", imported: true }),
            scored: sql.json({
              cogScore: Math.round(sc.cog * 10) / 10,
              cognitiveHealth: lbl.label,
              tone: lbl.tone,
              zScore: sc.z,
              ispcd: sc.isp === 1,
              timepoint: tp,
              normRef,
            }),
            completed_at: completedAt(tp),
          });
        }
      }
    }

    // ── 3) Test natijalarini bo'laklab bulk insert ──
    const CHUNK = 500;
    for (let i = 0; i < testRows.length; i += CHUNK) {
      await sql`insert into test_result ${sql(testRows.slice(i, i + CHUNK))}`;
      process.stdout.write(`\r→ Test natijalari: ${Math.min(i + CHUNK, testRows.length)} / ${testRows.length}`);
    }
    if (testRows.length) process.stdout.write("\n");

    const pInserted = insertedPatients.length;
    const tInserted = testRows.length;
    console.log(`✓ ${pInserted} ta bemor + ${tInserted} ta test natijasi import qilindi`);
    const erkak = [...demoByNo.values()].filter((d) => d.jinsi === "Erkak").length;
    const prem = [...demoByNo.values()].filter((d) => d.premorbid === 1).length;
    console.log(`  Erkak: ${erkak} · Ayol: ${demoByNo.size - erkak} · Premorbid+: ${prem}`);
    console.log("\n  Ko'rish: http://localhost:3000/uz/bemorlar");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("✗ Import xatosi:", e.message);
  process.exit(1);
});
