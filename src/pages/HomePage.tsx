import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BottomSheet } from '@/components/ui/sheet';
import { AppHeader } from '@/components/AppHeader';
import { songs } from '@/api/songs/song';
import { type Song, type SongListData } from '@/api/songs/song.type';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlaySession } from '@/store/usePlaySession';
import Loading from '@/components/ui/loading';
import { useSongList } from '@/hooks/useSongList';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const startSolo = usePlaySession((s) => s.startSolo);
  const [selected, setSelected] = useState<Song | null>(null);

  // Song List 불러오기
  const { songList, loading } = useSongList();

  if (loading || !songList) return <Loading />;

  // song_list = {total: number, songs: SongData[]}
  // SongData = {id: string, title: string }
  const song_list = songList;

  const onSolo = (id: string) => {
    startSolo();
    navigate(`/play/${id}`);
  };

  // 협주: 고른 곡을 협주 선택 화면까지 들고 가 맥락을 유지한다.
  const onEnsemble = (id: string) => {
    if (!selected) return;
    navigate(`/ensemble/${id}`, { state: { songId: selected.id, songTitle: selected.title } });
  };

  // 곡이 충분히 많을 때만 검색 노출 (MVP는 1곡이라 숨김 — 동작 안 하는 입력 방지)
  const showSearch = song_list.total >= 5;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="CAPSTONE DESIGN"
        right={
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-gray-50"
          >
            {user?.name ?? '게스트'} 님, 반가워요
          </button>
        }
      />

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <header className="space-y-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight">어떤 곡을 연주할까요?</h1>
            <p className="text-sm text-muted-foreground">
              곡을 선택하면 카메라·마이크 권한을 확인한 뒤 연주를 시작할 수 있어요.
            </p>
          </header>

          {/* 검색창 — 곡이 충분히 많을 때만 노출 */}
          {showSearch && (
            <div className="relative">
              <SearchIcon />
              <input
                type="text"
                placeholder="곡 번호 · 곡명 · 작곡가로 검색"
                className="block w-full rounded-2xl border border-border bg-card py-3.5 pl-12 pr-4 text-sm font-medium shadow-soft placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
              />
            </div>
          )}

          {/* 곡 리스트 */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">전체 곡</p>
                <p className="tabular text-xs font-semibold text-muted-foreground">
                  {song_list.total}곡
                </p>
              </div>
              <ul className="divide-y divide-border">
                {song_list.songs.map((song, i) => (
                  <li key={song.id}>
                    <SongRow song={song} number={i + 1} onSelect={() => setSelected(song)} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 모드 선택 시트 */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description="어떻게 연주할까요?"
      >
        <div className="space-y-3 p-6 pt-4">
          <Button size="xl" className="w-full" onClick={() => selected && onSolo(selected.id)}>
            혼자 연주
          </Button>
          <Button size="xl" variant="outline" className="w-full" onClick={() => selected && onEnsemble(selected.id)}>
            협주하기
          </Button>
          <p className="pt-1 text-center text-xs text-muted-foreground">
            협주는 다른 연주자의 녹음에 맞춰 듀엣으로 함께 연주합니다
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}

function SongRow({
  song,
  number,
  onSelect,
}: {
  song: Song;
  number: number;
  onSelect: () => void;
}) {
  const songNum = String(number).padStart(3, '0');

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none active:bg-gray-100"
    >
      <p className="tabular min-w-[3ch] text-2xl font-black leading-none text-gray-400">{songNum}</p>
      <p className="min-w-0 flex-1 truncate text-base font-bold">{song.title}</p>
      <ChevronRight />
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-muted-foreground"
      fill="none"
      stroke="currentColor"
    >
      <path strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}

