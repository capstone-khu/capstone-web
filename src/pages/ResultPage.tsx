import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { AppHeader } from '@/components/AppHeader';
import { ChevronLeftIcon } from '@/components/icons';
import { BarView, LaneGutter } from '@/components/sheet/BarView';
import { AREA_KO, AREA_TEXT, AREA_DOT } from '@/lib/area';
import { type Mark, getSessionDetail } from '@/api/session'
import { type Pitch } from '@/api/songs/song.type';
import { useSessionResult } from '@/hooks/useSessionResult';
import Loading from '@/components/ui/loading';
import { useSongScore } from '@/hooks/play/useSongScore';



const BARS_PER_ROW = 6;
const ROWS_PER_PAGE = 2; // 두 줄 = 한 페이지

interface IMarking {
  domain: string;
  action_id: string;
  feedback: string;
}

interface IMeasureDetail {
  measure_index: number;
  notes: {
    pitch: string;
    duration: string;
    position: number;
    lyric: string;
  }[];
  current_markings: IMarking[];
  previous_markings: IMarking[];
}

export default function ResultPage() {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [measureDetail, setMeasureDetail] = useState<IMeasureDetail | null >(null);

  // 세션 결과 데이터 
  const {
    sessionResult,
    loading: resultLoading,
    error,
  } = useSessionResult(Number(session_id)); 

  // 해당 곡 악보 조회 데이터
  const {
    song, 
    loading: songLoading
  } = useSongScore(sessionResult?.song_id?.toString())

  const bars = useMemo(() => {
    if (!song) return [];
    return song.measures.map((m) => m.notes.map((n) => n.pitch as Pitch));
  }, [song]);

  const lyrics = useMemo(() => {
    if (!song) return [];
    return song.measures.map((m) => m.notes.map((n) => n.lyric));
  }, [song]);

  const durations = useMemo(() => {
    if (!song) return [];
    return song.measures.map((m) => m.notes.map((n) => n.duration));
  }, [song]);

  
  const totalRows = Math.ceil(bars.length / BARS_PER_ROW);
  const resultPages = Math.ceil(totalRows / ROWS_PER_PAGE);

  const currentMarks = useMemo(() => {
    if (!sessionResult) return new Map();
    const map = new Map<number, Mark[]>();

    sessionResult.measures.forEach((measure) => {
      map.set(
        measure.measure_index - 1,
        measure.current.map((item) => ({
          area: item.domain as Mark['area'],
          message: item.feedback,
        }))
      );
    });

    return map;
  }, [sessionResult]);
  

  const previousMarks = useMemo(() => {
    if (!sessionResult) return new Map();
    const map = new Map<number, Mark[]>();

    sessionResult.measures.forEach((measure) => {
      map.set(
        measure.measure_index - 1,
        measure.previous.map((item) => ({
          area: item.domain as Mark['area'],
          message: item.feedback,
        }))
      );
    });

    return map;
  }, [sessionResult]);

  if (resultLoading || songLoading) return <Loading />;

  if (error) {
    return <div>결과를 불러올 수 없습니다.</div>;
  }

  if (!sessionResult) {
    return <div>결과가 없습니다.</div>;
  }


  // 이전 세션 기록이 하나라도 있으면 히스토리 열람 모드로 간주
  const isHistory = sessionResult.measures.some((m) => m.previous.length > 0);

  const goCoach = () =>  navigate(`/coach/${session_id}`);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onBack={() => navigate('/mypage')} // navigate(-1)
        title={
          <>
            결과 · {sessionResult.song_title}
            {sessionResult.mode === 'duet' && (
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background">
                협주 · {sessionResult.partner_name}
              </span>
            )}
          </>
        }
        right={
          <>
            <Button size="sm" variant="outline" onClick={() => navigate(isHistory ? '/mypage' : '/')}>
              {isHistory ? '목록으로' : '홈으로'}
            </Button>
            <Button size="sm" onClick={goCoach}>
              AI 상세 분석
            </Button>
          </>
        }
      />

      <main className="container max-w-5xl space-y-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{isHistory ? '잘못 연주한 부분을 개선해보세요!' : '이번 연주 누적 마킹'}</CardTitle>
            <CardDescription>
              {isHistory
                ? '이 연주에서 피드백 받은 부분입니다. 마디를 클릭하면 어떤 부분이 문제였는지 자세히 볼 수 있습니다.'
                : '이번 연주는 보관함에 자동 저장되었습니다. 마디를 클릭하면 어떤 부분이 문제였는지 자세히 볼 수 있습니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Legend />
            <div className="space-y-4">
              {Array.from({ length: ROWS_PER_PAGE }).map((_, r) => {
                const row = page * ROWS_PER_PAGE + r;
                if (row >= totalRows) return null;
                return (
                  <div key={row} className="flex items-start gap-2">
                    <LaneGutter staffSpacerClassName="h-16" className="pt-1" />
                    <div className="grid min-w-0 flex-1 grid-cols-6 gap-2">
                      {bars.slice(row * BARS_PER_ROW, (row + 1) * BARS_PER_ROW).map((_, i) => {
                        const barIndex = row * BARS_PER_ROW + i;
                        return (
                          <button
                            key={barIndex}
                            type="button"
                            onClick={async () => {
                              setSelectedBar(barIndex);
                              const res = await getSessionDetail(Number(session_id), barIndex+1);
                              if(res.success) {
                                console.log(res.data);
                                setMeasureDetail(res.data);
                              }
                              else alert(res.message);
                            }}
                            className="block w-full rounded-md p-1 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`마디 ${barIndex + 1} 자세히 보기`}
                          >
                            <BarView
                              barIndex={barIndex}
                              notes={
                                barIndex === selectedBar && measureDetail
                                  ? measureDetail.notes.map((n) => n.pitch as Pitch)
                                  : bars[barIndex]
                              }
                              previousMarks={
                                barIndex === selectedBar && measureDetail
                                  ? measureDetail.previous_markings.map((m) => ({
                                      area: m.domain as Mark['area'],
                                      message: m.feedback,
                                    }))
                                  : previousMarks.get(barIndex) ?? []
                              }
                              currentMarks={
                                barIndex === selectedBar && measureDetail
                                  ? measureDetail.current_markings.map((m) => ({
                                      area: m.domain as Mark['area'],
                                      message: m.feedback,
                                    }))
                                  : currentMarks.get(barIndex) ?? []
                              }
                              lyrics={
                                barIndex === selectedBar && measureDetail
                                  ? measureDetail.notes.map((n) => n.lyric)
                                  : lyrics[barIndex]
                              }
                              staffClassName="h-16"
                              duration={
                                barIndex === selectedBar && measureDetail
                                  ? measureDetail.notes.map((n) => n.duration)
                                  : durations[barIndex]
                              }
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <PageNav page={page} total={resultPages} onChange={setPage} />
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" size="lg" onClick={() => navigate(isHistory ? '/mypage' : '/')}>
            {isHistory ? '목록으로' : '홈으로'}
          </Button>
          <Button size="lg" onClick={goCoach}>
            AI 상세 분석
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
            bars={bars}
            lyrics={lyrics}
            durations={durations}
          />
        )}
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function PageNav({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        size="sm"
        variant="ghost"
        className="gap-1"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        이전
      </Button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`${i + 1}페이지`}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === page ? 'bg-foreground' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          />
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="gap-1"
        onClick={() => onChange(page + 1)}
        disabled={page === total - 1}
      >
        다음
        <ChevronLeftIcon className="h-4 w-4 rotate-180" />
      </Button>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-3.5 rounded-sm border-2 border-pitch bg-background" />
        <span className="inline-block h-2.5 w-3.5 rounded-sm border-2 border-rhythm bg-background" />
        <span className="inline-block h-2.5 w-3.5 rounded-sm border-2 border-posture bg-background" />
        <span>이전 세션 (외곽선)</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-3.5 rounded-sm bg-pitch" />
        <span className="inline-block h-2.5 w-3.5 rounded-sm bg-rhythm" />
        <span className="inline-block h-2.5 w-3.5 rounded-sm bg-posture" />
        <span>이번 세션 (채움)</span>
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
  bars,
  lyrics,
  durations,
}: {
  barIndex: number;
  currentBarMarks: Mark[];
  previousBarMarks: Mark[];
  bars: Pitch[][];
  lyrics: string[][];
  durations: string[][];
}) {
  const notes = bars[barIndex];

  return (
    <div className="space-y-5 p-6">
      {/* 큰 BarView */}
      <div className="mx-auto w-full max-w-[260px]">
        <BarView
          barIndex={barIndex}
          notes={notes}
          previousMarks={previousBarMarks}
          currentMarks={currentBarMarks}
          lyrics={lyrics[barIndex]}
          duration={durations[barIndex]}
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
  const dim = layer === 'previous' ? 'opacity-60' : '';
  return (
    <div className="rounded-xl border border-border px-3.5 py-2.5">
      <div className={`flex items-center gap-2.5 ${dim}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${AREA_DOT[mark.area]}`} />
        <span className={`text-sm font-bold ${AREA_TEXT[mark.area]}`}>{AREA_KO[mark.area]}</span>
      </div>
      {mark.message && <p className="mt-1.5 text-sm text-muted-foreground">{mark.message}</p>}
    </div>
  );
}
