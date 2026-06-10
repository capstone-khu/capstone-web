import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

import { AREAS, AREA_PILL, AREA_KO } from '@/lib/area';
import { ChevronLeftIcon } from '@/components/icons';

import { useAuthStore } from '@/store/useAuthStore';
import { AppHeader } from '@/components/AppHeader';

import { type RecordingItem, type RecordingItemSummary } from '@/api/history';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import { formatRelativeAndAbsolute } from '@/lib/utils'; 
import Loading from '@/components/ui/loading';
import { useDuetVideo } from '@/hooks/useDuetVideo';
import { usePlaySession } from '@/store/usePlaySession';
import { createSession } from '@/api/session';


export default function MyPage() {
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [page, setPage] = useState(1);
  const [videoOpen, setVideoOpen] = useState(false);
  const startFocus = usePlaySession((s) => s.startFocus);
  const startSolo = usePlaySession((s) => s.startSolo);

  // 연주 이력 조회 데이터
  const { items, size, total, loading: recordLoading } = useRecordHistory(page);  
  // 협주 영상 조회 데이터 
  const {
    data: duetVideo,
    loading: videoLoading,
    error,
    load,
    reset,
  } = useDuetVideo();

  if (!items || recordLoading) return <Loading />;

  // 서버가 절대 URL(MEDIA_BASE_URL)로 줄 수도 있으니 상대 경로일 때만 API 오리진을 붙인다
  const videoUrl = duetVideo?.composite_video_url
    ? duetVideo.composite_video_url.startsWith('http')
      ? duetVideo.composite_video_url
      : `${import.meta.env.VITE_API_URL}${duetVideo.composite_video_url}`
    : '';
  
  // pagination 연산 
  const pageCount = Math.ceil(total / size);
  const pagedItems = items;


  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleOpenDuetVideo = async (duetCompositeId?: number) => {
    if (!duetCompositeId) return;

    await load(duetCompositeId);
    setVideoOpen(true)
  }

  // 내 기록은 단독 연주 결과로 표시 — 협주 배지가 남지 않도록 모드 초기화.
  // 어느 기록을 열었는지 결과 화면에 넘겨 '과거 기록' 맥락으로 보여준다.
  const viewResult = (session_id: string) => {
    navigate(`/result/${session_id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="마이페이지"
        onBack={() => navigate('/')}
        right={
          <>
            <span className="hidden text-sm font-semibold sm:inline">{user?.name ?? '게스트'} 님</span>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </>
        }
      />

      <main className="container max-w-2xl space-y-6 py-6">
        {/* 연주 이력 */}
        <section className="space-y-3">
          <ul key={page} className="animate-page-in space-y-2.5">
            {pagedItems.map((item: RecordingItem) => (
              <li key={item.session_id}>
                <Card className="transition-colors hover:bg-gray-50">
                  <CardContent className="space-y-3 p-4">
                    <div
                      className="block w-full space-y-3 text-left transition-transform active:scale-[0.99]"
                    >
                      {/* 곡명 · 날짜 (좌) · 영역별 피드백 확인하기 (우) */}
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-base font-bold">
                          {item.song_title}{' '}
                          <span className="font-medium text-muted-foreground text-xs pl-2">· {formatRelativeAndAbsolute(item.played_at)}</span>
                          
                          {/* mode가 duet이면 협주 */}
                          {item.mode === "duet" && (
                            <span className="ml-2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background">
                              협주 · {item.partner_name}
                            </span>
                          )}

                        </p>

                        <button
                          type="button"
                          onClick={() => viewResult(item.session_id)} 
                          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground"
                        >
                          영역별 피드백 확인하기
                          <ChevronLeftIcon className="h-4 w-4 rotate-180 text-gray-400" />
                        </button>
                      </div>

                      <AreaStatGrid summary={item.stats} />

                      {/* API focus_measures는 1-based measure_index — 프론트 focusBars는 0-based */}
                      {item.focus_measures?.length > 0 && (
                        <RepeatBarCoach
                          focusMeasures={item.focus_measures.map((m) => m - 1)}
                          onStart={async () => {
                            // 집중 반복 레슨은 항상 솔로 세션으로 생성 —
                            // 이력 응답에는 duet 세션 생성에 필요한 partner_recording_id가 없음
                            const res = await createSession({ song_id: Number(item.song_id), mode: 'solo' });
                            if (!res.success) {
                              alert(res.message);
                              return;
                            }
                            startSolo(res.data.session_id);
                            startFocus(item.focus_measures.map((m) => m - 1));
                            navigate(`/play/${item.song_id}`);
                          }}
                        />
                      )}
                    </div>

                    {/* mode가 duet일 때 */}
                    {item.mode === "duet" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenDuetVideo(item.duet_composite_id)}
                      >
                        협주 영상 보기
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          {pageCount > 0 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${i + 1}페이지`}
                    onClick={() => setPage(i + 1)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i + 1 === page ? 'bg-foreground' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </section>
      </main>

        <Modal
          open={videoOpen}
          onClose={() => {
            setVideoOpen(false);
            reset();
          }}
          title="협주 영상"
        >
          {videoLoading && <Loading />}

          {error && (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          )}

          {duetVideo && (
            <div className="space-y-3 p-4">
              <div className="text-sm text-muted-foreground">
                {duetVideo.partner_name}님과  「 {duetVideo.song_title} 」을 협주한 영상입니다.
              </div>

              {duetVideo.status === 'ready' ? (
                <video controls className="w-full rounded-lg" src={videoUrl} />
              ) : duetVideo.status === 'failed' ? (
                <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
                  영상 합성에 실패했어요. 잠시 후 다시 시도해주세요.
                </p>
              ) : (
                // pending · processing — ready가 되면 자동 전환(폴링)
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    협주 영상을 만들고 있어요
                  </p>
                </div>
              )}
            </div>
          )}
      </Modal>
    </div>
  );
}


/** 영역별 피드백 개수 — 음정/박자/자세 3블록, 숫자를 블록 안에 크게. */
function AreaStatGrid({ summary }: { summary: RecordingItemSummary }) {
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

/** 세션 간 반복 실패 마디(들) → 집중 반복 레슨 추천 배너 */
function RepeatBarCoach({
  focusMeasures,
  onStart,
}: {
  focusMeasures: number[];
  onStart: () => void;
}) {
  const barLabels = focusMeasures
    .map((bar) => `마디 ${bar + 1}`)
    .join(', ');

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed">
          {focusMeasures.length === 1 ? (
            <>
              <span className="font-bold">{barLabels}</span>을 반복해서 틀렸어요.
              이 마디만 집중해서 연습해볼까요?
            </>
          ) : (
            <>
              <span className="font-bold">{barLabels}</span>를 반복해서 틀렸어요.
              이 마디들을 집중해서 연습해볼까요?
            </>
          )}
        </p>

        <Button size="sm" className="shrink-0" onClick={onStart}>
          집중 반복 레슨
        </Button>
      </CardContent>
    </Card>
  );
}