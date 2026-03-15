import { GraduationCap, ShieldAlert, BarChart3, Headphones, Settings } from 'lucide-react';

const ITEMS = [
  { icon: GraduationCap, label: 'FORMAÇÕES'    },
  { icon: ShieldAlert,   label: 'TUTORIA'      },
  { icon: BarChart3,     label: 'RELATÓRIOS'   },
  { icon: Headphones,    label: 'CHAMADOS'     },
  { icon: Settings,      label: 'DADOS MESTRES'},
];

const REPEATED = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

export default function SocialProofBar() {
  return (
    <div className="border-y border-white/[0.06] py-5 overflow-hidden bg-black">
      <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        {REPEATED.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2 mx-10 text-[#444] uppercase text-xs font-body tracking-[0.2em] shrink-0"
            >
              <Icon className="w-4 h-4 opacity-50" />
              {item.label}
              <span className="ml-8 text-white/[0.06]">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
