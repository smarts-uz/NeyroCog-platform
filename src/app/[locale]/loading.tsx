import { Loader2 } from "lucide-react";

export default function LocaleLoading() {
  return (
    <div className="min-h-[60vh] grid place-items-center" aria-busy="true" aria-live="polite">
      <Loader2 className="h-7 w-7 text-primary animate-spin" />
    </div>
  );
}
