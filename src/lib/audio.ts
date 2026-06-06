import { PITCH_FREQ, type Pitch } from '@/api/songs/song.type';
import { type ScoreData } from '@/api/songs/song.type';

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
export function scheduleSong(ctx: AudioContext, startTime: number, song: ScoreData) {
  const beatsPerBar = Number(song.song.time_signature.split('/')[0]);
  const beatSec = 60 / song.song.bpm;

  const sorted = [...song.measures].sort((a, b) => a.measure_index - b.measure_index);

  sorted.forEach((measure) => {
    measure.notes.forEach((note) => {
      const barIdx = measure.measure_index - 1; // measure_index는 1-based
      const freq = PITCH_FREQ[note.pitch as Pitch];
      if (!freq) return;

      // note.position은 마디 안에서의 박자 위치 (0, 1, 2, 3...)
      const when = startTime + (barIdx * beatsPerBar + note.position) * beatSec;
      // duration은 note.duration 문자열 기반으로 계산
      const duration = noteDurationSec(note.duration, beatSec);
      scheduleNote(ctx, freq, when, duration * 0.9);
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
  song: ScoreData,
) {
  const beatsPerBar = Number(song.song.time_signature.split('/')[0]);
  const beatSec = 60 / song.song.bpm;
  const barsCount = toBar - fromBar + 1;
  const phraseSec = barsCount * beatsPerBar * beatSec;

  const sorted = [...song.measures].sort((a, b) => a.measure_index - b.measure_index)

  for (let loop = 0; loop < loops; loop++) {
    const loopStart = startTime + loop * phraseSec;

    // fromBar~toBar는 0-based, measure_index는 1-based
    const targetMeasures = sorted.filter(
      (m) => m.measure_index - 1 >= fromBar && m.measure_index - 1 <= toBar,
    );

    targetMeasures.forEach((measure) => {
      const barIdx = measure.measure_index - 1 - fromBar; // 프레이즈 내 상대 인덱스
      measure.notes.forEach((note) => {
        const freq = PITCH_FREQ[note.pitch as Pitch];
        if (!freq) return;
        const when = loopStart + (barIdx * beatsPerBar + note.position) * beatSec;
        const duration = noteDurationSec(note.duration, beatSec);
        scheduleNote(ctx, freq, when, duration * 0.9);
      });
    });
  }
}

/** note.duration 문자열 → 초 변환 */
function noteDurationSec(duration: string, beatSec: number): number {
  switch (duration) {
    case 'whole':        return beatSec * 4;
    case 'half':         return beatSec * 2;
    case 'quarter':      return beatSec * 1;
    case 'eighth':       return beatSec * 0.5;
    case 'sixteenth':    return beatSec * 0.25;
    default:             return beatSec * 1;
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
