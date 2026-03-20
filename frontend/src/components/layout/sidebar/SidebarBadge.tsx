interface SidebarBadgeProps {
  count: number;
  max?: number;
}

export default function SidebarBadge({ count, max = 9 }: SidebarBadgeProps) {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : count;
  return (
    <span className="ml-auto min-w-[18px] px-1.5 text-center bg-[#EC0000] rounded-full text-[10px] font-bold text-white leading-[18px]">
      {display}
    </span>
  );
}
