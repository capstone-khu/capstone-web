import { PITCH_Y, type Bar as BarType } from '@/data/song';
import { markClass, type Area, type Mark } from '@/data/session';

type Props = {
  barIndex: number;
  notes: BarType;
  isCurrent?: boolean;
  progress?: number; // 0~1, 현재 마디 안에서 플레이헤드 위치
  previousMarks: Mark[];
  currentMarks: Mark[];
  lyrics?: string[]; // 마디당 음절 4개 (가사 표시 시)
};

const noteX = (i: number) => 16 + i * 24;

export function BarView({
  notes,
  isCurrent = false,
  progress = 0,
  previousMarks,
  currentMarks,
  lyrics,
}: Props) {
  const playheadX = 8 + progress * 100;

  return (
    <div className="space-y-1">
      <div
        className={`rounded-md border bg-background transition-colors ${
          isCurrent ? 'border-foreground' : 'border-border'
        }`}
      >
        <svg viewBox="0 0 116 60" className="block h-auto w-full">
          {[15, 22, 29, 36, 43].map((y) => (
            <line
              key={y}
              x1="8"
              y1={y}
              x2="108"
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
            />
          ))}
          <line x1="8" y1="15" x2="8" y2="43" stroke="hsl(var(--border))" strokeWidth="0.5" />
          <line x1="108" y1="15" x2="108" y2="43" stroke="hsl(var(--border))" strokeWidth="0.5" />

          {notes.map((p, i) => (
            <g key={i}>
              {p === 'C4' && (
                <line
                  x1={noteX(i) - 5}
                  y1="50"
                  x2={noteX(i) + 5}
                  y2="50"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="0.8"
                />
              )}
              <ellipse
                cx={noteX(i)}
                cy={PITCH_Y[p]}
                rx="3.6"
                ry="2.8"
                fill="hsl(var(--foreground))"
                transform={`rotate(-20 ${noteX(i)} ${PITCH_Y[p]})`}
              />
              <line
                x1={noteX(i) + 3.4}
                y1={PITCH_Y[p] - 1}
                x2={noteX(i) + 3.4}
                y2={PITCH_Y[p] - 16}
                stroke="hsl(var(--foreground))"
                strokeWidth="0.8"
              />
            </g>
          ))}

          {isCurrent && (
            <line
              x1={playheadX}
              y1="10"
              x2={playheadX}
              y2="48"
              stroke="hsl(var(--foreground))"
              strokeWidth="1.5"
              opacity="0.85"
            />
          )}
        </svg>
      </div>

      <MarkRow area="pitch" previous={previousMarks} current={currentMarks} />
      <MarkRow area="rhythm" previous={previousMarks} current={currentMarks} />
      <MarkRow area="posture" previous={previousMarks} current={currentMarks} />

      {lyrics && (
        <div className="flex justify-around px-1.5 pt-1 text-sm font-semibold tracking-tight">
          {lyrics.map((syl, i) => {
            const isHighlighted = isCurrent && i < progress * lyrics.length;
            return (
              <span
                key={i}
                className={`transition-colors duration-150 ${
                  isHighlighted ? 'text-foreground' : 'text-muted-foreground/70'
                }`}
              >
                {syl}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MarkRow({
  area,
  previous,
  current,
}: {
  area: Area;
  previous: Mark[];
  current: Mark[];
}) {
  const curr = current.find((m) => m.area === area);
  const prev = previous.find((m) => m.area === area);
  if (curr) {
    return <div className={`h-1.5 rounded-sm ${markClass(area, curr.severity, 'current')}`} />;
  }
  if (prev) {
    return <div className={`h-1.5 rounded-sm ${markClass(area, prev.severity, 'previous')}`} />;
  }
  return <div className="h-1.5 rounded-sm bg-transparent" />;
}
