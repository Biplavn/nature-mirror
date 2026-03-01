/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#FDF6EC',
                'warm-white': '#FAF3E6',
                parchment: '#F5ECD7',
                ink: { DEFAULT: '#2C1810', light: '#5C4033' },
                'field-green': { DEFAULT: '#4A7C59', light: '#5E9B70', dark: '#3A6347' },
                'field-amber': { DEFAULT: '#C9923D', light: '#D4A94F' },
                'field-red': '#A0522D',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Playfair Display', 'Georgia', 'serif'],
                body: ['Lora', 'Georgia', 'serif'],
                hand: ['Caveat', 'cursive'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-slow': 'float 8s ease-in-out infinite',
                'flutter': 'flutter 0.3s ease-in-out infinite',
                'draw-in': 'drawIn 2s ease-out forwards',
                'fade-up': 'fadeUp 0.7s ease-out forwards',
                'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
                'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'wing-left': 'wingLeft 0.15s ease-in-out infinite alternate',
                'wing-right': 'wingRight 0.15s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                flutter: {
                    '0%, 100%': { transform: 'rotate(-3deg) scale(1)' },
                    '50%': { transform: 'rotate(3deg) scale(1.02)' },
                },
                drawIn: {
                    from: { strokeDashoffset: '800', opacity: '0' },
                    to: { strokeDashoffset: '0', opacity: '1' },
                },
                fadeUp: {
                    from: { opacity: '0', transform: 'translateY(24px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                },
                wingLeft: {
                    '0%': { transform: 'rotateY(0deg) scaleX(1)' },
                    '100%': { transform: 'rotateY(50deg) scaleX(0.6)' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0.5' },
                    '60%': { transform: 'scale(1.12)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                wingRight: {
                    '0%': { transform: 'rotateY(0deg) scaleX(1)' },
                    '100%': { transform: 'rotateY(-50deg) scaleX(0.6)' },
                },
            },
        },
    },
    plugins: [],
}
