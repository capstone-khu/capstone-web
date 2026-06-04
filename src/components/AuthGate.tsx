import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { me } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import Loading from '@/components/ui/loading';
import { router } from '@/router';

export function AuthGate() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await me();
          const user = { id: res.data.id, name: res.data.name };
          setAuth(user, token);
        } catch (err) {
          console.error('토큰 유효하지 않음', err);
          setAuth(null, null);
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };

    init();
  }, [setAuth]);

  if (loading) return <Loading />;

  return <RouterProvider router={router} />;
}