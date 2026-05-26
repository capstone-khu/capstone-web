import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { AppHeader } from '@/components/AppHeader';
import { BarView } from '@/components/sheet/BarView';
import { LYRICS, SONG } from '@/data/song';
import {
  ANALYSIS_WINDOW_BARS,
  FEEDBACK_SEQUENCE,
  currentMarksUpToWindow,
  marksFromSummary,
  previousMarksByBar,
  type Area,
  type Feedback,
  type Mark,
  type Severity,
} from '@/data/session';
import { getRecording } from '@/data/recordings';
import { usePlaySession } from '@/store/usePlaySession';

const TOTAL_WINDOWS = Math.ceil(SONG.bars.length / ANALYSIS_WINDOW_BARS);

const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
const SEVERITY_KO: Record<Severity, string> = { mild: '살짝', major: '심각' };
const AREA_DOT: Record<Area, string> = {
  pitch: 'bg-pitch',
  rhythm: 'bg-rhythm',
  posture: 'bg-posture',
};
const AREA_TEXT: Record<Area, string> = {
  pitch: 'text-pitch',
  rhythm: 'text-rhythm',
  posture: 'text-posture',
};

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = usePlaySession((s) => s.mode);
  const recordingId = usePlaySession((s) => s.recordingId);
  const replay = usePlaySession((s) => s.replay);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // 마이페이지 이력에서 진입하면 state.recordingId가 실린다 → '과거 기록' 열람 모드.
  // 연주 직후(/play)에서 오면 state가 없다 → '방금 끝난 연주' 모드.
  const historyId = (location.state as { recordingId?: string } | null)?.recordingId ?? null;
  const historyRec = historyId ? getRecording(historyId) : null;
  const isHistory = !!historyRec;

  // 협주 배지는 방금 끝난 연주에만 (과거 내 기록은 단독 연주).
  const partner = !isHistory && mode === 'ensemble' ? getRecording(recordingId) : null;

  const onReplay = () => {
    replay();
    navigate('/play');
  };

  // 방금 끝난 연주 = 라이브 피드백 시퀀스 그대로. 과거 기록 = 그 기록의 요약으로부터 분포 생성.
  const currentMarks = useMemo(
    () => (historyRec ? marksFromSummary(historyRec.summary) : currentMarksUpToWindow(TOTAL_WINDOWS - 1)),
    [historyRec],
  );
  const previousMarks = useMemo(() => previousMarksByBar(), []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onBack={() => navigate(isHistory ? '/mypage' : '/')}
        title={
          <>
            {isHistory ? `${historyRec.date} 연주 · ${SONG.title}` : `결과 · ${SONG.title}`}
            {partner && (
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background">
                협주 · {partner.playerName}
              </span>
            )}
          </>
        }
        right={
          <>
            <Button size="sm" variant="outline" onClick={() => navigate(isHistory ? '/mypage' : '/')}>
              {isHistory ? '목록으로' : '홈으로'}
            </Button>
            <Button size="sm" onClick={onReplay}>
              다시 연주
            </Button>
          </>
        }
      />

      <main className="container max-w-5xl space-y-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{isHistory ? '연주 마킹' : '이번 연주 누적 마킹'}</CardTitle>
            <CardDescription>
              {isHistory
                ? '이 연주에서 마킹된 부분입니다. 마디를 클릭하면 어떤 부분이 문제였는지 자세히 볼 수 있습니다.'
                : '이번 연주는 보관함에 자동 저장되었습니다. 마디를 클릭하면 어떤 부분이 문제였는지 자세히 볼 수 있습니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Legend />
            <div className="space-y-4">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="grid grid-cols-6 gap-2">
                  {SONG.bars.slice(row * 6, (row + 1) * 6).map((bar, i) => {
                    const barIndex = row * 6 + i;
                    return (
                      <button
                        key={barIndex}
                        type="button"
                        onClick={() => setSelectedBar(barIndex)}
                        className="block w-full rounded-md p-1 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`마디 ${barIndex + 1} 자세히 보기`}
                      >
                        <BarView
                          barIndex={barIndex}
                          notes={bar}
                          previousMarks={previousMarks.get(barIndex) ?? []}
                          currentMarks={currentMarks.get(barIndex) ?? []}
                          lyrics={LYRICS[barIndex]}
                        />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" size="lg" onClick={() => navigate(isHistory ? '/mypage' : '/')}>
            {isHistory ? '목록으로' : '홈으로'}
          </Button>
          <Button size="lg" onClick={onReplay}>
            다시 연주
          </Button>
        </div>
      </main>

      <Modal
        open={selectedBar !== null}
        onClose={() => setSelectedBar(null)}
        title={selectedBar !== null ? `마디 ${selectedBar + 1}` : ''}
      >
        {selectedBar !== null && (
          <BarDetail
            barIndex={selectedBar}
            currentBarMarks={currentMarks.get(selectedBar) ?? []}
            previousBarMarks={previousMarks.get(selectedBar) ?? []}
            feedback={isHistory ? null : (FEEDBACK_SEQUENCE[Math.floor(selectedBar / ANALYSIS_WINDOW_BARS)] ?? null)}
          />
        )}
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2 w-3 rounded-sm bg-pitch/30" />
        <span className="inline-block h-2 w-3 rounded-sm bg-rhythm/30" />
        <span className="inline-block h-2 w-3 rounded-sm bg-posture/30" />
        <span>이전 세션 (가이드)</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2 w-3 rounded-sm bg-pitch" />
        <span className="inline-block h-2 w-3 rounded-sm bg-rhythm" />
        <span className="inline-block h-2 w-3 rounded-sm bg-posture" />
        <span>이번 세션</span>
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 마디 상세 — 모달 내용 */

function BarDetail({
  barIndex,
  currentBarMarks,
  previousBarMarks,
  feedback,
}: {
  barIndex: number;
  currentBarMarks: Mark[];
  previousBarMarks: Mark[];
  /** 라이브 세션 결과에서만 피드백 문구를 함께 보여준다. 과거 기록은 null. */
  feedback: Feedback | null;
}) {
  const notes = SONG.bars[barIndex];

  return (
    <div className="space-y-5 p-6">
      {/* 큰 BarView */}
      <div className="mx-auto w-full max-w-[260px]">
        <BarView
          barIndex={barIndex}
          notes={notes}
          previousMarks={previousBarMarks}
          currentMarks={currentBarMarks}
          lyrics={LYRICS[barIndex]}
        />
      </div>

      {/* 음표 */}
      <div className="rounded-xl bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">음표</p>
        <p className="tabular mt-1 text-base font-bold">{notes.join('  ·  ')}</p>
      </div>

      {/* 이번 세션 */}
      <section className="space-y-2">
        <p className="text-sm font-bold">이번 세션</p>
        {currentBarMarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">문제 없음 (GOOD)</p>
        ) : (
          <ul className="space-y-2">
            {currentBarMarks.map((m, i) => (
              <li key={i}>
                <MarkChip mark={m} />
              </li>
            ))}
          </ul>
        )}

        {feedback && feedback.tone === 'normal' && (
          <FeedbackQuote label={`[${feedback.label}]`} message={feedback.message} />
        )}
        {feedback && feedback.tone === 'switch' && (
          <div className="rounded-xl bg-posture/10 px-4 py-3">
            <p className="text-xs font-bold text-posture">[{feedback.label}]</p>
            <p className="mt-0.5 text-sm font-semibold">{feedback.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">영역 전환 가이드</p>
          </div>
        )}
        {feedback && feedback.tone === 'positive' && (
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold">{feedback.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">칭찬</p>
          </div>
        )}
      </section>

      {/* 이전 세션 */}
      <section className="space-y-2">
        <p className="text-sm font-bold">이전 세션 (참고)</p>
        {previousBarMarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">참고할 이전 마킹 없음</p>
        ) : (
          <ul className="space-y-2">
            {previousBarMarks.map((m, i) => (
              <li key={i}>
                <MarkChip mark={m} layer="previous" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MarkChip({ mark, layer = 'current' }: { mark: Mark; layer?: 'previous' | 'current' }) {
  const opacity = layer === 'previous' ? 'opacity-50' : '';
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
      <div className="flex items-center gap-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${AREA_DOT[mark.area]} ${opacity}`} />
        <span className={`text-sm font-bold ${AREA_TEXT[mark.area]} ${opacity}`}>
          {AREA_KO[mark.area]}
        </span>
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{SEVERITY_KO[mark.severity]}</span>
    </div>
  );
}

function FeedbackQuote({ label, message }: { label: string; message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{message}</p>
    </div>
  );
}
