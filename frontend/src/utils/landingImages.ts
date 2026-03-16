/**
 * Dynamic image loader for landing page.
 * Returns null when the image file doesn't exist yet — use ImagePlaceholder as fallback.
 * Place image files in: src/assets/images/landing/
 */

// Glob import — only includes files that actually exist. Empty when folder is empty.
const _modules = import.meta.glob(
  '/src/assets/images/landing/*',
  { eager: true }
) as Record<string, { default: string }>;

export function getLandingImage(filename: string): string | null {
  const key = Object.keys(_modules).find((k) => k.endsWith(`/${filename}`));
  return key ? _modules[key]?.default ?? null : null;
}
