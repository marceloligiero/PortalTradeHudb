import { useTranslation } from 'react-i18next';
import { useScrollReveal, reveal } from './primitives';
import {
  Clock, AlertTriangle, FileSpreadsheet, Zap,
  TrendingUp, ShieldCheck, RotateCcw, Brain,
} from 'lucide-react';

const TICKER_ITEMS = [
  { key: 'onboarding',   icon: Clock,           symbol: 'ONBD', value: '-74%'  },
  { key: 'errors',       icon: AlertTriangle,    symbol: 'ERRS', value: '-82%'  },
  { key: 'reports',      icon: FileSpreadsheet,  symbol: 'RPTS', value: '-95%'  },
  { key: 'resolution',   icon: Zap,              symbol: 'RSLV', value: '-68%'  },
  { key: 'productivity', icon: TrendingUp,       symbol: 'PROD', value: '+45%'  },
  { key: 'compliance',   icon: ShieldCheck,      symbol: 'CMPL', value: '99.4%' },
  { key: 'rework',       icon: RotateCcw,        symbol: 'RWRK', value: '-91%'  },
  { key: 'retention',    icon: Brain,            symbol: 'KNOW', value: '+3x'   },
] as const;

export default function SocialProofBar() {
  const { t } = useTranslation();
  const { ref, visible } = useScrollReveal(0.3);

  const items = TICKER_ITEMS.map(item => ({
    ...item,
    label: t(`landing.ticker.${item.key}`),
  }));
  const repeated = [...items, ...items, ...items];

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative overflow-hidden z-[2]"
      style={{
        background: '#0C0C0F',
        ...reveal(visible),
      }}
    >
      {/* Top accent line — gradient red */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #EC0000 20%, #EC0000 80%, transparent)' }} />

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0C0C0F, transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0C0C0F, transparent)' }} />

      {/* Marquee */}
      <div className="flex animate-marquee whitespace-nowrap py-3" style={{ width: 'max-content' }}>
        {repeated.map((item, i) => {
          const Icon = item.icon;
          const isDown = item.value.startsWith('-');
          return (
            <span key={i} className="inline-flex items-center gap-2 shrink-0 px-5">
              <Icon className="w-3 h-3 text-[#22C55E]" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#22C55E]">{item.symbol}</span>
              <span className="font-body text-[11px] text-white/50">{item.label}</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-[8px] text-[#22C55E]">{isDown ? '\u25BC' : '\u25B2'}</span>
                <span className="font-mono text-[12px] font-bold text-white">{item.value}</span>
              </span>
              <span className="ml-3 text-[10px] text-white/10 font-mono">|</span>
            </span>
          );
        })}
      </div>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)' }} />
    </div>
  );
}
