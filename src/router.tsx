import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import PlayPage from '@/pages/PlayPage';
import ResultPage from '@/pages/ResultPage';
import LoginPage from '@/pages/LoginPage';
import EnsemblePage from '@/pages/EnsemblePage';
import MyPage from '@/pages/MyPage';
import { RequireAuth } from '@/components/RequireAuth';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/ensemble', element: <EnsemblePage /> },
      { path: '/play', element: <PlayPage /> },
      { path: '/result', element: <ResultPage /> },
      { path: '/mypage', element: <MyPage /> },
    ],
  },
]);
