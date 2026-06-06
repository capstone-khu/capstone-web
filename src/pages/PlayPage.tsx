import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { BarView, LaneGutter } from '@/components/sheet/BarView';
import { CheckIcon, HistoryIcon } from '@/components/icons';
import { AppHeader } from '@/components/AppHeader';
import {
  FEEDBACK_SEQUENCE,
  currentMarksUpToWindow,
  previousCautionsForWindow,
  previousMarksByBar,
  type Caution,
  type Feedback,
  type Mark,
} from '@/data/session';
import { type Area, AREA_KO, AREA_DOT, AREA_ICON, AREA_BG_LIGHT } from '@/lib/area';
import { scheduleMetronome } from '@/lib/audio';
import { usePlaySession, type PlayMode } from '@/store/usePlaySession';
import { getRecording, type Recording } from '@/data/recordings';
import Loading from '@/components/ui/loading';
import { useSongScore } from '@/hooks/play/useSongScore';
import { beatsPerBar, toBars, toLyrics } from '@/lib/utils';
import { useMediaPermission } from '@/hooks/play/useMediaPermission';
import { usePlayProgress } from '@/hooks/play/usePlayProgress';
import { type ScoreData, type Pitch } from '@/api/songs/song.type';

export default function PlayPage() {
  const { id } = useParams();
  // 선택한 곡 정보 조회
  const { song, loading } = useSongScore(id);
  if (loading || !song ) return <Loading />;

  return <PlayPageInner song={song} />;
}

