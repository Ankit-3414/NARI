/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-end Cyber-Modern Palette
        background: "#050505", // True black depth
        surface: "#0D0D0D",    // Subtle dark surface
        "surface-light": "#161616",
        primary: {
          DEFAULT: "#00F2FF", // Cyber Blue
          light: "#80F9FF",
          dark: "#00A3AD",
        },
        accent: {
          DEFAULT: "#7000FF", // Electric Purple
          light: "#B080FF",
          dark: "#4A00CC",
        },
        success: "#00FF94",    // Neon Mint
        danger: "#FF0055",     // Cyber Rose
        warning: "#FFB800",    // Neon Amber
        secondary: "#666666",  // Muted text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00F2FF 0%, #7000FF 100%)',
        'gradient-surface': 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
        'glass-radial': 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 242, 255, 0.15)',
        'glow-accent': '0 0 20px rgba(112, 0, 255, 0.15)',
        'glow-success': '0 0 20px rgba(0, 255, 148, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
