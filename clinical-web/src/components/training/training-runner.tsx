"use client";

import type { ExerciseId } from "@/lib/training/meta";
import { NBackTraining } from "./nback";
import { RTimeTraining } from "./reaction-time";
import type { TrainingComponentProps } from "./shared";
import { TaskSwitchTraining } from "./task-switch";
import { TrackingTraining } from "./tracking";
import { VisualSearchTraining } from "./visual-search";

export function TrainingRunner({
  exerciseId,
  ...props
}: TrainingComponentProps & { exerciseId: ExerciseId }) {
  switch (exerciseId) {
    case "visualSearch":
      return <VisualSearchTraining {...props} />;
    case "nback":
      return <NBackTraining {...props} />;
    case "taskSwitch":
      return <TaskSwitchTraining {...props} />;
    case "reactionTime":
      return <RTimeTraining {...props} />;
    case "tracking":
      return <TrackingTraining {...props} />;
  }
}
