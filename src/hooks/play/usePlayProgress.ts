// 전체 연주 엔진
// 연주 진행 상태 관리 (진행 시간, 현재 마디/박자, 일시정지/재개 등)

import { scheduleBarsLoop, scheduleSong } from "@/lib/audio";
import { useRef, useState, useEffect } from "react";
import { type ScoreData } from "@/api/songs/song.type";


interface PlayProgressInput {
    data: ScoreData;
    focusBar?: number | null; 
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

    focusLoopRound?: number; // 집중 반복 중이면 현재 몇 번째 반복인지 (1부터 시작)
    TOTAL_DURATION: number;
    TOTAL_BARS: number;
    FOCUS_LOOPS: number;

    pause: () => void;
    resume: () => void;
    restart: () => void;

    handleIntroDone: () => void;
};

/** 분석 단위: 3마디 = 한 윈도우. 한 윈도우에 하나의 피드백/마킹이 적용됨. */
export const ANALYSIS_WINDOW_BARS = 3;

export const usePlayProgress = ({ data, focusBar }: PlayProgressInput): PlayProgressReturn => {
    // song이 없으면 훅 내부 계산 자체를 막음
    if (!data) throw new Error('usePlayProgress: song은 null이 될 수 없습니다');
    const beatsPerBar = Number(data.song.time_signature.split("/")[0]);
    const TOTAL_BARS = data.song.total_measures;
    const FOCUS_LOOPS = 5;


    // 악보 데이터에서 연주 분석에 필요한 여러 파생값들을 계산
    const BAR_DURATION = (60 / data.song.bpm) * beatsPerBar;
    const WINDOW_DURATION = BAR_DURATION * ANALYSIS_WINDOW_BARS;
    const TOTAL_WINDOWS = Math.ceil(TOTAL_BARS / ANALYSIS_WINDOW_BARS);
    const TOTAL_DURATION = BAR_DURATION * TOTAL_BARS;


    const [elapsed, setElapsed] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [introDone, setIntroDone] = useState(false); 

    const rafRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const songStartTimeRef = useRef<number>(0);

    // 진행 시간, 마디/박자 인덱스 등 계산
    const focused = focusBar != null;
    const phraseStart = focused ? focusBar : 0;
    const phraseEnd = focused ? focusBar : TOTAL_BARS - 1;
    const phraseBars = phraseEnd - phraseStart + 1;
    const PHRASE_DURATION = phraseBars * BAR_DURATION;
    const focusDuration = PHRASE_DURATION * FOCUS_LOOPS;
    const focusLoopRound = focused ? Math.floor(elapsed / PHRASE_DURATION) + 1 : 0;
    const playClock = focused ? elapsed % PHRASE_DURATION : elapsed;

    const currentBarIndex = focused
        ? phraseStart +
            Math.min(
            Math.floor(playClock / BAR_DURATION),
            phraseBars - 1,
            )
        : Math.min(
            Math.floor(elapsed / BAR_DURATION),
            TOTAL_BARS - 1,
            );
    
    const progressInBar =
        (playClock % BAR_DURATION) / BAR_DURATION;

    const currentWindowIndex = focused
        ? Math.min(
            Math.floor(currentBarIndex / ANALYSIS_WINDOW_BARS),
            TOTAL_WINDOWS - 1,
            )
        : Math.min(
            Math.floor(elapsed / WINDOW_DURATION),
            TOTAL_WINDOWS - 1,
            );

    // 일시정지/재개 — AudioContext의 suspend/resume과 연동
    const pause = () => {
        setIsPlaying(false);
    };

    const resume = () => {
        setIsPlaying(true);
    };

    // 집중 반복 '다시 한 번' — 카운트인부터 재시작
    const restart = () => {
        audioCtxRef.current?.close();
        audioCtxRef.current = null;

        setElapsed(0);
        setIsFinished(false);
        setIsPlaying(true);
        setIntroDone(false);
    };

    // 전주(메트로놈)가 끝나면 곡 AudioContext를 만들고 스케줄 시작
      const handleIntroDone = () => {
        const Ctx = window.AudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          audioCtxRef.current = ctx;
          ctx.resume().then(() => {
            songStartTimeRef.current = ctx.currentTime;
            if (focused) {
              // ✅ data 추가 — 단, 여기서 SongScoreDataDetail이 아니라 ScoreData 전체가 필요
              scheduleBarsLoop(ctx, songStartTimeRef.current, phraseStart, phraseEnd, FOCUS_LOOPS, data);
            } else {
              scheduleSong(ctx, songStartTimeRef.current, data);
            }
          });
        }
        setIntroDone(true);
      };

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
          const endAt = focused ? focusDuration : TOTAL_DURATION;
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
    }, [introDone, isPlaying, isFinished, focused, focusDuration]);


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
}