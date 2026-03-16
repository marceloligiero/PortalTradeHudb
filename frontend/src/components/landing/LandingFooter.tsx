import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

const COLUMNS: Record<string, string[]> = {
  Plataforma:   ['Formações', 'Tutoria', 'Relatórios', 'Chamados', 'Dados Mestres'],
  Sobre:        ['Sobre nós', 'Contacto', 'Carreiras'],
  Recursos:     ['Blog', 'Documentação API', 'Novidades'],
  Suporte:      ['Central de Ajuda', 'FAQ', 'Status do Sistema'],
};

const linkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' };

export default function LandingFooter() {
  return (
    <footer style={{ background: '#0F172A', padding: '60px 24px 40px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand — spans 1 col on md */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-[#EC0000]" />
              <span className="font-logo font-bold text-white text-base tracking-tight">
                TradeDataHub
              </span>
            </div>
            <p
              className="font-body text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '200px' }}
            >
              Qualidade operacional proactiva, automatizada e partilhada.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(COLUMNS).map(([title, items]) => (
            <div key={title}>
              <h4
                className="font-body text-xs font-bold uppercase mb-4"
                style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.12em' }}
              >
                {title}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      to="/login"
                      className="font-body text-sm transition-colors duration-200"
                      style={linkStyle}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © 2025 TradeDataHub. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            {['Termos de Serviço', 'Política de Privacidade'].map((item) => (
              <Link
                key={item}
                to="/login"
                className="font-body text-xs transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
