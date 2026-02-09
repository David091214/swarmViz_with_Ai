import {
  AssistantRequestPayload,
  AssistantResponse,
  DroneDraft,
} from './types';

const PROXY_URL = import.meta.env.VITE_QWEN_PROXY_URL ?? '/api/qwen';

class QwenClient {
  async sendMessage(payload: AssistantRequestPayload): Promise<AssistantResponse> {
    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Qwen proxy returned ${response.status}`);
      }

      const data = (await response.json()) as AssistantResponse;
      if (data && typeof data.reply === 'string') {
        return data;
      }

      throw new Error('Malformed Qwen response');
    } catch (error) {
      console.warn('[QwenClient] Falling back to local mock response:', error);
      return this.buildMockResponse(payload);
    }
  }

  private buildMockResponse(payload: AssistantRequestPayload): AssistantResponse {
    const latestDrone = payload.context.recentDrones[0];
    const summary = latestDrone
      ? `I see ${payload.context.recentDrones.length} active drones. ${latestDrone.droneId} is currently at (${latestDrone.position.x.toFixed(1)}, ${latestDrone.position.y.toFixed(1)}, ${latestDrone.position.z.toFixed(1)}).`
      : 'No drone data is currently available, so I will keep listening for updates.';

    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const demoDrone: DroneDraft = {
      droneId: `QW-${randomSuffix}`,
      swarmId: latestDrone?.swarmId ?? 'alpha',
      taskId: latestDrone?.taskId ?? 'hovering',
      state: latestDrone?.state ?? 'hovering',
      position: {
        x: (latestDrone?.position.x ?? 0) + 5,
        y: latestDrone?.position.y ?? 3,
        z: (latestDrone?.position.z ?? 0) - 4,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0,
      },
      detectionRange: latestDrone?.detectionRange ?? 12,
      signalIntensity: latestDrone?.signalIntensity ?? 50,
      videoFeedbackOn: true,
      timePoint: payload.context.activeFilters.selectedSwarms.length,
    };

    return {
      reply: `${summary} Because this is a local mock response, I'm suggesting a placeholder drone so you can test the workflow.`,
      actions: [
        {
          type: 'addDrone',
          summary: 'Propose adding a placeholder scout drone for testing the AI workflow.',
          payload: demoDrone,
          confidence: 0.35,
        },
      ],
    };
  }
}

export const qwenClient = new QwenClient();
