import { api } from './client';

export interface DuetVideo {
  duet_composite_id: number;
  song_title: string;
  partner_name: string;
  status: 'ready' | 'processing' | 'failed';
  composite_video_url: string;
  created_at: string;
}

interface DuetVideoResponse {
  success: boolean;
  status: number;
  message: string;
  data: DuetVideo;
}

// 협주 영상 조회
export const getDuetVideo = async (
  duetCompositeId: number
): Promise<DuetVideo> => {
  const response = await api.get(`/duet-videos/${duetCompositeId}`);
  return response.data.data;
};