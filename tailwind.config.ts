import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hermes: {
          cream: '#fcf7f1',
          'cream-light': '#fffcf7',
          charcoal: '#282828',
          muted: '#696969',
          grey: '#949494',
          orange: '#f37021',
        },
      },
      fontFamily: {
        hermes: ['var(--font-manrope)', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      maxWidth: {
        hermes: '147.69231rem',
      },
    },
  },
  plugins: [],
}
export default config
