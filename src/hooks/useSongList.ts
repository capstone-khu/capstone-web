import { useEffect, useState } from 'react';
import { songs } from '@/api/songs/song';
import { type SongListData } from '@/api/songs/song.type';

export function useSongList() {
  const [songList, setSongList] = useState<SongListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const data = await songs();
        setSongList(data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  return {
    songList,
    loading,
    error,
  };
}