import { useEffect, useState } from 'react';
import { type SessionResult, getSessionResult } from '@/api/session';

export function useSessionResult(sessionId: number) {
  const [sessionResult, setSessionResult] =
    useState<SessionResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionResult = async () => {
      try {
        setLoading(true);

        const data = await getSessionResult(sessionId);
        setSessionResult(data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionResult();
  }, [sessionId]);

  return {
    sessionResult,
    loading,
    error,
  };
}