function PlayPageInner({ song }: { song: ScoreData }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const navigate = useNavigate();
  const { stream, error, requesting, stage, requestPermission, cleanup } = useMediaPermission();

  const focusBars = usePlaySession((s) => s.focusBars);
  const activeFocusBar = focusBars.length > 0 ? (focusBars[focusIdx] ?? 0) : null;

  const progress = usePlayProgress({ data: song, focusBar: activeFocusBar });

  const mode = usePlaySession((s) => s.mode);
  const recordingId = usePlaySession((s) => s.recordingId);
  const skipPermission = usePlaySession((s) => s.skipPermission);
  const recording = getRecording(recordingId);
  const session_id = usePlaySession((state) => state.session_id);
 

  // "다시 연주"로 들어온 경우 권한 화면을 건너뛰고 바로 연주 준비(전주)로 진입
  useEffect(() => {
    if (skipPermission) requestPermission();
  }, [skipPermission, requestPermission]);

  const handleFinish = () => { cleanup(); navigate('/result'); };
  const handleExit   = () => { cleanup(); navigate('/');       };

  if (stage === 'permission') {
    // 다시 연주로 진입했고 아직 에러가 없으면 권한 카드 대신 간단한 준비 로더 노출
    if (skipPermission && !error) return <PrepLoader />;
    return (
      <PermissionView
        requesting={requesting}
        error={error}
        onStart={requestPermission}
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <PlayingView
      key={`play-${activeFocusBar ?? 'normal'}`}
      progress={progress}
      stream={stream}
      mode={mode}
      recording={recording}
      focusBar={activeFocusBar}
      focusBars={focusBars}
      focusIdx={focusIdx}
      onSelectFocusIdx={setFocusIdx}
      onFinish={handleFinish}
      onExit={handleExit}
      // ✅ API 데이터에서 파생한 값을 아래로 전달
      songTitle={song.song.title}
      bars={toBars(song.measures)}
      lyrics={toLyrics(song.measures)}
      bpm={song.song.bpm}
      beatsPerBarCount={beatsPerBar(song.song.time_signature)}
    />
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 다시 연주 진입 시 권한이 이미 허용된 상태 — 잠깐의 준비 로더 */

function PrepLoader() {
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

/* ──────────────────────────────────────────────────────────────── */
/* 1. 권한 요청 단계 */

function PermissionView({
  requesting,
  error,
  onStart,
  onBack,
}: {
  requesting: boolean;
  error: string | null;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-bold">연주 준비</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              연주를 분석하려면 카메라(자세)와 마이크(음정·박자) 권한이 필요합니다.
            </p>
          </div>

          <div className="space-y-3 rounded-xl bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
              <div>
                <p className="text-sm font-semibold">카메라</p>
                <p className="text-xs text-muted-foreground">
                  손목·팔꿈치·손가락 커브·어깨·엄지 자세를 분석합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
              <div>
                <p className="text-sm font-semibold">마이크</p>
                <p className="text-xs text-muted-foreground">
                  음정 정확도와 박자 타이밍을 실시간으로 측정합니다.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-posture/10 p-4">
              <p className="text-sm font-semibold text-foreground">{error}</p>
            </div>
          )}

          <Button size="lg" className="w-full" onClick={onStart} disabled={requesting}>
            {requesting ? '권한 요청 중…' : error ? '다시 시도' : '카메라 · 마이크 권한 요청'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack}>
            뒤로가기
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 2. 전주(메트로놈) 카운트인 — 노래방처럼 악보 카드 '안에서' 박자를 센다. */

const INTRO_BEATS = 8;

/** 전주 메트로놈 오디오 + 박자 카운트 진행. 현재 비트(-1=시작 전)를 반환. */
function useMetronomeIntro(bpm: number, beatsPerBarCount: number, onDone: () => void) {
  const [currentBeat, setCurrentBeat] = useState(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const beatSec = 60 / bpm;
  const totalDuration = INTRO_BEATS * beatSec;

  useEffect(() => {
    const Ctx = window.AudioContext;
    if (!Ctx) {
      onDone();
      return;
    }
    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    ctx.resume().then(() => {
      startTimeRef.current = ctx.currentTime;
      scheduleMetronome(ctx, startTimeRef.current, INTRO_BEATS, bpm, beatsPerBarCount);
    });

    const tick = () => {
      const ac = audioCtxRef.current;
      if (!ac) return;
      const elapsed = ac.currentTime - startTimeRef.current;
      if (elapsed >= totalDuration) {
        onDone();
        return;
      }
      setCurrentBeat(Math.floor(elapsed / beatSec));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.close();
      audioCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return currentBeat;
}

/** 악보 카드 위에 겹쳐지는 카운트인 오버레이 — 큰 박자 숫자 + 8비트 도트. */
function CountInOverlay({
  bpm,
  beatsPerBarCount,
  onDone,
}: {
  bpm: number;
  beatsPerBarCount: number;
  onDone: () => void;
}) {
  const currentBeat = useMetronomeIntro(bpm, beatsPerBarCount, onDone);
  const beatInBar = currentBeat < 0 ? 1 : (currentBeat % beatsPerBarCount) + 1;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-2xl bg-card/85 backdrop-blur-[2px]">
      <p className="text-sm font-bold text-muted-foreground">곧 연주가 시작됩니다</p>

      {/* 큰 박자 카운터 (1→2→3→4 반복) */}
      <p
        key={currentBeat}
        className="animate-press tabular text-8xl font-bold leading-none tracking-tight"
      >
        {beatInBar}
      </p>

      {/* 8비트 도트 인디케이터 */}
      <div className="flex items-center gap-3">
        {Array.from({ length: INTRO_BEATS }).map((_, i) => {
          const isAccent = i % beatsPerBarCount === 0;
          const isActive = i === currentBeat;
          const isPast = i < currentBeat;
          const sizeCls = isAccent ? 'h-3.5 w-3.5' : 'h-2 w-2';
          const colorCls = isActive
            ? 'bg-foreground scale-150'
            : isPast
              ? 'bg-gray-400'
              : 'bg-gray-200';
          return (
            <span
              key={i}
              className={`rounded-full transition-all duration-150 ${sizeCls} ${colorCls}`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 3. 연주 단계 — 좌측 영상(메인) / 우측 악보(메인), 그 아래 피드백 + 상태 */

function PlayingView({
  stream,
  progress,
  mode,
  recording,
  focusBar,
  focusBars,
  focusIdx,
  onSelectFocusIdx,
  onFinish,
  onExit,
  songTitle,
  bars,
  lyrics,
  bpm,
  beatsPerBarCount,
}: {
  stream: MediaStream | null;
  progress: ReturnType<typeof usePlayProgress>;
  mode: PlayMode;
  recording: Recording | null;
  focusBar: number | null;
  focusBars: number[];
  focusIdx: number;
  onSelectFocusIdx: (idx: number) => void;
  onFinish: () => void;
  onExit: () => void;
  songTitle: string;
  bars: Pitch[][];
  lyrics: string[][];
  bpm: number;
  beatsPerBarCount: number;
}) {
  const isEnsemble = mode === 'ensemble' && !!recording;
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const {
    elapsed,
    focused,
    isFinished,
    introDone,
    currentBarIndex,
    progressInBar,
    currentWindowIndex,
    focusLoopRound,
    TOTAL_BARS,
    FOCUS_LOOPS,
    pause,
    resume,
    handleIntroDone,
  } = progress;

  const isPlaying = introDone && !isFinished && progress.isPlaying;

  const currentMarks = useMemo(
    () => currentMarksUpToWindow(currentWindowIndex),
    [currentWindowIndex],
  );

  const previousMarks = useMemo(() => previousMarksByBar(), []);

  const currentFeedbacks = useMemo(
    () => FEEDBACK_SEQUENCE[currentWindowIndex] ?? [],
    [currentWindowIndex],
  );

  const previousCautions = useMemo(
    () => previousCautionsForWindow(currentWindowIndex),
    [currentWindowIndex],
  );

  const isPostureAlert = useMemo(
    () =>
      currentFeedbacks.some(
        (fb) => fb.tone === 'normal' && fb.area === 'posture',
      ),
    [currentFeedbacks],
  );

  const handleBack = () => {
    if (isFinished || focused) {
      onExit();
      return;
    }
    pause();
    setShowExitConfirm(true);
    return;
  };

  const handleTogglePlay = () => {
    if (progress.isPlaying) pause();
    else resume();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onBack={handleBack}
        title={
          focused && focusBar !== null ? (
            <>마디 {focusBar + 1} 집중 반복</>
          ) : (
            <>
              {songTitle}
              {isEnsemble && (
                <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-[11px] text-background">
                  협주 · {recording.playerName}
                </span>
              )}
            </>
          )
        }
        right={
          <>
            <p className="tabular text-sm font-semibold">
              {focused
                ? `반복 ${focusLoopRound}/${FOCUS_LOOPS}회`
                : `마디 ${Math.min(currentBarIndex + 1, TOTAL_BARS)}/${TOTAL_BARS}`}
            </p>

            {isPlaying && (
              <Button size="sm" variant="outline" onClick={handleTogglePlay}>
                일시정지
              </Button>
            )}

            {!progress.isPlaying && introDone && !isFinished && (
              <Button size="sm" onClick={resume}>
                재개
              </Button>
            )}
          </>
        }
      />

      <main className="container max-w-7xl space-y-4 py-6">
        {focusBars.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {focusBars.map((b, i) => (
              <button
                key={b}
                type="button"
                onClick={() => onSelectFocusIdx(i)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
                  i === focusIdx
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                마디 {b + 1}
              </button>
            ))}
          </div>
        )}

        <div className="grid items-stretch gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CameraStage stream={stream} alertPosture={isPostureAlert} />

            {isEnsemble && (
              <PartnerAudioBar
                name={recording.playerName}
                progress={elapsed / progress.TOTAL_DURATION}
                playing={progress.isPlaying && introDone && !isFinished}
              />
            )}
          </div>

          <div className="lg:col-span-3">
            <SheetStage
              currentBarIndex={currentBarIndex}
              progressInBar={progressInBar}
              currentMarks={currentMarks}
              previousMarks={previousMarks}
              isFinished={isFinished}
              introActive={!introDone}
              onIntroDone={handleIntroDone}
              focusBar={focusBar}
              // ✅ API 파생 데이터 전달
              bars={bars}
              lyrics={lyrics}
              bpm={bpm}
              beatsPerBarCount={beatsPerBarCount}
            />
          </div>
        </div>

        {focused && focusBar !== null ? (
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm font-semibold">
                자주 흔들렸던 마디 {focusBar + 1}이에요. 천천히 반복해보세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="flex items-stretch gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <PreviousCaution cautions={previousCautions} />
              <FeedbackCaption tone="previous" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <CurrentFeedback
                feedbacks={currentFeedbacks}
                barIndex={currentWindowIndex}
              />
              <FeedbackCaption tone="current" />
            </div>
          </section>
        )}

        {isFinished && (
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-lg font-bold">
                  {focused ? '집중 연습을 마쳤어요' : '연주가 끝났습니다'}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {focused
                    ? '이 구간을 충분히 반복했어요.'
                    : isEnsemble
                      ? '협주 영상이 저장되었습니다.'
                      : '연주가 저장되었습니다.'}
                </p>
              </div>

              <div className="flex gap-3">
                {focused ? (
                  <>
                    <Button variant="outline" size="lg" onClick={onExit}>
                      돌아가기
                    </Button>

                    {focusIdx < focusBars.length - 1 ? (
                      <Button
                        size="lg"
                        onClick={() => onSelectFocusIdx(focusIdx + 1)}
                      >
                        다음 마디
                      </Button>
                    ) : (
                      <Button size="lg" onClick={progress.restart}>
                        다시 연습
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="lg" onClick={onExit}>
                      홈으로
                    </Button>
                    <Button size="lg" onClick={onFinish}>
                      결과 보기
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Modal
        open={showExitConfirm}
        onClose={() => {
          setShowExitConfirm(false)
        }}
        title="연주를 종료할까요?"
      >
        <div className="space-y-5 p-6">
          <p className="text-sm text-muted-foreground">
            종료하면 저장되지 않고 홈으로 돌아갑니다.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
              계속하기
            </Button>
            <Button onClick={onExit}>종료하기</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 메인 영상 카드 — 악보와 동등 비중 */

function CameraStage({
  stream,
  alertPosture = false,
  duet = false,
}: {
  stream: MediaStream | null;
  alertPosture?: boolean;
  /** 협주 좌우 이분할 모드 — 컬럼 높이를 채우고 푸터를 숨긴다. */
  duet?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-card transition-all duration-200 ${
        duet ? 'h-full' : ''
      } ${
        alertPosture
          ? 'border-posture shadow-[0_0_0_4px_hsl(var(--posture)/0.25)]'
          : 'border-border shadow-card'
      }`}
    >
      <div className={`relative bg-foreground ${duet ? 'min-h-0 flex-1' : 'aspect-video'}`}>
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-background/60">
            카메라 미연결
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-foreground/55 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-posture" />
          LIVE
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-foreground/55 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          나
        </div>
      </div>
      {!duet && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-bold">연주 자세</p>
          <p className="text-xs text-muted-foreground">좋은 연주는 바른 자세에서 시작돼요</p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 협주 상대 음원 — 상대 녹화 영상은 띄우지 않고(연주 종료 후 좌우 합성 협주 영상으로),
   음원 재생 상태와 진행만 표시한다. */

function PartnerAudioBar({
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

/* ──────────────────────────────────────────────────────────────── */
/* 메인 악보 카드 */

function SheetStage({
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
}) {
  // 집중 모드 — 틀린 그 한 마디만 크게 보여준다.
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
              />
            </div>
          </div>
        </div>
        {introActive && <CountInOverlay bpm={bpm} beatsPerBarCount={beatsPerBarCount} onDone={onIntroDone} />}
      </div>
    );
  }

  // 4마디 × 1줄 = 4마디/페이지. 한 줄에 마디를 적게 둬 음표를 키운다.
  const BARS_PER_ROW = 4;
  const ROWS_PER_PAGE = 1;
  const BARS_PER_PAGE = BARS_PER_ROW * ROWS_PER_PAGE;
  const TOTAL_PAGES   = Math.ceil(bars.length / BARS_PER_PAGE);  
  const pageIndex = Math.min(Math.floor(currentBarIndex / BARS_PER_PAGE), TOTAL_PAGES - 1);
  const pageStart = pageIndex * BARS_PER_PAGE;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-bold">악보</p>
        <div className="flex items-center gap-2.5">
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

/* ──────────────────────────────────────────────────────────────── */



/** 영역 배지 — 아이콘 + 영역 이름 (음정/박자/자세) */
function AreaBadge({ area }: { area: Area }) {
  const Icon = AREA_ICON[area];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-background ${AREA_DOT[area]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {AREA_KO[area]}
    </span>
  );
}

const FEEDBACK_BASE =
  'animate-feedback-in flex min-h-[110px] min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl px-5 py-4 text-center';

/**
 * 현재 라이브 피드백 — 한 윈도우에서 동시에 여러 영역 지적이 올 수 있다.
 * 영역별 블록(배지 + 메시지)을 한 카드에 쌓아 '동시 다중 영역'을 한눈에 보여준다.
 */
function CurrentFeedback({ feedbacks, barIndex }: { feedbacks: Feedback[]; barIndex: number }) {
  // 분석 부족(빈 윈도우)
  if (feedbacks.length === 0) {
    return (
      <div
        key={`empty-${barIndex}`}
        className="animate-feedback-in flex min-h-[110px] min-w-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-background px-5 text-sm text-muted-foreground"
      >
        다음 마디의 피드백을 분석 중…
      </div>
    );
  }

  // 칭찬 — 영역색 없는 '보상' 모드 (체크 + 중립 카드)
  if (feedbacks.length === 1 && feedbacks[0].tone === 'positive') {
    return (
      <div
        key={`fb-${barIndex}`}
        className={`${FEEDBACK_BASE} border border-border bg-card shadow-soft`}
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs font-bold text-background">
          <CheckIcon className="h-3.5 w-3.5" />
          칭찬
        </span>
        <p className="text-xl font-bold leading-snug tracking-tight">{feedbacks[0].message}</p>
      </div>
    );
  }

  // 슈퍼바이저 코칭(폴백) — 영역색·영역 배지 없는 중립 카드.
  if (feedbacks.length === 1 && feedbacks[0].tone === 'supervisor') {
    return (
      <div key={`fb-${barIndex}`} className={`${FEEDBACK_BASE} border border-border bg-muted/50`}>
        <span className="inline-flex items-center gap-1 rounded-md bg-foreground/80 px-2 py-1 text-xs font-bold text-background">
          코치
        </span>
        <p className="text-lg font-bold leading-snug tracking-tight">{feedbacks[0].message}</p>
      </div>
    );
  }

  // 지적 1개 이상 — 영역별 블록을 한 카드에 쌓는다. 더 막힌(reward 낮은) 영역을 먼저.
  const issues = feedbacks
    .filter((fb): fb is Extract<Feedback, { tone: 'normal' }> => fb.tone === 'normal')
    .sort((a, b) => (a.reward ?? 0) - (b.reward ?? 0));
  const multi = issues.length > 1;
  // 다중이면 한 영역색으로 칠할 수 없으니 중립 카드, 단일이면 영역 틴트.
  const bg = multi ? 'border border-border bg-card shadow-soft' : AREA_BG_LIGHT[issues[0].area];
  return (
    <div key={`fb-${barIndex}`} className={`${FEEDBACK_BASE} ${bg}`}>
      {issues.map((fb, i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1.5 ${
            i > 0 ? 'w-full border-t border-border/60 pt-3' : ''
          }`}
        >
          <AreaBadge area={fb.area} />
          <p
            className={`font-bold leading-snug tracking-tight ${multi ? 'text-base' : 'text-xl'}`}
          >
            {fb.message}
          </p>
        </div>
      ))}
    </div>
  );
}

/** 블록 밑 캡션 — 이 블록이 지난/현재 연주 피드백임을 안내. */
function FeedbackCaption({ tone }: { tone: 'previous' | 'current' }) {
  if (tone === 'previous') {
    return (
      <p className="flex items-center justify-center gap-1 text-center text-sm font-bold text-muted-foreground">
        <HistoryIcon className="h-4 w-4" />
        지난 연주 피드백이에요!
      </p>
    );
  }
  return <p className="text-center text-sm font-bold text-foreground">현재 연주 피드백이에요!</p>;
}

/**
 * 지난 연주 피드백 — 라이브 피드백보다 조용하게(ghost·점선). 블록 안은 현재 피드백과
 * 동일하게 중앙정렬(배지 + 메시지). 여러 마킹은 한 카드에 묶어 과밀을 막는다.
 */
function PreviousCaution({ cautions }: { cautions: Caution[] }) {
  // 위치 고정 — 비어도 자리를 지키고 '없음'을 명시.
  if (cautions.length === 0) {
    return (
      <div className="flex min-h-[110px] min-w-0 flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40 px-5 text-center text-sm text-muted-foreground">
        이 구간은 지난 연주에 받은 피드백이 없어요
      </div>
    );
  }
  // 현재 피드백과 글씨 크기 규칙 통일 — 다중이면 text-base, 단일이면 text-xl.
  const multi = cautions.length > 1;
  return (
    <div className="animate-feedback-in flex min-h-[110px] min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-4 text-center">
      {cautions.map((c, i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1.5 ${
            i > 0 ? 'w-full border-t border-border/60 pt-3' : ''
          }`}
        >
          <AreaBadge area={c.area} />
          <p
            className={`font-bold leading-snug tracking-tight text-muted-foreground ${
              multi ? 'text-base' : 'text-xl'
            }`}
          >
            {c.message}
          </p>
        </div>
      ))}
    </div>
  );
}

