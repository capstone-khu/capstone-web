/**
 * MVP 세션 더미 데이터 — 분석 윈도우(3마디) 단위 피드백.
 * 화면 기획용. 실제 분석 결과 대신 시나리오 기반 시드.
 */
import { SONG } from '@/data/song';

export type Area = 'pitch' | 'rhythm' | 'posture';
export type Severity = 'mild' | 'major';
export type Mark = { area: Area; severity: Severity };

export type Feedback =
  | { tone: 'normal'; area: Area; label: string; action: string; message: string; mark?: Mark }
  | { tone: 'positive'; action: string; message: string }
  | {
      tone: 'switch';
      from: Area;
      to: Area;
      label: string;
      action: string;
      message: string;
      mark?: Mark;
    };

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
 * 18종 SA-XX 액션을 다양하게 등장시켜 톤·영역 분포를 시연.
 */
export const FEEDBACK_SEQUENCE: (Feedback | null)[] = [
  // W0: 마디 1-3 — 시작 (분석 부족)
  null,

  // W1: SA-01 PITCH_UP — 음정 낮음(FLAT) → 올리기
  {
    tone: 'normal',
    area: 'pitch',
    label: '음정',
    action: '음정 올리기',
    message: '음정을 올리세요',
    mark: { area: 'pitch', severity: 'mild' },
  },

  // W2: SA-03 PITCH_FIX_DRIFT — 음정 흘러내림
  {
    tone: 'normal',
    area: 'pitch',
    label: '음정',
    action: '손가락 고정',
    message: '음정이 흘러내리고 있습니다. 손가락 위치를 고정하세요',
    mark: { area: 'pitch', severity: 'major' },
  },

  // W3: SA-04 POSITIVE_PITCH — 음정 개선됨, 칭찬
  { tone: 'positive', action: '잘하고 있어요', message: '잘 하고 있습니다. 계속 유지하세요' },

  // W4: SA-06 RHYTHM_WAIT — 박자 일찍 연주
  {
    tone: 'normal',
    area: 'rhythm',
    label: '박자',
    action: '천천히 기다리기',
    message: '박자보다 일찍 연주하고 있습니다. 박자를 맞추세요',
    mark: { area: 'rhythm', severity: 'mild' },
  },

  // W5: SA-08 TEMPO_SLOW_DOWN — 템포 빠름
  {
    tone: 'normal',
    area: 'rhythm',
    label: '박자',
    action: '템포 늦추기',
    message: '템포가 빠릅니다. 속도를 늦추세요',
    mark: { area: 'rhythm', severity: 'major' },
  },

  // W6: SA-11 SWITCH_RHYTHM_TO_POSTURE — 박자 반복 실패 → 자세 점검
  {
    tone: 'switch',
    from: 'rhythm',
    to: 'posture',
    label: '박자 → 자세',
    action: '자세 점검',
    message: '박자 교정이 반복 실패하고 있습니다. 자세를 점검하세요',
    mark: { area: 'posture', severity: 'major' },
  },

  // W7: SA-15 SHOULDER_RELAX — 자세 세부 (어깨 내리기)
  {
    tone: 'normal',
    area: 'posture',
    label: '자세',
    action: '어깨 내리기',
    message: '어깨를 내리세요',
    mark: { area: 'posture', severity: 'mild' },
  },
];

/**
 * opacity 클래스 매핑 — 이전 세션은 옅게(/30), 이번 세션은 심각도에 따라(/60 / full).
 * tailwind JIT가 정적 분석으로 잡아내도록 명시적으로 나열.
 */
const PREV_CLASS: Record<Area, string> = {
  pitch: 'bg-pitch/30',
  rhythm: 'bg-rhythm/30',
  posture: 'bg-posture/30',
};
const CURRENT_MILD_CLASS: Record<Area, string> = {
  pitch: 'bg-pitch/60',
  rhythm: 'bg-rhythm/60',
  posture: 'bg-posture/60',
};
const CURRENT_MAJOR_CLASS: Record<Area, string> = {
  pitch: 'bg-pitch',
  rhythm: 'bg-rhythm',
  posture: 'bg-posture',
};

export function markClass(area: Area, severity: Severity, layer: 'previous' | 'current'): string {
  if (layer === 'previous') return PREV_CLASS[area];
  return severity === 'major' ? CURRENT_MAJOR_CLASS[area] : CURRENT_MILD_CLASS[area];
}

/** 이전 세션 마킹을 bar 인덱스로 키잉한 Map — 윈도우 마킹을 그 윈도우의 모든 마디로 펼침 */
export function previousMarksByBar(): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  for (const entry of PREVIOUS_SESSION_MARKS) {
    const startBar = entry.window * ANALYSIS_WINDOW_BARS;
    for (let b = startBar; b < startBar + ANALYSIS_WINDOW_BARS; b++) {
      map.set(b, entry.marks);
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
        arr.push({ area, severity });
        map.set(b, arr);
      }
    }
  });
  return map;
}

/** FEEDBACK_SEQUENCE 중 윈도우 0..upToWindow(포함) 까지의 mark들을 bar 인덱스로 펼쳐 키잉 */
export function currentMarksUpToWindow(upToWindow: number): Map<number, Mark[]> {
  const map = new Map<number, Mark[]>();
  for (let i = 0; i <= upToWindow; i++) {
    const fb = FEEDBACK_SEQUENCE[i];
    if (fb && 'mark' in fb && fb.mark) {
      const startBar = i * ANALYSIS_WINDOW_BARS;
      for (let b = startBar; b < startBar + ANALYSIS_WINDOW_BARS; b++) {
        const arr = map.get(b) ?? [];
        arr.push(fb.mark);
        map.set(b, arr);
      }
    }
  }
  return map;
}
