import { PITCH_FREQ, SONG, type Pitch } from '@/data/song';

/**
 * 단일 음표 스케줄. triangle wave + 짧은 attack/release envelope (바이올린 흉내는 아니지만
 * 화면 기획용 가이드 톤으로 충분).
 */
function scheduleNote(ctx: AudioContext, freq: number, when: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  // ADSR (단순화)
  const attack = 0.015;
  const release = 0.08;
  const sustainLevel = 0.18;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(sustainLevel, when + attack);
  gain.gain.setValueAtTime(sustainLevel, when + duration - release);
  gain.gain.linearRampToValueAtTime(0, when + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

/** 곡 전체 스케줄. startTime = ctx.currentTime 기준의 절대 시간(초). */
export function scheduleSong(ctx: AudioContext, startTime: number) {
  const beatSec = 60 / SONG.bpm; // 4분음 길이
  SONG.bars.forEach((bar, barIdx) => {
    bar.forEach((pitch: Pitch, noteIdx) => {
      const when = startTime + (barIdx * SONG.beatsPerBar + noteIdx) * beatSec;
      scheduleNote(ctx, PITCH_FREQ[pitch], when, beatSec * 0.9);
    });
  });
}

/**
 * 특정 마디 구간 [fromBar..toBar] 을 loops회 반복 스케줄 — 집중 반복 레슨용.
 * 각 반복은 프레이즈 길이만큼 이어 붙는다.
 */
export function scheduleBarsLoop(
  ctx: AudioContext,
  startTime: number,
  fromBar: number,
  toBar: number,
  loops: number,
) {
  const beatSec = 60 / SONG.bpm;
  const barsCount = toBar - fromBar + 1;
  const phraseSec = barsCount * SONG.beatsPerBar * beatSec;
  for (let loop = 0; loop < loops; loop++) {
    const loopStart = startTime + loop * phraseSec;
    for (let b = fromBar; b <= toBar; b++) {
      SONG.bars[b].forEach((pitch: Pitch, noteIdx) => {
        const when = loopStart + ((b - fromBar) * SONG.beatsPerBar + noteIdx) * beatSec;
        scheduleNote(ctx, PITCH_FREQ[pitch], when, beatSec * 0.9);
      });
    }
  }
}

/**
 * 메트로놈 클릭 — 짧고 단단한 톤. 강박(beat 0, 4, 8…)은 좀 더 높고 크게,
 * 약박은 옅게. 노래방 전주 시 박자 감 잡기 위해 사용.
 */
function scheduleClick(ctx: AudioContext, when: number, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = accent ? 1500 : 1000;
  const peak = accent ? 0.22 : 0.14;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(peak, when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.08);
}

/**
 * 메트로놈 N비트 스케줄. accentEveryN(기본 4)마다 강박.
 * 반환: 마지막 클릭 종료 후 다음 박자 시작 시점(초, ctx.currentTime 기준).
 */
export function scheduleMetronome(
  ctx: AudioContext,
  startTime: number,
  beatCount: number,
  bpm: number,
  accentEveryN: number = 4,
): number {
  const beatSec = 60 / bpm;
  for (let i = 0; i < beatCount; i++) {
    const when = startTime + i * beatSec;
    scheduleClick(ctx, when, i % accentEveryN === 0);
  }
  return startTime + beatCount * beatSec;
}
