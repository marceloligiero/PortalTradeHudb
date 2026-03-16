import { useState, useEffect, useRef } from 'react';
import { GraduationCap, ShieldAlert, BarChart3, Headphones } from 'lucide-react';

const TABS = [
  {
    key: 'formacoes',
    icon: GraduationCap,
    label: 'Formações',
    title: 'Formação Proactiva e Contínua',
    description:
      'Cursos e planos de treino para gravadores e liberadores. Desde o onboarding de novos colaboradores até formações avançadas por categoria de documento. O sistema vincula formações a categorias de erro — quem erra em X, recebe formação sobre X. Certificados incluídos.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80',
    imageAlt: 'Formação corporativa em sala',
  },
  {
    key: 'tutoria',
    icon: ShieldAlert,
    label: 'Tutoria',
    title: 'Registo e Correcção Estruturada de Erros',
    description:
      'Quando o liberador encontra um erro, regista-o com categoria, gravador e tipo (interno vs incidência). O sistema gera plano de acção com itens, prazos e fluxo de aprovação. Cada erro vira aprendizagem — nunca se perde.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80',
    imageAlt: 'Mentora revendo documentos com colaborador',
  },
  {
    key: 'relatorios',
    icon: BarChart3,
    label: 'Relatórios',
    title: 'Dados que Orientam Decisões',
    description:
      'Quem erra mais? Em quê? As formações funcionam? Relatórios por equipa, gravador, categoria. Cruzamento formações × erros para medir impacto real. Filtros por período, equipa, tipo de erro.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80',
    imageAlt: 'Dashboard com gráficos de análise de dados',
  },
  {
    key: 'chamados',
    icon: Headphones,
    label: 'Chamados',
    title: 'Suporte Interno sem Atrito',
    description:
      'Sistema fora do ar? Dúvida operacional? Pedido de acesso? Kanban simples — abra, acompanhe e resolva. Sem e-mails perdidos, sem conversas informais sem registo.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80',
    imageAlt: 'Equipa de suporte colaborando',
  },
];

export default function SolutionTabs() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const tab = TABS[active];

  const reveal: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  return (
    <section
      id="funcionalidades"
      ref={sectionRef}
      className="bg-[#F8F9FB]"
      style={{ padding: '100px 24px' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div style={reveal}>
          <span className="font-body text-xs font-bold uppercase tracking-widest" style={{ color: '#EC0000' }}>
            A Solução
          </span>
          <h2
            className="font-headline font-bold text-[#111827] leading-[1.15] mt-3 mb-3"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', maxWidth: '700px' }}
          >
            Equipas de processamento precisam de qualidade que acompanhe o ritmo.
          </h2>
          <p
            className="font-body text-[#6B7280] mb-10"
            style={{ fontSize: '1rem', maxWidth: '580px' }}
          >
            Formação estruturada, tutoria rastreada, relatórios cruzados e suporte integrado.
            Quando tudo funciona junto, a qualidade escala.
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex items-center overflow-x-auto mb-10"
          style={{
            ...reveal,
            transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {TABS.map((t, i) => {
            const Icon = t.icon;
            const isActive = active === i;
            return (
              <button
                key={t.key}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-5 py-3 font-body text-sm font-medium whitespace-nowrap transition-colors duration-200"
                style={{
                  color: isActive ? '#EC0000' : '#6B7280',
                  borderBottom: isActive ? '2px solid #EC0000' : '2px solid transparent',
                  marginBottom: '-1px',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content — key forces remount → CSS animation fires */}
        <div
          key={active}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          {/* Text */}
          <div>
            <h3
              className="font-headline font-bold text-[#111827] mb-4"
              style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)' }}
            >
              {tab.title}
            </h3>
            <p className="font-body text-[#6B7280] leading-relaxed mb-6" style={{ fontSize: '1rem' }}>
              {tab.description}
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-1 font-body text-sm font-semibold transition-colors duration-200"
              style={{ color: '#EC0000' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Explorar {tab.label} →
            </a>
          </div>

          {/* Image */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB' }}
          >
            <img
              src={tab.image}
              alt={tab.imageAlt}
              loading="lazy"
              className="w-full object-cover"
              style={{ aspectRatio: '4/3', borderRadius: '12px' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
