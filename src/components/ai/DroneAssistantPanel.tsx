import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageSquare, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DroneData,
  DroneState,
  SwarmID,
  TaskType,
  VisualizationFilters,
} from '@/types/drone';
import { qwenClient } from '@/lib/ai/qwenClient';
import {
  AssistantAction,
  AssistantMessage,
  AssistantContextSnapshot,
  DroneDraft,
} from '@/lib/ai/types';
import { draftToDrone } from '@/lib/ai/normalizers';

interface DroneAssistantPanelProps {
  drones: DroneData[];
  tasks: TaskType[];
  swarms: SwarmID[];
  states: DroneState[];
  filters: VisualizationFilters;
  currentTimePoint: number;
  currentTimeLabel?: string;
  onAddDrone: (drone: DroneData) => Promise<void> | void;
  onAddTask: (taskId: TaskType, description?: string) => Promise<void> | void;
  onApplyFilters: (updates: Partial<VisualizationFilters>) => Promise<void> | void;
  onDeleteDrone: (droneId: string) => Promise<void> | void;
  className?: string;
}

const createId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const quickPrompts = [
  'Summarize any anomalies in the last time step.',
  'Which drones need charging soon?',
  'Add a recon drone near the southern perimeter.',
  'Filter to attacking drones only.',
];

