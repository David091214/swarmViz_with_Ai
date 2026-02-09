import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DroneData, SwarmID, TaskType, DroneState } from '@/types/drone';
import { Users, Battery, Activity, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DroneStatisticsProps {
  drones: DroneData[];
  className?: string;
}

interface Segment {
  label: string;
  value: number;
  color: string;
}

const humanizeLabel = (value: string, noneLabel = 'None') => {
  if (value === 'none') return noneLabel;
  return value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const TASK_ORDER: TaskType[] = [
  'taking-off',
  'entering-swarm',
  'hovering',
  'passing-by',
  'returning',
  'descending',
  'attacking',
  'parachute-deployment',
  'none',
];

const SWARM_ORDER: SwarmID[] = ['alpha', 'beta', 'gamma', 'none'];

const SWARM_COLOR_MAP: Record<SwarmID, string> = {
  alpha: 'hsl(var(--swarm-alpha))', //
  beta: 'hsl(var(--swarm-beta))',
  gamma: 'hsl(var(--swarm-gamma))',
  delta: 'hsl(var(--swarm-delta))',
  epsilon: 'hsl(var(--swarm-epsilon))',
  none: 'hsl(215 15% 60%)',
};

const TASK_COLOR_MAP: Record<TaskType, string> = {
  'taking-off': 'hsl(199 89% 55%)',
  'entering-swarm': 'hsl(152 76% 45%)',
  hovering: 'hsl(187 92% 67%)',
  'passing-by': 'hsl(259 83% 67%)',
  returning: 'hsl(201 97% 64%)',
  descending: 'hsl(25 95% 58%)',
  attacking: 'hsl(0 84% 60%)',
  'parachute-deployment': 'hsl(300 83% 67%)',
  none: 'hsl(220 10% 60%)',
};

const STATE_COLOR_MAP: Record<DroneState, string> = {
  idle: 'hsl(var(--task-idle))',
  patrol: 'hsl(var(--task-patrol))',
  search: 'hsl(var(--task-search))',
  rescue: 'hsl(var(--task-rescue))',
  attack: 'hsl(var(--task-attack))',
  attacking: 'hsl(0 84% 60%)',
  charging: 'hsl(30 100% 60%)',
  maintenance: 'hsl(220 15% 60%)',
  emergency: 'hsl(0 100% 60%)',
  'taking-off': 'hsl(199 89% 55%)',
  'entering-swarm': 'hsl(152 76% 45%)',
  hovering: 'hsl(187 92% 67%)',
  'passing-by': 'hsl(259 83% 67%)',
  returning: 'hsl(201 97% 64%)',
  descending: 'hsl(25 95% 58%)',
  'parachute-deployment': 'hsl(300 83% 67%)',
};

export function DroneStatistics({ drones, className }: DroneStatisticsProps) {
  const totalDrones = drones.length;

  const avgBattery = useMemo(() => {
    if (totalDrones === 0) return 0;
    return drones.reduce((sum, drone) => sum + drone.batteryPercentage, 0) / totalDrones;
  }, [drones, totalDrones]);

  const avgSpeed = useMemo(() => {
    if (totalDrones === 0) return 0;
    const total = drones.reduce((sum, drone) => {
      const speed = Math.sqrt(
        drone.velocity.x ** 2 +
        drone.velocity.y ** 2 +
        drone.velocity.z ** 2
      );
      return sum + speed;
    }, 0);
    return total / totalDrones;
  }, [drones, totalDrones]);

  const avgAltitude = useMemo(() => {
    if (totalDrones === 0) return 0;
    return drones.reduce((sum, drone) => sum + drone.position.y, 0) / totalDrones;
  }, [drones, totalDrones]);

  const avgDetectionRange = useMemo(() => {
    if (totalDrones === 0) return 0;
    return drones.reduce((sum, drone) => sum + drone.detectionRange, 0) / totalDrones;
  }, [drones, totalDrones]);

  const swarmCounts = useMemo(() => {
    return drones.reduce((acc, drone) => {
      acc[drone.swarmId] = (acc[drone.swarmId] || 0) + 1;
      return acc;
    }, {} as Record<SwarmID, number>);
  }, [drones]);

  const taskCounts = useMemo(() => {
    return drones.reduce((acc, drone) => {
      acc[drone.taskId] = (acc[drone.taskId] || 0) + 1;
      return acc;
    }, {} as Record<TaskType, number>);
  }, [drones]);

  const stateCounts = useMemo(() => {
    return drones.reduce((acc, drone) => {
      acc[drone.state] = (acc[drone.state] || 0) + 1;
      return acc;
    }, {} as Record<DroneState, number>);
  }, [drones]);

  const batteryLevels = useMemo(() => ({
    critical: drones.filter(d => d.batteryPercentage < 20).length,
    low: drones.filter(d => d.batteryPercentage >= 20 && d.batteryPercentage < 50).length,
    medium: drones.filter(d => d.batteryPercentage >= 50 && d.batteryPercentage < 80).length,
    high: drones.filter(d => d.batteryPercentage >= 80).length,
  }), [drones]);

  const detectionCoverage = useMemo(() => {
    if (totalDrones === 0) {
      return { coveragePercent: 0, overlapPairs: 0, totalPairs: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    let totalCoverageArea = 0;

    for (const drone of drones) {
      minX = Math.min(minX, drone.position.x - drone.detectionRange);
      maxX = Math.max(maxX, drone.position.x + drone.detectionRange);
      minZ = Math.min(minZ, drone.position.z - drone.detectionRange);
      maxZ = Math.max(maxZ, drone.position.z + drone.detectionRange);
      totalCoverageArea += Math.PI * drone.detectionRange * drone.detectionRange;
    }

    const boundingArea = Math.max((maxX - minX) * (maxZ - minZ), 0);
    const coveragePercent = boundingArea > 0
      ? Math.min(100, (totalCoverageArea / boundingArea) * 100)
      : 0;

    let overlapPairs = 0;
    for (let i = 0; i < drones.length; i++) {
      for (let j = i + 1; j < drones.length; j++) {
        const dx = drones[i].position.x - drones[j].position.x;
        const dz = drones[i].position.z - drones[j].position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < drones[i].detectionRange + drones[j].detectionRange) {
          overlapPairs++;
        }
      }
    }

    const totalPairs = (totalDrones * (totalDrones - 1)) / 2;

    return { coveragePercent, overlapPairs, totalPairs };
  }, [drones, totalDrones]);

  const swarmEntries = useMemo(
    () =>
      SWARM_ORDER
        .filter((swarmId) => swarmCounts[swarmId] !== undefined)
        .map((swarmId) => [swarmId, swarmCounts[swarmId] ?? 0] as [SwarmID, number]),
    [swarmCounts]
  );
  const taskSegments: Segment[] = useMemo(
    () => TASK_ORDER.map(task => ({
      label: task,
      value: taskCounts[task] ?? 0,
      color: TASK_COLOR_MAP[task] ?? 'hsl(215 15% 60%)',
    })),
    [taskCounts]
  );

  const batterySegments: Segment[] = [
    { label: 'High', value: batteryLevels.high, color: 'hsl(var(--battery-high))' },
    { label: 'Medium', value: batteryLevels.medium, color: 'hsl(var(--battery-medium))' },
    { label: 'Low', value: batteryLevels.low, color: 'hsl(var(--battery-low))' },
    { label: 'Critical', value: batteryLevels.critical, color: 'hsl(var(--battery-critical))' },
  ].filter(segment => segment.value > 0);

  const stateEntries = useMemo(
    () => Object.entries(stateCounts)
      .map(([state, count]) => ({ state: state as DroneState, count }))
      .sort((a, b) => b.count - a.count),
    [stateCounts]
  );

  const alerts: { message: string; tone: 'warning' | 'critical' }[] = [];
  if (batteryLevels.critical > 0) {
    alerts.push({
      message: `${batteryLevels.critical} drone${batteryLevels.critical === 1 ? '' : 's'} critically low on charge`,
      tone: 'critical',
    });
  }
  if (batteryLevels.low > 0) {
    alerts.push({
      message: `${batteryLevels.low} drone${batteryLevels.low === 1 ? '' : 's'} need charging soon`,
      tone: 'warning',
    });
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <MetricTile
          icon={<Users className="h-6 w-6 text-primary" />}
          label="Fleet Strength"
          value={totalDrones}
          subtitle="Active units in formation"
        />
        <Card className="border border-accent/30 bg-surface/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mission Power</p>
                <h3 className="text-lg font-semibold text-foreground">Average Battery</h3>
              </div>
              <Battery className="h-6 w-6 text-accent" />
            </div>
            <div className="mt-4 flex items-center gap-6">
              <RadialMeter value={avgBattery} max={100} color="hsl(var(--accent))" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--battery-high))]" />
                  <span>High charge: {batteryLevels.high}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--battery-medium))]" />
                  <span>Stable: {batteryLevels.medium}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--battery-low))]" />
                  <span>Low: {batteryLevels.low}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--battery-critical))]" />
                  <span>Critical: {batteryLevels.critical}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-primary/30 bg-surface/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Velocity Spectrum</p>
                <h3 className="text-lg font-semibold text-foreground">Average Speed</h3>
              </div>
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-2">
              <SpeedGraph speed={avgSpeed} />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-warning/30 bg-surface/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sensor Envelope</p>
                <h3 className="text-lg font-semibold text-foreground">Detection Range</h3>
              </div>
              <Target className="h-6 w-6 text-warning" />
            </div>
            <div className="mt-4 space-y-3">
              <LinearGauge value={avgDetectionRange} max={80} label={`${avgDetectionRange.toFixed(1)} m`} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Coverage Utilization</span>
                <span>{Math.round(detectionCoverage.coveragePercent)}%</span>
              </div>
              {detectionCoverage.totalPairs > 0 && (
                <p className="text-xs text-muted-foreground">
                  {detectionCoverage.overlapPairs} overlapping pair{detectionCoverage.overlapPairs === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border border-primary/20 bg-surface/70 xl:max-w-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Swarm Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
           {swarmEntries.map(([swarmId, count]) => (
              <MiniDonut
                key={swarmId}
                label={swarmId}
                value={count}
                total={totalDrones}
                color={SWARM_COLOR_MAP[swarmId] ?? 'hsl(215 15% 60%)'}
              />
            ))}
            {swarmEntries.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">No active swarms.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-secondary/20 bg-surface/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Task Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TaskBarChart segments={taskSegments} total={totalDrones} />
          </CardContent>
        </Card>

        <BatteryHealthPanel
          segments={batterySegments}
          total={totalDrones}
          average={avgBattery}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-primary/20 bg-surface/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              State Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stateEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No state telemetry available.</p>
            )}
            {stateEntries.map(({ state, count }) => (
              <div key={state} className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: STATE_COLOR_MAP[state] ?? 'hsl(var(--muted))' }}
                  />
                  <span className="font-medium capitalize text-foreground">{state.replace(/-/g, ' ')}</span>
                </div>
                <span className="font-mono text-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-destructive/30 bg-surface/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {alerts.length === 0 && (
              <div className="flex items-center gap-3 rounded-md border border-accent/30 bg-accent/10 p-3 text-accent">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span>All systems nominal. No alerts triggered.</span>
              </div>
            )}
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3',
                  alert.tone === 'critical'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-warning/40 bg-warning/10 text-warning'
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
}

