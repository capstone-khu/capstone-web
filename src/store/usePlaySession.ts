import { create } from 'zustand';
import type { Area } from '@/lib/area';

/**
 * 연주 세션 설정 — /play 진입 전에 진입점(홈/협주 선택/결과)에서 세팅한다.
 * location.state 대신 스토어로 들고 있어 메트로놈 모달 등 리마운트에도 안전.
 */
export type PlayMode = 'solo' | 'ensemble';

type PlaySessionState = {
  mode: PlayMode;
  session_id?: number | null,

  partner: {
    recordingId: string;
    userName: string;
  } | null;

  skipPermission: boolean;
  /** 집중 반복 레슨 대상 마디(0-based) 목록. 비어 있으면 일반 연주. 여러 개면 마디 탭으로 전환. */
  focusBars: number[];

  /** 현재 재생 중인 마디 인덱스 (1-based, API measure_index 기준) */
  currentMeasureIndex: number;
  setCurrentMeasureIndex: (index: number) => void;

  /** 혼자 연주 시작 */
  startSolo: (arg0:number) => void;

  /** 선택한 녹음과 함께 협주 시작 */
  startEnsemble: (
    session_id: number,
    partner: { recordingId: string; userName: string }
  ) => void;

  /** 같은 설정으로 다시 연주 — 권한 화면만 건너뜀 */
  replay: () => void;

  /** 약점 마디(들) 집중 반복 레슨 시작 (마이페이지 등에서) */
  startFocus: (bars: number[]) => void;
};

export const usePlaySession = create<PlaySessionState>((set) => ({
  mode: 'solo',
  session_id: null,
  recordingId: null,
  partner: null,
  skipPermission: false,
  focusBars: [],

  currentMeasureIndex: 1,
  setCurrentMeasureIndex: (index) => set({ currentMeasureIndex: index }),

  startSolo: (session_id) =>
    set({
      mode: 'solo',
      session_id,
      partner: null,
      skipPermission: false,
      focusBars: [],
      currentMeasureIndex: 1,
    }),
  
  startEnsemble: (session_id, partner) =>
    set({
      mode: 'ensemble',
      session_id,
      partner,
      skipPermission: false,
      focusBars: [],
    }),

  replay: () => set({ skipPermission: true }),

  startFocus: (bars) =>
    set({
      skipPermission: true,
      focusBars: bars,
    }),
}));

interface IMark {
  domain: Area,
  action_id: string,
  feedback: string,
}
interface IMeasure {
  measure_index: number,
  markings: IMark[]
}
interface IprevRecord {
  measures: IMeasure[],
  setMeasures: (m: IMeasure[]) => void;
}

export const prevSessionRecord = create<IprevRecord>((set) => ({
  measures: [],
  setMeasures: (m: IMeasure[]) => set({measures: m}),
}))
