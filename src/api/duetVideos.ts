import { api } from './client';

export interface DuetVideo {
  duet_composite_id: number;
  song_title: string;
  partner_name: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  composite_video_url: string;
  created_at: string;
}


// 협주 영상 조회
export const getDuetVideo = async (
  duetCompositeId: number
): Promise<DuetVideo> => {
  const response = await api.get(`/duet-videos/${duetCompositeId}`);

  console.log("협주 영상 조회: ", response.data.data);
  return response.data.data;
};