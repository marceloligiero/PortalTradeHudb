import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

const PLATFORM_LINKS = [
  { label: 'Formações',    path: '/login' },
  { label: 'Tutoria',      path: '/login' },
  { label: 'Relatórios',   path: '/login' },
  { label: 'Chamados',     path: '/login' },
  { label: 'Dados Mestres',path: '/login' },
];

const RESOURCES_LINKS = [
  { label: 'Documentação API', path: '/login' },
  { label: 'Central de Ajuda', path: '/login' },
  { label: 'FAQ / Chatbot',    path: '/login' },
];

const LEGAL_LINKS = [
  { label: 'Sobre',        path: '/login' },
  { label: 'Privacidade',  path: '/login' },
  { label: 'Termos de Uso',path: '/login' },
];

export default function LandingFooter() {
  return (
    <footer id="footer" className="bg-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-santander-500 rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-logo text-lg font-semibold text-white">TradeDataHub</span>
            </div>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              Plataforma de gestão de formações, tutoria e qualidade para equipas de processamento de documentos.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-body text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Plataforma
            </h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-body text-sm text-gray-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-body text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Recursos
            </h4>
            <ul className="space-y-3">
              {RESOURCES_LINKS.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-body text-sm text-gray-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="font-body text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Institucional
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-body text-sm text-gray-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="font-body text-xs text-gray-600 text-center">
            © 2025 TradeDataHub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
