// --------------- song.ts ------------------
export interface Song {
  id: string;
  number: number;
  title: string;
}

export interface SongListData {
  total: number;
  songs: Song[];
}

export interface SongListResponse {
  success: boolean;
  status: number;
  message: string;
  data: SongListData;
}

// --------------- song_score.ts ------------------

export type Pitch = 'C4' | 'D4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'A4' | 'B4'; // F#4, B4 추가

export type Bar = Pitch[];

/**
 * 오선 라인 기준: E4=43(5선), G4=36(4선), B4=29(3선), D5=22(2선), F5=15(1선)
 *  공간: F4=39.5, A4=32.5, C5=25.5 / 가선 아래: D4=46.5, C4=50
 */
/** 시각적 위치 */
export const PITCH_Y: Record<Pitch, number> = {
  C4: 50,
  D4: 46.5,
  E4: 43,
  F4: 39.5,
  'F#4': 39.5,
  G4: 36,
  A4: 32.5,
  B4: 29,
};

/** 음 이름 → 주파수 (Hz). 12-TET 표준 튜닝 (A4 = 440). */
/** 음악적 의미: 소리 */
export const PITCH_FREQ: Record<Pitch, number> = {
  B4: 493.88,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  A4: 440.0,
};

export interface ScoreData {
  song: SongScoreDataDetail;
  measures: {
    measure_index: number;
    notes: {
      pitch: string;
      duration: string;
      position: number;
      lyric: string;
    }[];
  }[];
}

export interface SongScoreDataDetail {
    id: number;
    number: number;
    title: string;
    bpm: number;
    time_signature: string;
    total_measures: number;
}

export interface ScoreResponse {
  success: boolean;
  status: number;
  message: string;
  data: ScoreData;
}

// --------------- song_partners.ts ------------------
export interface Partner {
  recording_id: string;
  user_name: string;
  recorded_at: string;
}

export interface PartnersData {
  song_title: string;
  partners: Partner[]
}

export interface PartnersResponse {
  success: boolean;
  status: number;
  message: string;
  data: PartnersData;
}