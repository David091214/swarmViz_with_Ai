// Comprehensive drone swarm data types

export interface DronePosition {
  x: number;
  y: number; // Height
  z: number;
}

export interface DroneVelocity {
  x: number;
  y: number;
  z: number;
}

export interface DroneOrientation {
  pitch: number; // Rotation around X-axis
  roll: number;  // Rotation around Z-axis  
  yaw: number;   // Rotation around Y-axis
}

export type DroneState =
  | 'idle'
  | 'patrol'
  | 'search'
  | 'rescue'
  | 'attack'
  | 'attacking'
  | 'charging'
  | 'maintenance'
  | 'emergency'
  | 'taking-off'
  | 'entering-swarm'
  | 'hovering'
  | 'passing-by'
  | 'returning'
  | 'descending'
  | 'parachute-deployment'
  | string;

export type TaskType =
  | 'taking-off'
  | 'entering-swarm'
  | 'hovering'
  | 'passing-by'
  | 'returning'
  | 'descending'
  | 'attacking'
  | 'parachute-deployment'
  | 'none'
  | '-1'
  | string;

export type SwarmID = 'alpha' | 'beta' | 'gamma' | 'delta' | 'epsilon' | 'none' | '-1' | string;

export interface DroneData {
  droneId: string;
  timePoint: number;
  timeLabel?: string;
  swarmId: SwarmID;
  swarmLabel?: string;
  taskId: TaskType;
  taskLabel?: string;
  state: DroneState;
  position: DronePosition;
  velocity: DroneVelocity;
  orientation: DroneOrientation;
  batteryPercentage: number;
  detectionRange: number;
  signalIntensity: number;
  videoFeedbackOn: boolean;
}

export interface DroneSwarmDataset {
  timePoints: number[];
  timePointLabels?: string[];
  drones: DroneData[];
  metadata: {
    totalDrones: number;
    totalTimePoints: number;
    swarmCounts: Record<SwarmID, number>;
    taskCounts: Record<TaskType, number>;
    stateCounts?: Record<DroneState, number>;
    boundingBox: {
      min: DronePosition;
      max: DronePosition;
    };
    swarmLabels?: Record<string, string>;
  };
}

// Visualization filters and controls
export interface VisualizationFilters {
  selectedSwarms: SwarmID[];
  selectedTasks: TaskType[];
  selectedStates: DroneState[];
  batteryRange: [number, number];
  showTrajectories: boolean;
  showDetectionRanges: boolean;
  showVelocityVectors: boolean;
  showSignalIntensity: boolean;
  showVideoFeedback: boolean;
}

export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  timeRange: [number, number];
}
