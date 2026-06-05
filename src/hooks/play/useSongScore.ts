import { useEffect, useState } from "react";
import { type ScoreData } from "@/api/songs/song.type";
import { song_score } from "@/api/songs/song_score";

// 
export function useSongScore(songId?: string) {
  const [song, setSong] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!songId) return;

    let cancelled = false;

    const fetchSong = async () => {
      setLoading(true);

      try {
        const response = await song_score(songId);

        if (!cancelled) {
            setSong(response);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSong();

    return () => {
      cancelled = true;
    };
  }, [songId]);

  return { song, loading };
}