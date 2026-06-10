import { useCallback, useEffect, useRef, useState } from 'react';
import { getDuetVideo, DuetVideo } from '@/api/duetVideos';

/** 합성 잡 폴링 주기(ms) — pending/processing 동안 자동 재조회 */
const POLL_INTERVAL_MS = 3000;

export function useDuetVideo() {
  const [data, setData] = useState<DuetVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const load = useCallback(
    async (duetCompositeId: number, silent = false) => {
      if (!duetCompositeId) return;
      stopPolling();

      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }

        const result = await getDuetVideo(duetCompositeId);
        setData(result);

        // ready/failed가 될 때까지 자동 폴링 — 모달이 알아서 전환된다
        if (result.status === 'pending' || result.status === 'processing') {
          timerRef.current = window.setTimeout(
            () => load(duetCompositeId, true),
            POLL_INTERVAL_MS
          );
        }
      } catch (e: any) {
        setError(e?.message ?? '협주 영상 조회 실패');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [stopPolling]
  );

  const reset = useCallback(() => {
    stopPolling();
    setData(null);
    setError(null);
    setLoading(false);
  }, [stopPolling]);

  // 언마운트 시 폴링 정리
  useEffect(() => stopPolling, [stopPolling]);

  return {
    data,
    loading,
    error,
    load,
    reset,
  };
}
