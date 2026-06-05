import { api } from './client';

export interface Song {
  id: number;
  number: number;
  title: string;
}

export interface SongData {
  total: number;
  songs: Song[];
}

export interface SongListResponse {
  success: boolean;
  status: number;
  message: string;
  data: SongData;
}

export async function songs(): Promise<SongData> {
  const { data } = await api.get<SongListResponse>('/songs');

  if (!data.success) {
    throw new Error(data.message || 'API 에러');
  }

  return data.data;
}