function MetricTile({ icon, label, value, subtitle }: MetricTileProps) {
  return (
    <Card className="border border-primary/20 bg-surface/70">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <h3 className="text-3xl font-semibold text-foreground">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="neon-glow flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface RadialMeterProps {
  value: number;
  max: number;
  color: string;
}

function RadialMeter({ value, max, color }: RadialMeterProps) {
  const normalized = max === 0 ? 0 : Math.min(1, Math.max(0, value / max));
  const gradient = `conic-gradient(${color} ${normalized * 100}%, rgba(9, 12, 24, 0.6) ${normalized * 100}% 100%)`;

  return (
    <div className="relative h-20 w-20">
      <div className="absolute inset-0 rounded-full opacity-90" style={{ background: gradient }} />
      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full border border-border/60 bg-background/90">
        <span className="text-lg font-semibold text-foreground">{value.toFixed(1)}%</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Avg</span>
      </div>
    </div>
  );
}

interface LinearGaugeProps {
  value: number;
  max: number;
  label?: string;
}

function LinearGauge({ value, max, label }: LinearGaugeProps) {
  const normalized = max === 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className="rounded-full bg-gradient-to-r from-primary via-accent to-warning"
          style={{ width: `${normalized * 100}%` }}
        />
      </div>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
    </div>
  );
}

