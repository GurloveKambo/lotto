/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: '#0D1117',
        card: '#161B22',
        elevated: '#1C2433',
        border: '#30363D',
        muted: '#484F58',
      },
      translate: {
        '4.5': '1.125rem',
        '0.5': '0.125rem',
      },
    },
  },
  plugins: [],
}
