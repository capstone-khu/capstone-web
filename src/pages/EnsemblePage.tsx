import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { usePlaySession } from '@/store/usePlaySession';
import { useSongPartners } from '@/hooks/useSongPartners';
import { type Partner } from '@/api/songs/song.type';
import { formatRelativeAndAbsolute } from '@/lib/utils'
import Loading from '@/components/ui/loading';
import { createSession } from '@/api/session';

export default function EnsemblePage() {
  const { id } = useParams();
  const { partnersData, loading } = useSongPartners(id);

  const navigate = useNavigate();
  const startEnsemble = usePlaySession((s) => s.startEnsemble);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => window.clearTimeout(timerRef.current ?? undefined), []);


  if (loading || !partnersData) return <Loading />;
  // 협주할 파트너 선택
  const { song_title, partners } = partnersData;


  // 협주 상대 선택 → 음원 로딩 인디케이터를 잠깐 보여준 뒤 연주로 진입.
  const onSelect = async (partner: Partner) => {
    setSelectedPartner(partner);
    const res = await createSession({song_id: Number(id), mode: 'duet', partner_recording_id: Number(partner.recording_id)})
    console.log(res);
    if(!res.success) {
      alert(res.message);
    }
    else {
      timerRef.current = window.setTimeout(() => {
        startEnsemble(partner.recording_id);
        navigate(`/play/${id}`);
      }, 1400);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader title="협주할 연주 선택" onBack={() => navigate('/')} />

      <main className="container flex max-w-2xl flex-1 flex-col justify-center gap-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">누구와 함께 연주할까요?</h1>
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-foreground">「{song_title}」</span>을 함께 연주할 상대를
            선택하세요.
          </p>
        </div>

        {!loading && (!partners || partners.length === 0) ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              아직 이 곡으로 협주할 수 있는 녹음이 없어요.
            </CardContent>
          </Card>
        ) : (
        <ul className="space-y-3.5">
          {partners.map((partner) => (
            <li key={partner.recording_id}>
              <button
                type="button"
                onClick={() => onSelect(partner)}
                className="block w-full text-left transition-transform active:scale-[0.99]"
              >
                <Card className="transition-colors hover:bg-gray-50">
                  <CardContent className="flex items-center gap-5 p-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-bold">{partner.user_name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                         {formatRelativeAndAbsolute(partner.recorded_at)}
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

      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-background px-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-dot-bounce rounded-full bg-foreground [animation-delay:-0.32s]" />
            <span className="h-3 w-3 animate-dot-bounce rounded-full bg-foreground [animation-delay:-0.16s]" />
            <span className="h-3 w-3 animate-dot-bounce rounded-full bg-foreground" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-lg font-bold">협주 음원을 불러오고 있어요</p>
            <p className="text-sm text-muted-foreground">
              {selectedPartner.user_name} 님과 함께 연주할 준비 중이에요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

