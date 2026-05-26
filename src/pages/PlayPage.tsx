import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { BarView } from '@/components/sheet/BarView';
import { UserIcon } from '@/components/icons';
import { AppHeader } from '@/components/AppHeader';
import { LYRICS, SONG } from '@/data/song';
import {
  ANALYSIS_WINDOW_BARS,
  FEEDBACK_SEQUENCE,
  currentMarksUpToWindow,
  previousMarksByBar,
  type Area,
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
/* 2. 전주(메트로놈) — /play 위에 모달로 띄움. 박자 감 + 들어갈 준비 시간 제공. */

const INTRO_BEATS = 8;
const INTRO_ACCENT_EVERY = SONG.beatsPerBar; // 4박마다 강박

function MetronomeOverlay({ onDone }: { onDone: () => void }) {
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

  const beatInBar = currentBeat < 0 ? 1 : (currentBeat % SONG.beatsPerBar) + 1;
  const barNumber = currentBeat < 0 ? 1 : Math.floor(currentBeat / SONG.beatsPerBar) + 1;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-9 rounded-3xl bg-card/95 px-8 py-12 shadow-modal">
        <div className="space-y-2 text-center">
          <p className="text-sm font-bold">박자에 맞춰 들어갈 준비</p>
          <p className="tabular text-xs text-muted-foreground">
            전주 {barNumber}/{INTRO_BEATS / SONG.beatsPerBar}마디
          </p>
        </div>

        {/* 큰 박자 카운터 (1→2→3→4 반복) */}
        <p
          key={currentBeat}
          className="animate-press tabular text-[120px] font-bold leading-none tracking-tight"
        >
          {beatInBar}
        </p>

        {/* 8비트 도트 인디케이터 */}
        <div className="flex items-center gap-3">
          {Array.from({ length: INTRO_BEATS }).map((_, i) => {
            const isAccent = i % INTRO_ACCENT_EVERY === 0;
            const isActive = i === currentBeat;
            const isPast = i < currentBeat;
            const sizeCls = isAccent ? 'h-4 w-4' : 'h-2.5 w-2.5';
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
    </div>,
    document.body,
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
  const progressInWindow = (elapsed % WINDOW_DURATION) / WINDOW_DURATION;

  const currentMarks = useMemo(
    () => currentMarksUpToWindow(currentWindowIndex),
    [currentWindowIndex],
  );
  const previousMarks = useMemo(() => previousMarksByBar(), []);

  const currentFeedback: Feedback | null = useMemo(() => {
    return FEEDBACK_SEQUENCE[currentWindowIndex] ?? null;
  }, [currentWindowIndex]);

  const areaStatus = useMemo(() => {
    const fb = FEEDBACK_SEQUENCE[currentWindowIndex];
    const status: Record<Area, 'good' | 'mild' | 'major'> = {
      pitch: 'good',
      rhythm: 'good',
      posture: 'good',
    };
    if (fb && 'mark' in fb && fb.mark) status[fb.mark.area] = fb.mark.severity;
    return status;
  }, [currentWindowIndex]);

  // 자세 영역이 활성(피드백 area=posture 또는 영역 전환 to=posture)일 때 영상 카드 강조
  const isPostureAlert = useMemo(() => {
    const fb = currentFeedback;
    if (!fb) return false;
    if (fb.tone === 'normal') return fb.area === 'posture';
    if (fb.tone === 'switch') return fb.to === 'posture';
    return false;
  }, [currentFeedback]);

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
            />
          </div>
        </div>

        {/* 피드백 */}
        <section className="min-h-[80px]">
          <FeedbackBar
            feedback={currentFeedback}
            barProgress={progressInWindow}
            barIndex={currentWindowIndex}
          />
        </section>

        {/* 상태바 */}
        <section className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
          <div className="flex items-center gap-5">
            <StatusDot area="pitch" status={areaStatus.pitch} label="음정" />
            <StatusDot area="rhythm" status={areaStatus.rhythm} label="박자" />
            <StatusDot area="posture" status={areaStatus.posture} label="자세" />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${stream ? 'bg-foreground' : 'bg-gray-300'}`}
              />
              카메라
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${stream ? 'bg-foreground' : 'bg-gray-300'}`}
              />
              마이크
            </span>
          </div>
        </section>

        {isFinished && (
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-bold">연주가 끝났습니다</p>
                <p className="text-xs text-muted-foreground">
                  이번 연주가 보관함에 자동 저장되었습니다 · 결과에서 마킹 누적을 확인하세요
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

      {!introDone && <MetronomeOverlay onDone={handleIntroDone} />}
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
          <p className="text-xs text-muted-foreground">손목·팔꿈치·손가락·어깨·엄지</p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 협주 상대 — 선택한 녹음을 함께 재생(듀엣). 실제 미디어 없이 placeholder. */

const PARTNER_AVATAR_BG: Record<Area, string> = {
  pitch: 'bg-pitch/20 text-pitch',
  rhythm: 'bg-rhythm/20 text-rhythm',
  posture: 'bg-posture/20 text-posture',
};

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
      <div className={`relative bg-gray-900 ${duet ? 'min-h-0 flex-1' : 'aspect-video'}`}>
        {/* placeholder: 녹화 영상 자리 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${PARTNER_AVATAR_BG[recording.avatarAccent]}`}
          >
            <UserIcon className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold text-background/80">{recording.playerName} 님의 녹화</p>
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/15 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-posture' : 'bg-gray-400'}`} />
          REC 재생
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-background/15 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          협주 상대
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
}: {
  currentBarIndex: number;
  progressInBar: number;
  currentMarks: Map<number, Mark[]>;
  previousMarks: Map<number, Mark[]>;
  isFinished: boolean;
}) {
  // 6마디(1줄) 단위 페이지. 24마디 = 4페이지 (1절 = 0·1, 2절 = 2·3).
  const BARS_PER_PAGE = 6;
  const TOTAL_PAGES = Math.ceil(SONG.bars.length / BARS_PER_PAGE);
  const pageIndex = Math.min(Math.floor(currentBarIndex / BARS_PER_PAGE), TOTAL_PAGES - 1);
  const startBar = pageIndex * BARS_PER_PAGE;
  const pageBars = SONG.bars.slice(startBar, startBar + BARS_PER_PAGE);
  const verseLabel = pageIndex < TOTAL_PAGES / 2 ? '1절' : '2절';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
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
        className="animate-feedback-in flex flex-1 items-center px-5 py-6"
      >
        <div className="grid w-full grid-cols-6 gap-3">
          {pageBars.map((bar, i) => {
            const barIndex = startBar + i;
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

const AREA_BG_LIGHT: Record<Area, string> = {
  pitch: 'bg-pitch/10',
  rhythm: 'bg-rhythm/10',
  posture: 'bg-posture/10',
};
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

function FeedbackBar({
  feedback,
  barProgress,
  barIndex,
}: {
  feedback: Feedback | null;
  barProgress: number;
  barIndex: number;
}) {
  if (!feedback) {
    return (
      <div
        key={`empty-${barIndex}`}
        className="animate-feedback-in flex min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-border bg-background px-5 text-sm text-muted-foreground"
      >
        다음 마디의 피드백을 분석 중…
      </div>
    );
  }

  // 영역 결정: normal=area, switch=to(가이드 대상)
  const area: Area | null =
    feedback.tone === 'normal'
      ? feedback.area
      : feedback.tone === 'switch'
        ? feedback.to
        : null;

  // 톤별 베이스 스타일
  const baseBg = area ? AREA_BG_LIGHT[area] : 'bg-gray-50';
  const dotCls = area ? AREA_DOT[area] : 'bg-gray-400';
  const textCls = area ? AREA_TEXT[area] : 'text-muted-foreground';

  // 라벨
  const label =
    feedback.tone === 'positive' ? '칭찬' : feedback.tone === 'switch' ? feedback.label : feedback.label;

  // 부제 (영역 전환만 부연 설명)
  const subtitle = feedback.tone === 'switch' ? '영역 전환 가이드' : null;

  return (
    <div
      key={`fb-${barIndex}-${feedback.action}`}
      className={`animate-feedback-in overflow-hidden rounded-2xl ${baseBg}`}
    >
      <div className="space-y-2 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotCls}`} />
          <span className={`text-xs font-bold tracking-wide ${textCls}`}>{label}</span>
          {subtitle && (
            <span className="text-xs font-medium text-muted-foreground">· {subtitle}</span>
          )}
        </div>
        <p className="text-[26px] font-bold leading-snug tracking-tight">{feedback.action}</p>
        <p className="text-sm text-muted-foreground">{feedback.message}</p>
      </div>
      {/* 잔여 시간 progress — 시간이 흐를수록 줄어듦 */}
      <div className="h-1 bg-foreground/5">
        <div
          className="h-full bg-foreground/30 transition-[width] duration-100 ease-linear"
          style={{ width: `${Math.max(0, 1 - barProgress) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatusDot({
  area,
  status,
  label,
}: {
  area: Area;
  status: 'good' | 'mild' | 'major';
  label: string;
}) {
  const dotClass =
    status === 'good'
      ? 'bg-gray-200'
      : status === 'mild'
        ? area === 'pitch'
          ? 'bg-pitch/60'
          : area === 'rhythm'
            ? 'bg-rhythm/60'
            : 'bg-posture/60'
        : area === 'pitch'
          ? 'bg-pitch'
          : area === 'rhythm'
            ? 'bg-rhythm'
            : 'bg-posture';

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
