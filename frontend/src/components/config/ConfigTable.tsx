import { useEffect, useRef, useState } from 'react';
import { useSchedulerStore } from '../../store/schedulerStore';
import { ConfigDataTables } from './ConfigDataTables';
import { ConfigExporter } from './ConfigExporter';
import { ConfigImporter } from './ConfigImporter';
import { ConfigSummary } from './ConfigSummary';

export const ConfigTable = () => {
  const { config } = useSchedulerStore();
  const [isStuck, setIsStuck] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' },
    );

    const sentinel = stickyRef.current?.previousElementSibling;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Sentinel element for intersection observer */}
      <div className="h-0" />
      <div
        ref={stickyRef}
        className="sticky top-0 z-10 rounded-xl border border-white/5 bg-slate-900/95 backdrop-blur-sm transition-all duration-200"
        style={{ padding: isStuck ? '1rem 1.5rem' : '1.5rem' }}
      >
        <div
          className={`transition-all duration-200 ${
            isStuck ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-20 opacity-100'
          }`}
        >
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <div>
              <h3 className="text-lg font-semibold">Dataset summary</h3>
              <p className="text-sm text-slate-400">
                Ensure each entity is imported and validated before running the scheduler.
              </p>
            </div>
            <div className="flex gap-2">
              <ConfigImporter />
              <ConfigExporter />
            </div>
          </div>
        </div>
        <div className={isStuck ? '' : 'mt-2'}>
          <ConfigSummary config={config} compact={isStuck} />
        </div>
      </div>
      <ConfigDataTables config={config} />
    </div>
  );
};
