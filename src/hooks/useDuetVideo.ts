import { useCallback, useState } from 'react';
import { getDuetVideo, DuetVideo } from '@/api/duetVideos';

export function useDuetVideo() {
  const [data, setData] = useState<DuetVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (duetCompositeId: number) => {
    if (!duetCompositeId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getDuetVideo(duetCompositeId);
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? '협주 영상 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    load,
    reset,
  };
}