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
          { path: '/ensemble/:id', element: <EnsemblePage /> },
          { path: '/play/:id', element: <PlayPage /> },
          { path: '/result/:session_id', element: <ResultPage /> },
          { path: '/coach/:session_id', element: <CoachPage /> },
          { path: '/mypage', element: <MyPage /> },
        ],
      },
    ],
  },
]);
