import { useEffect, useRef, useState } from 'react';
import { SONG } from '@/data/song';
import { scheduleMetronome } from '@/lib/audio';

const INTRO_BEATS = 8;
const INTRO_ACCENT_EVERY = SONG.beatsPerBar;

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

export function CountInOverlay({ onDone }: { onDone: () => void }) {
  const currentBeat = useMetronomeIntro(onDone);
  const beatInBar = currentBeat < 0 ? 1 : (currentBeat % SONG.beatsPerBar) + 1;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-2xl bg-card/85 backdrop-blur-[2px]">
      <p className="text-sm font-bold text-muted-foreground">곧 연주가 시작됩니다</p>

      <p
        key={currentBeat}
        className="animate-press tabular text-8xl font-bold leading-none tracking-tight"
      >
        {beatInBar}
      </p>

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
