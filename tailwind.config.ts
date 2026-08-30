import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-deepest': '#0F1F3D',
        'navy-core': '#1B3A6B',
        'navy-light': '#2C5090',
        'text-primary': '#0A0E17',
        'text-secondary': '#3D4451',
        'text-muted': '#6B7280',
        border: '#D1D5DB',
        'bg-page': '#F4F5F7',
        'bg-card': '#FFFFFF',
        gold: '#B08D57',
        'gold-hover': '#8A6D3F',
        success: '#2F7D5C',
        warning: '#C08A2E',
        danger: '#B0433D',
        info: '#4A6FA5',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
