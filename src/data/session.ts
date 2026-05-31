/**
 * MVP 세션 더미 데이터 — 분석 윈도우(3마디) 단위 피드백.
 * 화면 기획용. 실제 분석 결과 대신 시나리오 기반 시드.
 */
import { SONG } from '@/data/song';
import type { Area } from '@/lib/area';

export type Severity = 'mild' | 'major';
export type Mark = { area: Area; severity: Severity; message?: string };

export type Feedback =
  | { tone: 'normal'; area: Area; message: string; mark?: Mark }
  | { tone: 'positive'; message: string };

/** 분석 단위: 3마디 = 한 윈도우. 한 윈도우에 하나의 피드백/마킹이 적용됨. */
export const ANALYSIS_WINDOW_BARS = 3;

/** 이전 세션 마킹 — 윈도우 인덱스 기준. 그 윈도우의 모든 마디에 펼쳐서 표시됨. */
export const PREVIOUS_SESSION_MARKS: Array<{ window: number; marks: Mark[] }> = [
  { window: 1, marks: [{ area: 'pitch', severity: 'mild' }] },
  { window: 2, marks: [{ area: 'pitch', severity: 'major' }] },
  { window: 3, marks: [{ area: 'rhythm', severity: 'mild' }] },
  { window: 4, marks: [{ area: 'rhythm', severity: 'major' }, { area: 'posture', severity: 'mild' }] },
  { window: 5, marks: [{ area: 'posture', severity: 'mild' }] },
  { window: 6, marks: [{ area: 'posture', severity: 'major' }] },
];

/**
 * 윈도우 진입 시점에 표시되는 더미 피드백 (총 8개 = 24마디 / 3마디).
 * 각 윈도우는 피드백 '배열' — 동시에 여러 영역에서 지적이 들어오는 경우를 표현(W5·W6).
 * SA 스펙 메시지를 영역(음정/박자/자세)·톤(지적/칭찬)별로 시연.
 */
export const FEEDBACK_SEQUENCE: (Feedback[] | null)[] = [
  // W0: 마디 1-3 — 시작 (분석 부족)
  null,

  // W1: SA-01 PITCH_UP
  [{ tone: 'normal', area: 'pitch', message: '음정을 올리세요', mark: { area: 'pitch', severity: 'mild' } }],

  // W2: SA-03 PITCH_FIX_DRIFT
  [
    {
      tone: 'normal',
      area: 'pitch',
      message: '음정이 흘러내리고 있습니다. 손가락 위치를 고정하세요',
      mark: { area: 'pitch', severity: 'major' },
    },
  ],

  // W3: SA-04 POSITIVE_PITCH
  [{ tone: 'positive', message: '잘 하고 있습니다. 계속 유지하세요' }],

  // W4: SA-07 RHYTHM_CATCH_UP
  [
    {
      tone: 'normal',
      area: 'rhythm',
      message: '박자보다 늦게 연주하고 있습니다. 박자를 맞추세요',
      mark: { area: 'rhythm', severity: 'mild' },
    },
  ],

  // W5: 동시 2영역 — 박자(SA-08) + 자세(SA-12)
  [
    {
      tone: 'normal',
      area: 'rhythm',
      message: '템포가 빠릅니다. 속도를 늦추세요',
      mark: { area: 'rhythm', severity: 'major' },
    },
    {
      tone: 'normal',
      area: 'posture',
      message: '왼손 손목을 펴세요',
      mark: { area: 'posture', severity: 'mild' },
    },
  ],

  // W6: 동시 3영역 — 음정(SA-01) + 박자(SA-07) + 자세(SA-15)
  [
    {
      tone: 'normal',
      area: 'pitch',
      message: '음정을 올리세요',
      mark: { area: 'pitch', severity: 'mild' },
    },
    {
      tone: 'normal',
      area: 'rhythm',
      message: '박자보다 늦게 연주하고 있습니다. 박자를 맞추세요',
      mark: { area: 'rhythm', severity: 'mild' },
    },
    {
      tone: 'normal',
      area: 'posture',
      message: '어깨를 내리세요',
      mark: { area: 'posture', severity: 'major' },
    },
  ],

  // W7: SA-12 WRIST_STRAIGHTEN
  [
    {
      tone: 'normal',
      area: 'posture',
      message: '왼손 손목을 펴세요',
      mark: { area: 'posture', severity: 'mild' },
    },
  ],
];

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

/**
 * 마킹(area+severity)별 대표 피드백 문구.
 * 이전 세션 마킹/과거 기록은 실제 이벤트 문구가 없으므로 이 대표 문구를 상세에 표시.
 * (이번 세션 마킹은 FEEDBACK_SEQUENCE의 실제 문구를 그대로 사용)
 */
