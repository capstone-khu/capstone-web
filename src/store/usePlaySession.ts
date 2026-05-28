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
  /** 집중 반복 레슨 대상 마디(0-based). null이면 일반 연주 */
  focusBar: number | null;
  /** 혼자 연주 시작 */
  startSolo: () => void;
  /** 선택한 녹음과 함께 협주 시작 */
  startEnsemble: (recordingId: string) => void;
  /** 같은 설정으로 다시 연주 — 권한 화면만 건너뜀 */
  replay: () => void;
  /** 특정 마디 집중 반복 레슨 시작 (마이페이지 등에서) */
  startFocus: (bar: number) => void;
};

export const usePlaySession = create<PlaySessionState>((set) => ({
  mode: 'solo',
  recordingId: null,
  skipPermission: false,
  focusBar: null,
  startSolo: () => set({ mode: 'solo', recordingId: null, skipPermission: false, focusBar: null }),
  startEnsemble: (recordingId) =>
    set({ mode: 'ensemble', recordingId, skipPermission: false, focusBar: null }),
  replay: () => set({ skipPermission: true }),
  startFocus: (bar) => set({ mode: 'solo', recordingId: null, skipPermission: true, focusBar: bar }),
}));
