export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 bg-muted rounded-lg w-44" />
          <div className="h-4 bg-muted rounded w-28" />
        </div>
        <div className="hidden sm:block h-4 bg-muted rounded w-36" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-muted rounded w-20" />
            <div className="h-8 bg-muted rounded w-12" />
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sales widget */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
            <div className="px-5 pb-4">
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          </div>

          {/* Alert card placeholder */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="h-3 bg-muted rounded w-28" />
              <div className="h-3 bg-muted rounded w-14" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-36" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                  <div className="h-3 bg-muted rounded w-4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-5">
          {/* Inventory value */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-muted rounded w-32" />
            <div className="h-7 bg-muted rounded w-28" />
            <div className="h-6 bg-muted rounded-lg w-36" />
          </div>

          {/* Recent activity */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="h-3 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-28" />
                    <div className="h-3 bg-muted rounded w-36" />
                  </div>
                  <div className="space-y-1.5 items-end flex flex-col">
                    <div className="h-3.5 bg-muted rounded w-6" />
                    <div className="h-3 bg-muted rounded w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
