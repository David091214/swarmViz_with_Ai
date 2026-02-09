import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ExpandableVisualizationProps {
  children: React.ReactNode;
  viewName: string;
  modeLabel: string;
  collapsedClassName?: string;
  className?: string;
}

export function ExpandableVisualization({
  children,
  viewName,
  modeLabel,
  collapsedClassName,
  className,
}: ExpandableVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const containerClasses = cn(
    'relative flex h-full w-full rounded-xl border border-slate-800/60 bg-slate-950/50 shadow-inner transition-all duration-300 ease-in-out',
    'backdrop-blur-sm',
    isExpanded
      ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] scale-100 shadow-2xl'
      : collapsedClassName,
    className,
  );

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={toggleExpand}
        />
      )}
      <div className={containerClasses}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
        <div className="absolute left-4 top-4 z-10 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 shadow-sm">
          {modeLabel}
          {isExpanded && <span className="ml-2 text-[10px] font-normal text-emerald-300">Expanded</span>}
        </div>
        <button
          type="button"
          className="group absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-100 shadow-md transition-transform duration-200 hover:scale-105 hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60"
          onClick={toggleExpand}
          aria-pressed={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${viewName}`}
          title={isExpanded ? 'Collapse view' : 'Expand view'}
        >
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
        <div className={cn('relative z-0 flex h-full w-full', isExpanded ? 'cursor-zoom-out' : '')}>
          {children}
        </div>
      </div>
    </>
  );
}
