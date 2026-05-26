/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Marking colors — 음정/박자/자세 영역 마킹 (디자인 시스템 액센트) */
        pitch: 'hsl(var(--pitch))',
        rhythm: 'hsl(var(--rhythm))',
        posture: 'hsl(var(--posture))',
        /* Toss gray scale — tailwind 기본 gray를 덮어씀 */
        gray: {
          50: '#F9FAFB',
          100: '#F2F4F6',
          200: '#E5E8EB',
          300: '#D1D6DB',
          400: '#B0B8C1',
          500: '#8B95A1',
          600: '#6B7684',
          700: '#4E5968',
          800: '#333D4B',
          900: '#191F28',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 6px)', /* 8px */
        md: 'calc(var(--radius) - 4px)', /* 10px */
        lg: 'var(--radius)',              /* 14px (버튼/인풋 기본) */
        xl: 'calc(var(--radius) + 2px)', /* 16px */
        '2xl': '1.25rem',                /* 20px (카드) */
        '3xl': '1.5rem',                 /* 24px (큰 모달/시트) */
      },
      boxShadow: {
        /* 토스풍 매우 부드러운 그림자 */
        soft: '0 2px 8px rgba(17, 24, 39, 0.04)',
        card: '0 1px 3px rgba(17, 24, 39, 0.04), 0 4px 12px rgba(17, 24, 39, 0.04)',
        popover:
          '0 4px 16px rgba(17, 24, 39, 0.08), 0 1px 4px rgba(17, 24, 39, 0.04)',
        modal: '0 12px 32px rgba(17, 24, 39, 0.12)',
      },
      keyframes: {
        press: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
        },
        'feedback-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        press: 'press 180ms ease-in-out',
        'feedback-in': 'feedback-in 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        'sheet-up': 'sheet-up 240ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