export function DroneAssistantPanel({
  drones,
  tasks,
  swarms,
  states,
  filters,
  currentTimePoint,
  currentTimeLabel,
  onAddDrone,
  onAddTask,
  onApplyFilters,
  onDeleteDrone,
  className,
}: DroneAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: createId(),
      role: 'assistant',
      content: 'Qwen Mission Assistant online. Ask about swarm status, request summaries, or tell me to add drones/tasks.',
      timestamp: Date.now(),
    },
  ]);
  const [pendingActions, setPendingActions] = useState<AssistantAction[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const [quickAddDraft, setQuickAddDraft] = useState<DroneDraft>(() => ({
    droneId: '',
    swarmId: swarms[0] ?? 'alpha',
    taskId: tasks[0] ?? 'hovering',
    state: states[0] ?? 'hovering',
    position: { x: 0, y: 5, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    videoFeedbackOn: true,
  }));
  const [quickAddTimePoint, setQuickAddTimePoint] = useState<string>(
    () => Math.floor(currentTimePoint).toString(),
  );
  const [deleteDroneId, setDeleteDroneId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQuickAddSaving, setIsQuickAddSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const contextSnapshot: AssistantContextSnapshot = useMemo(
    () => ({
      recentDrones: drones.slice(0, 50),
      activeFilters: filters,
      availableTasks: tasks,
      availableSwarms: swarms,
      availableStates: states,
    }),
    [drones, filters, swarms, tasks, states],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setQuickAddTimePoint(prev =>
      prev.trim().length === 0 ? Math.floor(currentTimePoint).toString() : prev,
    );
  }, [currentTimePoint]);

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: createId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await qwenClient.sendMessage({
        messages: nextMessages,
        context: contextSnapshot,
        intent: 'drone-swarm-assistant',
      });

      const assistantMessage: AssistantMessage = {
        id: createId(),
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (response.actions?.length) {
        setPendingActions(response.actions);
      } else {
        setPendingActions([]);
      }
    } catch (error) {
      console.error('Failed to send message to Qwen', error);
      toast.error('Unable to reach Qwen service', {
        description: 'Check your API proxy or network settings.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyAction = async (action: AssistantAction) => {
    setProcessingActionId(action.summary);
    try {
      switch (action.type) {
        case 'addDrone': {
          const fullDrone = draftToDrone(action.payload, currentTimePoint, currentTimeLabel);
          await onAddDrone(fullDrone);
          toast.success('New drone added', {
            description: action.summary,
          });
          break;
        }
        case 'addTask': {
          await onAddTask(action.payload.taskId, action.payload.description);
          toast.success('Task recorded', {
            description: `${action.payload.taskId} is now available.`,
          });
          break;
        }
        case 'updateFilters': {
          await onApplyFilters(action.payload);
          toast.success('Filters updated', {
            description: action.summary,
          });
          break;
        }
        default:
          break;
      }

      setPendingActions(prev => prev.filter(item => item !== action));
    } catch (error) {
      toast.error('Failed to apply action', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const updateQuickAddDraft = (updates: Partial<DroneDraft>) => {
    setQuickAddDraft(prev => ({
      ...prev,
      ...updates,
      position: updates.position
        ? { ...prev.position, ...updates.position }
        : prev.position,
      velocity: updates.velocity
        ? { ...prev.velocity, ...updates.velocity }
        : prev.velocity,
    }));
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddDraft.droneId.trim()) {
      toast.error('Drone ID is required for manual entry.');
      return;
    }

    setIsQuickAddSaving(true);
    try {
      const normalizedTimePoint =
        quickAddTimePoint.trim() === '' ? undefined : Number(quickAddTimePoint);

      const normalized = draftToDrone(
        {
          ...quickAddDraft,
          droneId: quickAddDraft.droneId.trim(),
          timePoint: normalizedTimePoint,
        },
        currentTimePoint,
        currentTimeLabel,
      );
      await onAddDrone(normalized);
      toast.success(`Drone ${normalized.droneId} created`);
      setQuickAddDraft(prev => ({
        ...prev,
        droneId: '',
      }));
      setQuickAddTimePoint('');
    } catch (error) {
      toast.error('Unable to save drone', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsQuickAddSaving(false);
    }
  };

  const handleDeleteDrone = async () => {
    if (!deleteDroneId.trim()) {
      toast.error('Provide a drone ID to delete.');
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteDrone(deleteDroneId.trim());
      toast.success(`Drone ${deleteDroneId.trim()} removed`);
      setDeleteDroneId('');
    } catch (error) {
      toast.error('Failed to delete drone', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn('w-80', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-primary" />
          AI Mission Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-48 rounded-md border border-border/60 bg-muted/30 p-3">
          <div ref={scrollRef} className="space-y-3 pr-2">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm',
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] bg-primary text-primary-foreground'
                    : 'mr-auto max-w-[90%] bg-slate-900/70 text-slate-100',
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="grid grid-cols-2 gap-2">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              type="button"
              className="rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted"
              onClick={() => handleQuickPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Ask about swarm status, request actions, or describe a new drone..."
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Contacting Qwen...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>

        {pendingActions.length > 0 && (
          <div className="space-y-2 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3">
            <p className="text-xs font-semibold text-emerald-300">Suggested actions</p>
            {pendingActions.map(action => (
              <div key={action.summary} className="rounded-md border border-emerald-500/20 bg-slate-950/40 p-2">
                <p className="text-xs font-semibold text-slate-100">{action.summary}</p>
                {action.type === 'addDrone' && (
                  <p className="mt-1 text-[11px] text-slate-300">
                    Drone {action.payload.droneId} | Task {action.payload.taskId} | Swarm {action.payload.swarmId}
                  </p>
                )}
                {action.type === 'addTask' && (
                  <p className="mt-1 text-[11px] text-slate-300">
                    Task: {action.payload.taskId}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 w-full text-xs"
                  disabled={processingActionId === action.summary}
                  onClick={() => handleApplyAction(action)}
                >
                  {processingActionId === action.summary ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-dashed border-border/70 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-3.5 w-3.5 text-primary" />
            Quick manual drone entry
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-medium text-muted-foreground">
            <label className="col-span-2 space-y-1">
              <span className="pl-0.5 text-[11px] uppercase tracking-wide">Drone Identifier</span>
              <Input
                placeholder="e.g. AI-Scout-07"
                value={quickAddDraft.droneId}
                onChange={event => updateQuickAddDraft({ droneId: event.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="pl-0.5 text-[11px] uppercase tracking-wide">Swarm ID</span>
              <Input
                placeholder="alpha / custom"
                value={quickAddDraft.swarmId}
                onChange={event => updateQuickAddDraft({ swarmId: event.target.value as SwarmID })}
              />
            </label>
            <label className="space-y-1">
              <span className="pl-0.5 text-[11px] uppercase tracking-wide">Task</span>
              <Input
                placeholder="hovering / recon"
                value={quickAddDraft.taskId}
                onChange={event => updateQuickAddDraft({ taskId: event.target.value as TaskType })}
              />
            </label>
            <label className="col-span-2 space-y-1">
              <span className="pl-0.5 text-[11px] uppercase tracking-wide">Operational State</span>
              <Input
                placeholder="patrol / descending / custom"
                value={quickAddDraft.state}
                onChange={event => updateQuickAddDraft({ state: event.target.value as DroneState })}
              />
            </label>
            <label className="col-span-2 space-y-1">
              <span className="pl-0.5 text-[11px] uppercase tracking-wide">Time Point (index)</span>
              <Input
                type="number"
                placeholder={`Defaults to ${Math.floor(currentTimePoint)}`}
                value={quickAddTimePoint}
                onChange={event => setQuickAddTimePoint(event.target.value)}
              />
            </label>
            <div className="col-span-2 mt-2 grid grid-cols-3 gap-3">
              {(['x', 'y', 'z'] as const).map(axis => (
                <label key={`pos-${axis}`} className="space-y-1">
                  <span className="pl-0.5 text-[11px] uppercase tracking-wide">Position {axis.toUpperCase()} (m)</span>
                  <Input
                    type="number"
                    value={quickAddDraft.position[axis]}
                    onChange={event =>
                      updateQuickAddDraft({
                        position: { ...quickAddDraft.position, [axis]: Number(event.target.value) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-3">
              {(['x', 'y', 'z'] as const).map(axis => (
                <label key={`vel-${axis}`} className="space-y-1">
                  <span className="pl-0.5 text-[11px] uppercase tracking-wide">Velocity {axis.toUpperCase()} (m/s)</span>
                  <Input
                    type="number"
                    value={quickAddDraft.velocity[axis]}
                    onChange={event =>
                      updateQuickAddDraft({
                        velocity: { ...quickAddDraft.velocity, [axis]: Number(event.target.value) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleQuickAddSubmit} disabled={isQuickAddSaving}>
            {isQuickAddSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Drone'
            )}
          </Button>
          <div className="space-y-2 border-t border-border/40 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remove drone
            </span>
            <div className="flex gap-2">
              <Input
                placeholder="Exact Drone ID (e.g. AI-Scout-07)"
                value={deleteDroneId}
                onChange={event => setDeleteDroneId(event.target.value)}
              />
              <Button
                variant="destructive"
                className="shrink-0"
                onClick={handleDeleteDrone}
                disabled={isDeleting || !deleteDroneId.trim()}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deletes the custom drone record and removes it from both visualizations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
