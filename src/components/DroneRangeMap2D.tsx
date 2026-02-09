import React, { useMemo } from 'react';

import { DroneData, SwarmID, DroneSwarmDataset } from '@/types/drone';
import { getSwarmColor } from '@/lib/colorMaps';
import { getTimePointColor } from '@/lib/timeSeriesColors';
import { cn } from '@/lib/utils';

interface TimePointSeriesEntry {
  timePoint: number;
  label: string;
  drones: DroneData[];
}

interface DroneRangeMap2DProps {
  drones: DroneData[];
  showDetectionRanges?: boolean;
  showSignalIntensity?: boolean;
  showVideoFeedback?: boolean;
  boundingBox?: DroneSwarmDataset['metadata']['boundingBox'];
  timePointSeries?: TimePointSeriesEntry[];
  currentTimePoint?: number;
  timePointColors?: Record<number, string>;
  className?: string;
}

type CircleDatum = {
  id: string;
  swarmId: SwarmID;
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  shape: MarkerShape;
};

type TimePointMarker = {
  id: string;
  x: number;
  y: number;
  shape: MarkerShape;
};

type TimePointLayer = {
  timePoint: number;
  label: string;
  color: string;
  isCurrent: boolean;
  markers: TimePointMarker[];
};

type MarkerShape = 'circle' | 'square' | 'diamond' | 'hexagon' | 'cross';

const markerShapePalette: MarkerShape[] = ['circle', 'square', 'diamond', 'hexagon', 'cross'];

const shapeSizeMultiplier: Record<MarkerShape, number> = {
  circle: 1,
  square: 1,
  diamond: 1,
  hexagon: 1.2,
  cross: 1.3,
};

const swarmLabelMap: Record<SwarmID, string> = {
  alpha: 'SW-1',
  beta: 'SW-2',
  gamma: 'SW-3',
  delta: 'SW-4',
  epsilon: 'SW-5',
  none: 'NO SWARM',
  '-1': 'NO SWARM',
};

function formatSwarmLabel(id: SwarmID) {
  return swarmLabelMap[id] ?? id.toUpperCase();
}

function hashToShape(id: string): MarkerShape {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % markerShapePalette.length;
  return markerShapePalette[index];
}

