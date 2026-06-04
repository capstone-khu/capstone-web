import { PITCH_Y, type Bar as BarType } from '@/data/song';
import { markBorderClass, markClass, type Mark } from '@/data/session';
import { type Area, AREA_KO, AREA_DOT } from '@/lib/area';

type Props = {
  barIndex: number;
  notes: BarType;
  isCurrent?: boolean;
  progress?: number; // 0~1, 현재 마디 안에서 플레이헤드 위치
  previousMarks: Mark[];
  currentMarks: Mark[];
  lyrics?: string[]; // 마디당 음절 4개 (가사 표시 시)
  staffClassName?: string; // 악보 SVG 높이 — 거터 정렬이 필요한 그리드에선 'h-16' 고정
};

const noteX = (i: number) => 16 + i * 24;

export function BarView({
  notes,
  isCurrent = false,
  progress = 0,
  previousMarks,
  currentMarks,
  lyrics,
  staffClassName = 'h-auto',
}: Props) {
  const playheadX = 8 + progress * 100;
  const activeNote = Math.min(
    Math.floor(progress * notes.length),
    notes.length - 1
  );

  return (
    <div className="space-y-1">
      <div
        className={`rounded-md border bg-background transition-colors ${
          isCurrent ? 'border-foreground' : 'border-border'
        }`}
      >
        <svg
          viewBox="0 0 116 60"
          preserveAspectRatio="xMidYMid meet"
          className={`block w-full ${staffClassName}`}
        >
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

          {notes.map((p, i) => {
            const isActive = isCurrent && i === activeNote;

            const noteColor = isActive
              ? '#ffda03'
              : 'hsl(var(--foreground))';

            return (
              <g key={i}>
                {p === 'C4' && (
                  <line
                    x1={noteX(i) - 5}
                    y1="50"
                    x2={noteX(i) + 5}
                    y2="50"
                    stroke={noteColor}
                    strokeWidth="0.8"
                  />
                )}

                <ellipse
                  cx={noteX(i)}
                  cy={PITCH_Y[p]}
                  rx={isActive ? 4.8 : 3.6}
                  ry={isActive ? 3.8 : 2.8}
                  fill={noteColor}
                  transform={`rotate(-20 ${noteX(i)} ${PITCH_Y[p]})`}
                  style={{
                    transition: 'fill 120ms ease, rx 120ms ease, ry 120ms ease',
                  }}
                />

                <line
                  x1={noteX(i) + 3.4}
                  y1={PITCH_Y[p] - 1}
                  x2={noteX(i) + 3.4}
                  y2={PITCH_Y[p] - 16}
                  stroke={noteColor}
                  strokeWidth={isActive ? '1.2' : '0.8'}
                  style={{
                    transition: 'stroke 120ms ease',
                  }}
                />
              </g>
            );
          })}

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
  // 이번=꽉 참(색칠) / 이전=외곽선(테두리) / 없음(GOOD)=옅은 회색 트랙. '형태'로 시간을 구분.
  // 같은 영역에 둘 다 있으면 현재 색칠 위에 과거 테두리를 덧입혀 둘 다 보이게 한다.
  let barClass: string;
  if (curr && prev) {
    barClass = `${markClass(area, 'current')} ${markBorderClass(area)}`;
  } else if (curr) {
    barClass = markClass(area, 'current');
  } else if (prev) {
    barClass = markClass(area, 'previous');
  } else {
    barClass = 'bg-gray-100';
  }
  return (
    <div className="flex h-4 items-center">
      <div className={`h-2.5 w-full rounded-sm ${barClass}`} />
    </div>
  );
}

/**
 * 악보 줄 왼쪽 거터 — 마킹 3레인(음정/박자/자세)에 이름표를 한 번씩 붙인다.
 * BarView와 동일한 세로 리듬(space-y-1 + 악보 자리 + h-4 레인)을 그대로 복제해
 * 별도 좌표 계산 없이 각 레인과 라벨이 줄을 맞춘다.
 */
export function LaneGutter({
  staffSpacerClassName = 'h-16',
  className = '',
}: {
  staffSpacerClassName?: string;
  className?: string;
}) {
  return (
    <div className={`shrink-0 space-y-1 ${className}`}>
      {/* 악보 박스와 동일한 테두리 박스 모델로 높이를 맞춘 빈 자리 */}
      <div className="rounded-md border border-transparent">
        <div className={`w-full ${staffSpacerClassName}`} />
      </div>
      {(['pitch', 'rhythm', 'posture'] as Area[]).map((area) => (
        <div key={area} className="flex h-4 items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${AREA_DOT[area]}`} />
          <span className="text-[11px] font-semibold leading-none text-muted-foreground">
            {AREA_KO[area]}
          </span>
        </div>
      ))}
    </div>
  );
}
