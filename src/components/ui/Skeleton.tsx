import { cn } from '@/src/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-slate-100 rounded-xl", className)} />
  );
}

export function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  const colWidths = Array(cols).fill(0).map((_, i) => {
    const widths = ['w-1/3', 'w-1/4', 'w-1/5', 'w-1/6', 'w-1/4'];
    return widths[i % widths.length];
  });

  return (
    <div className="animate-pulse">
      <div className="flex gap-8 px-8 py-5 border-b border-slate-100">
        {colWidths.map((w, i) => (
          <div key={i} className={cn("h-4 bg-slate-100 rounded", w)} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-8 px-8 py-6 border-b border-slate-50">
          {colWidths.map((w, i) => (
            <div key={i} className={cn("h-5 bg-slate-50 rounded", w)} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse">
          <div className="h-1.5 bg-slate-100" />
          <div className="p-8 space-y-4">
            <div className="flex justify-between">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
              <div className="w-16 h-8 bg-slate-50 rounded-lg" />
            </div>
            <div className="h-6 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-50 rounded w-full" />
            <div className="pt-6 border-t border-slate-50">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-6 bg-slate-50 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 animate-pulse">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="flex gap-2 mt-4">
              <div className="h-5 bg-slate-50 rounded w-16" />
              <div className="h-5 bg-slate-50 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
