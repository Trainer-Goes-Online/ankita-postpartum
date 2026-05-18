import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F24C69',
          bright: '#F87186',
          deep: '#944453',
          soft: '#FCE7EC',
          rose: '#FFE8EE',
          cream: '#FFF7F8',
          ring: 'rgba(242, 76, 105, 0.25)',
        },
        ink: {
          DEFAULT: '#1A0E12',
          soft: '#4A3B40',
          muted: '#8A7A7E',
        },
        line: {
          DEFAULT: '#F1E4E8',
          strong: '#E5D2D8',
        },
      },
      fontFamily: {
        heading: ['Gilroy', 'var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'Georgia', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(180deg, #F24C69 9%, #944453 95%)',
        'brand-gradient-x': 'linear-gradient(90deg, #F24C69 0%, #944453 100%)',
        'cream-fade': 'linear-gradient(180deg, #FFF7F8 0%, #FFFFFF 100%)',
        'rose-radial': 'radial-gradient(ellipse at top, #FFE8EE 0%, #FFFFFF 65%)',
      },
      borderRadius: {
        pill: '999px',
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(146, 68, 83, 0.18)',
        card: '0 12px 40px -16px rgba(146, 68, 83, 0.22)',
        glow: '0 14px 44px -14px rgba(242, 76, 105, 0.45)',
        pressed: 'inset 0 -2px 0 rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(242, 76, 105, 0.55)' },
          '70%': { boxShadow: '0 0 0 18px rgba(242, 76, 105, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(242, 76, 105, 0)' },
        },
      },
      animation: {
        float: 'float 3.6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        marquee: 'marquee 28s linear infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
