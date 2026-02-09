import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DroneVisualization3D } from './DroneVisualization3D';
import { DroneRangeMap2D } from './DroneRangeMap2D';
import { Timeline } from './ui/timeline';
import { ControlPanel } from './ui/control-panel';
import { DroneStatistics } from './DroneStatistics';
import { DroneAssistantPanel } from './ai/DroneAssistantPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateMockData, getDronesAtTime, getDroneTrajectory } from '@/data/mockData';
import { VisualizationFilters, TimelineState, DroneData, SwarmID, TaskType, DroneState } from '@/types/drone';
import { Radar, BarChart3, Settings, Map as MapIcon } from 'lucide-react';
import { buildTimePointColorMap } from '@/lib/timeSeriesColors';
import { toast } from 'sonner';
import { ExpandableVisualization } from './ui/expandable-visualization';
import { fetchCustomEntities, upsertCustomDrone, addCustomTask, deleteCustomDrone } from '@/lib/api/customEntities';

const mergeUnique = <T,>(base: T[], additions: T[]) => {
  const seen = new Set<T>();
  const result: T[] = [];
  [...base, ...additions].forEach(item => {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  });
  return result;
};

const arraysAreEqual = <T,>(a: T[], b: T[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export function DroneSwarmDashboard() {
  // Generate data on component mount
  const dataset = useMemo(() => {
    const data = generateMockData();
    toast.success('Drone swarm data loaded successfully', {
      description: `${data.metadata.totalDrones} drones across ${data.timePoints.length} time points`
    });
    return data;
  }, []);

  const availableSwarms = useMemo(
    () => Object.keys(dataset.metadata.swarmCounts) as SwarmID[],
    [dataset]
  );

  const availableTasks = useMemo(
    () => Object.keys(dataset.metadata.taskCounts) as TaskType[],
    [dataset]
  );

  const availableStates = useMemo(() => {
    const stateCounts = dataset.metadata.stateCounts;
    if (stateCounts) {
      return Object.keys(stateCounts) as DroneState[];
    }
    const uniqueStates = new Set<DroneState>();
    dataset.drones.forEach((drone) => uniqueStates.add(drone.state));
    return Array.from(uniqueStates);
  }, [dataset]);

  const [customDrones, setCustomDrones] = useState<DroneData[]>([]);
  const [customTasks, setCustomTasks] = useState<TaskType[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCustomEntities()
      .then(entityData => {
        if (cancelled) {
          return;
        }
        setCustomDrones(entityData.drones ?? []);
        setCustomTasks(entityData.tasks ?? []);
      })
      .catch(error => {
        toast.error('Failed to load custom entities', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const combinedSwarms = useMemo(
    () => mergeUnique(availableSwarms, customDrones.map(drone => drone.swarmId)),
    [availableSwarms, customDrones],
  );
  const combinedTasks = useMemo(
    () => mergeUnique(mergeUnique(availableTasks, customTasks), customDrones.map(drone => drone.taskId)),
    [availableTasks, customTasks, customDrones],
  );
  const combinedStates = useMemo(
    () => mergeUnique(availableStates, customDrones.map(drone => drone.state)),
    [availableStates, customDrones],
  );

  // Timeline state
  const [timelineState, setTimelineState] = useState<TimelineState>(() => ({
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    timeRange: [0, dataset.timePoints.length - 1]
  }));

  // Visualization filters
  const [filters, setFilters] = useState<VisualizationFilters>(() => ({
    selectedSwarms: availableSwarms,
    selectedTasks: availableTasks,
    selectedStates: availableStates,
    batteryRange: [0, 100],
    showTrajectories: false,
    showDetectionRanges: false,
    showVelocityVectors: false,
    showSignalIntensity: true,
    showVideoFeedback: true,
  }));

  const matchesFilters = useCallback((drone: DroneData) =>
    filters.selectedSwarms.includes(drone.swarmId) &&
    filters.selectedTasks.includes(drone.taskId) &&
    (filters.selectedStates.length === 0 || filters.selectedStates.includes(drone.state)) &&
    drone.batteryPercentage >= filters.batteryRange[0] &&
    drone.batteryPercentage <= filters.batteryRange[1],
  [filters]);

  useEffect(() => {
    setFilters(prev => {
      const mergedSwarms = mergeUnique(prev.selectedSwarms, combinedSwarms);
      const mergedTasks = mergeUnique(prev.selectedTasks, combinedTasks);
      const mergedStates = combinedStates.length > 0
        ? mergeUnique(prev.selectedStates, combinedStates)
        : prev.selectedStates;

      if (
        arraysAreEqual(prev.selectedSwarms, mergedSwarms) &&
        arraysAreEqual(prev.selectedTasks, mergedTasks) &&
        arraysAreEqual(prev.selectedStates, mergedStates)
      ) {
        return prev;
      }

      return {
        ...prev,
        selectedSwarms: mergedSwarms,
        selectedTasks: mergedTasks,
        selectedStates: mergedStates,
      };
    });
  }, [combinedSwarms, combinedTasks, combinedStates]);

  // Auto-play functionality
  useEffect(() => {
    if (!timelineState.isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimelineState(prev => {
        const maxIndex = Math.max(0, dataset.timePoints.length - 1);
        if (maxIndex === 0) {
          return prev;
        }

        const nextTime = prev.currentTime + prev.playbackSpeed;
        if (nextTime > maxIndex) {
          return { ...prev, currentTime: 0 };
        }
        return { ...prev, currentTime: nextTime };
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [timelineState.isPlaying, timelineState.playbackSpeed, dataset.timePoints.length]);

  // Get current drones with timeline interpolation and filters applied
  const interpolatedDrones = useMemo(() => {
    if (dataset.timePoints.length === 0) {
      return [] as DroneData[];
    }

    const maxIndex = Math.max(0, dataset.timePoints.length - 1);
    const clampedTime = Math.min(Math.max(timelineState.currentTime, 0), maxIndex);
    const startIndex = Math.floor(clampedTime);
    const endIndex = Math.min(startIndex + 1, maxIndex);
    const t = clampedTime - startIndex;

    const startDrones = getDronesAtTime(dataset, startIndex).filter(matchesFilters);

    if (t === 0 || endIndex === startIndex) {
      return startDrones;
    }

    const endDrones = getDronesAtTime(dataset, endIndex).filter(matchesFilters);
    const endById = new Map<string, DroneData>(endDrones.map(drone => [drone.droneId, drone]));

    const lerp = (from: number, to: number, alpha: number) => from + (to - from) * alpha;

    return startDrones.map(drone => {
      const next = endById.get(drone.droneId);
      if (!next) {
        return drone;
      }

      return {
        ...drone,
        position: {
          x: lerp(drone.position.x, next.position.x, t),
          y: lerp(drone.position.y, next.position.y, t),
          z: lerp(drone.position.z, next.position.z, t),
        },
        velocity: {
          x: lerp(drone.velocity.x, next.velocity.x, t),
          y: lerp(drone.velocity.y, next.velocity.y, t),
          z: lerp(drone.velocity.z, next.velocity.z, t),
        },
        orientation: {
          pitch: lerp(drone.orientation.pitch, next.orientation.pitch, t),
          roll: lerp(drone.orientation.roll, next.orientation.roll, t),
          yaw: lerp(drone.orientation.yaw, next.orientation.yaw, t),
        },
        batteryPercentage: lerp(drone.batteryPercentage, next.batteryPercentage, t),
        detectionRange: lerp(drone.detectionRange, next.detectionRange, t),
        signalIntensity: lerp(drone.signalIntensity, next.signalIntensity, t),
        videoFeedbackOn: t < 0.5 ? drone.videoFeedbackOn : next.videoFeedbackOn,
      };
    });
  }, [dataset, timelineState.currentTime, matchesFilters]);

  const currentDrones = useMemo(() => {
    const filteredCustom = customDrones.filter(matchesFilters);
    return [...interpolatedDrones, ...filteredCustom];
  }, [interpolatedDrones, customDrones, matchesFilters]);

  const timePointSeries = useMemo(() => {
    const baseSeries = dataset.timePoints
      .map((timePoint, index) => {
        const dronesAtTime = getDronesAtTime(dataset, timePoint).filter(matchesFilters);
        if (dronesAtTime.length === 0) {
          return null;
        }

        return {
          timePoint,
          label: dataset.timePointLabels?.[index] ?? `T${timePoint}`,
          drones: dronesAtTime,
        };
      })
      .filter((entry): entry is { timePoint: number; label: string; drones: DroneData[] } => entry !== null);

    if (customDrones.length === 0) {
      return baseSeries;
    }

    const customByTime = new Map<number, DroneData[]>();
    customDrones.forEach(drone => {
      if (!matchesFilters(drone)) {
        return;
      }
      const timePoint = typeof drone.timePoint === 'number'
        ? drone.timePoint
        : Math.floor(timelineState.currentTime);
      const existing = customByTime.get(timePoint) ?? [];
      customByTime.set(timePoint, [...existing, drone]);
    });

    const customEntries = Array.from(customByTime.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timePoint, dronesAtTime]) => ({
        timePoint,
        label: `AI-${timePoint}`,
        drones: dronesAtTime,
      }));

    return [...baseSeries, ...customEntries];
  }, [dataset, matchesFilters, customDrones, timelineState.currentTime]);

  const timePointColorMap = useMemo(
    () => buildTimePointColorMap(dataset.timePoints.length),
    [dataset.timePoints.length],
  );

  const trajectoryPaths = useMemo(() => {
    if (!filters.showTrajectories) {
      return [] as { droneId: string; swarmId: SwarmID; points: [number, number, number][] }[];
    }

    const uniqueIds = Array.from(new Set(currentDrones.map(drone => drone.droneId)));
    const paths: { droneId: string; swarmId: SwarmID; points: [number, number, number][] }[] = [];

    uniqueIds.forEach(droneId => {
      const history = getDroneTrajectory(dataset, droneId).filter(matchesFilters);
      if (history.length <= 1) {
        return;
      }

      paths.push({
        droneId,
        swarmId: history[history.length - 1].swarmId,
        points: history.map(entry => [entry.position.x, entry.position.y, entry.position.z] as [number, number, number]),
      });
    });

    return paths;
  }, [filters.showTrajectories, currentDrones, dataset, matchesFilters]);

  // Timeline handlers
  const handleTimeChange = (time: number) => {
    const maxIndex = Math.max(0, dataset.timePoints.length - 1);
    const clamped = Math.min(Math.max(time, 0), maxIndex);
    setTimelineState(prev => ({ ...prev, currentTime: clamped }));
  };

  const handlePlayPause = () => {
    setTimelineState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSpeedChange = (speed: number) => {
    setTimelineState(prev => ({ ...prev, playbackSpeed: speed }));
  };

  const handleAddDrone = async (drone: DroneData) => {
    try {
      const updatedDrones = await upsertCustomDrone(drone);
      setCustomDrones(updatedDrones);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Unable to save drone', { description: message });
      throw error;
    }
  };

  const handleAddTask = async (taskId: TaskType, description?: string) => {
    try {
      const updatedTasks = await addCustomTask(taskId, description);
      setCustomTasks(updatedTasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Unable to save task', { description: message });
      throw error;
    }
  };

  const handleApplyFilterUpdates = async (updates: Partial<VisualizationFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleDeleteDrone = async (droneId: string) => {
    try {
      const updatedDrones = await deleteCustomDrone(droneId);
      setCustomDrones(updatedDrones);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Unable to delete drone', { description: message });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border border-primary/40 shadow-sm">
                <img
                  src="/favicon.ico"
                  alt="Swarmscape Icon"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Drone Swarm Visualization
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time spatiotemporal analysis of multi-dimensional drone data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>{currentDrones.length} active drones</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-3 py-4">
        <div className="grid grid-cols-12 gap-3 h-[calc(100vh-200px)]">
          {/* Control Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-3"
          >
            <div className="sticky top-4 flex flex-col gap-3">
              <ControlPanel
                filters={filters}
                onFiltersChange={setFilters}
                availableSwarms={combinedSwarms}
                availableTasks={combinedTasks}
                className="w-full"
              />
              <DroneAssistantPanel
                drones={currentDrones}
                tasks={combinedTasks}
                swarms={combinedSwarms}
                states={combinedStates}
                filters={filters}
                currentTimePoint={Math.floor(timelineState.currentTime)}
                currentTimeLabel={dataset.timePointLabels?.[Math.floor(timelineState.currentTime)]}
                onAddDrone={handleAddDrone}
                onAddTask={handleAddTask}
                onApplyFilters={handleApplyFilterUpdates}
                onDeleteDrone={handleDeleteDrone}
                className="w-full"
              />
            </div>
          </motion.div>

          {/* Visualization Area */}
          <div className="col-span-12 lg:col-span-9 space-y-2.5">
            <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* 3D Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="overflow-hidden h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Radar className="w-5 h-5" />
                      3D Spatial View
                      <span className="text-sm font-normal text-muted-foreground">
                        Time: {dataset.timePointLabels?.[Math.floor(timelineState.currentTime)] ?? timelineState.currentTime.toFixed(0)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ExpandableVisualization
                      viewName="3D Spatial View"
                      modeLabel="3D View"
                      collapsedClassName="h-96 w-full"
                    >
                      <DroneVisualization3D
                        drones={currentDrones}
                        trajectories={trajectoryPaths}
                        showTrajectories={filters.showTrajectories}
                        showDetectionRanges={filters.showDetectionRanges}
                        showVelocityVectors={filters.showVelocityVectors}
                        showSignalIntensity={filters.showSignalIntensity}
                        showVideoFeedback={filters.showVideoFeedback}
                        className="h-full w-full"
                        timePointColors={timePointColorMap}
                        activeTimePoint={Math.floor(timelineState.currentTime)}
                      />
                    </ExpandableVisualization>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 2D Detection Range Map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
              <Card className="overflow-hidden h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapIcon className="w-5 h-5" />
                    2D Range Overlap
                    <span className="text-sm font-normal text-muted-foreground">
                      {filters.showDetectionRanges
                        ? 'Top-down detection coverage'
                        : 'Enable detection ranges to view overlap'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ExpandableVisualization
                    viewName="2D Range Overlap"
                    modeLabel="2D View"
                    collapsedClassName="h-[420px] w-full"
                    className="mx-auto max-w-[480px]"
                  >
                    <DroneRangeMap2D
                      drones={currentDrones}
                      showDetectionRanges={filters.showDetectionRanges}
                      showSignalIntensity={filters.showSignalIntensity}
                      showVideoFeedback={filters.showVideoFeedback}
                      boundingBox={dataset.metadata.boundingBox}
                      timePointSeries={timePointSeries}
                      currentTimePoint={Math.floor(timelineState.currentTime)}
                      timePointColors={timePointColorMap}
                      className="h-full w-full"
                    />
                  </ExpandableVisualization>
                </CardContent>
              </Card>
            </motion.div>
          </div>

            {/* Timeline Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Timeline
                currentTime={timelineState.currentTime}
                maxTime={dataset.timePoints.length - 1}
                isPlaying={timelineState.isPlaying}
                playbackSpeed={timelineState.playbackSpeed}
                currentLabel={dataset.timePointLabels?.[Math.floor(timelineState.currentTime)]}
                maxLabel={dataset.timePointLabels?.[dataset.timePoints.length - 1]}
                onTimeChange={handleTimeChange}
                onPlayPause={handlePlayPause}
                onSpeedChange={handleSpeedChange}
              />
            </motion.div>

            {/* Analysis Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Tabs defaultValue="statistics" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="statistics" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Analysis
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="statistics" className="mt-4">
                  <DroneStatistics drones={currentDrones} />
                </TabsContent>
                
                <TabsContent value="analysis" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Coordination Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Swarm Cohesion:</span>
                              <span className="font-mono">0.87</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Task Distribution:</span>
                              <span className="font-mono">0.92</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Energy Efficiency:</span>
                              <span className="font-mono">0.78</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Performance Indicators</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Mission Success Rate:</span>
                              <span className="font-mono text-accent">94.5%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average Response Time:</span>
                              <span className="font-mono">2.3s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Coverage Area:</span>
                              <span className="font-mono">4.2 km²</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
