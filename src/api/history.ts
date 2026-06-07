import { api } from './client';

export interface RecordingItem {
  session_id: string;
  song_id: string;
  song_title: string;
  played_at: string;
  mode: string;
  stats: RecordingItemSummary;
  focus_measures: number[];
  duet_composite_id?: number;
  partner_name?: string;
}

export interface RecordingItemSummary {
    pitch: number;
    rhythm: number;
    posture: number;
}

export interface RecordingsData {
  page: number;
  size: number;
  total: number;
  items: RecordingItem[];
}


// 연주 이력 조회
export const getRecordHistory = async (): Promise<RecordingsData> => {
  const response = await api.get('/me/history')
  return response.data.data;
};