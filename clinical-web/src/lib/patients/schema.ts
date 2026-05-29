import { z } from "zod";

/**
 * Yangi bemor — forma sxemasi.
 *
 * Forma mantig'i:
 *   - tug'ilgan sanadan yoshi avtomatik hisoblanadi
 *   - boshlanish + tugash vaqtlaridan davomiyligi (daqiqada) avtomatik
 *   - premorbid binary (0|1) — CLAUDE.md qoidasi
 */
export const newPatientSchema = z
  .object({
    fish: z.string().trim().min(2, "F.I.Sh. kiritilishi shart"),
    jinsi: z.enum(["Erkak", "Ayol"]),
    tugilgan: z.string().min(1, "Tug'ilgan sana kiritilishi shart"),
    premorbid: z.union([z.literal(0), z.literal(1)]),
    boshlanish: z.string().min(1, "Boshlanish vaqti kiritilishi shart"),
    tugash: z.string().min(1, "Tugash vaqti kiritilishi shart"),
    prep: z.coerce.number().int().min(0).max(20),
  })
  .superRefine((val, ctx) => {
    const start = new Date(val.boshlanish);
    const end = new Date(val.tugash);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tugash"],
        message: "Vaqt formati noto'g'ri",
      });
      return;
    }
    const minutes = (end.getTime() - start.getTime()) / 60000;
    if (minutes <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tugash"],
        message: "Davomiyligi musbat bo'lishi kerak",
      });
    }
  });

export type NewPatientInput = z.infer<typeof newPatientSchema>;
