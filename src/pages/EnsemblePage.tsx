import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { OTHER_RECORDINGS, type Recording, type RecordingSummary } from '@/data/recordings';
import type { Area } from '@/data/session';
import { SONG } from '@/data/song';
import { UserIcon } from '@/components/icons';
import { AppHeader } from '@/components/AppHeader';
import { usePlaySession } from '@/store/usePlaySession';

const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
const AREA_DOT: Record<Area, string> = {
  pitch: 'bg-pitch',
  rhythm: 'bg-rhythm',
  posture: 'bg-posture',
};

export default function EnsemblePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const startEnsemble = usePlaySession((s) => s.startEnsemble);

  // 홈에서 고른 곡 맥락을 이어받는다 (직접 진입 시 기본 곡으로 폴백).
  const songState = location.state as { songId?: string; songTitle?: string } | null;
  const songId = songState?.songId ?? 'twinkle';
  const songTitle = songState?.songTitle ?? SONG.title;
  const recordings = OTHER_RECORDINGS.filter((r) => r.songId === songId);

  const onSelect = (rec: Recording) => {
    startEnsemble(rec.id);
    navigate('/play');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader title="협주할 연주 선택" onBack={() => navigate('/')} />

      <main className="container flex max-w-2xl flex-1 flex-col justify-center gap-6 py-10">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">누구와 함께 연주할까요?</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">「{songTitle}」</span>을 함께 연주할 상대를
            선택하세요. 선택한 연주자의 녹음에 맞춰 듀엣으로 진행됩니다.
          </p>
        </div>

        {recordings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              아직 이 곡으로 협주할 수 있는 녹음이 없어요.
            </CardContent>
          </Card>
        ) : (
        <ul className="space-y-3">
          {recordings.map((rec) => (
            <li key={rec.id}>
              <button type="button" onClick={() => onSelect(rec)} className="block w-full text-left">
                <Card className="transition-colors hover:bg-gray-50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold">{rec.playerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {rec.songTitle} · {rec.date}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background">
                      함께 연주하기
                    </span>
                  </CardContent>
                </Card>
              </button>
            </li>
          ))}
        </ul>
        )}
      </main>
    </div>
  );
}

export function SummaryChips({ summary }: { summary: RecordingSummary }) {
  const areas = (Object.keys(summary) as Area[]).filter((a) => summary[a] > 0);
  if (areas.length === 0) {
    return <span className="text-xs font-semibold text-muted-foreground">마킹 없음 · 깔끔한 연주</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {areas.map((a) => (
        <span key={a} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${AREA_DOT[a]}`} />
          {AREA_KO[a]} {summary[a]}
        </span>
      ))}
    </div>
  );
}
