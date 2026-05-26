# Capstone

## ⚠️ 프로젝트 성격 (작업 전 반드시 인지)

이 저장소는 **화면 기획(UI 프로토타이핑)을 위한 작업 공간**이다. 실제 프로덕션 프론트엔드가 아니다.

- **API 연결 없음.** 서버 통신, fetch, axios, TanStack Query 사용 패턴을 새로 도입하지 말 것. 데이터는 in-memory 상수 / 더미 JSON으로 충분.
- **백엔드 통합 고려 X.** 인증, 환경변수, CORS, 네트워크 에러 핸들링 등 백엔드 연계 주제는 먼저 제안하지 말 것.
- **목표는 "화면이 어떻게 보이고 어떻게 흐를지" 빠르게 시각화하는 것.**
- 컴포넌트, 라우팅, 클라이언트 상태(Zustand), UI/UX 위주로 작업한다.

## 프로젝트 도메인 (MVP)

**악기 연주 실시간 코칭 서비스의 화면 기획.** 노트북 카메라+마이크 앞에서 흐르는 악보를 보며 연주하면, 시스템이 음정·박자·자세를 분석해 ① 실시간 피드백을 띄우고 ② 다음 연주 시 악보에 누적 마킹으로 시각화한다.

### MVP 화면 (3개)
1. **곡 선택** — 1곡 하드코딩이라 사실상 "시작" 버튼
2. **연주 화면** (메인) — 흐르는 악보 + 플레이헤드 + 실시간 피드백 1줄 + 누적 마킹
3. **결과 화면** — 악보 전체에 이번 세션 마킹 표시 (통계 없음)

### 핵심 인터랙션
- **입력**: 카메라(자세) + 마이크(음정/박자), 권한 받고 자동 시작
- **악보**: 정적 SVG + **플레이헤드만 이동** (노래방 방식 — 악보는 안 움직임)
- **피드백 텍스트**: 1줄, `[영역]` 라벨 + 메시지, **1개 마디 동안 유지** (다음 마디 시작 시 새 피드백으로 교체. 새 피드백 없으면 영역 비움. 단, 모든 영역 GOOD이면 칭찬 메시지 표시)

### 3가지 분석 영역

| 영역 | 입력 | 상태 종류 |
|---|---|---|
| **음정** (Pitch) | 마이크 | GOOD / 살짝·많이 높음 / 살짝·많이 낮음 / 드리프트 |
| **박자** (Rhythm) | 마이크 | GOOD / 일찍 / 늦게 / 템포 빠름·느림 |
| **자세** (Posture) | 카메라 | GOOD / 손목 / 팔꿈치 / 손가락 커브 / 어깨 / 엄지 |

### 피드백 메시지 (총 18종, 한국어 그대로 노출)

**3가지 톤** — 시각적으로 확실히 구분:
- **일반 지적** — `[박자] 박자보다 늦게 연주하고 있습니다. 박자를 맞추세요`
- **칭찬** — `잘 하고 있습니다. 계속 유지하세요`
- **영역 전환 가이드** — `[박자→자세] 박자 교정이 반복 실패하고 있습니다. 자세를 점검하세요` (같은 영역 3회 연속 실패 시)

### 마킹 시스템 (핵심 가치)

이번 세션 실시간 누적 + 이전 세션 옅게 가이드.

| 영역 | 컬러 토큰 | 클래스 |
|---|---|---|
| 음정 | `--pitch` `#3182F6` Blue | `bg-pitch`, `text-pitch` |
| 박자 | `--rhythm` `#F5A623` Yellow | `bg-rhythm`, `text-rhythm` |
| 자세 | `--posture` `#E84A7F` Pink | `bg-posture`, `text-posture` |
| GOOD | — | 표시 없음 |

- **표시 위치**: 마디 아래 **세로 스택** (영역별 1줄씩, 최대 3줄)
- **이전 세션** = `bg-pitch/30` 류로 옅게 (가이드)
- **이번 세션** = `bg-pitch` 진하게, 실시간으로 그려짐
- **심각도** = 농도 단계 (살짝 = `/60`, 심각 = 풀)

### 걷어낸 것 (MVP 스코프 밖)
슈퍼바이저 캐릭터 시각 분리 / 누적 진척도 화면 / 세션 히스토리 / 자세 캘리브레이션 / 코치 3인 시각화 / 통계 화면

---

## ⚠️ 작업 시 반드시 참고할 규칙

