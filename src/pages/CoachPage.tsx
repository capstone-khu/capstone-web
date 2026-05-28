import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { PitchIcon, RhythmIcon, PostureIcon } from '@/components/icons';
import { SONG } from '@/data/song';
import { liveSessionSummary, type Area } from '@/data/session';
import { getRecording } from '@/data/recordings';
import { buildCoachReport, type CoachLevel } from '@/data/coach';

const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
const AREA_TEXT: Record<Area, string> = {
  pitch: 'text-pitch',
  rhythm: 'text-rhythm',
  posture: 'text-posture',
};
const AREA_PILL: Record<Area, string> = {
  pitch: 'bg-pitch/10 text-pitch',
  rhythm: 'bg-rhythm/10 text-rhythm',
  posture: 'bg-posture/10 text-posture',
};
const LEVEL_LABEL: Record<CoachLevel, string> = {
  good: '잘함',
  watch: '보통',
  focus: '아쉬움',
};

function AreaIcon({ area, className }: { area: Area; className?: string }) {
  const Icon = area === 'pitch' ? PitchIcon : area === 'rhythm' ? RhythmIcon : PostureIcon;
  return <Icon className={className} />;
}

/**
 * AI 상세 분석 — 세션 후 코칭 화면.
 * /result의 'AI 상세 분석' 버튼으로 진입. location.state.recordingId 유무로
 * '과거 기록(마이페이지 → 결과 경유)' / '방금 끝난 연주' 맥락을 구분한다.
 * 진입 시 LLM 분석을 흉내 내는 3-dot 로딩을 잠깐 보여준 뒤 리포트를 노출한다.
 */
export default function CoachPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const historyId = (location.state as { recordingId?: string } | null)?.recordingId ?? null;
  const historyRec = historyId ? getRecording(historyId) : null;
  const isHistory = !!historyRec;

  const report = useMemo(
    () => buildCoachReport(isHistory ? historyRec.summary : liveSessionSummary()),
    [isHistory, historyRec],
  );

  // 영역 탭 — 기본은 가장 아쉬운 영역.
  const [tab, setTab] = useState<Area>(report.primaryArea);
  const active = report.items.find((it) => it.area === tab);

  // LLM 호출을 흉내 내는 로딩 (mock). 실제 연동 시 호출 완료 시점에 해제.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1300);
    return () => clearTimeout(t);
  }, []);

  const exitLabel = isHistory ? '목록으로' : '홈으로';
  const exit = () => navigate(isHistory ? '/mypage' : '/');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        onBack={() => navigate(-1)}
        title={isHistory ? `${historyRec.date} 연주 · AI 상세 분석` : `AI 상세 분석 · ${SONG.title}`}
        right={
          <Button size="sm" variant="outline" onClick={exit}>
            {exitLabel}
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex gap-2">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="h-3 w-3 animate-bounce rounded-full bg-foreground"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">AI가 이번 연주를 분석하고 있어요…</p>
        </div>
      ) : (
        <main className="container max-w-2xl space-y-6 py-6">
          {/* 디브리핑 */}
          <Card className="overflow-hidden">
            <div className="bg-foreground px-6 py-2.5 text-left text-[11px] font-bold text-background">
              AI 상세 분석
            </div>
            <CardContent className="space-y-3 p-6">
              <h2 className="text-xl font-bold leading-snug">{report.headline}</h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{report.summary}</p>
            </CardContent>
          </Card>

          {/* 영역별 — 음정/박자/자세 탭으로 전환 */}
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-bold text-muted-foreground">영역별로 살펴봐요</h3>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {report.items.map((it) => (
                <button
                  key={it.area}
                  type="button"
                  onClick={() => setTab(it.area)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-colors ${
                    tab === it.area
                      ? `bg-white shadow-sm ${AREA_TEXT[it.area]}`
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <AreaIcon area={it.area} className="h-4 w-4" />
                  {AREA_KO[it.area]}
                </button>
              ))}
            </div>
            {active && (
              <Card key={active.area} className="animate-feedback-in">
                <CardContent className="space-y-2.5 p-5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${AREA_PILL[active.area]}`}
                  >
                    {LEVEL_LABEL[active.level]}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">{active.comment}</p>
                  {active.practice && (
                    <div className="rounded-xl bg-gray-50 px-3.5 py-3">
                      <p className="text-xs font-bold text-muted-foreground">
                        {active.practiceTitle}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {active.practice}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* 하단 액션 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              결과 다시 보기
            </Button>
            <Button size="lg" onClick={exit}>
              {exitLabel}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}
