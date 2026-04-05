/**
 * Chaves centralizadas para localStorage / sessionStorage.
 * Usar sempre estas constantes — nunca strings literais diretas.
 */
export const STORAGE_KEYS = {
  LANGUAGE: 'language',
  THEME: 'theme',
  AUTH: 'auth-storage',
  SIDEBAR: 'sidebar-prefs',
  lesson: {
    visited: (id: string | number) => `lesson_${id}_visited`,
    lastPage: (id: string | number) => `lesson_${id}_lastPage`,
    finished: (id: string | number) => `lesson_${id}_finished`,
  },
  challenge: {
    pausedDuration: (id: string | number) => `challenge_paused_${id}`,
    pauseStart: (id: string | number) => `challenge_pause_start_${id}`,
  },
} as const;
