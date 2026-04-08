export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-zinc-200 rounded w-56" />
        <div className="h-4 bg-zinc-100 rounded w-96 mt-2" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 bg-zinc-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
