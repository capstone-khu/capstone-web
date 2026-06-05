import { useEffect, useState } from "react";
import { type ScoreData, song_score } from "@/api/song/song_score";

export function useSong(songId?: string) {
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