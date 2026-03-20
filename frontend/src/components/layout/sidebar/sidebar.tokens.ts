/* ==========================================================
 * Sidebar Design Tokens — single source of truth
 * Design system: Santander — #EC0000 primary, dark/light
 * ==========================================================*/

// ── Dimensions ──────────────────────────────────────────────
export const SIDEBAR_W_EXPANDED  = 'w-64';        // 256px
export const SIDEBAR_W_COLLAPSED = 'w-[60px]';    // 60px — tighter icon strip
export const SIDEBAR_TRANSITION  = 'transition-[width] duration-300 ease-in-out';

// ── Shell (<aside>) — flex column, no overflow-hidden ───────
// Removing overflow-hidden so portal tooltips are never clipped
export const SIDEBAR_SHELL =
  'flex flex-col bg-white dark:bg-[#0D0D0F] ' +
  'border-r border-gray-100 dark:border-white/[0.04] ' +
  'min-h-[calc(100vh-64px)] sticky top-16 print:hidden';

// ── Nav area (scrollable) ────────────────────────────────────
export const SIDEBAR_NAV   = 'flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5';

// ── Sidebar footer (toggle lives here) ──────────────────────
export const SIDEBAR_FOOTER =
  'shrink-0 px-2 py-2 border-t border-gray-100 dark:border-white/[0.04]';

// ── Nav link — expanded ──────────────────────────────────────
export const NAV_LINK_BASE =
  'flex items-center gap-2.5 px-3 py-2 rounded-lg ' +
  'transition-colors duration-150 text-[13px] font-medium leading-none ' +
  'select-none outline-none focus-visible:ring-2 focus-visible:ring-[#EC0000]/40 focus-visible:ring-offset-1';

export const NAV_LINK_ACTIVE =
  'bg-[#EC0000] text-white shadow-sm shadow-[#EC0000]/20';

export const NAV_LINK_INACTIVE =
  'text-gray-600 dark:text-gray-400 ' +
  'hover:bg-[#EC0000]/[0.06] dark:hover:bg-white/[0.04] ' +
  'hover:text-gray-900 dark:hover:text-white';

// ── Nav link — collapsed (icon only) ────────────────────────
export const NAV_LINK_COLLAPSED_BASE =
  'flex items-center justify-center w-9 h-9 mx-auto rounded-lg ' +
  'transition-colors duration-150 ' +
  'outline-none focus-visible:ring-2 focus-visible:ring-[#EC0000]/40';

// ── Section label (text part only — component adds the extending line) ──
export const SECTION_LABEL =
  'text-[10px] font-bold uppercase tracking-[.14em] text-gray-400/80 dark:text-gray-600 whitespace-nowrap';

// ── Icon ─────────────────────────────────────────────────────
export const ICON_CLS = 'w-[15px] h-[15px] flex-shrink-0';

// ── Badge (inline, expanded) ─────────────────────────────────
export const BADGE_CLS =
  'ml-auto px-1.5 py-0.5 min-w-[18px] text-center ' +
  'bg-[#EC0000] rounded-full text-[10px] font-bold text-white leading-none';

// ── Mobile overlay ───────────────────────────────────────────
export const MOBILE_BACKDROP =
  'fixed inset-0 z-40 bg-black/40 dark:bg-black/60 ' +
  'backdrop-blur-[2px] transition-opacity duration-300';

export const MOBILE_DRAWER =
  'fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col ' +
  'bg-white dark:bg-[#0D0D0F] ' +
  'shadow-2xl shadow-black/10 dark:shadow-black/40 ' +
  'border-r border-gray-100 dark:border-white/[0.04] ' +
  'transition-transform duration-300 ease-out';

// ── Layout shell (page wrapper) ──────────────────────────────
export const LAYOUT_SHELL =
  'min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-white transition-colors duration-300';
export const MAIN_CONTENT =
  'flex-1 min-w-0 p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none';

// ── Tooltip (kept for SidebarTooltip, now uses portal) ───────
export const TOOLTIP_CLS =
  'px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none ' +
  'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg';
