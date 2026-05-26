import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/icons';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

/** 모바일 노래방 무드의 바텀 시트 — 모바일은 하단, 데스크탑은 중앙 다이얼로그. */
export function BottomSheet({ open, onClose, title, description, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-sheet-up relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card shadow-modal sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-100"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-gray-200" />
        </div>
        {(title || description) && (
          <div className="space-y-1 px-6 pb-1 pt-4 pr-14">
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
