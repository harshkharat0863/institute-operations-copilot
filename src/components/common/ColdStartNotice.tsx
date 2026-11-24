import React, { useEffect, useState } from 'react';
import { Server, Loader2 } from 'lucide-react';

export const ColdStartNotice: React.FC = () => {
  const [isWaking, setIsWaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any = null;

    const handleColdStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ isWaking: boolean }>;
      const waking = customEvent.detail?.isWaking ?? false;
      setIsWaking(waking);
      if (waking) {
        setElapsedSeconds(3);
        timer = setInterval(() => {
          setElapsedSeconds(s => s + 1);
        }, 1000);
      } else {
        if (timer) clearInterval(timer);
        setElapsedSeconds(0);
      }
    };

    window.addEventListener('server_cold_start', handleColdStart);
    return () => {
      window.removeEventListener('server_cold_start', handleColdStart);
      if (timer) clearInterval(timer);
    };
  }, []);

  if (!isWaking) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 rounded-[8px] bg-surface border border-accent/40 shadow-xl pointer-events-auto flex items-start gap-3.5 text-xs text-text">
        <div className="p-2 rounded-[6px] bg-accent-subtle text-accent shrink-0 mt-0.5">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-serif font-medium text-text text-sm">
              Waking up the server, this can take up to a minute
            </h4>
            <span className="font-mono text-[11px] text-text-subtle shrink-0 tabular-nums">
              {elapsedSeconds}s
            </span>
          </div>

          <p className="text-text-muted mt-1 leading-relaxed text-[11px]">
            Render free-tier web services sleep after periods of inactivity. Your request is in progress and the app will resume automatically once the backend is ready.
          </p>

          <div className="mt-2 w-full bg-surface-muted rounded-full h-1 overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