interface SegmentedBarProps {
  segments: Segment[];
  total: number;
  noneLabel?: string;
}

function SegmentedBar({ segments, total, noneLabel = 'None' }: SegmentedBarProps) {
  if (total === 0 || segments.length === 0) {
    return <div className="h-3 w-full rounded-full bg-muted/40" />;
  }

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/40">
      {segments.map(segment => {
        const width = (segment.value / total) * 100;
        if (width <= 0) return null;
        const labelText = humanizeLabel(segment.label, noneLabel);
        return (
          <div
            key={segment.label}
            className="h-full"
            style={{ width: `${width}%`, background: segment.color }}
            title={`${labelText}: ${segment.value}`}
          />
        );
      })}
    </div>
  );
}

interface LegendItemProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function LegendItem({ label, value, total, color }: LegendItemProps) {
  const percent = total === 0 ? 0 : (value / total) * 100;
  const labelText = humanizeLabel(label, 'No Task');
  return (
    <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="capitalize text-foreground">{labelText}</span>
      </div>
      <span className="font-mono text-foreground">{value} · {percent.toFixed(0)}%</span>
    </div>
  );
}

interface BatteryRangeBarProps {
  value: number;
}

function BatteryRangeBar({ value }: BatteryRangeBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const handlePosition = Math.min(98, Math.max(2, clamped));

  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg,
              hsl(var(--battery-critical)) 0%,
              hsl(var(--battery-critical)) 20%,
              hsl(var(--battery-low)) 20%,
              hsl(var(--battery-low)) 50%,
              hsl(var(--battery-medium)) 50%,
              hsl(var(--battery-medium)) 80%,
              hsl(var(--battery-high)) 80%,
              hsl(var(--battery-high)) 100%)`,
          }}
        />
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${handlePosition}%` }}
        >
          <div className="-ml-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-background/60 shadow-[0_0_12px_rgba(255,255,255,0.55)] backdrop-blur">
            <div className="h-2 w-2 rounded-full bg-foreground" />
          </div>
        </div>
      </div>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>0%</span>
        <span>20%</span>
        <span>50%</span>
        <span>80%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

