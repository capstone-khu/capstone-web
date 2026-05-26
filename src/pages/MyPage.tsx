import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MY_RECORDINGS, type Recording, type RecordingSummary } from '@/data/recordings';
import type { Area } from '@/data/session';
import { ChevronLeftIcon } from '@/components/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlaySession } from '@/store/usePlaySession';
import { AppHeader } from '@/components/AppHeader';

const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
const AREA_JOSA: Record<Area, string> = { pitch: '을', rhythm: '를', posture: '를' };
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

const AREAS: Area[] = ['pitch', 'rhythm', 'posture'];

/** 영역별 피드백 개수 — 음정/박자/자세 3블록, 숫자를 블록 안에 크게. */
function AreaStatGrid({ summary }: { summary: RecordingSummary }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {AREAS.map((a) => (
        <div
          key={a}
          className={`flex flex-col items-center gap-1 rounded-xl py-3 ${AREA_PILL[a]}`}
        >
          <span className="text-xs font-bold">{AREA_KO[a]}</span>
          <span className="tabular text-2xl font-bold leading-none">{summary[a]}</span>
        </div>
      ))}
    </div>
  );
}

/** 이력 전체에서 영역별 피드백 개수를 합산해 가장 많은(=가장 약한) 영역을 찾는다. */
function weakestArea(recs: Recording[]): Area | null {
  const totals: Record<Area, number> = { pitch: 0, rhythm: 0, posture: 0 };
  for (const r of recs) {
    totals.pitch += r.summary.pitch;
    totals.rhythm += r.summary.rhythm;
    totals.posture += r.summary.posture;
  }
  const ranked = (Object.entries(totals) as [Area, number][]).reduce((a, b) =>
    b[1] > a[1] ? b : a,
  );
  return ranked[1] > 0 ? ranked[0] : null;
}

/** 약점 영역 코칭 배너 — "다음엔 '음정'을 좀 더 신경써 볼까요?" */
function WeakAreaCoach({ area }: { area: Area }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-center text-sm leading-relaxed">
          지금까지 <span className={`font-bold ${AREA_TEXT[area]}`}>{AREA_KO[area]}</span> 피드백이
          가장 많았어요. 다음엔{' '}
          <span className={`font-bold ${AREA_TEXT[area]}`}>{AREA_KO[area]}</span>
          {AREA_JOSA[area]} 좀 더 신경써 볼까요?
        </p>
      </CardContent>
    </Card>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const startSolo = usePlaySession((s) => s.startSolo);
  const weak = weakestArea(MY_RECORDINGS);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // 내 기록은 단독 연주 결과로 표시 — 협주 배지가 남지 않도록 모드 초기화.
  // 어느 기록을 열었는지 결과 화면에 넘겨 '과거 기록' 맥락으로 보여준다.
  const viewResult = (recordingId: string) => {
    startSolo();
    navigate('/result', { state: { recordingId } });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="마이페이지" onBack={() => navigate('/')} />

      <main className="container max-w-2xl space-y-6 py-6">
        {/* 프로필 */}
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="min-w-0 flex-1 truncate text-lg font-bold">
              {user?.name ?? '게스트'} 님
            </p>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* 연주 이력 */}
        <section className="space-y-3">
          {weak && <WeakAreaCoach area={weak} />}
          <ul className="space-y-2.5">
            {MY_RECORDINGS.map((rec) => (
              <li key={rec.id}>
                <button
                  type="button"
                  onClick={() => viewResult(rec.id)}
                  className="block w-full text-left transition-transform active:scale-[0.99]"
                >
                  <Card className="transition-colors hover:bg-gray-50">
                    <CardContent className="space-y-3 p-4">
                      {/* 곡명 · 날짜 (좌) · 영역별 피드백 확인하기 (우) */}
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-base font-bold">
                          {rec.songTitle}{' '}
                          <span className="font-medium text-muted-foreground">· {rec.date}</span>
                        </p>
                        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
                          영역별 피드백 확인하기
                          <ChevronLeftIcon className="h-4 w-4 rotate-180 text-gray-400" />
                        </span>
                      </div>

                      <AreaStatGrid summary={rec.summary} />
                    </CardContent>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
