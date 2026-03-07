import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        // Takeoff category colors
        category: {
          door: '#3b82f6',       // Blue
          window: '#10b981',     // Green
          closet: '#8b5cf6',     // Purple
          cabinet: '#f59e0b',    // Amber
          baseboard: '#ef4444',  // Red
          crown: '#ec4899',      // Pink
          casing: '#06b6d4',     // Cyan
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
