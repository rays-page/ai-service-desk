export default function AppLoading() {
  return (
    <div className="space-y-4 px-5 py-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded-md bg-line" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-lg border border-line bg-white/70" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-line bg-white/70" />
    </div>
  );
}
