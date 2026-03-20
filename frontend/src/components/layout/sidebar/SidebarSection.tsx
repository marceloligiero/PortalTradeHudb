import { useSidebarCollapsed } from '../PortalLayout';
import { SECTION_LABEL } from './sidebar.tokens';

interface SidebarSectionProps {
  label: string;
}

export default function SidebarSection({ label }: SidebarSectionProps) {
  const collapsed = useSidebarCollapsed();

  /* Collapsed: thin horizontal rule */
  if (collapsed) {
    return (
      <div className="py-3 px-3" role="separator">
        <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />
      </div>
    );
  }

  /* Expanded: text + extending line to the right */
  return (
    <div role="separator" className="flex items-center gap-2 mt-5 mb-1.5 px-3">
      <span className={SECTION_LABEL}>{label}</span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.05]" aria-hidden="true" />
    </div>
  );
}
