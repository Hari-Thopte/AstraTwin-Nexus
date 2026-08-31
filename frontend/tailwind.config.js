/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020408',
          900: '#0a0e1a',
          800: '#0d1224',
          700: '#111827',
          600: '#1a2035',
          500: '#243047',
          400: '#374151',
          300: '#4b5563',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        electric: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        status: {
          nominal: '#10b981',
          warning: '#f59e0b',
          degraded: '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, #0a0e1a 0%, #0d1224 50%, #111827 100%)',
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.3)',
        'glow-red': '0 0 20px rgba(239,68,68,0.3)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        blink: 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