1. **색상은 무조건 토큰 클래스** 사용 — `bg-primary`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border-border` 등. **hex 색 직접 쓰지 말 것.**
2. **버튼은 항상 `<Button>` 컴포넌트** (`src/components/ui/button.tsx`) — CTA는 `size="lg"`(56px) 이상 권장.
3. **카드는 항상 `<Card>` 컴포넌트** (`src/components/ui/card.tsx`) — 자동으로 토스풍 `rounded-2xl border shadow-card` 적용됨.
4. **그림자는 토큰화된 것만** — `shadow-soft` / `shadow-card` / `shadow-popover` / `shadow-modal`. tailwind 기본 `shadow-md` 같은 건 너무 강해서 토스 무드 깨짐.
5. **라운드도 토큰** — `rounded-sm`(8) / `rounded-md`(10) / `rounded-lg`(14) / `rounded-xl`(16) / `rounded-2xl`(20·카드) / `rounded-3xl`(24·시트). 임의 `rounded-[5px]` 지양.
6. **숫자 노출(금액·카운트)에는 `className="tabular"`** — 고정폭 숫자로 정렬감 살리기.
7. **다크모드 코드 추가 금지** — 라이트 전용. (필요해지면 별도 요청 받고)
8. **새 패키지 설치 전에 확인** — 기본 스택만 유지. Storybook/MSW/Husky 같은 도구 임의로 추가 X.
9. **마킹 컬러는 영역 토큰 사용** — 음정 `bg-pitch`, 박자 `bg-rhythm`, 자세 `bg-posture`. opacity는 tailwind 슬래시(`bg-pitch/30`)로 단계 표현. 임의 hex 금지.
10. **피드백 메시지 톤 구분** — 일반 지적 / 칭찬 / 영역 전환 가이드 3가지를 시각적으로 다르게 (배경·아이콘·라벨 등).

## 디자인 시스템

**컨셉:** 흑백 모노톤 베이스 + 토스(Toss) 스타일링 모방. (토스 공식 npm 컴포넌트 라이브러리는 없음 — 토큰/컴포넌트 스타일을 직접 차용.)

### 색상 토큰 (`src/index.css`, HSL)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--background` | `0 0% 100%` | 페이지/카드 배경 (순백) |
| `--foreground` / `--primary` | `214 24% 13%` (#191F28, gray-900) | 본문/CTA 검정 |
| `--secondary` / `--muted` / `--accent` | `210 14% 96%` (#F2F4F6, gray-100) | 보조 면 |
| `--muted-foreground` | `213 10% 47%` (#6B7684, gray-600) | 보조 텍스트 |
| `--border` / `--input` | `210 9% 91%` (#E5E8EB, gray-200) | 구분선 |
| `--destructive` | `214 24% 13%` | 위험(현재는 검정 일관성. 빨강 필요시 이 변수만 교체) |
| `--radius` | `0.875rem` (14px) | 버튼 기준 |

추가로 `colors.gray.50~900` (tailwind 기본 gray 덮어씀) — 토스 공식 gray scale.

### 타이포
- `Pretendard Variable` (jsdelivr CDN, `index.html`에 link). 시스템 폰트 fallback.
- body: `letter-spacing: -0.01em`, `line-height: 1.5`.
- 숫자 정렬: `.tabular` 유틸 (`font-variant-numeric: tabular-nums`).

### 컴포넌트
- **Button** — h-12 기본(48px), `sm`(40px), `lg`(56px·CTA), `xl`(60px). `rounded-xl` + `font-semibold` + `active:scale-[0.98]` + `duration-100`. variants: default / secondary / outline / ghost / destructive / link.
- **Card** — `rounded-2xl border shadow-card`. Header / Title / Description / Content / Footer 패턴.

### 그림자 & 모션
- `shadow-soft` / `shadow-card` / `shadow-popover` / `shadow-modal` — 매우 부드러운 토스풍.
- `animation-press` — scale(0.97) 압축 효과 (180ms).

### 모드
- 라이트 전용. `.dark` 블록과 `darkMode: ['class']` 설정 모두 제거된 상태.

## 기술 스택 (참고)

- Vite 5 + React 18 + TypeScript
- React Router v6 (`createBrowserRouter`)
- Tailwind CSS v3 + shadcn/ui (CSS variables 방식)
- Zustand v5 (클라이언트 상태)
- React Hook Form + Zod (`@hookform/resolvers`)
- Vitest 2 + Testing Library + jsdom
- ESLint 9 (flat config) + Prettier 3

### 경로
- `@/*` → `src/*` (vite/tsconfig 양쪽 alias 설정됨)

### 스크립트
- `npm run dev` / `build` / `lint` / `format` / `test` / `test:run` / `preview`
