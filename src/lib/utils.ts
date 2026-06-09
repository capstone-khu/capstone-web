import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ScoreData, type Pitch } from '@/api/songs/song.type';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "2026-06-01T10:00:00+09:00"를 오늘 기준으로 "N일 전 2026년 6월 1일"로 변경하는 함수
export function formatRelativeAndAbsolute(dateString: string) {
  const date = new Date(dateString);

  const getKstDateOnly = (d: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);

    const year = Number(parts.find(p => p.type === 'year')?.value);
    const month = Number(parts.find(p => p.type === 'month')?.value);
    const day = Number(parts.find(p => p.type === 'day')?.value);

    return new Date(year, month - 1, day);
  };

  const todayKst = getKstDateOnly(new Date());
  const targetKst = getKstDateOnly(date);

  const diffDays = Math.max(
    0,
    Math.round(
      (todayKst.getTime() - targetKst.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const relative = diffDays === 0 ? '오늘' : `${diffDays}일 전`;

  const absolute = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  return `${relative} · ${absolute}`;
}

/** "4/4" 같은 time_signature 문자열에서 분자(박자수)를 꺼낸다. */
export function beatsPerBar(timeSignature: string): number {
  return parseInt(timeSignature.split('/')[0], 10) || 4;
}

/**
 * measures 배열을 BarView가 기대하는 notes[][] 형태로 변환.
 * measure_index 순으로 정렬해 빈 마디가 생기지 않도록 한다.
 */
export function toBars(measures: ScoreData['measures']): Pitch[][] {
  const sorted = [...measures].sort((a, b) => a.measure_index - b.measure_index);
  return sorted.map((m) => m.notes.map((n) => n.pitch as Pitch));
}

/**
 * measures 배열에서 마디별 lyrics 배열을 추출.
 * LYRICS[barIndex] === lyrics[barIndex] 와 동일하게 사용.
 */
export function toLyrics(measures: ScoreData['measures']): string[][] {
  const sorted = [...measures].sort((a, b) => a.measure_index - b.measure_index);
  // BarView의 lyrics prop이 string 하나라면 첫 번째 note의 lyric을 대표값으로 사용.
  // BarView가 note[]를 통째로 받는다면 아래 toLyrics 대신 bars를 그대로 넘기면 됩니다.
  return sorted.map((m) => m.notes.map((n) => n.lyric));
}

/**
 * measures 배열에서 마디별 duration(박자) 배열을 추출.
 */
export function toDuration(measures: ScoreData['measures']): string[][] {
  const sorted = [...measures].sort((a, b) => a.measure_index - b.measure_index);
  // BarView의 lyrics prop이 string 하나라면 첫 번째 note의 lyric을 대표값으로 사용.
  // BarView가 note[]를 통째로 받는다면 아래 toLyrics 대신 bars를 그대로 넘기면 됩니다.
  return sorted.map((m) => m.notes.map((n) => n.duration));
}