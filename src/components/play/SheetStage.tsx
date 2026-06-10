import { BarView, LaneGutter } from '@/components/sheet/BarView';
import { type Pitch } from '@/api/songs/song.type';
import { type Mark } from '@/lib/playFeedback';
import { CountInOverlay } from './CountInOverlay';

export function SheetStage({
  currentBarIndex,
  progressInBar,
  currentMarks,
  previousMarks,
  isFinished,
  introActive,
  onIntroDone,
  focusBar,
  bars,
  lyrics,
  bpm,
  beatsPerBarCount,
  duration,
}: {
  currentBarIndex: number;
  progressInBar: number;
  currentMarks: Map<number, Mark[]>;
  previousMarks: Map<number, Mark[]>;
  isFinished: boolean;
  introActive: boolean;
  onIntroDone: () => void;
  focusBar: number | null;
  bars: Pitch[][];
  lyrics: string[][];
  bpm: number;
  beatsPerBarCount: number;
  duration: string[][];
}) {
  if (focusBar != null) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-bold">악보</p>
          <p className="text-xs font-semibold text-muted-foreground">마디 {focusBar + 1}</p>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-6">
          <div className="flex w-full max-w-[300px] items-start gap-3">
            <LaneGutter staffSpacerClassName="h-28" />
            <div className="min-w-0 flex-1">
              <BarView
                barIndex={focusBar}
                notes={bars[focusBar]}
                isCurrent={!isFinished}
                progress={isFinished ? 0 : progressInBar}
                previousMarks={previousMarks.get(focusBar) ?? []}
                currentMarks={currentMarks.get(focusBar) ?? []}
                lyrics={lyrics[focusBar]}
                staffClassName="h-28"
                duration={duration[focusBar]}
              />
            </div>
          </div>
        </div>
        {introActive && <CountInOverlay bpm={bpm} beatsPerBarCount={beatsPerBarCount} onDone={onIntroDone} />}
      </div>
    );
  }

  const BARS_PER_ROW = 4;
  const ROWS_PER_PAGE = 1;
  const BARS_PER_PAGE = BARS_PER_ROW * ROWS_PER_PAGE;
  const TOTAL_PAGES = Math.ceil(bars.length / BARS_PER_PAGE);
  const pageIndex = Math.min(Math.floor(currentBarIndex / BARS_PER_PAGE), TOTAL_PAGES - 1);
  const pageStart = pageIndex * BARS_PER_PAGE;
  const verseLabel = currentBarIndex < bars.length / 2 ? '1절' : '2절';

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-bold">악보</p>
        <div className="flex items-center gap-2.5">
          <p className="text-xs font-semibold text-muted-foreground">{verseLabel}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i <= pageIndex ? 'bg-foreground' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        key={pageIndex}
        className="animate-feedback-in flex flex-1 flex-col justify-center gap-6 px-5 py-6"
      >
        {Array.from({ length: ROWS_PER_PAGE }).map((_, r) => {
          const rowStart = pageStart + r * BARS_PER_ROW;
          if (rowStart >= bars.length) return null;
          const rowBars = bars.slice(rowStart, rowStart + BARS_PER_ROW);
          return (
            <div key={r} className="flex w-full items-start gap-3">
              <LaneGutter staffSpacerClassName="h-24" />
              <div className="grid min-w-0 flex-1 grid-cols-4 gap-3">
                {rowBars.map((bar, i) => {
                  const barIndex = rowStart + i;
                  const isCurrent = barIndex === currentBarIndex && !isFinished;
                  return (
                    <BarView
                      key={barIndex}
                      barIndex={barIndex}
                      notes={bar}
                      isCurrent={isCurrent}
                      progress={isCurrent ? progressInBar : 0}
                      previousMarks={previousMarks.get(barIndex) ?? []}
                      currentMarks={currentMarks.get(barIndex) ?? []}
                      lyrics={lyrics[barIndex]}
                      staffClassName="h-24"
                      duration={duration[barIndex]}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {introActive && <CountInOverlay bpm={bpm} beatsPerBarCount={beatsPerBarCount} onDone={onIntroDone} />}
    </div>
  );
}
