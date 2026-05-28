/** 공용 아이콘 — 프로필/아바타 기본값 등에서 재사용. */

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v1h18v-1c0-3.5-4-6-9-6z" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  );
}

/** 음정 — 음표 */
export function PitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

/** 박자 — 메트로놈 */
export function RhythmIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
    >
      <path d="M14.2 2H9.8a1 1 0 00-1 .8L4.9 19.3A2 2 0 006.8 22h10.4a2 2 0 002-2.7L15.2 2.8a1 1 0 00-1-.8zM12 6l2 9h-4l2-9z" />
    </svg>
  );
}

/** 자세 — 사람 */
export function PostureIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="6" r="3" />
      <path d="M6 21v-1a6 6 0 0112 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1z" />
    </svg>
  );
}

/** 칭찬 — 체크 */
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** 지난 기록 — 되감기 시계 */
export function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13 3a9 9 0 00-9 9H1l3.9 3.9.07.14L9 12H6a7 7 0 117 7 6.9 6.9 0 01-4.9-2l-1.42 1.44A9 9 0 1013 3zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z" />
    </svg>
  );
}

/** 닫기 — X */
export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
