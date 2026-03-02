import React from 'react';

export default function TutoriaPage({
  children,
  className = 'space-y-6 max-w-4xl',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
