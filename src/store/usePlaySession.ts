import { create } from 'zustand';

/**
 * 연주 세션 설정 — /play 진입 전에 진입점(홈/협주 선택/결과)에서 세팅한다.
 * location.state 대신 스토어로 들고 있어 메트로놈 모달 등 리마운트에도 안전.
 */
export type PlayMode = 'solo' | 'ensemble';

type PlaySessionState = {
  mode: PlayMode;
  recordingId: string | null;
  skipPermission: boolean;
  /** 혼자 연주 시작 */
  startSolo: () => void;
  /** 선택한 녹음과 함께 협주 시작 */
  startEnsemble: (recordingId: string) => void;
  /** 같은 설정으로 다시 연주 — 권한 화면만 건너뜀 */
  replay: () => void;
};

export const usePlaySession = create<PlaySessionState>((set) => ({
  mode: 'solo',
  recordingId: null,
  skipPermission: false,
  startSolo: () => set({ mode: 'solo', recordingId: null, skipPermission: false }),
  startEnsemble: (recordingId) => set({ mode: 'ensemble', recordingId, skipPermission: false }),
  replay: () => set({ skipPermission: true }),
}));
