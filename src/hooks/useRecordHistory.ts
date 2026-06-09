import { useEffect, useState } from 'react';
import { getRecordHistory, RecordingItem } from '@/api/history';

export function useRecordHistory(page: number) {
  const [items, setItems] = useState<RecordingItem[]>([]);
  const [size, setSize] = useState(3);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const data = await getRecordHistory(page, 3);

        setItems(data.items);
        setSize(data.size);
        setTotal(data.total);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page]);

  return {
    items,
    size,
    total,
    loading,
  };
}