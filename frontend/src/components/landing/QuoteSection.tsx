import { useState, useRef, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FAQS = [
  {
    question: 'O que é o TradeDataHub?',
    answer:
      'Plataforma integrada de formações, tutoria, relatórios e suporte para equipas de processamento de documentos. Do gravador ao gestor — tudo num só lugar.',
  },
  {
    question: 'Quem usa o sistema?',
    answer:
      'Gravadores, liberadores, formadores, coordenadores e administradores. Cada utilizador vê exactamente o que precisa para fazer o seu trabalho melhor.',
  },
  {
    question: 'O que acontece quando um erro é encontrado?',
    answer:
      'O liberador regista na tutoria, categoriza e atribui ao gravador. Gera-se automaticamente um plano de acção com prazos. O gravador executa, submete e o liberador aprova.',
  },
  {
    question: 'E se o erro chegar ao cliente?',
    answer:
      'É classificado como incidência — erro grave. Gera automaticamente uma ficha de aprendizagem partilhada com toda a equipa. O padrão não se repete.',
  },
  {
    question: 'O sistema suporta vários idiomas?',
    answer:
      'Sim — Português (PT), Espanhol (ES) e Inglês (EN). A interface adapta-se ao idioma do utilizador.',
  },
];

export default function QuoteSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.faq-header', '.faq-item'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.faq-header', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      });
      gsap.from('.faq-item', {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      ref={sectionRef}
      className="bg-black px-6"
      style={{ paddingTop: '160px', paddingBottom: '160px' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="faq-header font-headline font-bold text-white leading-[1.0] mb-16"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
          Perguntas Frequentes
        </h2>

        <div>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item border-b border-white/[0.06]">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="font-body text-white text-base pr-8 group-hover:text-white/80 transition-colors">
                  {faq.question}
                </span>
                <span className="shrink-0 text-[#444] group-hover:text-[#777] transition-colors">
                  {openIndex === i ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
              </button>
              {openIndex === i && (
                <div className="pb-6">
                  <p className="font-body text-[#555] text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