const SAMPLE_MESSAGE: Record<Area, Record<Severity, string>> = {
  pitch: {
    mild: '음정을 올리세요',
    major: '음정이 흘러내리고 있습니다. 손가락 위치를 고정하세요',
  },
  rhythm: {
    mild: '박자보다 늦게 연주하고 있습니다. 박자를 맞추세요',
    major: '템포가 빠릅니다. 속도를 늦추세요',
  },
  posture: {
    mild: '왼손 손목을 펴세요',
    major: '어깨를 내리세요',
  },
};

export type Caution = { area: Area; severity: Severity; message: string };

/** 현재 윈도우의 '지난 연주' 주의 — 이전 세션 마킹을 대표 문구와 함께 반환. */
export function previousCautionsForWindow(window: number): Caution[] {
  const entry = PREVIOUS_SESSION_MARKS.find((e) => e.window === window);
  if (!entry) return [];
  return entry.marks.map((m) => ({
    area: m.area,
    severity: m.severity,
    message: SAMPLE_MESSAGE[m.area][m.severity],
  }));
}

/** 이전 세션 마킹을 bar 인덱스로 키잉한 Map — 윈도우 마킹을 그 윈도우의 모든 마디로 펼침 */
export function previousMarksByBar(): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  for (const entry of PREVIOUS_SESSION_MARKS) {
    const startBar = entry.window * ANALYSIS_WINDOW_BARS;
    const marks = entry.marks.map((m) => ({
      ...m,
      message: SAMPLE_MESSAGE[m.area][m.severity],
    }));
    for (let b = startBar; b < startBar + ANALYSIS_WINDOW_BARS; b++) {
      map.set(b, marks);
    }
  }
  return map;
}

/**
 * 영역별 마킹 개수 요약(summary)으로부터 bar 인덱스 마킹 Map을 생성.
 * 라이브 세션은 FEEDBACK_SEQUENCE를 쓰지만, 과거 기록(마이페이지)은 영역별 개수만 갖고 있어
 * 기록마다 다른 마킹 분포를 보이도록 결정적으로 펼친다. (첫 개는 살짝, 이후는 심각)
 */
export function marksFromSummary(summary: Record<Area, number>): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  const totalWindows = Math.ceil(SONG.bars.length / ANALYSIS_WINDOW_BARS);
  // 영역마다 시작 윈도우를 달리해 분포가 겹쳐도 한 마디 최대 3줄(영역별 1줄)을 넘지 않게 한다.
  const startWindow: Record<Area, number> = { pitch: 1, rhythm: 3, posture: 5 };
  (['pitch', 'rhythm', 'posture'] as Area[]).forEach((area) => {
    for (let n = 0; n < summary[area]; n++) {
      const window = startWindow[area] + n;
      if (window >= totalWindows) break;
      const severity: Severity = n === 0 ? 'mild' : 'major';
      const startBar = window * ANALYSIS_WINDOW_BARS;
      for (let b = startBar; b < startBar + ANALYSIS_WINDOW_BARS && b < SONG.bars.length; b++) {
        const arr = map.get(b) ?? [];
        arr.push({ area, severity, message: SAMPLE_MESSAGE[area][severity] });
        map.set(b, arr);
      }
    }
  });
  return map;
}

/**
 * 마디별 실패 기록(barFails)을 bar 인덱스 마킹 Map으로 변환 — 과거 기록의 실제 틀린 마디를 그대로 표시.
 */
export function marksFromBarFails(barFails: { bar: number; area: Area }[]): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  for (const f of barFails) {
    const arr = map.get(f.bar) ?? [];
    arr.push({ area: f.area, severity: 'major', message: SAMPLE_MESSAGE[f.area].major });
    map.set(f.bar, arr);
  }
  return map;
}

/**
 * 방금 끝난 라이브 세션의 영역별 피드백 횟수 요약.
 * 과거 기록(Recording.summary)과 같은 포맷이라 세션 후 코치 리포트 입력으로 그대로 쓴다.
 */
export function liveSessionSummary(): Record<Area, number> {
  const s: Record<Area, number> = { pitch: 0, rhythm: 0, posture: 0 };
  for (const fbs of FEEDBACK_SEQUENCE) {
    if (!fbs) continue;
    for (const fb of fbs) {
      if (fb.tone === 'normal') s[fb.area] += 1;
    }
  }
  return s;
}

/** FEEDBACK_SEQUENCE 중 윈도우 0..upToWindow(포함) 까지의 mark들을 bar 인덱스로 펼쳐 키잉 */
export function currentMarksUpToWindow(upToWindow: number): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  for (let i = 0; i <= upToWindow; i++) {
    const fbs = FEEDBACK_SEQUENCE[i];
    if (!fbs) continue;
    const startBar = i * ANALYSIS_WINDOW_BARS;
    for (const fb of fbs) {
      if ('mark' in fb && fb.mark) {
        const mark = { ...fb.mark, message: fb.message };
        for (let b = startBar; b < startBar + ANALYSIS_WINDOW_BARS; b++) {
          const arr = map.get(b) ?? [];
          arr.push(mark);
          map.set(b, arr);
        }
      }
    }
  }
  return map;
}
