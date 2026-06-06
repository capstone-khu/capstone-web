import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { AppHeader } from '@/components/AppHeader';
import { SONG } from '@/data/song';
import {
  FEEDBACK_SEQUENCE,
  currentMarksUpToWindow,
  previousCautionsForWindow,
  previousMarksByBar,
} from '@/data/session';
import { type PlayMode, prevSessionRecord } from '@/store/usePlaySession';
import { type Recording } from '@/data/recordings';
import { type usePlayProgress } from '@/hooks/play/usePlayProgress';
import { CameraStage } from './CameraStage';
import { PartnerAudioBar } from './PartnerAudioBar';
import { SheetStage } from './SheetStage';
import { CurrentFeedback, FeedbackCaption, PreviousCaution } from './FeedbackPanel';

export function PlayingView({
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

  const currentFeedbacks = useMemo(
    () => FEEDBACK_SEQUENCE[currentWindowIndex] ?? [],
    [currentWindowIndex],
  );

  const prev_measures = prevSessionRecord((state) => state.measures);

  const PREVIOUS_SESSION_MARKS = prev_measures.map((m) => (
    { window: m.measure_index, marks: m.markings.map((mk => ({ area: mk.domain, message: mk.feedbck }))) }
  ));

  const previousMarks = useMemo(() => previousMarksByBar(PREVIOUS_SESSION_MARKS), []);
  const previousCautions = useMemo(
    () => previousCautionsForWindow(currentWindowIndex, PREVIOUS_SESSION_MARKS),
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
              {SONG.title}
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
        onClose={() => setShowExitConfirm(false)}
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
