import { Outlet, useLocation } from 'react-router-dom';

/**
 * 전역 라우트 전환 레이아웃 — 라우트가 바뀔 때마다 페이지를 부드럽게 페이드/슬라이드인(토스풍).
 * pathname을 key로 줘 매 전환마다 재마운트되어 enter 애니메이션이 재생된다.
 */
export function AppLayout() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-in">
      <Outlet />
    </div>
  );
}
