import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

const PLATFORM_LINKS  = ['Formações', 'Tutoria', 'Relatórios', 'Chamados', 'Dados Mestres'];
const LEGAL_LINKS     = ['Sobre', 'Privacidade', 'Termos de Uso'];

export default function LandingFooter() {
  return (
    <footer id="footer" className="bg-black border-t border-white/[0.06] px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-16 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-santander-500 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-logo text-2xl font-semibold text-white tracking-tight">
                TradeDataHub
              </span>
            </div>
            <p className="font-body text-xs text-[#333] max-w-xs leading-relaxed uppercase tracking-[0.1em]">
              Plataforma de formações, tutoria e qualidade
              para equipas de processamento de documentos.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-20">
            <div>
              <h4 className="font-body text-[10px] text-[#222] uppercase tracking-[0.25em] mb-6">
                Plataforma
              </h4>
              <ul className="space-y-3">
                {PLATFORM_LINKS.map(label => (
                  <li key={label}>
                    <Link
                      to="/login"
                      className="font-body text-xs text-[#444] hover:text-white transition-colors duration-200 uppercase tracking-[0.1em]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-body text-[10px] text-[#222] uppercase tracking-[0.25em] mb-6">
                Institucional
              </h4>
              <ul className="space-y-3">
                {LEGAL_LINKS.map(label => (
                  <li key={label}>
                    <Link
                      to="/login"
                      className="font-body text-xs text-[#444] hover:text-white transition-colors duration-200 uppercase tracking-[0.1em]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-8">
          <p className="font-body text-[10px] text-[#222] uppercase tracking-[0.2em]">
            © 2025 TradeDataHub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
