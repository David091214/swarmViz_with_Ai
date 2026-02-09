import {
  DroneData,
  DroneOrientation,
  DronePosition,
  DroneState,
  DroneVelocity,
  SwarmID,
  TaskType,
  VisualizationFilters,
} from '@/types/drone';

export type AssistantRole = 'user' | 'assistant';

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  timestamp: number;
}

export interface AssistantContextSnapshot {
  recentDrones: DroneData[];
  activeFilters: VisualizationFilters;
  availableTasks: TaskType[];
  availableSwarms: SwarmID[];
  availableStates: DroneState[];
}

export interface DroneDraft {
  droneId: string;
  swarmId: SwarmID;
  taskId: TaskType;
  state: DroneState;
  position: DronePosition;
  velocity: DroneVelocity;
  orientation?: Partial<DroneOrientation>;
  batteryPercentage?: number;
  detectionRange?: number;
  signalIntensity?: number;
  videoFeedbackOn?: boolean;
  timePoint?: number;
  timeLabel?: string;
}

export interface AddDroneAction {
  type: 'addDrone';
  summary: string;
  payload: DroneDraft;
  confidence?: number;
}

export interface AddTaskAction {
  type: 'addTask';
  summary: string;
  payload: {
    taskId: TaskType;
    description?: string;
  };
  confidence?: number;
}

export interface UpdateFiltersAction {
  type: 'updateFilters';
  summary: string;
  payload: Partial<VisualizationFilters>;
  confidence?: number;
}

export type AssistantAction = AddDroneAction | AddTaskAction | UpdateFiltersAction;

export interface AssistantResponse {
  reply: string;
  actions?: AssistantAction[];
  reasoning?: string;
}

export interface AssistantRequestPayload {
  messages: AssistantMessage[];
  context: AssistantContextSnapshot;
  intent?: string;
}
