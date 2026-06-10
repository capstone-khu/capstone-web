// 전체 연주 엔진
// 연주 진행 상태 관리 (진행 시간, 현재 마디/박자, 일시정지/재개 등)

import { scheduleBarsLoop, scheduleMetadataSong, scheduleSong } from "@/lib/audio";
import { useRef, useState, useEffect } from "react";
import { type ScoreData } from "@/api/songs/song.type";
import { scoreMetadata } from "@/lib/score_metadata";

interface PlayProgressInput {
  data: ScoreData;
  focusBar?: number | null;
  onStartRecording?: () => void;
}

interface PlayProgressReturn {
  elapsed: number;
  focused: boolean;

  isPlaying: boolean;
  isFinished: boolean;
  introDone: boolean;

  currentBarIndex: number;
  progressInBar: number;
  currentWindowIndex: number;

  focusLoopRound?: number;
  TOTAL_DURATION: number;
  TOTAL_BARS: number;
  FOCUS_LOOPS: number;

  pause: () => void;
  resume: () => void;
  restart: () => void;

  handleIntroDone: () => void;
}

/** 분석 단위: 3마디 = 한 윈도우 */
export const ANALYSIS_WINDOW_BARS = 3;

const METADATA_OFFSET = scoreMetadata.notes.length > 0
  ? Math.min(...scoreMetadata.notes.map((n) => n.start))
  : 0;

function calcBarFromMetadata(elapsed: number): {
  barIndex: number;
  progressInBar: number;
} {
  const notes = scoreMetadata.notes;
  if (notes.length === 0) return { barIndex: 0, progressInBar: 0 };

  const measureMap = new Map<number, { firstStart: number; lastEnd: number }>();
  for (const n of notes) {
    const m = n.measure;
    const start = n.start - METADATA_OFFSET;
    const end = n.end - METADATA_OFFSET;
    const existing = measureMap.get(m);
    if (!existing) {
      measureMap.set(m, { firstStart: start, lastEnd: end });
    } else {
      measureMap.set(m, {
        firstStart: Math.min(existing.firstStart, start),
        lastEnd: Math.max(existing.lastEnd, end),
      });
    }
  }

  const measures = Array.from(measureMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([measure, { firstStart, lastEnd }]) => ({ measure, firstStart, lastEnd }));

  const totalEnd = measures[measures.length - 1].lastEnd;

  if (elapsed >= totalEnd) {
    return {
      barIndex: measures[measures.length - 1].measure - 1,
      progressInBar: 1,
    };
  }

  for (let i = 0; i < measures.length; i++) {
    const cur = measures[i];
    const nextStart =
      i + 1 < measures.length ? measures[i + 1].firstStart : cur.lastEnd;

    if (elapsed >= cur.firstStart && elapsed < nextStart) {
      const barDuration = nextStart - cur.firstStart;
      const progressInBar =
        barDuration > 0 ? (elapsed - cur.firstStart) / barDuration : 0;
      return {
        barIndex: cur.measure - 1,
        progressInBar: Math.min(progressInBar, 1),
      };
    }
  }

  return { barIndex: 0, progressInBar: 0 };
}

function metadataTotalDuration(): number {
  if (scoreMetadata.notes.length === 0) return 0;
  return Math.max(...scoreMetadata.notes.map((n) => n.end)) - METADATA_OFFSET;
}

export const usePlayProgress = ({
  data,
  focusBar,
  onStartRecording,
}: PlayProgressInput): PlayProgressReturn => {
  if (!data) throw new Error("usePlayProgress: song은 null이 될 수 없습니다");

  const beatsPerBar = Number(data.song.time_signature.split("/")[0]);
  const TOTAL_BARS = data.song.total_measures;
  const FOCUS_LOOPS = 7;

  const BAR_DURATION = (60 / data.song.bpm) * beatsPerBar;
  const WINDOW_DURATION = BAR_DURATION * ANALYSIS_WINDOW_BARS;
  const TOTAL_WINDOWS = Math.ceil(TOTAL_BARS / ANALYSIS_WINDOW_BARS);

  const TOTAL_DURATION = metadataTotalDuration() || BAR_DURATION * TOTAL_BARS;

  const focused = focusBar != null;
  const phraseStart = focused ? focusBar : 0;
  const phraseEnd = focused ? focusBar : TOTAL_BARS - 1;
  const phraseBars = phraseEnd - phraseStart + 1;
  const PHRASE_DURATION = phraseBars * BAR_DURATION;
  const focusDuration = PHRASE_DURATION * FOCUS_LOOPS;

  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const songStartTimeRef = useRef<number>(0);

  let currentBarIndex: number;
  let progressInBar: number;

  if (focused) {
    const playClock = elapsed % PHRASE_DURATION;
    currentBarIndex =
      phraseStart + Math.min(Math.floor(playClock / BAR_DURATION), phraseBars - 1);
    progressInBar = (playClock % BAR_DURATION) / BAR_DURATION;
  } else {
    const result = calcBarFromMetadata(elapsed);
    currentBarIndex = Math.min(result.barIndex, TOTAL_BARS - 1);
    progressInBar = result.progressInBar;
  }

  const focusLoopRound = focused ? Math.floor(elapsed / PHRASE_DURATION) + 1 : 0;

  const currentWindowIndex = Math.min(
    Math.floor(currentBarIndex / ANALYSIS_WINDOW_BARS),
    TOTAL_WINDOWS - 1
  );

  const pause = () => setIsPlaying(false);
  const resume = () => setIsPlaying(true);

  const restart = () => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setElapsed(0);
    setIsFinished(false);
    setIsPlaying(true);
    setIntroDone(false);
  };

  const handleIntroDone = () => {
    const Ctx = window.AudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    ctx.resume().then(() => {
      songStartTimeRef.current = ctx.currentTime;

      onStartRecording?.();
      console.log("녹화 시작!");

      if (focused) {
        scheduleBarsLoop(ctx, songStartTimeRef.current, phraseStart, phraseEnd, FOCUS_LOOPS, data);
      } else {
        scheduleMetadataSong(ctx, songStartTimeRef.current, scoreMetadata);
      }
    });

    setIntroDone(true);
  };

  // 언마운트 시 곡 재생 AudioContext 정리 — 닫지 않으면 페이지를 떠나도 스케줄된 노래가 계속 나옴
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
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

    const endAt = focused ? focusDuration : TOTAL_DURATION;

    const tick = () => {
      const ac = audioCtxRef.current;
      if (!ac) return;

      const now = ac.currentTime - songStartTimeRef.current;

      if (now >= endAt) {
        setElapsed(endAt);
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
  }, [introDone, isPlaying, isFinished, focused, focusDuration, TOTAL_DURATION]);

  return {
    elapsed,
    focused,
    isPlaying,
    isFinished,
    introDone,
    currentBarIndex,
    progressInBar,
    currentWindowIndex,
    focusLoopRound,
    TOTAL_DURATION,
    TOTAL_BARS,
    FOCUS_LOOPS,
    pause,
    resume,
    restart,
    handleIntroDone,
  };
};