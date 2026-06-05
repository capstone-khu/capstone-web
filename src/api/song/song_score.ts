import { api } from '../client';

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

interface ScoreResponse {
  success: boolean;
  status: number;
  message: string;
  data: ScoreData;
}

export const song_score = async (
  songId: string | number
): Promise<ScoreData> => {
  const res = await api.get<ScoreResponse>(`/songs/${songId}/score`);

  return res.data.data;
};