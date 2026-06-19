/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{html,js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      // Extend the color utilities using CSS variables
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-blur-enter': {
          '0%': { opacity: '0', filter: 'blur(1px)' },
          '100%': { opacity: '1', filter: 'blur(0)' }
        },
        'fade-blur-exit': {
          '0%': { opacity: '1', filter: 'blur(0)' },
          '100%': { opacity: '0', filter: 'blur(1px)' }
        },
        'scale-enter': {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' }
        },
        'scale-exit': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-blur-enter': 'fade-blur-enter 0.5s ease-in forwards',
        'fade-blur-exit': 'fade-blur-exit 0.5s ease-out forwards',
        'scale-enter': 'scale-enter 0.3s ease-out forwards',
        'scale-exit': 'scale-exit 0.3s ease-out forwards'
      },
      // Define custom font families if needed
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        notoSans: ['Noto Sans', 'sans-serif'],
        sans: ["ui-sans-serif", "system-ui", "sans-serif","Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"],
        serif: ['Georgia', 'serif'],
        mono: ['Courier New', 'monospace']
      }
    }
  },
  plugins: [
    require('tailwindcss-animate') // Include any plugins you're using
  ]
}
