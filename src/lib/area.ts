import { PitchIcon, RhythmIcon, UserIcon } from '@/components/icons';

export type Area = 'pitch' | 'rhythm' | 'posture';

export const AREA_KO: Record<Area, string> = { pitch: '음정', rhythm: '박자', posture: '자세' };
export const AREA_GA: Record<Area, string> = { pitch: '이', rhythm: '가', posture: '가' };
export const AREAS: Area[] = ['pitch', 'rhythm', 'posture'];

// 영역별 색상 클래스 매핑 — 점(dot), 텍스트(text), 필(pill) 등 용도별로 나눠서 관리
export const AREA_DOT: Record<Area, string> = {
  pitch: 'bg-pitch',
  rhythm: 'bg-rhythm',
  posture: 'bg-posture',
};

export const AREA_TEXT: Record<Area, string> = {
  pitch: 'text-pitch',
  rhythm: 'text-rhythm',
  posture: 'text-posture',
};

export const AREA_PILL: Record<Area, string> = {
  pitch: 'bg-pitch/10 text-pitch',
  rhythm: 'bg-rhythm/10 text-rhythm',
  posture: 'bg-posture/10 text-posture',
};

export const AREA_BG_LIGHT: Record<Area, string> = {
  pitch: 'bg-pitch/10',
  rhythm: 'bg-rhythm/10',
  posture: 'bg-posture/10',
};

export const AREA_ICON: Record<Area, (p: { className?: string }) => JSX.Element> = {
  pitch: PitchIcon,
  rhythm: RhythmIcon,
  posture: UserIcon,
};