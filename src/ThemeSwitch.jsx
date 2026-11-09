import React from 'react';

export default function ThemeSwitch({ isDark, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'} className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
      {isDark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
    </button>
  );
}
