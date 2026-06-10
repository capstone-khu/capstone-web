import type { CSSProperties } from 'react';
import { PITCH_Y, type Bar as BarType, type Pitch } from '@/api/songs/song.type';
import { markBorderClass, markClass, type Mark } from '@/lib/playFeedback';
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
  duration?: string[]; 
};

// 4음표 기준 균등 배치: 18, 42, 66, 90 (viewBox 116 기준)
const NOTE_X = [18, 42, 66, 90] as const;
const noteX = (i: number) => NOTE_X[i] ?? 18 + i * 24;
const NOTE_Y_OFFSET = 3.5; 

export function BarView({
  notes,
  isCurrent = false,
  progress = 0,
  previousMarks,
  currentMarks,
  lyrics,
  staffClassName = 'h-auto',
  duration=[],
}: Props) {
  const playheadX = 8 + progress * 100;
  const activeNote = Math.min(
    Math.floor(progress * notes.length),
    notes.length - 1
  );

  const LYRICS_SLOT = 4;
  const normalizedLyrics = Array.from({ length: LYRICS_SLOT }, (_, i) => 
    lyrics?.[i] ?? ''
  )

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
            // PITCH_Y에 없는 pitch 방어
            const y = PITCH_Y[p as Pitch];
            if (y === undefined) return null;
            
            const isActive = isCurrent && i === activeNote;
            const isHalfNote = duration[i] === 'half';

            const noteColor = isActive
              ? '#ffda03'
              : 'hsl(var(--foreground))';

            return (
              // 가선 
              <g key={i}>
                {y >= 46 && ( // D4(46.5)·C4(50) 모두 가선 표시
                  <line
                    x1={noteX(i) - (isActive ? 7 : 5)}
                    y1={y + NOTE_Y_OFFSET}
                    x2={noteX(i) + (isActive ? 7 : 5)}
                    y2={y + NOTE_Y_OFFSET}
                    stroke={noteColor}
                    strokeWidth="1"
                  />
                )}

                {/* 음표 */}
                {isHalfNote ? (
                  <ellipse
                    cx={noteX(i)}
                    cy={PITCH_Y[p] + NOTE_Y_OFFSET}
                    rx={isActive ? 4.8 : 3.6}
                    ry={isActive ? 3.8 : 2.8}
                    fill="none"
                    stroke={noteColor}
                    strokeWidth="1.5"
                  />
                ) : (
                  <ellipse
                  cx={noteX(i)}
                  cy={PITCH_Y[p] + NOTE_Y_OFFSET}
                  rx={isActive ? 4.8 : 3.6}
                  ry={isActive ? 3.8 : 2.8}
                  fill={noteColor}
                  transform={`rotate(-20 ${noteX(i)} ${PITCH_Y[p] + NOTE_Y_OFFSET})`}
                  style={{
                    transition: 'fill 120ms ease, rx 120ms ease, ry 120ms ease',
                  }}
                />
                )}
                

                {/* 꼬리 */}
                <line
                  x1={noteX(i) + (isActive ? 4.7 : 3.3)}
                  y1={PITCH_Y[p] + NOTE_Y_OFFSET}
                  x2={noteX(i) + (isActive ? 4.7 : 3.3)}
                  y2={PITCH_Y[p] + NOTE_Y_OFFSET- 17}
                  stroke={noteColor}
                  strokeWidth={isActive ? '1.4' : '1.2'}
                  style={{
                    transition: 'stroke 120ms ease rx 120ms ease, ry 120ms ease',
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
          {normalizedLyrics.map((syl, i) => {
            const isHighlighted = isCurrent && i < progress * LYRICS_SLOT;
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

  const isRainbow = curr?.supervisor === true;

  let barClass: string;
  let style: CSSProperties | undefined;
  if (isRainbow) {
    barClass = prev ? markBorderClass(area) : '';
    style = { background: 'linear-gradient(90deg, #f87171, #fb923c, #facc15, #4ade80, #60a5fa, #a78bfa)' };
  } else if (curr && prev) {
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
      <div className={`h-2.5 w-full rounded-sm ${barClass}`} style={style} />
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
