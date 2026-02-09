import { DroneData, TaskType } from '@/types/drone';

const BASE_URL = '/api/custom-entities';

export interface CustomEntitiesPayload {
  drones: DroneData[];
  tasks: TaskType[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCustomEntities(): Promise<CustomEntitiesPayload> {
  const response = await fetch(BASE_URL, { method: 'GET' });
  return handleResponse<CustomEntitiesPayload>(response);
}

export async function upsertCustomDrone(drone: DroneData): Promise<DroneData[]> {
  const response = await fetch(`${BASE_URL}/drones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ drone }),
  });
  const data = await handleResponse<{ drones: DroneData[] }>(response);
  return data.drones;
}

export async function addCustomTask(taskId: TaskType, description?: string): Promise<TaskType[]> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId, description }),
  });
  const data = await handleResponse<{ tasks: TaskType[] }>(response);
  return data.tasks;
}

export async function deleteCustomDrone(droneId: string): Promise<DroneData[]> {
  const response = await fetch(`${BASE_URL}/drones/${encodeURIComponent(droneId)}`, {
    method: 'DELETE',
  });
  const data = await handleResponse<{ drones: DroneData[] }>(response);
  return data.drones;
}