function renderMarkerShape(
  shape: MarkerShape,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
) {
  switch (shape) {
    case 'circle':
      return (
        <circle
          cx={cx}
          cy={cy}
          r={size}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'square':
      return (
        <rect
          x={cx - size}
          y={cy - size}
          width={size * 2}
          height={size * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={size * 0.2}
        />
      );
    case 'diamond': {
      const points = [
        `${cx},${cy - size}`,
        `${cx - size},${cy}`,
        `${cx},${cy + size}`,
        `${cx + size},${cy}`,
      ].join(' ');
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case 'hexagon': {
      const angleStep = Math.PI / 3;
      const points = Array.from({ length: 6 }, (_, idx) => {
        const angle = angleStep * idx - Math.PI / 6;
        const px = cx + size * Math.cos(angle);
        const py = cy + size * Math.sin(angle);
        return `${px},${py}`;
      }).join(' ');
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case 'triangle':
    case 'cross':
    default: {
      const arm = size * 0.6;
      const points = [
        `${cx - arm},${cy - size}`,
        `${cx - size},${cy - arm}`,
        `${cx - arm},${cy}`,
        `${cx - size},${cy + arm}`,
        `${cx - arm},${cy + size}`,
        `${cx + arm},${cy + size}`,
        `${cx + size},${cy + arm}`,
        `${cx + arm},${cy}`,
        `${cx + size},${cy - arm}`,
        `${cx + arm},${cy - size}`,
      ].join(' ');
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
  }
}

const MAP_MIN = 0;
const MAP_MAX = 100;
const MAP_SIZE = MAP_MAX - MAP_MIN;

function signalIntensityToColor(intensity: number) {
  const normalized = Math.min(Math.max(intensity / 100, 0), 1);
  const hue = 12 + normalized * 110; // 12deg (red) to 122deg (green)
  const saturation = 85;
  const lightness = 45 + normalized * 15;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function DroneRangeMap2D({
  drones,
  showDetectionRanges = false,
  showSignalIntensity = true,
  showVideoFeedback = true,
  boundingBox,
  timePointSeries,
  currentTimePoint,
  timePointColors,
  className,
}: DroneRangeMap2DProps) {
  const detectionDrones = useMemo(
    () => (showDetectionRanges ? drones.filter(drone => drone.detectionRange > 0) : []),
    [drones, showDetectionRanges],
  );

  const normalizeToMap = (
    coordinate: number,
    minValue: number,
    span: number,
  ) => ((coordinate - minValue) / span) * MAP_SIZE + MAP_MIN;

  const { viewBox, bounds, circles, timeLayers } = useMemo(() => {
    const baseBounds = { left: MAP_MIN, top: MAP_MIN, size: MAP_SIZE };

    if (detectionDrones.length === 0 && (!timePointSeries || timePointSeries.length === 0)) {
      return {
        viewBox: `0 0 ${MAP_MAX} ${MAP_MAX}`,
        bounds: baseBounds,
        circles: [] as CircleDatum[],
        timeLayers: [] as TimePointLayer[],
      };
    }

    const bounds3d = boundingBox ?? {
      min: { x: MAP_MIN, y: 0, z: MAP_MIN },
      max: { x: MAP_MAX, y: 0, z: MAP_MAX },
    };

    const spanX = Math.max(bounds3d.max.x - bounds3d.min.x, 1);
    const spanZ = Math.max(bounds3d.max.z - bounds3d.min.z, 1);
    const scale = MAP_SIZE / Math.max(spanX, spanZ);
    const FIXED_OUTER_RADIUS = 2;
    const FIXED_INNER_RADIUS = 2;

    const EDGE_PADDING = MAP_SIZE * 0.04;

    const clampWithMargin = (value: number) =>
      Math.min(Math.max(value, MAP_MIN + EDGE_PADDING), MAP_MAX - EDGE_PADDING);

    const circles: CircleDatum[] = detectionDrones.map(drone => {
      const normalizedX = normalizeToMap(drone.position.x, bounds3d.min.x, spanX);
      const normalizedZ = normalizeToMap(drone.position.z, bounds3d.min.z, spanZ);
      const x = clampWithMargin(normalizedX);
      const y = clampWithMargin(MAP_MAX - normalizedZ);
      const outerRadius = FIXED_OUTER_RADIUS;
      const innerRadius = FIXED_INNER_RADIUS;
      const color = getSwarmColor(drone.swarmId);

      return {
        id: drone.droneId,
        swarmId: drone.swarmId,
        x,
        y,
        innerRadius,
        outerRadius,
        color,
        shape: hashToShape(drone.droneId),
      };
    });

    const timeLayers: TimePointLayer[] = (timePointSeries ?? [])
      .map((layer, index) => {
        if (!layer.drones || layer.drones.length === 0) {
          return null;
        }

        const markers: TimePointMarker[] = layer.drones.map(drone => {
          const normalizedX = normalizeToMap(drone.position.x, bounds3d.min.x, spanX);
          const normalizedZ = normalizeToMap(drone.position.z, bounds3d.min.z, spanZ);
          const x = clampWithMargin(normalizedX);
          const y = clampWithMargin(MAP_MAX - normalizedZ);

          return {
            id: `${layer.timePoint}-${drone.droneId}`,
            x,
            y,
            shape: hashToShape(drone.droneId),
          };
        });

        if (markers.length === 0) {
          return null;
        }

        const isCurrent = typeof currentTimePoint === 'number' && layer.timePoint === currentTimePoint;
        const isPast = typeof currentTimePoint === 'number' && layer.timePoint < currentTimePoint;

        return {
          timePoint: layer.timePoint,
          label: layer.label,
          color: timePointColors?.[layer.timePoint] ?? getTimePointColor(index),
          isCurrent,
          markers,
          isPast,
        } as TimePointLayer & { isPast: boolean };
      })
      .filter((entry): entry is TimePointLayer & { isPast: boolean } => entry !== null)
      .map(layer => ({
        timePoint: layer.timePoint,
        label: layer.label,
        color: layer.color,
        isCurrent: layer.isCurrent,
        markers: layer.isCurrent ? layer.markers : [],
      }));

    return {
      viewBox: `0 0 ${MAP_MAX} ${MAP_MAX}`,
      bounds: baseBounds,
      circles,
      timeLayers,
    };
  }, [boundingBox, currentTimePoint, detectionDrones, timePointSeries, timePointColors]);

  const realtimeMarkers = useMemo(() => {
    if ((!showSignalIntensity && !showVideoFeedback) || drones.length === 0) {
      return [] as Array<{
        id: string;
        x: number;
        y: number;
        signalIntensity: number;
        signalColor: string;
        videoFeedbackOn: boolean;
      }>;
    }

    const bounds3d = boundingBox ?? {
      min: { x: MAP_MIN, y: 0, z: MAP_MIN },
      max: { x: MAP_MAX, y: 0, z: MAP_MAX },
    };
    const spanX = Math.max(bounds3d.max.x - bounds3d.min.x, 1);
    const spanZ = Math.max(bounds3d.max.z - bounds3d.min.z, 1);
    const EDGE_PADDING = MAP_SIZE * 0.04;
    const clampWithMargin = (value: number) =>
      Math.min(Math.max(value, MAP_MIN + EDGE_PADDING), MAP_MAX - EDGE_PADDING);

    return drones.map(drone => {
      const normalizedX = normalizeToMap(drone.position.x, bounds3d.min.x, spanX);
      const normalizedZ = normalizeToMap(drone.position.z, bounds3d.min.z, spanZ);
      const x = clampWithMargin(normalizedX);
      const y = clampWithMargin(MAP_MAX - normalizedZ);
      const signalIntensity = typeof drone.signalIntensity === 'number' ? drone.signalIntensity : 0;
      return {
        id: drone.droneId,
        x,
        y,
        signalIntensity,
        signalColor: signalIntensityToColor(signalIntensity),
        videoFeedbackOn: drone.videoFeedbackOn,
      };
    });
  }, [drones, boundingBox, showSignalIntensity, showVideoFeedback]);

  const gridLines = useMemo(() => {
    const lines: { orientation: 'horizontal' | 'vertical'; position: number }[] = [];
    const divisions = 5;

    if (circles.length === 0 && timeLayers.length === 0) {
      return lines;
    }

    const step = bounds.size / divisions;

    for (let i = 1; i < divisions; i += 1) {
      const offset = bounds.left + step * i;
      const horizontalOffset = bounds.top + step * i;
      lines.push({ orientation: 'vertical', position: offset });
      lines.push({ orientation: 'horizontal', position: horizontalOffset });
    }

    return lines;
  }, [bounds, circles.length, timeLayers.length]);

  const legendEntries = useMemo(() => {
    const seen = new Set<SwarmID>();
    const entries: { swarmId: SwarmID; color: string }[] = [];

    circles.forEach(circle => {
      if (!seen.has(circle.swarmId)) {
        seen.add(circle.swarmId);
        entries.push({ swarmId: circle.swarmId, color: circle.color });
      }
    });

    return entries;
  }, [circles]);

  const hasData = showDetectionRanges && detectionDrones.length > 0;

  const pointRadius = Math.max(bounds.size * 0.02, 1.5);
  const markerRadius = Math.max(bounds.size * 0.015, 1.2);

  return (
    <div className={cn('relative w-full h-full overflow-hidden rounded-lg bg-slate-950/40', className)}>
      <svg viewBox={viewBox} className="h-full w-full">
        <defs>
          <linearGradient id="range-map-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.15)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0.45)" />
          </linearGradient>
          <filter id="range-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <image
          href="/bird_view.png"
          x={bounds.left}
          y={bounds.top}
          width={bounds.size}
          height={bounds.size}
          preserveAspectRatio="none"
        />

        <rect
          x={bounds.left}
          y={bounds.top}
          width={bounds.size}
          height={bounds.size}
          fill="url(#range-map-gradient)"
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth={0.5}
        />

        {gridLines.map((line, index) => (
          <line
            key={`${line.orientation}-${index}`}
            x1={line.orientation === 'vertical' ? line.position : bounds.left}
            y1={line.orientation === 'vertical' ? bounds.top : line.position}
            x2={line.orientation === 'vertical' ? line.position : bounds.left + bounds.size}
            y2={line.orientation === 'vertical' ? bounds.top + bounds.size : line.position}
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={0.6}
          />
        ))}

        {timeLayers.map(layer => (
          <g key={`time-layer-${layer.timePoint}`}>
            {layer.markers.map(marker => (
              <g key={marker.id}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={layer.isCurrent ? markerRadius * 2.5 : markerRadius * 1.8}
                  fill={layer.color}
                  fillOpacity={layer.isCurrent ? 0.16 : 0.12}
                  filter="url(#range-glow)"
                />
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={layer.isCurrent ? markerRadius * 1.6 : markerRadius * 1.2}
                  fill="none"
                  stroke={layer.color}
                  strokeWidth={0.9}
                  strokeOpacity={0.8}
                />
                {renderMarkerShape(
                  marker.shape,
                  marker.x,
                  marker.y,
                  (layer.isCurrent ? markerRadius * 0.9 : markerRadius * 0.7) * (shapeSizeMultiplier[marker.shape] ?? 1),
                  layer.color,
                  'rgba(15, 23, 42, 0.9)',
                  0.5,
                )}
              </g>
            ))}
          </g>
        ))}

        {circles.map((circle, index) => (
          <g key={`circle-${circle.id}`}>
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.outerRadius * 1.4}
              fill={circle.color}
              fillOpacity={0.15}
              filter="url(#range-glow)"
            />
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.innerRadius}
              fill={circle.color}
              fillOpacity={0.18}
              stroke={circle.color}
              strokeWidth={1.2}
              strokeOpacity={0.7}
            />
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.outerRadius}
              fill="none"
              stroke={circle.color}
              strokeWidth={1.2}
              strokeOpacity={0.4}
            >
              <animate
                attributeName="r"
                values={`${circle.outerRadius}; ${circle.outerRadius * 1.35}; ${circle.outerRadius}`}
                dur="2.4s"
                repeatCount="indefinite"
                begin={`${(index % 5) * 0.3}s`}
              />
              <animate
                attributeName="opacity"
                values="0.4; 0; 0"
                dur="2.4s"
                repeatCount="indefinite"
                begin={`${(index % 5) * 0.3}s`}
              />
            </circle>
            {renderMarkerShape(
              circle.shape,
              circle.x,
              circle.y,
              pointRadius * (shapeSizeMultiplier[circle.shape] ?? 1),
              circle.color,
              'rgba(15, 23, 42, 0.9)',
              0.6,
            )}
            <text
              x={circle.x}
              y={circle.y + pointRadius * 2.6}
              fontSize={pointRadius * 2.6}
              fill="#e2e8f0"
              fontWeight={600}
              stroke="#0f172a"
              strokeWidth={0.4}
              textAnchor="middle"
            >
              {circle.id}
            </text>
          </g>
        ))}

        {(showSignalIntensity || showVideoFeedback) && realtimeMarkers.map(marker => {
          const normalized = Math.min(Math.max(marker.signalIntensity / 100, 0), 1);
          const baseRadius = pointRadius * 1.05;
          const scaledRadius = showSignalIntensity
            ? pointRadius * (1.05 + normalized * 0.9)
            : baseRadius;
          const strokeOpacity = 0.4 + normalized * 0.4;
          const videoColor = marker.videoFeedbackOn ? '#22c55e' : '#ef4444';

          return (
            <g key={`realtime-${marker.id}`}>
              {showSignalIntensity && (
                <>
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={scaledRadius * 1.3}
                    fill={marker.signalColor}
                    fillOpacity={0.2 + normalized * 0.3}
                  />
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={scaledRadius}
                    fill="none"
                    stroke={marker.signalColor}
                    strokeWidth={1.4}
                    strokeOpacity={strokeOpacity}
                  />
                </>
              )}
              <text
                x={marker.x}
                y={marker.y + scaledRadius * 0.3}
                fontSize={Math.max(2.6, scaledRadius * 1.4)}
                fill="#e2e8f0"
                fontWeight={600}
                stroke="#0f172a"
                strokeWidth={0.4}
                textAnchor="middle"
              >
                {marker.id}
              </text>
              {showVideoFeedback && (
                <g transform={`translate(${marker.x - scaledRadius * 0.6}, ${marker.y - scaledRadius * 1.8})`}>
                  <rect
                    width={scaledRadius * 1.2}
                    height={scaledRadius * 0.6}
                    rx={scaledRadius * 0.15}
                    fill="rgba(15, 23, 42, 0.75)"
                    stroke={videoColor}
                    strokeWidth={0.4}
                  />
                  <circle
                    cx={scaledRadius * 0.25}
                    cy={scaledRadius * 0.3}
                    r={scaledRadius * 0.14}
                    fill={videoColor}
                  />
                  <text
                    x={scaledRadius * 0.75}
                    y={scaledRadius * 0.42}
                    fontSize={Math.max(1.4, scaledRadius * 0.28)}
                    fill={videoColor}
                    fontWeight={600}
                    textAnchor="start"
                  >
                    {marker.videoFeedbackOn ? 'REC' : 'OFF'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {legendEntries.length > 0 && hasData && (
        <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 rounded-md bg-slate-950/80 px-3 py-2 text-xs text-slate-200 shadow-lg">
          {legendEntries.map(entry => (
            <div key={`legend-${entry.swarmId}`} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="uppercase tracking-wide">{formatSwarmLabel(entry.swarmId)}</span>
            </div>
          ))}
        </div>
      )}

      {timeLayers.length > 0 && (
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-md bg-slate-950/80 px-3 py-2 text-xs text-slate-200 shadow-lg">
          {timeLayers.map(layer => (
            <div key={`time-legend-${layer.timePoint}`} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: layer.color, opacity: layer.isCurrent ? 0.85 : 0.4 }}
              />
              <span>{layer.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
