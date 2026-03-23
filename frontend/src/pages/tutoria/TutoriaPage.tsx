import React from 'react';

/**
 * TutoriaPage — container padrão para todas as páginas do portal de tutoria.
 *
 * Fornece:
 * - Espaçamento vertical consistente (space-y-6)
 * - Sem padding extra (o PortalLayout já aplica p-6 lg:p-8)
 * - max-w opcional para controlar a largura do conteúdo
 *
 * Uso:
 *   <TutoriaPage>...</TutoriaPage>
 *   <TutoriaPage maxWidth="max-w-5xl">...</TutoriaPage>
 */
export default function TutoriaPage({
  children,
  className,
  maxWidth,
}: {
  children: React.ReactNode;
  /** Classes adicionais no container (ex: 'space-y-8') */
  className?: string;
  /** Limitar largura do conteúdo (ex: 'max-w-5xl'). Opcional. */
  maxWidth?: string;
}) {
  return (
    <div className={[
      'space-y-6',
      maxWidth ?? '',
      className ?? '',
    ].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
