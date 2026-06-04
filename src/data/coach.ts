/**
 * 세션 후 'AI 코치' 디브리핑 — 화면 기획용 목 데이터.
 *
 * 컨셉: 실시간 멀티 에이전트(음정/박자/자세 전문 에이전트 + 슈퍼바이저)가 연주 동안
 * 룰베이스로 교정하며 남긴 세션 기록을, 연주가 끝난 뒤 LLM 코치가 읽고
 * '디브리핑 + 다음 연습 처방'으로 번역한다. 여기서는 그 LLM 출력을
 * 영역별 피드백 개수(summary)로부터 결정적으로 생성한 목으로 대신한다.
 */
import { type Area, AREA_GA, AREA_KO, AREAS } from '@/lib/area';
import type { RecordingSummary } from '@/data/recordings';

export type CoachLevel = 'good' | 'watch' | 'focus';

export type Drill = {
  area: Area;
  title: string;
  detail: string;
};

/** 한 영역의 코칭 — 수준 + 한 줄 코멘트(어디서·뭐가·왜 또는 칭찬) + (필요 시) 연습법. */
export type CoachItem = {
  area: Area;
  level: CoachLevel;
  comment: string;
  /** 보통·아쉬움일 때만 */
  practiceTitle?: string;
  practice?: string;
};

export type CoachReport = {
  /** 한 줄 헤드라인 */
  headline: string;
  /** 디브리핑 단락 */
  summary: string;
  /** 음정·박자·자세 3영역 (탭 순서 고정) */
  items: CoachItem[];
  /** 기본으로 선택할(가장 아쉬운) 영역 */
  primaryArea: Area;
};

const COMMENT: Record<Area, Record<CoachLevel, string>> = {
  pitch: {
    good: '음이 처음부터 끝까지 정확했어요. 듣기 좋았어요.',
    watch: '거의 정확했는데, 음을 길게 끌 때 가끔 살짝 높아졌어요.',
    focus:
      '음이 자주 어긋났어요. 특히 길게 끄는 음에서 처음엔 맞다가 점점 낮아지는 게 반복됐어요. 짚는 손가락 위치가 조금씩 밀린 거예요.',
  },
  rhythm: {
    good: '박자를 흔들림 없이 잘 맞췄어요.',
    watch: '대체로 좋았는데, 빠른 부분에서 살짝 서둘렀어요.',
    focus:
      '박자가 자주 흔들렸어요. 빠른 부분에서 점점 빨라지거나 음 사이 간격이 들쭉날쭉했어요. 마음이 급해질 때 나오는 거예요.',
  },
  posture: {
    good: '자세가 편안하고 안정적이었어요.',
    watch: '대체로 좋았는데, 가끔 왼쪽 손목이 안으로 꺾였어요.',
    focus:
      '손목이나 어깨에 힘이 자주 들어갔어요. 몸이 굳으면 음정·박자도 같이 흔들리니까, 여기부터 편하게 풀면 나머지도 한결 나아져요.',
  },
};

const DRILL: Record<Area, Omit<Drill, 'area'>> = {
  pitch: {
    title: '느리게, 한 음씩 정확히',
    detail:
      '평소보다 천천히, 음 하나하나를 길게 늘여 잡아보세요. 그 음이 시작부터 끝까지 같은 높이로 들리는지 귀로 확인하면서요. 튜너 앱을 켜두면 눈으로도 보여요.',
  },
  rhythm: {
    title: '메트로놈 켜고 천천히',
    detail:
      '메트로놈을 평소보다 느리게 맞춰놓고, 한 마디도 안 틀릴 때까지 그 속도로 쳐보세요. 익숙해지면 조금씩 빠르게요. 발로 박을 같이 밟으면 덜 흔들려요.',
  },
  posture: {
    title: '거울 보고 자세 잡기',
    detail:
      '거울 앞에서 악기만 들고(활은 안 켜도 돼요) 30초만 바른 자세로 가만히 있어보세요. 손목은 일자로, 어깨는 툭 내리고요. 몸이 그 느낌을 기억하게요.',
  },
};

/**
 * 영역 수준 — 잘함(good) / 보통(watch) / 아쉬움(focus).
 * 실제로는 세션 데이터를 보고 LLM이 이 셋 중 하나로 분류한다.
 * MVP에서는 영역별 피드백 개수로 분류를 흉내 낸다.
 */
function levelOf(count: number): CoachLevel {
  if (count <= 0) return 'good';
  if (count === 1) return 'watch';
  return 'focus';
}

/**
 * 연주 기록의 영역별 피드백 개수로부터 코치 리포트를 결정적으로 생성.
 * 피드백이 가장 많은 영역을 핵심 숙제(primaryArea)로 잡고, 동점이면 균형 메시지로 분기한다.
 */
export function buildCoachReport(summary: RecordingSummary): CoachReport {
  // 피드백 많은 순(동점은 음정 > 박자 > 자세 고정 순서).
  const ranked = AREAS.map((area) => ({
    area,
    count: summary[area],
    level: levelOf(summary[area]),
  })).sort((a, b) => b.count - a.count);

  const maxCount = ranked[0].count;
  const total = ranked.reduce((s, d) => s + d.count, 0);
  const primaryArea = maxCount > 0 ? ranked[0].area : null;
  const tiedTop = ranked.filter((d) => d.count === maxCount).length;
  const balanced = maxCount > 0 && tiedTop >= 2;

  // 음정·박자·자세 3영역 모두 — 탭으로 보여주므로 잘함 영역도 포함(연습법은 보통·아쉬움만).
  const items: CoachItem[] = AREAS.map((area) => {
    const level = levelOf(summary[area]);
    const base: CoachItem = { area, level, comment: COMMENT[area][level] };
    return level === 'good'
      ? base
      : { ...base, practiceTitle: DRILL[area].title, practice: DRILL[area].detail };
  });

  let headline: string;
  let summaryText: string;

  if (total === 0) {
    headline = '오늘 정말 잘 쳤어요!';
    summaryText =
      '음정·박자·자세 어디 하나 크게 흔들리지 않고 끝까지 깔끔하게 쳤어요. 지금 이 느낌을 기억하는 게 제일 좋은 연습이에요. 가볍게 한 번 더 즐기면서 쳐봐요.';
  } else if (balanced) {
    headline = '조금씩만 더 다듬으면 돼요';
    summaryText = [
      '이번엔 어느 한 군데가 크게 무너지진 않았고, 음정·박자·자세에서 조금씩 아쉬운 순간들이 있었어요.',
      summary.posture >= 2
        ? '특히 몸에 힘이 들어갈 때 소리도 같이 흔들렸어요. 자세부터 편하게 풀면 나머지도 따라와요.'
        : '',
      '아래에서 짚어주는 것만 하나씩 신경 쓰면 다음엔 훨씬 깔끔해질 거예요.',
    ]
      .filter(Boolean)
      .join(' ');
  } else {
    const primaryKo = AREA_KO[primaryArea as Area];
    const ga = AREA_GA[primaryArea as Area];
    headline = `이번엔 ${primaryKo}${ga} 제일 아쉬웠어요`;
    summaryText = [
      `이번엔 ${primaryKo}${ga} 가장 자주 흔들렸어요(${maxCount}번).`,
      primaryArea === 'posture'
        ? '몸에 힘이 들어갈 때 소리도 같이 흔들렸어요. 자세부터 편하게 풀면 나머지도 따라와요.'
        : `아래에서 ${primaryKo} 위주로 짚어줄게요.`,
      '한 번에 다 말고 그것부터 잡아봐요.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return { headline, summary: summaryText, items, primaryArea: ranked[0].area };
}
