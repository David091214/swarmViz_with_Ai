import {
  DroneData,
  DroneOrientation,
} from '@/types/drone';

import { DroneDraft } from './types';

const defaultOrientation: DroneOrientation = { pitch: 0, roll: 0, yaw: 0 };

export function draftToDrone(
  draft: DroneDraft,
  fallbackTimePoint: number,
  fallbackLabel?: string,
): DroneData {
  return {
    droneId: draft.droneId,
    timePoint: typeof draft.timePoint === 'number' ? draft.timePoint : fallbackTimePoint,
    timeLabel: draft.timeLabel ?? fallbackLabel,
    swarmId: draft.swarmId,
    taskId: draft.taskId,
    state: draft.state,
    position: draft.position,
    velocity: draft.velocity,
    orientation: {
      pitch: draft.orientation?.pitch ?? defaultOrientation.pitch,
      roll: draft.orientation?.roll ?? defaultOrientation.roll,
      yaw: draft.orientation?.yaw ?? defaultOrientation.yaw,
    },
    batteryPercentage: draft.batteryPercentage ?? 100,
    detectionRange: draft.detectionRange ?? 15,
    signalIntensity: draft.signalIntensity ?? 50,
    videoFeedbackOn: draft.videoFeedbackOn ?? true,
    swarmLabel: draft.swarmId.toUpperCase?.() ? undefined : undefined,
    taskLabel: draft.taskId,
  };
}
