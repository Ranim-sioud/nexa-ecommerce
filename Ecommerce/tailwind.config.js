// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Tout ton code JSX/TSX
  ],
  theme: {
    extend: {},
  },
  safelist: [
    // Classes dynamiques que PurgeCSS pourrait supprimer
    'flex',
    'items-center',
    'justify-center',
    'justify-end',
    'justify-start',
    'h-full',
    'h-screen',
    'w-full',
    'max-w-lg',
    'bg-white',
    'bg-gray-50',
    'bg-[#D9F4EC]',
    'text-gray-800',
    'text-gray-700',
    'rounded-lg',
    'rounded-xl',
    'shadow-md',
    'shadow-sm',
    // tu peux ajouter d'autres classes dynamiques si besoin
  ],
  plugins: [],
};