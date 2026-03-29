// Path: src-frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class', // enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Google Blue primary palette
        primary: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#aecbfa',
          300: '#74a9f5',
          400: '#4285f4',
          500: '#1a73e8', // main Google blue
          600: '#1765cc',
          700: '#1557b0',
          800: '#0d47a1',
          900: '#0a3880',
          DEFAULT: '#1a73e8',
        },
        // Surface colors
        surface: {
          DEFAULT: '#ffffff',
          variant: '#f8f9fa',
          container: '#f1f3f4',
          dark: '#1c1c1e',
        },
        // Text colors
        'on-surface': '#202124',
        'on-surface-variant': '#5f6368',
        // Divider
        divider: '#e0e0e0',
        // Status
        success: '#34a853',
        warning: '#fbbc04',
        error: '#ea4335',
        info: '#4285f4',
        // Contact avatar accent colors (deterministic)
        accent: {
          blue: '#4285f4',
          red: '#ea4335',
          yellow: '#fbbc04',
          green: '#34a853',
          orange: '#ff6d00',
          teal: '#46bdc6',
          purple: '#7b1fa2',
          crimson: '#c62828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Google Sans', 'Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '400' }],
        'headline': ['1.5rem', { lineHeight: '2rem', fontWeight: '400' }],
        'title-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'title-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'title-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'card-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'fab': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'dialog': '0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14)',
      },
      screens: {
        'xs': '375px',
        'mobile': '640px',
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}

export default config
