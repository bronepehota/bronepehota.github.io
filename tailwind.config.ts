import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'sans-serif'],
        'russo': ['var(--font-russo)', 'sans-serif'],
        'ibm-mono': ['var(--font-ibm-mono)', 'monospace'],
        'oswald': ['var(--font-oswald)', 'sans-serif'],
      },
      colors: {
        'hud-amber': '#f59e0b',
        'hud-amber-dark': '#d97706',
        'hud-green': '#10b981',
        'hud-green-dark': '#059669',
        'hud-slate': '#1e293b',
        'hud-slate-light': '#334155',
        // Military theme colors
        'military-rust': '#EA580C',
        'military-red': '#DC2626',
        'military-steel': '#475569',
        'military-dark': '#0C0A09',
        'military-sand': '#D6D3D1',
        'military-amber': '#F59E0B',
        'military-green': '#166534',
        'military-charcoal': '#1C1917',
        'military-taupe': '#A8A29E',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hud-gradient': 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
      },
      animation: {
        'scan': 'scan 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 0.5s infinite',
        'blink': 'blink 1s step-end infinite',
        'flicker': 'flicker 0.15s infinite',
        // New military animations
        'typewriter': 'typewriter 3s steps(40) forwards',
        'film-grain': 'film-grain 0.5s steps(10) infinite',
        'diagonal-reveal': 'diagonal-reveal 1.5s ease-out forwards',
        'military-glitch': 'military-glitch 0.3s infinite',
        'radar-scan': 'radar-scan 4s linear infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // New military keyframes
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        'film-grain': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -5%)' },
          '20%': { transform: 'translate(-10%, 5%)' },
          '30%': { transform: 'translate(5%, -10%)' },
          '40%': { transform: 'translate(-5%, 15%)' },
          '50%': { transform: 'translate(-10%, 5%)' },
          '60%': { transform: 'translate(15%, 0)' },
          '70%': { transform: 'translate(0, 10%)' },
          '80%': { transform: 'translate(-15%, 0)' },
          '90%': { transform: 'translate(10%, 5%)' },
        },
        'diagonal-reveal': {
          '0%': {
            clipPath: 'inset(0 100% 0 0)',
            opacity: '0',
          },
          '100%': {
            clipPath: 'inset(0 0 0 0)',
            opacity: '1',
          },
        },
        'military-glitch': {
          '0%': { transform: 'translate(0)', opacity: '1' },
          '20%': { transform: 'translate(-2px, 1px)', opacity: '0.9' },
          '40%': { transform: 'translate(1px, -1px)', opacity: '1' },
          '60%': { transform: 'translate(-1px, 2px)', opacity: '0.95' },
          '80%': { transform: 'translate(2px, -2px)', opacity: '1' },
          '100%': { transform: 'translate(0)', opacity: '1' },
        },
        'radar-scan': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
