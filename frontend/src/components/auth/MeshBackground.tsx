/**
 * MeshBackground — Subtle CSS-only gradient glow for auth pages.
 * Uses Santander #EC0000 as accent. No canvas, no visible blobs.
 */
export default function MeshBackground({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Very subtle top-right warm glow */}
      <div
        className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(236,0,0,0.04) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(236,0,0,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Very subtle bottom-left cool glow */}
      <div
        className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(100,116,139,0.04) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(100,116,139,0.05) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
