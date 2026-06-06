export function PrepLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <div className="flex gap-2">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-3 w-3 animate-bounce rounded-full bg-foreground"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">연주 준비 중…</p>
    </div>
  );
}
