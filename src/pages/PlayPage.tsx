import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { BarView, LaneGutter } from '@/components/sheet/BarView';
import { CheckIcon, HistoryIcon, PitchIcon, RhythmIcon, UserIcon } from '@/components/icons';
import { AppHeader } from '@/components/AppHeader';
import { LYRICS, SONG } from '@/data/song';
import {
  ANALYSIS_WINDOW_BARS,
  FEEDBACK_SEQUENCE,
  currentMarksUpToWindow,
  previousCautionsForWindow,
  previousMarksByBar,
  type Area,
  type Caution,
  type Feedback,
  type Mark,
} from '@/data/session';
import { scheduleMetronome, scheduleSong } from '@/lib/audio';
import { usePlaySession, type PlayMode } from '@/store/usePlaySession';
import { getRecording, formatDuration, type Recording } from '@/data/recordings';

const BAR_DURATION = (60 / SONG.bpm) * SONG.beatsPerBar;
const WINDOW_DURATION = BAR_DURATION * ANALYSIS_WINDOW_BARS;
const TOTAL_BARS = SONG.bars.length;
const TOTAL_WINDOWS = Math.ceil(TOTAL_BARS / ANALYSIS_WINDOW_BARS);
const TOTAL_DURATION = BAR_DURATION * TOTAL_BARS;

type Stage = 'permission' | 'playing';

