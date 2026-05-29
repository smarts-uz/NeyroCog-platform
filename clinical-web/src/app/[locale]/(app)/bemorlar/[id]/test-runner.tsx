"use client";

import { AudioTest } from "@/components/tests/audio-test";
import { DSTTest } from "@/components/tests/dst-test";
import { EEGTest } from "@/components/tests/eeg-test";
import { LMWTTest } from "@/components/tests/lmwt-test";
import { NSTest } from "@/components/tests/ns-test";
import type { TestPatient } from "@/components/tests/shared";
import { StroopTest } from "@/components/tests/stroop-test";
import { TMTTest } from "@/components/tests/tmt-test";
import { Button } from "@/components/ui/button";
import type { TestName } from "@/lib/engines/types";
import { useTranslations } from "next-intl";

export interface TestRunnerProps {
  test: TestName;
  patient: TestPatient;
  onAbort: () => void;
  onFinish: (raw: Record<string, unknown>) => void | Promise<void>;
}

/**
 * Test dispatcher — tanlangan testning interaktiv/forma komponentini
 * to'liq ekranli overlay sifatida ko'rsatadi.
 */
export function TestRunner({ test, patient, onAbort, onFinish }: TestRunnerProps) {
  const t = useTranslations("PatientView");
  const common = { patient, onAbort, onFinish };

  switch (test) {
    case "Stroop":
      return <StroopTest {...common} />;
    case "TMT":
      return <TMTTest {...common} />;
    case "DST":
      return <DSTTest {...common} />;
    case "LMWT":
      return <LMWTTest {...common} />;
    case "NS":
      return <NSTest {...common} />;
    case "EEG":
      return <EEGTest {...common} />;
    case "Audio":
      return <AudioTest {...common} />;
    default:
      return (
        <div className="grid place-items-center min-h-[60vh] gap-4">
          <p className="text-ink-3">{t("comingSoon")}</p>
          <Button variant="secondary" onClick={onAbort}>
            {t("back")}
          </Button>
        </div>
      );
  }
}
