import { api } from '../client';
import { type SongListData, type SongListResponse } from '@/api/songs/song.type'

// Home에서 Song 전체 리스트 받아오는 api
// api/songs
export async function songs(): Promise<SongListData> {
  const { data } = await api.get<SongListResponse>('/songs');

  if (!data.success) {
    throw new Error(data.message || 'API 에러');
  }

  return data.data;
}