export default function PlayPage() {
  const navigate = useNavigate();
  const mode = usePlaySession((s) => s.mode);
  const recordingId = usePlaySession((s) => s.recordingId);
  const skipPermission = usePlaySession((s) => s.skipPermission);
  const recording = getRecording(recordingId);

  const [stage, setStage] = useState<Stage>('permission');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const requestPermissionAndStart = async () => {
    setRequesting(true);
    setPermissionError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setStage('playing');
    } catch {
      setPermissionError(
        '카메라 또는 마이크 권한이 거절되었습니다. 브라우저 주소창의 권한 아이콘에서 허용 후 다시 시도해주세요.',
      );
    } finally {
      setRequesting(false);
    }
  };

  // "다시 연주"로 들어온 경우 권한 화면을 건너뛰고 바로 연주 준비(전주)로 진입
  useEffect(() => {
    if (skipPermission) requestPermissionAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      setStream((current) => {
        current?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, []);

  const handleFinish = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    navigate('/result');
  };

  const handleExit = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    navigate('/');
  };

  if (stage === 'permission') {
    // 다시 연주로 진입했고 아직 에러가 없으면 권한 카드 대신 간단한 준비 로더 노출
    if (skipPermission && !permissionError) return <PrepLoader />;
    return (
      <PermissionView
        requesting={requesting}
        error={permissionError}
        onStart={requestPermissionAndStart}
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <PlayingView
      stream={stream}
      mode={mode}
      recording={recording}
      onFinish={handleFinish}
      onExit={handleExit}
    />
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 다시 연주 진입 시 권한이 이미 허용된 상태 — 잠깐의 준비 로더 */

function PrepLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-foreground" />
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
const INTRO_ACCENT_EVERY = SONG.beatsPerBar; // 4박마다 강박

/** 전주 메트로놈 오디오 + 박자 카운트 진행. 현재 비트(-1=시작 전)를 반환. */
function useMetronomeIntro(onDone: () => void) {
  const [currentBeat, setCurrentBeat] = useState(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const beatSec = 60 / SONG.bpm;
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
      scheduleMetronome(ctx, startTimeRef.current, INTRO_BEATS, SONG.bpm, INTRO_ACCENT_EVERY);
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
function CountInOverlay({ onDone }: { onDone: () => void }) {
  const currentBeat = useMetronomeIntro(onDone);
  const beatInBar = currentBeat < 0 ? 1 : (currentBeat % SONG.beatsPerBar) + 1;

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
          const isAccent = i % INTRO_ACCENT_EVERY === 0;
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
  mode,
  recording,
  onFinish,
  onExit,
}: {
  stream: MediaStream | null;
  mode: PlayMode;
  recording: Recording | null;
  onFinish: () => void;
  onExit: () => void;
}) {
  const isEnsemble = mode === 'ensemble' && !!recording;
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const songStartTimeRef = useRef<number>(0);

  // 전주(메트로놈)가 끝나면 곡 AudioContext를 만들고 스케줄 시작
  const handleIntroDone = () => {
    const Ctx = window.AudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      ctx.resume().then(() => {
        songStartTimeRef.current = ctx.currentTime;
        scheduleSong(ctx, songStartTimeRef.current);
      });
    }
    setIntroDone(true);
  };

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!introDone) return;
    const ctx = audioCtxRef.current;
    if (isFinished || !isPlaying) {
      ctx?.suspend();
      return;
    }
    ctx?.resume();

    const tick = () => {
      const ac = audioCtxRef.current;
      const now = ac ? ac.currentTime - songStartTimeRef.current : 0;
      if (now >= TOTAL_DURATION) {
        setElapsed(TOTAL_DURATION);
        setIsFinished(true);
        return;
      }
      setElapsed(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [introDone, isPlaying, isFinished]);

  const currentBarIndex = Math.min(Math.floor(elapsed / BAR_DURATION), TOTAL_BARS - 1);
  const progressInBar = (elapsed % BAR_DURATION) / BAR_DURATION;

  const currentWindowIndex = Math.min(
    Math.floor(elapsed / WINDOW_DURATION),
    TOTAL_WINDOWS - 1,
  );

  const currentMarks = useMemo(
    () => currentMarksUpToWindow(currentWindowIndex),
    [currentWindowIndex],
  );
  const previousMarks = useMemo(() => previousMarksByBar(), []);

  const currentFeedbacks: Feedback[] = useMemo(
    () => FEEDBACK_SEQUENCE[currentWindowIndex] ?? [],
    [currentWindowIndex],
  );

  const previousCautions = useMemo(
    () => previousCautionsForWindow(currentWindowIndex),
    [currentWindowIndex],
  );

  // 자세 영역이 활성(피드백 area=posture 또는 영역 전환 to=posture)일 때 영상 카드 강조
  const isPostureAlert = useMemo(
    () => currentFeedbacks.some((fb) => fb.tone === 'normal' && fb.area === 'posture'),
    [currentFeedbacks],
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onBack={
          isFinished
            ? onExit
            : () => {
                setIsPlaying(false);
                setShowExitConfirm(true);
              }
        }
        title={
          <>
            {SONG.title}
            {isEnsemble && (
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background">
                협주 · {recording.playerName}
              </span>
            )}
          </>
        }
        right={
          <>
            <p className="tabular text-sm font-semibold">
              마디 {Math.min(currentBarIndex + 1, TOTAL_BARS)}/{TOTAL_BARS}
            </p>
            {introDone && !isFinished && isPlaying && (
              <Button size="sm" variant="outline" onClick={() => setIsPlaying(false)}>
                일시정지
              </Button>
            )}
            {introDone && !isFinished && !isPlaying && (
              <Button size="sm" onClick={() => setIsPlaying(true)}>
                재개
              </Button>
            )}
            {/* 완료 시 액션은 하단 완료 카드로 일원화 (헤더 중복 제거) */}
          </>
        }
      />

      <main className="container max-w-7xl space-y-4 py-6">
        {/* 좌: 영상 2 / 우: 악보 3 비율 — 같은 행, 동일 높이로 stretch */}
        <div className="grid items-stretch gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            {recording && mode === 'ensemble' ? (
              // 협주: 내 카메라 | 상대 영상을 좌우 이분할 (위아래 스택 대신, 솔로와 같은 높이 유지)
              <div className="grid h-full grid-cols-2 gap-3">
                <CameraStage stream={stream} alertPosture={isPostureAlert} duet />
                <PartnerStage
                  recording={recording}
                  progress={elapsed / TOTAL_DURATION}
                  playing={isPlaying && !isFinished && introDone}
                  duet
                />
              </div>
            ) : (
              <CameraStage stream={stream} alertPosture={isPostureAlert} />
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
            />
          </div>
        </div>

        {/* 피드백 — 좌: 지난 연주 / 우: 현재. 50:50 고정(동적 X). 없으면 '없음'을 명시. */}
        <section className="flex items-stretch gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <PreviousCaution key={`caution-${currentWindowIndex}`} cautions={previousCautions} />
            <FeedbackCaption tone="previous" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CurrentFeedback feedbacks={currentFeedbacks} barIndex={currentWindowIndex} />
            <FeedbackCaption tone="current" />
          </div>
        </section>

        {isFinished && (
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-lg font-bold">연주가 끝났습니다</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  이번 연주가 보관함에 자동 저장되었습니다 결과를 확인해주세요
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Button size="lg" variant="outline" onClick={onExit}>
                  홈으로
                </Button>
                <Button size="lg" onClick={onFinish}>
                  결과 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Modal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="연주를 종료할까요?"
      >
        <div className="space-y-5 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            지금 종료하면 이번 연주는 저장되지 않고 처음 화면으로 돌아갑니다.
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
/* 협주 상대 — 선택한 녹음을 함께 재생(듀엣). 실제 미디어 없이 placeholder. */

function PartnerStage({
  recording,
  progress,
  playing,
  duet = false,
}: {
  recording: Recording;
  progress: number;
  playing: boolean;
  /** 협주 좌우 이분할 모드 — 컬럼 높이를 채우고 푸터를 숨긴다. */
  duet?: boolean;
}) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card shadow-card ${duet ? 'h-full' : ''}`}>
      <div className={`relative bg-foreground ${duet ? 'min-h-0 flex-1' : 'aspect-video'}`}>
        {/* placeholder: 녹화 영상 자리 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-background/80">{recording.playerName} 님의 녹화</p>
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-foreground/55 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-posture' : 'bg-gray-400'}`} />
          REC 재생
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-foreground/55 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          {recording.playerName}
        </div>
        {/* 재생 진행바 (내 연주와 동기화) */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-background/20">
          <div
            className="h-full bg-background transition-[width] duration-100 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {!duet && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-bold">{recording.playerName}</p>
          <p className="tabular text-xs text-muted-foreground">
            {recording.songTitle} · {formatDuration(recording.durationSec)}
          </p>
        </div>
      )}
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
}: {
  currentBarIndex: number;
  progressInBar: number;
  currentMarks: Map<number, Mark[]>;
  previousMarks: Map<number, Mark[]>;
  isFinished: boolean;
  introActive: boolean;
  onIntroDone: () => void;
}) {
  // 4마디 × 1줄 = 4마디/페이지. 한 줄에 마디를 적게 둬 음표를 키운다.
  const BARS_PER_ROW = 4;
  const ROWS_PER_PAGE = 1;
  const BARS_PER_PAGE = BARS_PER_ROW * ROWS_PER_PAGE;
  const TOTAL_PAGES = Math.ceil(SONG.bars.length / BARS_PER_PAGE);
  const pageIndex = Math.min(Math.floor(currentBarIndex / BARS_PER_PAGE), TOTAL_PAGES - 1);
  const pageStart = pageIndex * BARS_PER_PAGE;
  const verseLabel = currentBarIndex < SONG.bars.length / 2 ? '1절' : '2절';

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
          if (rowStart >= SONG.bars.length) return null;
          const rowBars = SONG.bars.slice(rowStart, rowStart + BARS_PER_ROW);
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
                      lyrics={LYRICS[barIndex]}
                      staffClassName="h-24"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {introActive && <CountInOverlay onDone={onIntroDone} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

const AREA_BG_LIGHT: Record<Area, string> = {
  pitch: 'bg-pitch/10',
  rhythm: 'bg-rhythm/10',
  posture: 'bg-posture/10',
};
const AREA_SOLID: Record<Area, string> = {
  pitch: 'bg-pitch',
  rhythm: 'bg-rhythm',
  posture: 'bg-posture',
};
const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
const AREA_ICON: Record<Area, (p: { className?: string }) => JSX.Element> = {
  pitch: PitchIcon,
  rhythm: RhythmIcon,
  posture: UserIcon,
};

/** 영역 배지 — 아이콘 + 영역 이름 (음정/박자/자세) */
function AreaBadge({ area }: { area: Area }) {
  const Icon = AREA_ICON[area];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-background ${AREA_SOLID[area]}`}
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

  // 지적 1개 이상 — 영역별 블록을 한 카드에 쌓는다.
  const issues = feedbacks.filter(
    (fb): fb is Extract<Feedback, { tone: 'normal' }> => fb.tone === 'normal',
  );
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

