import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "2026-06-01T10:00:00+09:00"를 오늘 기준으로 "N일 전 2026년 6월 1일"로 변경하는 함수
export function formatRelativeAndAbsolute(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 1) 상대 시간
  let relative = '';

  if (diffDays === 0) {
    relative = '오늘';
  } else if (diffDays === 1) {
    relative = '1일 전';
  } else if (diffDays > 1) {
    relative = `${diffDays}일 전`;
  } else {
    // 미래 날짜 대비
    relative = `${Math.abs(diffDays)}일 후`;
  }

  // 2) 절대 날짜 (한국형 포맷)
  const absolute = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  return `${relative} · ${absolute}`;
}