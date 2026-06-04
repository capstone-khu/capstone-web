import { useState, useCallback, useEffect } from 'react';

export type Stage = 'permission' | 'playing';

// 미디어 권한 요청 및 관리 훅
export const useMediaPermission = () => {
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>('permission');

  const requestPermission = useCallback(async () => {
    setRequesting(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);
      setStage('playing');

      return mediaStream;
    } catch {
      setError(
        '카메라 또는 마이크 권한이 거절되었습니다. 브라우저 주소창의 권한 아이콘에서 허용 후 다시 시도해주세요.'
      );

      return null;
    } finally {
      setRequesting(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });

    setStage('permission');
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    stream,
    error,
    requesting,
    stage,
    requestPermission,
    cleanup,
  };
};