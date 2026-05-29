"use client";

import type { ExerciseMeta } from "@/lib/training/meta";
import { EngAudio } from "./engines/engine-audio";
import { EngBreathe } from "./engines/engine-breathe";
import { EngChoice } from "./engines/engine-choice";
import { EngMatch } from "./engines/engine-match";
import { EngSequence } from "./engines/engine-sequence";
import { TmtTraining } from "./engines/tmt-training";
import { NBackTraining } from "./nback";
import { RTimeTraining } from "./reaction-time";
import type { TrainingComponentProps, TrainingResult } from "./shared";
import { TaskSwitchTraining } from "./task-switch";
import { TrackingTraining } from "./tracking";
import { VisualSearchTraining } from "./visual-search";

/**
 * Mashq metadata'siga qarab to'g'ri komponentni tanlaydi:
 *  - `component` bo'lsa → flagship maxsus komponent
 *  - `engine` bo'lsa → config bilan boshqariladigan umumiy dvigatel
 * Saqlanadigan natijaning exerciseId'si har doim ishga tushirilgan mashq id'si
 * bo'ladi (bir komponent bir nechta mashq uchun qayta ishlatilishi mumkin).
 */
export function TrainingRunner({
  exercise,
  patient,
  onAbort,
  onFinish,
}: TrainingComponentProps & { exercise: ExerciseMeta }) {
  const wrappedFinish = (r: TrainingResult) => onFinish({ ...r, exerciseId: exercise.id });
  const flagshipProps: TrainingComponentProps = { patient, onAbort, onFinish: wrappedFinish };
  const engineProps = { exercise, patient, onAbort, onFinish: wrappedFinish };

  if (exercise.component) {
    switch (exercise.component) {
      case "VisualSearchTraining":
        return <VisualSearchTraining {...flagshipProps} />;
      case "NBackTraining":
        return <NBackTraining {...flagshipProps} />;
      case "TaskSwitchTraining":
        return <TaskSwitchTraining {...flagshipProps} />;
      case "RTimeTraining":
        return <RTimeTraining {...flagshipProps} />;
      case "TrackingTraining":
        return <TrackingTraining {...flagshipProps} />;
      case "TMTTest":
        return <TmtTraining {...engineProps} />;
    }
  }

  switch (exercise.engine) {
    case "EngSequence":
      return <EngSequence {...engineProps} />;
    case "EngChoice":
      return <EngChoice {...engineProps} />;
    case "EngMatch":
      return <EngMatch {...engineProps} />;
    case "EngAudio":
      return <EngAudio {...engineProps} />;
    case "EngBreathe":
      return <EngBreathe {...engineProps} />;
    default:
      return null;
  }
}
