import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

type UseLoadableDataOptions<T> = {
  fetchFn: () => Promise<T>;
  deps?: unknown[];
  initialData?: T;
};

type UseLoadableDataResult<T> = {
  data: T;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
};

export function useLoadableData<T>({
  fetchFn,
  deps = [],
  initialData,
}: UseLoadableDataOptions<T>): UseLoadableDataResult<T> {
  const [data, setData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchFn());
    } catch (e: any) {
      console.log('useLoadableData fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await fetchFn());
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    refreshing,
    onRefresh,
    reload: load,
    setData,
  };
}
