import { useEffect, useState } from 'react';
import { song_partners } from '@/api/songs/song_partners';
import { type PartnersData } from '@/api/songs/song.type';

export function useSongPartners(songId?: string) {
  const [partnersData, setPartnersData] = useState<PartnersData |null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!songId) {
      setPartnersData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSongPartners = async () => {
      setLoading(true);

        try {
            const data = await song_partners(songId);

            if (!cancelled) {
            setPartnersData(data);
            }
        } catch (error) {
            console.error(error);

            if (!cancelled) {
            setPartnersData(null);
            }
        } finally {
            if (!cancelled) {
            setLoading(false);
            }
        }
        };

        fetchSongPartners();
    
        return () => {
          cancelled = true;
        };
      }, [songId]);

  return {
    partnersData,
    loading,
  };
}