// Reusable shimmer skeleton components for all loading states

export const Skeleton = ({ className = '' }) => (
  <div className={`shimmer rounded-xl ${className}`} />
);

// ─── Generic Card Skeleton ────────────────────────────────────────────────────
export const CardSkeleton = ({ rows = 2 }) => (
  <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4 animate-pulse">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-8 w-32" />
    {rows > 2 && <Skeleton className="h-3 w-24" />}
  </div>
);

// ─── Markets Page Skeleton ────────────────────────────────────────────────────
export const MarketSkeleton = () => (
  <div className="space-y-8 pb-8 animate-pulse">
    <div className="space-y-2">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <div className="flex gap-2">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-8 w-16 rounded-full" />)}
        </div>
        <div className="glass rounded-[40px] p-8 h-[550px] border border-white/5">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-14 w-52" />
            </div>
            <Skeleton className="h-14 w-36 rounded-2xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-2xl opacity-30" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[32px]" />
        {[1,2,3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 ml-2" />
            {[1,2,3].map(j => <Skeleton key={j} className="h-20 w-full rounded-[24px]" />)}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Dashboard Skeleton ───────────────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <div className="space-y-8 pb-8 animate-pulse">
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-80" />
    </div>
    {/* KPI Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="glass p-6 rounded-[32px] border border-white/5 space-y-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    {/* Chart + Holdings */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass rounded-[40px] p-8 h-64 border border-white/5">
        <Skeleton className="h-full w-full rounded-2xl opacity-20" />
      </div>
      <div className="space-y-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-[24px]" />)}
      </div>
    </div>
  </div>
);

// ─── Portfolio Skeleton ───────────────────────────────────────────────────────
export const PortfolioSkeleton = () => (
  <div className="space-y-8 pb-8 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-32 rounded-2xl" />
    </div>
    {/* Holdings table */}
    <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24 rounded-xl" />
      </div>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20 hidden md:block" />
          <Skeleton className="h-8 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Watchlist Skeleton ───────────────────────────────────────────────────────
export const WatchlistSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="space-y-2">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="glass p-6 rounded-[32px] border border-white/5 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl opacity-30" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Analytics Skeleton (already in Analytics.jsx inline, but exported too) ──
export const AnalyticsSkeleton = () => (
  <div className="space-y-8 pb-12 animate-pulse">
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-12 w-64 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-2 h-48 bg-white/5 rounded-[32px]" />
      <div className="h-48 bg-white/5 rounded-[32px]" />
      <div className="h-48 bg-white/5 rounded-[32px]" />
    </div>
    <div className="h-[460px] bg-white/5 rounded-[40px]" />
  </div>
);

// ─── Journal Skeleton ─────────────────────────────────────────────────────────
export const JournalSkeleton = () => (
  <div className="space-y-8 pb-12 animate-pulse">
    <div className="space-y-2">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-[32px]" />)}
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-[32px]" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    </div>
  </div>
);

