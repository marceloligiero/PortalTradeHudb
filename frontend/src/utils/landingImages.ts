/**
 * Dynamic image loader for landing page.
 * Returns null when the image file doesn't exist yet — use ImagePlaceholder as fallback.
 * Place image files in: src/assets/images/landing/
 */

// Vite 7: eager + import:'default' extrai o URL directamente (sem precisar de .default)
const _modules = import.meta.glob(
  '/src/assets/images/landing/*',
  { eager: true, import: 'default' }
) as Record<string, string>;

export function getLandingImage(filename: string): string | null {
  const key = Object.keys(_modules).find((k) => k.endsWith(`/${filename}`));
  return key ? (_modules[key] ?? null) : null;
}
