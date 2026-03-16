import { GraduationCap, ShieldAlert, BarChart3, Headphones, Settings } from 'lucide-react';

const ITEMS = [
  { icon: GraduationCap, label: 'Formações'    },
  { icon: ShieldAlert,   label: 'Tutoria'      },
  { icon: BarChart3,     label: 'Relatórios'   },
  { icon: Headphones,    label: 'Chamados'     },
  { icon: Settings,      label: 'Dados Mestres'},
];

const REPEATED = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

export default function SocialProofBar() {
  return (
    <div
      className="overflow-hidden bg-[#F8F9FB] py-5"
      style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}
    >
      <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        {REPEATED.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2 mx-10 shrink-0"
              style={{ color: '#9CA3AF', opacity: 0.6 }}
            >
              <Icon className="w-4 h-4" />
              <span className="font-body text-xs uppercase" style={{ letterSpacing: '0.14em' }}>
                {item.label}
              </span>
              <span className="ml-8 text-[#E5E7EB]">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
