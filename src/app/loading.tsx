export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-zinc-200 rounded w-48" />
        <div className="h-4 bg-zinc-100 rounded w-72 mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-zinc-100 rounded-lg" />
        ))}
      </div>
      <div className="h-16 bg-zinc-100 rounded-lg" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-48 bg-zinc-100 rounded-lg" />
        <div className="h-48 bg-zinc-100 rounded-lg" />
      </div>
    </div>
  );
}
