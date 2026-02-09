import { SwarmID, TaskType } from '@/types/drone';

const SWARM_COLOR_DEFAULT = '#94a3b8';
const TASK_COLOR_DEFAULT = '#94a3b8';

const SWARM_COLOR_MAP: Record<SwarmID, string> = {
  alpha: '#0ea5e9',
  beta: '#a855f7',
  gamma: '#22c55e',
  delta: '#f59e0b',
  epsilon: '#ef4444',
  none: SWARM_COLOR_DEFAULT,
  '-1': SWARM_COLOR_DEFAULT,
};

const TASK_COLOR_MAP: Record<TaskType, string> = {
  'taking-off': '#0ea5e9',
  'entering-swarm': '#22c55e',
  hovering: '#06b6d4',
  'passing-by': '#6366f1',
  returning: '#14b8a6',
  descending: '#f97316',
  attacking: '#f43f5e',
  'parachute-deployment': '#a855f7',
  none: TASK_COLOR_DEFAULT,
  '-1': TASK_COLOR_DEFAULT,
};

export function getSwarmColor(id: SwarmID | null | undefined): string {
  return (id ? SWARM_COLOR_MAP[id] : undefined) ?? SWARM_COLOR_DEFAULT;
}

export function getTaskColor(id: TaskType | null | undefined): string {
  return (id ? TASK_COLOR_MAP[id] : undefined) ?? TASK_COLOR_DEFAULT;
}

export const swarmColors = SWARM_COLOR_MAP;
export const taskColors = TASK_COLOR_MAP;
export const defaultSwarmColor = SWARM_COLOR_DEFAULT;
export const defaultTaskColor = TASK_COLOR_DEFAULT;
