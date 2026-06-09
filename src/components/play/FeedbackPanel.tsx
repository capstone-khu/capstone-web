import { CheckIcon, HistoryIcon } from '@/components/icons';
import {
  type Area,
  AREA_KO,
  AREA_DOT,
  AREA_ICON,
  AREA_BG_LIGHT,
} from '@/lib/area';
import { type Caution, type Feedback } from '@/data/session';

function AreaBadge({ area }: { area: Area }) {
  const Icon = AREA_ICON[area];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-background ${AREA_DOT[area]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {AREA_KO[area]}
    </span>
  );
}

const FEEDBACK_BASE =
  'animate-feedback-in flex min-h-[110px] min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl px-5 py-4 text-center';

const TEXT_STYLE = 'text-sm font-bold leading-snug tracking-tight';

export function CurrentFeedback({
  feedbacks,
  barIndex,
}: {
  feedbacks: Feedback[];
  barIndex: number;
}) {
  if (feedbacks.length === 0) {
    return (
      <div
        key={`empty-${barIndex}`}
        className="animate-feedback-in flex min-h-[110px] min-w-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-background px-5 text-sm text-muted-foreground"
      >
        다음 마디의 피드백을 분석 중…
      </div>
    );
  }

  if (feedbacks.length === 1 && feedbacks[0].tone === 'positive') {
    return (
      <div
        key={`fb-${barIndex}`}
        className={`${FEEDBACK_BASE} border border-border bg-card shadow-soft`}
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs font-bold text-background">
          <CheckIcon className="h-3.5 w-3.5" />
          칭찬
        </span>

        <p className={TEXT_STYLE}>{feedbacks[0].message}</p>
      </div>
    );
  }

  if (feedbacks.length === 1 && feedbacks[0].tone === 'supervisor') {
    return (
      <div
        key={`fb-${barIndex}`}
        className={`${FEEDBACK_BASE} border border-border bg-muted/50`}
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-foreground/80 px-2 py-1 text-xs font-bold text-background">
          코치
        </span>

        <p className={TEXT_STYLE}>{feedbacks[0].message}</p>
      </div>
    );
  }

  const issues = feedbacks
    .filter(
      (fb): fb is Extract<Feedback, { tone: 'normal' }> =>
        fb.tone === 'normal'
    )
    .sort((a, b) => (a.reward ?? 0) - (b.reward ?? 0));

  const multi = issues.length > 1;

  const bg =
    issues.length > 0
      ? multi
        ? 'border border-border bg-card shadow-soft'
        : AREA_BG_LIGHT[issues[0].area]
      : 'bg-card';

  return (
    <div key={`fb-${barIndex}`} className={`${FEEDBACK_BASE} ${bg}`}>
      {issues.map((fb, i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1.5 ${
            i > 0 ? 'w-full border-t border-border/60 pt-3' : ''
          }`}
        >
          <AreaBadge area={fb.area} />

          <p className={TEXT_STYLE}>{fb.message}</p>
        </div>
      ))}
    </div>
  );
}

export function FeedbackCaption({
  tone,
}: {
  tone: 'previous' | 'current';
}) {
  if (tone === 'previous') {
    return (
      <p className="flex items-center justify-center gap-1 text-center text-sm font-bold text-muted-foreground">
        <HistoryIcon className="h-4 w-4" />
        지난 연주 피드백이에요!
      </p>
    );
  }

  return (
    <p className="text-center text-sm font-bold text-foreground">
      현재 연주 피드백이에요!
    </p>
  );
}

export function PreviousCaution({ cautions }: { cautions: Caution[] }) {
  if (cautions.length === 0) {
    return (
      <div className="flex min-h-[110px] min-w-0 flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40 px-5 text-center text-sm text-muted-foreground">
        이 구간은 지난 연주에 받은 피드백이 없어요
      </div>
    );
  }

  return (
    <div className="animate-feedback-in flex min-h-[110px] min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-4 text-center">
      {cautions.map((c, i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1.5 ${
            i > 0 ? 'w-full border-t border-border/60 pt-3' : ''
          }`}
        >
          <AreaBadge area={c.area} />

          <p className={TEXT_STYLE}>{c.message}</p>
        </div>
      ))}
    </div>
  );
}