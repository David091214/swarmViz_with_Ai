import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  currentTime: number;
  maxTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentLabel?: string;
  maxLabel?: string;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

export function Timeline({
  currentTime,
  maxTime,
  isPlaying,
  playbackSpeed,
  currentLabel,
  maxLabel,
  onTimeChange,
  onPlayPause,
  onSpeedChange,
  className
}: TimelineProps) {
  const speedOptions = [0.25, 0.5, 1, 2, 4];
  
  return (
    <div className={cn("flex items-center gap-4 p-4 bg-card border border-border rounded-lg", className)}>
      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTimeChange(0)}
          className="w-8 h-8 p-0"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onPlayPause}
          className="w-8 h-8 p-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTimeChange(maxTime)}
          className="w-8 h-8 p-0"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Time display */}
      <div className="flex flex-col text-sm font-mono text-muted-foreground min-w-[110px]">
        <span>{currentTime.toFixed(0)} / {maxTime.toFixed(0)}</span>
        {(currentLabel || maxLabel) && (
          <span className="text-[11px] uppercase tracking-wide text-foreground/70">
            {(currentLabel ?? '').trim() || `T+${currentTime.toFixed(0)}`} / {(maxLabel ?? '').trim() || `T+${maxTime.toFixed(0)}`}
          </span>
        )}
      </div>
      
      {/* Timeline slider */}
      <div className="flex-1 px-4">
        <Slider
          value={[currentTime]}
          max={maxTime}
          step={1}
          onValueChange={(value) => onTimeChange(value[0])}
          className="w-full"
        />
      </div>
      
      {/* Speed control */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Speed:</span>
        <select
          value={playbackSpeed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="px-2 py-1 text-sm bg-input border border-border rounded text-foreground"
        >
          {speedOptions.map(speed => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
