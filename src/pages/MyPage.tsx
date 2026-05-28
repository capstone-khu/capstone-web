import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MY_RECORDINGS, REPEAT_WEAK, type RecordingSummary } from '@/data/recordings';
import type { Area } from '@/data/session';
import { ChevronLeftIcon } from '@/components/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlaySession } from '@/store/usePlaySession';
import { AppHeader } from '@/components/AppHeader';

const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
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

/** 세션 간 반복 실패 마디 → 집중 반복 레슨 추천 배너 */
function RepeatBarCoach({
  bar,
  lessons,
  onStart,
}: {
  bar: number;
  lessons: number;
  onStart: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed">
          <span className="font-bold">마디 {bar + 1}</span>을 최근{' '}
          <span className="font-bold">{lessons}번</span> 레슨에서 놓쳤어요. 이 마디만 집중해서 반복
          연습해볼까요?
        </p>
        <Button size="sm" className="shrink-0" onClick={onStart}>
          집중 반복 레슨
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const startSolo = usePlaySession((s) => s.startSolo);
  const startFocus = usePlaySession((s) => s.startFocus);

  const startFocusLesson = (bar: number) => {
    startFocus(bar);
    navigate('/play');
  };
  const repeat = REPEAT_WEAK;

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
          {repeat && (
            <RepeatBarCoach
              bar={repeat.bar}
              lessons={repeat.lessons}
              onStart={() => startFocusLesson(repeat.bar)}
            />
          )}
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
