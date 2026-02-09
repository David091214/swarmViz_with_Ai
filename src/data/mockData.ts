import { DroneData, DroneSwarmDataset } from '@/types/drone';
import { excelDataset } from './excelDataset';

const dataset: DroneSwarmDataset = excelDataset;

export function generateMockData(): DroneSwarmDataset {
  return dataset;
}

export function getDronesAtTime(source: DroneSwarmDataset, timePoint: number): DroneData[] {
  return source.drones.filter((drone) => drone.timePoint === timePoint);
}

export function getDroneTrajectory(source: DroneSwarmDataset, droneId: string): DroneData[] {
  return source.drones
    .filter((drone) => drone.droneId === droneId)
    .sort((a, b) => a.timePoint - b.timePoint);
}
