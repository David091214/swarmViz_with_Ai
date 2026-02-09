// import { defineConfig } from "vite";                            
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { componentTagger } from "lovable-tagger";

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "::",
//     port: 8080,
//   },
//   plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// }));


import type { IncomingMessage } from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { defineConfig, type PluginOption } from "vite";

import type { AssistantRequestPayload, AssistantResponse } from "./src/lib/ai/types";
import type { DroneData, TaskType } from "./src/types/drone";

async function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  try {
    const raw = await fs.readFile(envPath, "utf-8");
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      const [key, ...rest] = trimmed.split("=");
      if (!key) {
        return;
      }
      const value = rest.join("=").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch {
    // Ignore missing .env file
  }
}

await loadEnvFile();

const CUSTOM_DATA_PATH = path.resolve(process.cwd(), "data/custom-entities.json");
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
type CustomEntityFile = { drones: DroneData[]; tasks: TaskType[] };

const DEFAULT_QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const DEFAULT_QWEN_MODEL = "qwen-plus";

async function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req
      .on("data", (chunk) => chunks.push(Buffer.from(chunk)))
      .on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
      .on("error", (error) => reject(error));
  });
}

async function ensureDataFile() {
  try {
    await fs.access(CUSTOM_DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(CUSTOM_DATA_PATH), { recursive: true });
    await fs.writeFile(CUSTOM_DATA_PATH, JSON.stringify({ drones: [], tasks: [] }, null, 2));
  }
}

async function readCustomData(): Promise<CustomEntityFile> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(CUSTOM_DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      drones: Array.isArray(parsed?.drones) ? (parsed.drones as DroneData[]) : [],
      tasks: Array.isArray(parsed?.tasks) ? (parsed.tasks as TaskType[]) : [],
    };
  } catch {
    return { drones: [], tasks: [] };
  }
}

async function writeCustomData(data: CustomEntityFile) {
  await ensureDataFile();
  await fs.writeFile(CUSTOM_DATA_PATH, JSON.stringify(data, null, 2));
}

function buildMockAssistantResponse(
  payload: AssistantRequestPayload,
  reason?: string,
): AssistantResponse {
  const latestDrone = payload.context.recentDrones[0];
  const summary = latestDrone
    ? `I see ${payload.context.recentDrones.length} active drones. ${latestDrone.droneId} is currently at (${latestDrone.position.x.toFixed(1)}, ${latestDrone.position.y.toFixed(1)}, ${latestDrone.position.z.toFixed(1)}).`
    : 'No drone data is currently available, so I will keep listening for updates.';

  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const demoDrone = {
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
    reply: reason ? `${summary} (Proxy fallback: ${reason})` : summary,
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

async function handleQwenProxy(payload: AssistantRequestPayload): Promise<AssistantResponse> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    return buildMockAssistantResponse(payload, 'QWEN_API_KEY not configured');
  }

  const apiUrl = process.env.QWEN_API_URL ?? DEFAULT_QWEN_API_URL;
  const model = process.env.QWEN_MODEL ?? DEFAULT_QWEN_MODEL;

  const systemPrompt = [
    'You are the Swarmscape Mission Assistant. Provide short, focused insights.',
    'When you suggest actions, respond with valid JSON that matches the schema { reply: string; actions?: AssistantAction[]; reasoning?: string; }.',
  ].join(' ');

  const contextSummary = JSON.stringify(payload.context);
  const qwenPayload = {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      ...payload.messages.map(message => ({ role: message.role, content: message.content })),
      {
        role: 'user',
        content: `Context snapshot: ${contextSummary}. Respond with JSON per the schema described earlier.`,
      },
    ],
    temperature: 0.2,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(qwenPayload),
    });

    if (!response.ok) {
      throw new Error(`Qwen API returned ${response.status}`);
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content) as AssistantResponse;
      } catch {
        return { reply: content };
      }
    }

    return buildMockAssistantResponse(payload, 'Empty response from Qwen');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Qwen error';
    return buildMockAssistantResponse(payload, message);
  }
}

const apiMiddlewarePlugin = (): PluginOption => ({
  name: 'swarmscape-ai-api',
  configureServer(server) {
    // Helpful at runtime to ensure env vars are loaded
    // (logs once when Vite dev server starts)
    console.log(
      '[QwenProxy] Key detected:',
      process.env.QWEN_API_KEY ? `${process.env.QWEN_API_KEY.slice(0, 6)}***` : 'undefined',
    );
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) {
        return next();
      }

      const url = new URL(req.url, 'http://localhost');

      try {
        if (url.pathname === '/api/qwen' && req.method === 'POST') {
          const body = await readRequestBody(req);
          const payload = body ? (JSON.parse(body) as AssistantRequestPayload) : null;
          if (!payload) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid payload' }));
            return;
          }

          const assistantResponse = await handleQwenProxy(payload);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(assistantResponse));
          return;
        }

        if (url.pathname === '/api/custom-entities' && req.method === 'GET') {
          const data = await readCustomData();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }

        if (url.pathname === '/api/custom-entities/drones' && req.method === 'POST') {
          const body = await readRequestBody(req);
          const parsed = body ? JSON.parse(body) : {};
          if (!parsed?.drone || !parsed.drone.droneId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Drone payload missing required fields' }));
            return;
          }

          const data = await readCustomData();
          const incomingDrone = parsed.drone as DroneData;
          const drones = [...data.drones];
          const index = drones.findIndex(drone => drone.droneId === incomingDrone.droneId);
          if (index >= 0) {
            drones[index] = incomingDrone;
          } else {
            drones.push(incomingDrone);
          }
          await writeCustomData({ drones, tasks: data.tasks });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ drones }));
          return;
        }

        const droneDeleteMatch = url.pathname.match(/^\/api\/custom-entities\/drones\/(.+)$/);
        if (droneDeleteMatch && req.method === 'DELETE') {
          const droneId = decodeURIComponent(droneDeleteMatch[1]);
          const data = await readCustomData();
          const drones = data.drones.filter(drone => drone.droneId !== droneId);
          await writeCustomData({ drones, tasks: data.tasks });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ drones }));
          return;
        }

        if (url.pathname === '/api/custom-entities/tasks' && req.method === 'POST') {
          const body = await readRequestBody(req);
          const parsed = body ? JSON.parse(body) : {};
          if (!parsed?.taskId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'taskId is required' }));
            return;
          }

          const data = await readCustomData();
          const tasks = new Set(data.tasks);
          tasks.add(parsed.taskId as TaskType);
          const updatedTasks = Array.from(tasks);
          await writeCustomData({ drones: data.drones, tasks: updatedTasks });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ tasks: updatedTasks }));
          return;
        }
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }));
        return;
      }

      return next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
    open: true,
  },
  plugins: [
    apiMiddlewarePlugin(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(ROOT_DIR, "./src"),
    },
  },
}));
