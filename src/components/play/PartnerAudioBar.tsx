export function PartnerAudioBar({
  name,
  progress,
  playing,
}: {
  name: string;
  progress: number;
  playing: boolean;
}) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;
  return (
    <div className="mt-3 rounded-2xl border-2 border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-posture' : 'bg-gray-400'}`} />
        <p className="text-sm font-bold">협주 · {name} 음원 재생 중</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-foreground transition-[width] duration-100 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
