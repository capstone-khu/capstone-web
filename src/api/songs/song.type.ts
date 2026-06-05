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
export interface ScoreData {
  song: {
    id: number;
    number: number;
    title: string;
    bpm: number;
    time_signature: string;
    total_measures: number;
  };
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