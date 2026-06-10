/**
 * 세션 마킹 공통 타입·헬퍼 — 마킹 스타일 클래스와 이전 세션 마킹 펼치기.
 * (시연용 더미 피드백은 실시간 WebSocket 연동으로 대체되어 제거됨)
 */
import type { Area } from '@/lib/area';

export type Severity = 'mild' | 'major';
export type Mark = { area: Area; severity?: Severity; message?: string; supervisor?: boolean };

export type Feedback =
  | { tone: 'normal'; area: Area; message: string; mark?: Mark; reward?: number }
  | { tone: 'positive'; message: string }
  | { tone: 'supervisor'; message: string; action?: string; area?: Area; isUpdated?: boolean };

/** 분석 단위: 3마디 = 한 윈도우. 한 윈도우에 하나의 피드백/마킹이 적용됨. */
export const ANALYSIS_WINDOW_BARS = 3;

/**
 * 마킹 클래스 매핑 — 시간(이번/이전)은 '형태'로 구분(심각도와 무관).
 *   이전 세션 = 외곽선만(속 빔) · 이번 세션 = 꽉 참(모두 /60)
 * tailwind JIT가 정적 분석으로 잡아내도록 명시적으로 나열.
 */
const PREV_CLASS: Record<Area, string> = {
  pitch: 'border-2 border-pitch bg-background',
  rhythm: 'border-2 border-rhythm bg-background',
  posture: 'border-2 border-posture bg-background',
};
/** 테두리만 — 과거+현재가 같은 영역에 겹칠 때 현재 색칠 위에 과거 테두리를 덧입힌다. */
const PREV_BORDER_CLASS: Record<Area, string> = {
  pitch: 'border-2 border-pitch',
  rhythm: 'border-2 border-rhythm',
  posture: 'border-2 border-posture',
};
// 현재 마킹 색칠 — 심각도와 무관하게 모두 연한 색(/60)으로 통일.
const CURRENT_CLASS: Record<Area, string> = {
  pitch: 'bg-pitch/60',
  rhythm: 'bg-rhythm/60',
  posture: 'bg-posture/60',
};

export function markClass(area: Area, layer: 'previous' | 'current'): string {
  return layer === 'previous' ? PREV_CLASS[area] : CURRENT_CLASS[area];
}

/** 과거 마킹 테두리(채움 없음) — 현재 색칠과 겹쳐 그릴 때 사용. */
export function markBorderClass(area: Area): string {
  return PREV_BORDER_CLASS[area];
}

/** 이전 세션 마킹을 bar 인덱스로 키잉한 Map — 윈도우 마킹을 그 윈도우의 모든 마디로 펼침 */
export function previousMarksByBar(PREVIOUS_SESSION_MARKS: any): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  for (const entry of PREVIOUS_SESSION_MARKS) {
    const startBar = entry.window * ANALYSIS_WINDOW_BARS;
    const marks = entry.marks.map((m: any) => ({
      ...m,
      message: m.message,
    }));
    for (let b = startBar; b < startBar + ANALYSIS_WINDOW_BARS; b++) {
      map.set(b, marks);
    }
  }
  return map;
}
