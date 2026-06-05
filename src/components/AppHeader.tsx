import type { ReactNode } from 'react';
import { ChevronLeftIcon } from '@/components/icons';

/**
 * 앱 공용 헤더 — 모든 인앱 화면(홈/협주/마이페이지/연주/결과)이 동일한 규칙으로 사용.
 * sticky + 하단 보더 + 반투명 backdrop, 좌측(뒤로 + 타이틀) / 우측(액션) 슬롯.
 * 로그인·연주 준비(권한/메트로놈) 같은 몰입 화면은 헤더를 두지 않는다.
 * 폭은 모든 페이지에서 풀폭(max-w-7xl)으로 통일 — 본문 폭과 무관하게 헤더는 동일하게 보인다.
 */
export function AppHeader({
  title,
  onBack,
  right,
}: {
  title: ReactNode;
  onBack?: (arg0:number) => void;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex max-w-7xl items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={() => onBack}
              aria-label="뒤로"
              className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2 text-sm font-bold leading-tight">
            {title}
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-2 sm:gap-3">{right}</div>}
      </div>
    </header>
  );
}
