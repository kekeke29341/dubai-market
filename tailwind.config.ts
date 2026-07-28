import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9ec',
          100: '#fdf0ca',
          200: '#fadf90',
          300: '#f7c94d',
          400: '#f5b325',
          500: '#ef920d',
          600: '#d36c07',
          700: '#af4b0a',
          800: '#8e3a0f',
          900: '#753110',
          950: '#421705',
        },
        gold: '#C8A96E',
        desert: '#F5F0E8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
