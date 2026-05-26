/**
 * 녹음(연주 기록) 더미 데이터 — 화면 기획용.
 * 연주가 끝나면 음원+영상이 자동 녹음된다고 가정한다.
 * - owner: 'other' → 협주 상대 후보 (다른 연주자의 연주)
 * - owner: 'me'    → 내 연주 이력 (마이페이지)
 * 실제 미디어 파일은 없으므로 협주 시 상대 영상은 placeholder로 표현한다.
 */
import type { Area } from '@/data/session';

export type RecordingSummary = Record<Area, number>;

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
  /** 아바타 색상 톤 */
  avatarAccent: Area;
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
    avatarAccent: 'pitch',
  },
  {
    id: 'rec-doyun',
    ...TWINKLE,
    playerName: '이도윤',
    owner: 'other',
    date: '5일 전',
    durationSec: 74,
    summary: { pitch: 1, rhythm: 3, posture: 1 },
    avatarAccent: 'rhythm',
  },
  {
    id: 'rec-jiwoo',
    ...TWINKLE,
    playerName: '박지우',
    owner: 'other',
    date: '1주 전',
    durationSec: 71,
    summary: { pitch: 0, rhythm: 1, posture: 3 },
    avatarAccent: 'posture',
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
    avatarAccent: 'pitch',
  },
  {
    id: 'rec-me-2',
    ...TWINKLE,
    playerName: '나',
    owner: 'me',
    date: '3일 전',
    durationSec: 70,
    summary: { pitch: 3, rhythm: 1, posture: 2 },
    avatarAccent: 'rhythm',
  },
];

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
