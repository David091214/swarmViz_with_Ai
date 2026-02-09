import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { SwarmID, TaskType, VisualizationFilters } from '@/types/drone';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  filters: VisualizationFilters;
  onFiltersChange: (filters: VisualizationFilters) => void;
  availableSwarms: SwarmID[];
  availableTasks: TaskType[];
  className?: string;
}

const baseSwarmOptions: { id: SwarmID; label: string; color: string }[] = [
  { id: 'alpha', label: 'SW-1', color: 'bg-swarm-alpha' },
  { id: 'beta', label: 'SW-2', color: 'bg-swarm-beta' },
  { id: 'gamma', label: 'SW-3', color: 'bg-swarm-gamma' },
  { id: 'delta', label: 'SW-4', color: 'bg-amber-500' },
  { id: 'epsilon', label: 'SW-5', color: 'bg-rose-500' },
  { id: 'none', label: 'No Swarm', color: 'bg-neutral-500' },
  { id: '-1', label: 'No Swarm (-1)', color: 'bg-neutral-400' },
];

const baseTaskOptions: { id: TaskType; label: string; color: string }[] = [
  { id: 'taking-off', label: 'Taking Off', color: 'bg-sky-500' },
  { id: 'entering-swarm', label: 'Entering Swarm', color: 'bg-emerald-500' },
  { id: 'hovering', label: 'Hovering', color: 'bg-cyan-400' },
  { id: 'passing-by', label: 'Passing By', color: 'bg-indigo-400' },
  { id: 'returning', label: 'Returning', color: 'bg-sky-400' },
  { id: 'descending', label: 'Descending', color: 'bg-orange-400' },
  { id: 'attacking', label: 'Attacking', color: 'bg-rose-500' },
  { id: 'parachute-deployment', label: 'Parachute Deployment', color: 'bg-fuchsia-500' },
  { id: 'none', label: 'No Task', color: 'bg-zinc-500' },
  { id: '-1', label: 'No Task (-1)', color: 'bg-zinc-400' },
];

const makeSwarmLabel = (id: SwarmID) => {
  const base = baseSwarmOptions.find(option => option.id === id);
  if (base) {
    return base;
  }
  return {
    id,
    label: typeof id === 'string' ? id.toUpperCase() : String(id),
    color: 'bg-slate-500',
  };
};

const makeTaskLabel = (id: TaskType) => {
  const base = baseTaskOptions.find(option => option.id === id);
  if (base) {
    return base;
  }
  return {
    id,
    label: typeof id === 'string' ? id.replace(/-/g, ' ') : String(id),
    color: 'bg-slate-400',
  };
};

export function ControlPanel({
  filters,
  onFiltersChange,
  availableSwarms,
  availableTasks,
  className,
}: ControlPanelProps) {
  const updateFilters = (updates: Partial<VisualizationFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const swarmOptions = useMemo(
    () => Array.from(new Set(availableSwarms)).map(makeSwarmLabel),
    [availableSwarms],
  );
  const taskOptions = useMemo(
    () => Array.from(new Set(availableTasks)).map(makeTaskLabel),
    [availableTasks],
  );

  const toggleSwarm = (swarmId: SwarmID) => {
    const newSwarms = filters.selectedSwarms.includes(swarmId)
      ? filters.selectedSwarms.filter(id => id !== swarmId)
      : [...filters.selectedSwarms, swarmId];
    updateFilters({ selectedSwarms: newSwarms });
  };

  const toggleTask = (taskId: TaskType) => {
    const newTasks = filters.selectedTasks.includes(taskId)
      ? filters.selectedTasks.filter(id => id !== taskId)
      : [...filters.selectedTasks, taskId];
    updateFilters({ selectedTasks: newTasks });
  };

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          Visualization Controls
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Swarm Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Swarms</h3>
          <div className="grid grid-cols-1 gap-2">
            {swarmOptions.map(swarm => (
              <div key={swarm.id} className="flex items-center space-x-2">
                <Checkbox
                  id={swarm.id}
                  checked={filters.selectedSwarms.includes(swarm.id)}
                  onCheckedChange={() => toggleSwarm(swarm.id)}
                />
                <label
                  htmlFor={swarm.id}
                  className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div className={cn("w-3 h-3 rounded-full", swarm.color)} />
                  <span>{swarm.label}</span>
                </label>
              </div>
            ))}
            <p className="mt-2 text-[11px] text-muted-foreground">
              Need a new swarm? Ask the AI Mission Assistant below to create it.
            </p>
          </div>
        </div>

        {/* Task Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
          <div className="grid grid-cols-1 gap-2">
            {taskOptions.map(task => (
              <div key={task.id} className="flex items-center space-x-2">
                <Checkbox
                  id={task.id}
                  checked={filters.selectedTasks.includes(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <label
                  htmlFor={task.id}
                  className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div className={cn("w-3 h-3 rounded", task.color)} />
                  <span className="capitalize">{task.label}</span>
                </label>
              </div>
            ))}
            <p className="mt-2 text-[11px] text-muted-foreground">
              Additional tasks can be created through the AI Mission Assistant.
            </p>
          </div>
        </div>

        {/* Battery Range Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Battery Level</h3>
          <div className="px-2">
            <Slider
              value={filters.batteryRange}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => updateFilters({ batteryRange: value as [number, number] })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{filters.batteryRange[0]}%</span>
              <span>{filters.batteryRange[1]}%</span>
            </div>
          </div>
        </div>

        {/* Visualization Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Display Options</h3>
        
        <div className="flex items-center justify-between">
          <label htmlFor="trajectories" className="text-sm font-medium">
              Show Trajectories
            </label>
            <Switch
              id="trajectories"
              checked={filters.showTrajectories}
              onCheckedChange={(checked) => updateFilters({ showTrajectories: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="detection" className="text-sm font-medium">
              Detection Ranges
            </label>
            <Switch
              id="detection"
              checked={filters.showDetectionRanges}
              onCheckedChange={(checked) => updateFilters({ showDetectionRanges: checked })}
            />
          </div>

        <div className="flex items-center justify-between">
          <label htmlFor="velocity" className="text-sm font-medium">
            Velocity Vectors
          </label>
          <Switch
            id="velocity"
            checked={filters.showVelocityVectors}
            onCheckedChange={(checked) => updateFilters({ showVelocityVectors: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="signal-intensity" className="text-sm font-medium">
            Signal Intensity
          </label>
          <Switch
            id="signal-intensity"
            checked={filters.showSignalIntensity}
            onCheckedChange={(checked) => updateFilters({ showSignalIntensity: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="video-feedback" className="text-sm font-medium">
            Video Feedback
          </label>
          <Switch
            id="video-feedback"
            checked={filters.showVideoFeedback}
            onCheckedChange={(checked) => updateFilters({ showVideoFeedback: checked })}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateFilters({
                selectedSwarms: swarmOptions.map(s => s.id),
                selectedTasks: taskOptions.map(t => t.id)
              })}
              className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => updateFilters({
                selectedSwarms: [],
                selectedTasks: []
              })}
            className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
