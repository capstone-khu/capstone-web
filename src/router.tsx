import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import PlayPage from '@/pages/PlayPage';
import ResultPage from '@/pages/ResultPage';
import CoachPage from '@/pages/CoachPage';
import LoginPage from '@/pages/LoginPage';
import EnsemblePage from '@/pages/EnsemblePage';
import MyPage from '@/pages/MyPage';
import { RequireAuth } from '@/components/RequireAuth';
import { AppLayout } from '@/components/AppLayout';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/ensemble', element: <EnsemblePage /> },
          { path: '/play/:id', element: <PlayPage /> },
          { path: '/result', element: <ResultPage /> },
          { path: '/coach', element: <CoachPage /> },
          { path: '/mypage', element: <MyPage /> },
        ],
      },
    ],
  },
]);
