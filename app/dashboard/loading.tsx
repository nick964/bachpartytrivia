export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="h-11 w-56 animate-pulse rounded bg-raised" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-56 animate-pulse border border-line bg-surface"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse border border-line bg-surface" />
    </div>
  );
}
