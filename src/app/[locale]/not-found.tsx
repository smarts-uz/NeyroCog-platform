import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FileQuestion } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LocaleNotFound() {
  const t = useTranslations("Errors");

  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-pill bg-surface-2 text-ink-3 grid place-items-center">
          <FileQuestion className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("404.title")}</h1>
          <p className="text-sm text-ink-2 mt-1.5">{t("404.subtitle")}</p>
        </div>
        <Link href="/bemorlar">
          <Button className="mt-1">{t("404.back")}</Button>
        </Link>
      </div>
    </main>
  );
}
