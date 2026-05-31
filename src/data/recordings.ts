/**
 * 녹음(연주 기록) 더미 데이터 — 화면 기획용.
 * 연주가 끝나면 음원+영상이 자동 녹음된다고 가정한다.
 * - owner: 'other' → 협주 상대 후보 (다른 연주자의 연주)
 * - owner: 'me'    → 내 연주 이력 (마이페이지)
 * 실제 미디어 파일은 없으므로 협주 시 상대 영상은 placeholder로 표현한다.
 */
import { type Area } from '@/lib/area';

export type RecordingSummary = Record<Area, number>;

/** 마디별 실패 기록 — 세션 간 반복 실패 마디 탐지 + 결과 마킹에 사용. (bar는 0-based) */
export type BarFail = { bar: number; area: Area };

export type Recording = {
  id: string;
  songId: string;
  songTitle: string;
  playerName: string;
  owner: 'me' | 'other';
  /** 표시용 상대 시점 라벨 */
  date: string;
  durationSec: number;
  /** 영역별 마킹 개수 요약 */
  summary: RecordingSummary;
  /** 어느 마디에서 어떤 영역이 틀렸는지 (세션 간 반복 실패 탐지·결과 마킹용) */
  barFails?: BarFail[];
};

const TWINKLE = { songId: 'twinkle', songTitle: '반짝 반짝 작은별' };

export const OTHER_RECORDINGS: Recording[] = [
  {
    id: 'rec-seoyeon',
    ...TWINKLE,
    playerName: '김서연',
    owner: 'other',
    date: '2일 전',
    durationSec: 72,
    summary: { pitch: 2, rhythm: 1, posture: 0 },
  },
  {
    id: 'rec-doyun',
    ...TWINKLE,
    playerName: '이도윤',
    owner: 'other',
    date: '5일 전',
    durationSec: 74,
    summary: { pitch: 1, rhythm: 3, posture: 1 },
  },
  {
    id: 'rec-jiwoo',
    ...TWINKLE,
    playerName: '박지우',
    owner: 'other',
    date: '1주 전',
    durationSec: 71,
    summary: { pitch: 0, rhythm: 1, posture: 3 },
  },
];

export const MY_RECORDINGS: Recording[] = [
  {
    id: 'rec-me-1',
    ...TWINKLE,
    playerName: '나',
    owner: 'me',
    date: '오늘',
    durationSec: 73,
    summary: { pitch: 2, rhythm: 2, posture: 1 },
    barFails: [
      { bar: 0, area: 'pitch' }, // 마디 1 — 반복 실패
      { bar: 8, area: 'pitch' },
      { bar: 3, area: 'rhythm' },
      { bar: 12, area: 'rhythm' },
      { bar: 5, area: 'posture' },
    ],
  },
  {
    id: 'rec-me-2',
    ...TWINKLE,
    playerName: '나',
    owner: 'me',
    date: '3일 전',
    durationSec: 70,
    summary: { pitch: 3, rhythm: 1, posture: 2 },
    barFails: [
      { bar: 0, area: 'pitch' }, // 마디 1 — 반복 실패
      { bar: 6, area: 'pitch' },
      { bar: 14, area: 'pitch' },
      { bar: 9, area: 'rhythm' },
      { bar: 5, area: 'posture' },
      { bar: 18, area: 'posture' },
    ],
  },
  {
    id: 'rec-me-3',
    ...TWINKLE,
    playerName: '나',
    owner: 'me',
    date: '1주 전',
    durationSec: 71,
    summary: { pitch: 2, rhythm: 1, posture: 1 },
    barFails: [
      { bar: 0, area: 'pitch' }, // 마디 1 — 반복 실패
      { bar: 11, area: 'pitch' },
      { bar: 4, area: 'rhythm' },
      { bar: 7, area: 'posture' },
    ],
  },
];

export type RepeatWeak = { bar: number; area: Area; lessons: number };

/**
 * 내 연주 이력에서 같은 마디가 여러 레슨에 걸쳐 실패한 경우를 찾는다.
 * 누적 3회 이상이면 마이페이지에서 '집중 반복 레슨'을 추천. (가장 많이 반복된 마디 1개)
 */
function computeRepeatWeak(records: Recording[]): RepeatWeak | null {
  const counts = new Map<number, { area: Area; lessons: number }>();
  for (const r of records) {
    for (const f of r.barFails ?? []) {
      const cur = counts.get(f.bar);
      if (cur) cur.lessons += 1;
      else counts.set(f.bar, { area: f.area, lessons: 1 });
    }
  }
  let best: RepeatWeak | null = null;
  for (const [bar, v] of counts) {
    if (v.lessons >= 3 && (!best || v.lessons > best.lessons)) {
      best = { bar, area: v.area, lessons: v.lessons };
    }
  }
  return best;
}

export const REPEAT_WEAK: RepeatWeak | null = computeRepeatWeak(MY_RECORDINGS);

const ALL = [...OTHER_RECORDINGS, ...MY_RECORDINGS];

export function getRecording(id: string | null): Recording | null {
  if (!id) return null;
  return ALL.find((r) => r.id === id) ?? null;
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
