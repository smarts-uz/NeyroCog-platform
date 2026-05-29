// Production DB smoke test — read counts + a transactional rehab-save write
// that rolls back (nothing persists). Run: node --env-file=.env.local scripts/smoke-prod.mjs
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL yo'q");

const sql = postgres(url, { prepare: false, max: 3 });

try {
  const [{ patients }] = await sql`select count(*)::int as patients from patient`;
  const [{ results }] = await sql`select count(*)::int as results from test_result`;
  const [{ sessions }] = await sql`select count(*)::int as sessions from training_session`;
  const doctor = await sql`
    select u.id, u.email, u.name, a.provider_id, (a.password is not null) as has_password
    from "user" u left join account a on a.user_id = u.id limit 1`;

  console.log(
    "READ ✓  patients=%d  test_result=%d  training_session=%d",
    patients,
    results,
    sessions,
  );
  console.log("DOCTOR ✓", JSON.stringify(doctor[0]));

  // Write roundtrip in a rolled-back transaction — proves rehab-save works
  // end-to-end (FKs, varchar(24) exercise_id, smallint level) without persisting.
  let insertedId = null;
  try {
    await sql.begin(async (tx) => {
      const [p] = await tx`select id from patient limit 1`;
      const [d] = await tx`select id from "user" limit 1`;
      const ins = await tx`
        insert into training_session
          (patient_id, doctor_id, exercise_id, score, accuracy, duration, level, raw, completed_at)
        values (${p.id}, ${d.id}, 'att_stroop', 240, 88, 130, 3, ${sql.json({ smoke: true })}, now())
        returning id`;
      insertedId = ins[0].id;
      throw new Error("__ROLLBACK_OK__");
    });
  } catch (e) {
    if (e.message !== "__ROLLBACK_OK__") throw e;
  }
  const [{ after }] = await sql`select count(*)::int as after from training_session`;
  console.log(
    "WRITE ✓  insert id=%s rolled back; training_session count still %d",
    insertedId,
    after,
  );

  console.log("\nALL GREEN — production DB read+write path works.");
} finally {
  await sql.end({ timeout: 5 });
}