interface BatteryThermometerProps {
  value: number;
}

function BatteryThermometer({ value }: BatteryThermometerProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const fillHeight = clamped;
  const ticks = [0, 20, 50, 80, 100];

  const gradient = `linear-gradient(0deg,
    hsl(var(--battery-critical)) 0%,
    hsl(var(--battery-critical)) 20%,
    hsl(var(--battery-low)) 20%,
    hsl(var(--battery-low)) 50%,
    hsl(var(--battery-medium)) 50%,
    hsl(var(--battery-medium)) 80%,
    hsl(var(--battery-high)) 80%,
    hsl(var(--battery-high)) 100%)`;

  return (
    <div className="flex items-end gap-4">
      <div className="relative h-48 w-16">
        <div className="absolute inset-0 rounded-[32px] border border-border/60 bg-background/80" />
        <div className="absolute inset-x-2 bottom-2 top-2 rounded-[28px] bg-muted/50" />
        <div
          className="absolute inset-x-2 bottom-2 rounded-b-[28px]"
          style={{ height: `${fillHeight}%`, background: gradient, transition: 'height 0.4s ease' }}
        />
        <div
          className="absolute left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-background bg-background/70 shadow-[0_0_14px_rgba(255,255,255,0.55)] backdrop-blur"
          style={{ bottom: `calc(${fillHeight}% + 4px)` }}
        >
          <div className="h-2 w-2 rounded-full bg-foreground" />
        </div>
        <div className="absolute inset-y-2 -left-10 flex flex-col justify-between text-xs text-muted-foreground">
          {ticks.map((tick) => (
            <span key={`thermo-tick-${tick}`}>{tick}%</span>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-foreground">{value.toFixed(0)}%</p>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Battery</p>
      </div>
    </div>
  );
}

interface SpeedGraphProps {
  speed: number;
}

function SpeedGraph({ speed }: SpeedGraphProps) {
  const maxTime = 10; // seconds
  const projectedDistance = Math.max(speed * maxTime, 5);
  const distanceTicks = Array.from({ length: 5 }, (_, idx) => (projectedDistance / 4) * idx);
  const timeTicks = Array.from({ length: 5 }, (_, idx) => (maxTime / 4) * idx);

  const width = 260;
  const height = 150;
  const margin = { top: 24, right: 18, bottom: 32, left: 45 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const lineEndX = margin.left + chartWidth;
  const lineEndY = margin.top;

  const pathD = `M ${margin.left} ${margin.top + chartHeight} L ${lineEndX} ${lineEndY}`;

  return (
    <div className="mt-4 space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-sm">
        <rect x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1} fillOpacity={0.45} />

        {/* Axes */}
        <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} stroke="hsl(var(--border))" strokeWidth={1.3} />
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke="hsl(var(--border))" strokeWidth={1.3} />

      {/* Distance ticks */}
      {distanceTicks.map((tick) => {
        const x = margin.left + (tick / projectedDistance) * chartWidth;
        return (
          <g key={`dist-${tick}`}>
            <line x1={x} x2={x} y1={margin.top + chartHeight} y2={margin.top + chartHeight + 6} stroke="hsl(var(--border))" />
            <text x={x} y={margin.top + chartHeight + 20} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
              {Math.round(tick)} m
            </text>
          </g>
        );
      })}

      {/* Time ticks */}
      {timeTicks.map((tick) => {
        const y = margin.top + chartHeight - (tick / maxTime) * chartHeight;
        return (
          <g key={`time-${tick}`}>
            <line x1={margin.left - 6} x2={margin.left} y1={y} y2={y} stroke="hsl(var(--border))" />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">
              {tick}s
            </text>
          </g>
        );
      })}

      <path d={pathD} stroke="hsl(var(--accent))" strokeWidth={2} fill="none" strokeLinecap="round" />
      <circle cx={lineEndX} cy={lineEndY} r={4} fill="hsl(var(--accent))" stroke="hsl(var(--accent-foreground))" strokeWidth={2} />

      <text x={margin.left + chartWidth / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))" letterSpacing={2}>
        Distance (m)
      </text>
      <text x={16} y={margin.top + chartHeight / 2} transform={`rotate(-90 16 ${margin.top + chartHeight / 2})`} fontSize={11} fill="hsl(var(--muted-foreground))" letterSpacing={2}>
        Time (s)
      </text>
      <text x={lineEndX} y={lineEndY - 8} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">
        {`${Math.round(projectedDistance)} m @ ${maxTime}s`}
      </text>
    </svg>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="rounded-md border border-border/40 bg-background/60 px-3 py-2">
          <p className="font-medium text-foreground">Avg Speed</p>
          <p className="font-mono text-sm text-foreground">{speed.toFixed(1)} m/s</p>
        </div>
        <div className="rounded-md border border-border/40 bg-background/60 px-3 py-2">
          <p className="font-medium text-foreground">Distance in 10s</p>
          <p className="font-mono text-sm text-foreground">{projectedDistance.toFixed(1)} m</p>
        </div>
        <div className="rounded-md border border-border/40 bg-background/60 px-3 py-2">
          <p className="font-medium text-foreground">Time Window</p>
          <p className="font-mono text-sm text-foreground">0 – {maxTime}s</p>
        </div>
      </div>
    </div>
  );
}

interface BatteryHealthPanelProps {
  segments: Segment[];
  total: number;
  average: number;
}

function BatteryHealthPanel({ segments, total, average }: BatteryHealthPanelProps) {
  const descriptor = 'Average charge across all selected drones';
  const maxSegment = Math.max(...segments.map(segment => segment.value), 1);
  const sortedSegments = [...segments].sort((a, b) => b.value - a.value);

  return (
        <Card className="border border-accent/20 bg-surface/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Battery Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BatteryThermometer value={average} />
            <BatteryRangeBar value={average} />
            <p className="text-xs text-muted-foreground">Average charge across all selected drones</p>
          </CardContent>
        </Card>
  );
}

interface TaskBarChartProps {
  segments: Segment[];
  total: number;
}

function TaskBarChart({ segments, total }: TaskBarChartProps) {
  const baselineTotal = total === 0 ? 1 : total;

  return (
    <div className="space-y-3">
      {segments.map(segment => {
        const percent = Math.max(0, (segment.value / baselineTotal) * 100);
        const labelText = humanizeLabel(segment.label, 'No Task');
        return (
          <div key={segment.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
                <span className="capitalize text-foreground">{labelText}</span>
              </span>
              <span className="font-mono text-foreground">{segment.value} · {total === 0 ? '0' : percent.toFixed(0)}%</span>
            </div>
            <div className="h-8 w-full rounded-lg border border-border/50 bg-background/60 px-2 py-1 shadow-inner">
              <div className="relative h-full w-full rounded-md bg-muted/40">
                <div
                  className="absolute inset-y-0 left-0 rounded-md"
                  style={{
                    width: `${percent}%`,
                    background: `${segment.color}`,
                    transition: 'width 0.35s ease',
                    minWidth: segment.value > 0 ? '6%' : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MiniDonutProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function MiniDonut({ label, value, total, color }: MiniDonutProps) {
  const percent = total === 0 ? 0 : (value / total) * 100;
  const gradient = `conic-gradient(${color} ${percent}%, rgba(9, 12, 24, 0.6) ${percent}% 100%)`;
  const labelText = humanizeLabel(label, 'No Swarm');

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full border border-border/50 bg-background/90">
          <span className="text-base font-semibold text-foreground">{value}</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Units</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold capitalize text-foreground">{labelText}</p>
        <p className="text-xs text-muted-foreground">{percent.toFixed(0)}% of fleet</p>
      </div>
    </div>
  );
}
