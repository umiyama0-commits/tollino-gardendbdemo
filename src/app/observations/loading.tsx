export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-zinc-200 rounded w-48" />
        <div className="h-4 bg-zinc-100 rounded w-72 mt-2" />
      </div>
      <div className="h-14 bg-zinc-100 rounded-lg" />
      <div className="h-96 bg-zinc-100 rounded-lg" />
    </div>
  );
}
