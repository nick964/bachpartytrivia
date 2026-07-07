export default function EventLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-4 w-20 animate-pulse rounded bg-raised" />
        <div className="mt-3 h-10 w-72 animate-pulse rounded bg-raised" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-raised" />
      </div>
      <div className="h-64 animate-pulse border border-line bg-surface" />
      <div className="h-32 animate-pulse border border-line bg-surface" />
    </div>
  );
}
