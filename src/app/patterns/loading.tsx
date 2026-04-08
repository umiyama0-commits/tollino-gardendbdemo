export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-zinc-200 rounded w-64" />
        <div className="h-4 bg-zinc-100 rounded w-96 mt-2" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-zinc-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
