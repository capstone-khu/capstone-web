import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MY_RECORDINGS, formatDuration } from '@/data/recordings';
import { UserIcon } from '@/components/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlaySession } from '@/store/usePlaySession';
import { AppHeader } from '@/components/AppHeader';
import { SummaryChips } from '@/pages/EnsemblePage';

export default function MyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const startSolo = usePlaySession((s) => s.startSolo);

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
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{user?.name ?? '게스트'} 님</p>
              <p className="tabular text-sm text-muted-foreground">
                연주 기록 {MY_RECORDINGS.length}회
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* 연주 이력 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground">연주 이력</h2>
          <ul className="space-y-3">
            {MY_RECORDINGS.map((rec) => (
              <li key={rec.id}>
                <button type="button" onClick={() => viewResult(rec.id)} className="block w-full text-left">
                  <Card className="transition-colors hover:bg-gray-50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold">{rec.songTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.date} · {formatDuration(rec.durationSec)}
                        </p>
                        <div className="mt-2">
                          <SummaryChips summary={rec.summary} />
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-muted-foreground">
                        결과 보기 →
                      </span>
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
