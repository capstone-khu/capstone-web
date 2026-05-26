/**
 * MVP 곡 데이터 — 반짝 반짝 작은별 (바이올린, C major, 4/4, 12마디)
 * 화면 기획용 더미 데이터. 음표 길이는 단순화해 마디당 4음표(4분음 4개)로 표현.
 */

export type Pitch = 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4';

export type Bar = Pitch[];

export const SONG = {
  title: '반짝 반짝 작은별',
  composer: '전래동요',
  instrument: '바이올린',
  key: 'C major',
  timeSignature: '4/4',
  bpm: 80,
  beatsPerBar: 4,
  bars: [
    // 1절
    ['C4', 'C4', 'G4', 'G4'],
    ['A4', 'A4', 'G4', 'G4'],
    ['F4', 'F4', 'E4', 'E4'],
    ['D4', 'D4', 'C4', 'C4'],
    ['G4', 'G4', 'F4', 'F4'],
    ['E4', 'E4', 'D4', 'D4'],
    ['G4', 'G4', 'F4', 'F4'],
    ['E4', 'E4', 'D4', 'D4'],
    ['C4', 'C4', 'G4', 'G4'],
    ['A4', 'A4', 'G4', 'G4'],
    ['F4', 'F4', 'E4', 'E4'],
    ['D4', 'D4', 'C4', 'C4'],
    // 2절 (동일 멜로디 반복)
    ['C4', 'C4', 'G4', 'G4'],
    ['A4', 'A4', 'G4', 'G4'],
    ['F4', 'F4', 'E4', 'E4'],
    ['D4', 'D4', 'C4', 'C4'],
    ['G4', 'G4', 'F4', 'F4'],
    ['E4', 'E4', 'D4', 'D4'],
    ['G4', 'G4', 'F4', 'F4'],
    ['E4', 'E4', 'D4', 'D4'],
    ['C4', 'C4', 'G4', 'G4'],
    ['A4', 'A4', 'G4', 'G4'],
    ['F4', 'F4', 'E4', 'E4'],
    ['D4', 'D4', 'C4', 'C4'],
  ] as Bar[],
};

/**
 * 5선보 (treble clef) 기준 음표 Y 좌표.
 * staff 라인: y = 15, 22, 29, 36, 43 (위→아래 = F5, D5, B4, G4, E4)
 */
export const PITCH_Y: Record<Pitch, number> = {
  A4: 32.5, // G4-B4 사이
  G4: 36,
  F4: 39.5,
  E4: 43,
  D4: 46.5,
  C4: 50, // ledger line below
};

/**
 * 마디별 한국어 가사 음절 (마디당 4음절, SONG.bars와 같은 길이).
 * `∼`는 sustain(이전 음절을 끌어 부르는 자리) 표기.
 */
export const LYRICS: string[][] = [
  // 1절
  ['반', '짝', '반', '짝'],
  ['작', '은', '별', '∼'],
  ['아', '름', '답', '게'],
  ['비', '치', '네', '∼'],
  ['동', '쪽', '하', '늘'],
  ['에', '서', '도', '∼'],
  ['서', '쪽', '하', '늘'],
  ['에', '서', '도', '∼'],
  ['반', '짝', '반', '짝'],
  ['작', '은', '별', '∼'],
  ['아', '름', '답', '게'],
  ['비', '치', '네', '∼'],
  // 2절 (동일 가사 반복)
  ['반', '짝', '반', '짝'],
  ['작', '은', '별', '∼'],
  ['아', '름', '답', '게'],
  ['비', '치', '네', '∼'],
  ['동', '쪽', '하', '늘'],
  ['에', '서', '도', '∼'],
  ['서', '쪽', '하', '늘'],
  ['에', '서', '도', '∼'],
  ['반', '짝', '반', '짝'],
  ['작', '은', '별', '∼'],
  ['아', '름', '답', '게'],
  ['비', '치', '네', '∼'],
];

/** 음 이름 → 주파수 (Hz). 12-TET 표준 튜닝 (A4 = 440). */
export const PITCH_FREQ: Record<Pitch, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
};

/** 곡 목록 메타 — MVP는 첫 번째 곡만 실제로 동작. 나머지는 향후 확장 자리. */
export type SongStatus = 'available' | 'coming-soon';

export type SongMeta = {
  id: string;
  title: string;
  composer: string;
  instrument: string;
  key?: string;
  bpm?: number;
  bars?: number;
  status: SongStatus;
};

export const SONG_LIST: SongMeta[] = [
  {
    id: 'twinkle',
    title: SONG.title,
    composer: SONG.composer,
    instrument: SONG.instrument,
    key: SONG.key,
    bpm: SONG.bpm,
    bars: SONG.bars.length,
    status: 'available',
  },
];
