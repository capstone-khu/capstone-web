import { useEffect, useState } from 'react';
import { getRecordHistory, RecordingItem } from '@/api/history';

export function useRecordHistory() {
  const [items, setItems] = useState<RecordingItem[]>([]);
  const [size] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const data = await getRecordHistory();

        setItems(data.items);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    items,
    size,
    loading,
  };
}