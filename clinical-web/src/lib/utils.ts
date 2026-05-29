import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class merger — class'larni birlashtiradi va konflikt bo'lganda
 * keyingisini saqlaydi (`bg-bg bg-surface` → `bg-surface`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
