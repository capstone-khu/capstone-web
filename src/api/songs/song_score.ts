import { api } from '../client';
import { type ScoreData, type ScoreResponse } from '@/api/songs/song.type'

// 곡 하나를 골랐을 때, 해당 곡 악보+데이터 불러오는 api
// api/songs/{song-id}/score
export const song_score = async (
  songId: string | number
): Promise<ScoreData> => {
  const res = await api.get<ScoreResponse>(`/songs/${songId}/score`);

  return res.data.data;
};