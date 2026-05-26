import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { OTHER_RECORDINGS, type Recording } from '@/data/recordings';
import { SONG } from '@/data/song';
import { AppHeader } from '@/components/AppHeader';
import { usePlaySession } from '@/store/usePlaySession';

export default function EnsemblePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const startEnsemble = usePlaySession((s) => s.startEnsemble);
  const [loadingRec, setLoadingRec] = useState<Recording | null>(null);
  const timerRef = useRef<number | null>(null);

  // 홈에서 고른 곡 맥락을 이어받는다 (직접 진입 시 기본 곡으로 폴백).
  const songState = location.state as { songId?: string; songTitle?: string } | null;
  const songId = songState?.songId ?? 'twinkle';
  const songTitle = songState?.songTitle ?? SONG.title;
  const recordings = OTHER_RECORDINGS.filter((r) => r.songId === songId);

  useEffect(() => () => window.clearTimeout(timerRef.current ?? undefined), []);

  // 협주 상대 선택 → 음원 로딩 인디케이터를 잠깐 보여준 뒤 연주로 진입.
  const onSelect = (rec: Recording) => {
    setLoadingRec(rec);
    timerRef.current = window.setTimeout(() => {
      startEnsemble(rec.id);
      navigate('/play');
    }, 1400);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader title="협주할 연주 선택" onBack={() => navigate('/')} />

      <main className="container flex max-w-2xl flex-1 flex-col justify-center gap-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">누구와 함께 연주할까요?</h1>
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-foreground">「{songTitle}」</span>을 함께 연주할 상대를
            선택하세요.
          </p>
        </div>

        {recordings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              아직 이 곡으로 협주할 수 있는 녹음이 없어요.
            </CardContent>
          </Card>
        ) : (
        <ul className="space-y-3.5">
          {recordings.map((rec) => (
            <li key={rec.id}>
              <button
                type="button"
                onClick={() => onSelect(rec)}
                className="block w-full text-left transition-transform active:scale-[0.99]"
              >
                <Card className="transition-colors hover:bg-gray-50">
                  <CardContent className="flex items-center gap-5 p-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-bold">{rec.playerName}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {rec.songTitle} · {rec.date}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background">
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

      {loadingRec && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-background px-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-dot-bounce rounded-full bg-foreground [animation-delay:-0.32s]" />
            <span className="h-3 w-3 animate-dot-bounce rounded-full bg-foreground [animation-delay:-0.16s]" />
            <span className="h-3 w-3 animate-dot-bounce rounded-full bg-foreground" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-lg font-bold">협주 음원을 불러오고 있어요</p>
            <p className="text-sm text-muted-foreground">
              {loadingRec.playerName} 님과 함께 연주할 준비 중이에요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

