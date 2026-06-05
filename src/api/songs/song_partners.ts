import { api } from '../client';
import { type PartnersData, type PartnersResponse } from './song.type';

// 협주하기를 눌렀을 때, 해당 곡 함께 연주할 파트너 고르는 api 
// api/songs/{song-id}/duet-partners
export const song_partners = async (
  songId: string | number
): Promise<PartnersData> => {
  const res = await api.get<PartnersResponse>(`/songs/${songId}/duet-partners`);

  return res.data.data;
};