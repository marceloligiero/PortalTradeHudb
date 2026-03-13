import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Globe, Loader2, ExternalLink, Bot, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  role: 'user' | 'bot';
  text: string;
  supportUrl?: string;
  supportLabel?: string;
  suggestions?: string[];
}

const LANGS = [
  { code: 'pt', label: '🇵🇹 PT' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'en', label: '🇺🇸 EN' },
] as const;
type LangCode = 'pt' | 'es' | 'en';

const PLACEHOLDER: Record<LangCode, string> = {
  pt: 'Escreve uma pergunta…',
  es: 'Escribe una pregunta…',
  en: 'Ask a question…',
};

const TITLE: Record<LangCode, string> = {
  pt: 'Assistente TradeHub',
  es: 'Asistente TradeHub',
  en: 'TradeHub Assistant',
};

const WELCOME: Record<LangCode, string> = {
  pt: 'Olá! 👋 Sou o **Assistente TradeHub**, o teu assistente virtual inteligente. Posso ajudar-te com informações sobre erros, planos de ação, estatísticas e muito mais!\n\nExperimenta escrever uma pergunta ou clica numa das sugestões abaixo:',
  es: '¡Hola! 👋 Soy el **Asistente TradeHub**, tu asistente virtual inteligente. Puedo ayudarte con información sobre errores, planes de acción, estadísticas y mucho más!\n\nPrueba escribir una pregunta o haz clic en una de las sugerencias:',
  en: 'Hello! 👋 I\'m the **TradeHub Assistant**, your intelligent virtual helper. I can help with errors, action plans, statistics and more!\n\nTry typing a question or click a suggestion below:',
};

/** Simple markdown-to-HTML renderer (bold + bullet lists) */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul class="list-disc pl-4 space-y-0.5">${m}</ul>`)
    .replace(/\n/g, '<br/>');
}

/** Typing animation dots */
function TypingDots({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EC0000] to-[#CC0000] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className={`px-4 py-3 rounded-2xl rounded-tl-md ${isDark ? 'bg-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
        <div className="flex items-center gap-1 py-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const { token } = useAuthStore();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState<LangCode>('pt');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (messages.length === 0) {
        const defaultSuggestions: Record<LangCode, string[]> = {
          pt: ['meus erros', 'estatísticas', 'meus planos', 'ajuda'],
          es: ['mis errores', 'estadísticas', 'mis planes', 'ayuda'],
          en: ['my errors', 'stats', 'my plans', 'help'],
        };
        setMessages([{ role: 'bot', text: WELCOME[lang], suggestions: defaultSuggestions[lang] }]);
      }
    }
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const send = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading || !token) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: msg, lang });
      const data = res.data;
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.reply, supportUrl: data.support_url, supportLabel: data.support_label, suggestions: data.suggestions },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: { pt: '⚠️ Erro ao contactar o servidor.', es: '⚠️ Error al contactar el servidor.', en: '⚠️ Error contacting the server.' }[lang] },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, lang, loading, token]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const sendSuggestion = useCallback((text: string) => {
    if (loading || !token) return;
    setInput(text);
    // We need to trigger send with this text directly
    setTimeout(() => {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text }]);
      setLoading(true);
      api.post('/chat', { message: text, lang })
        .then(r => {
          const data = r.data;
          setMessages(prev => [...prev, { role: 'bot', text: data.reply, supportUrl: data.support_url, supportLabel: data.support_label, suggestions: data.suggestions }]);
        })
        .catch(() => {
          setMessages(prev => [...prev, { role: 'bot', text: '\u26a0\ufe0f Erro ao contactar o servidor.' }]);
        })
        .finally(() => {
          setLoading(false);
          setInput('');
          setTimeout(() => inputRef.current?.focus(), 50);
        });
    }, 0);
  }, [loading, token, lang]);

  if (!token) return null;

  // Panel size classes – responsive
  const panelCls = expanded
    ? 'fixed inset-0 sm:inset-4 sm:rounded-3xl z-50'
    : 'fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full h-full sm:w-[420px] sm:h-auto sm:max-h-[680px] sm:rounded-2xl';

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#EC0000] to-[#CC0000] text-white shadow-2xl shadow-[#EC0000]/40 flex items-center justify-center group"
            aria-label="Chatbot"
          >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#EC0000] animate-ping opacity-20 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className={`${panelCls} flex flex-col shadow-2xl border overflow-hidden ${
                isDark ? 'bg-[#0d0d0f] border-white/10' : 'bg-white border-gray-200'
              }`}
            >
              {/* ── Header ───────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#EC0000] to-[#CC0000] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <Bot className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{TITLE[lang]}</p>
                    <p className="text-white/50 text-[10px] font-medium">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Language */}
                  <div className="relative">
                    <button onClick={() => setLangOpen(o => !o)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {LANGS.find(l => l.code === lang)?.label}
                    </button>
                    <AnimatePresence>
                      {langOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className={`absolute right-0 top-full mt-1 rounded-xl border shadow-2xl overflow-hidden z-10 ${isDark ? 'bg-[#1a1a1f] border-white/10' : 'bg-white border-gray-200'}`}
                        >
                          {LANGS.map(l => (
                            <button key={l.code}
                              onClick={() => { setLang(l.code); setLangOpen(false); }}
                              className={`w-full px-4 py-2 text-xs font-medium text-left transition-colors ${
                                l.code === lang
                                  ? 'bg-[#EC0000]/10 text-[#EC0000]'
                                  : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >{l.label}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Expand/minimize – desktop only */}
                  <button onClick={() => setExpanded(e => !e)}
                    className="hidden sm:flex p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  {/* Close */}
                  <button onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Messages ─────────────────────────────────────────── */}
              <div className={`flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4 ${isDark ? 'bg-[#0d0d0f]' : 'bg-gray-50/50'}`}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {m.role === 'bot' ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EC0000] to-[#CC0000] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-[#EC0000]/20">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-800 text-white'}`}>
                        U
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[80%] ${m.role === 'user' ? '' : ''}`}>
                      <div
                        className={`px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-gradient-to-br from-[#EC0000] to-[#CC0000] text-white rounded-2xl rounded-tr-md shadow-sm shadow-[#EC0000]/20'
                            : isDark
                              ? 'bg-white/[0.06] text-gray-100 rounded-2xl rounded-tl-md border border-white/5'
                              : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-100 shadow-sm'
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(m.text)) }} />
                        {m.supportUrl && (
                          <a
                            href={m.supportUrl} target="_blank" rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              m.role === 'user'
                                ? 'bg-white/15 text-white hover:bg-white/25'
                                : isDark
                                  ? 'bg-[#EC0000]/10 text-[#EC0000] hover:bg-[#EC0000]/20'
                                  : 'bg-red-50 text-[#EC0000] hover:bg-red-100'
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {m.supportLabel || 'Ver material'}
                          </a>
                        )}
                      </div>
                      {/* Suggestion chips */}
                      {m.role === 'bot' && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.suggestions.map((s, si) => (
                            <motion.button
                              key={si}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: si * 0.05 }}
                              onClick={() => sendSuggestion(s)}
                              disabled={loading}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.03] ${
                                isDark
                                  ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.12] border border-white/10'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              } disabled:opacity-50`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {s}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && <TypingDots isDark={isDark} />}
                <div ref={endRef} />
              </div>

              {/* ── Input ────────────────────────────────────────────── */}
              <div className={`flex-shrink-0 p-3 border-t ${isDark ? 'border-white/8 bg-[#0d0d0f]' : 'border-gray-100 bg-white'}`}>
                <div className={`flex items-end gap-2 rounded-2xl border px-4 py-2.5 transition-colors ${
                  isDark
                    ? 'bg-white/[0.04] border-white/8 focus-within:border-[#EC0000]/40'
                    : 'bg-gray-50 border-gray-200 focus-within:border-[#EC0000]/30 focus-within:bg-white'
                }`}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder={PLACEHOLDER[lang]}
                    disabled={loading}
                    rows={1}
                    className={`flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 resize-none max-h-[120px] leading-relaxed ${isDark ? 'text-white' : 'text-gray-800'}`}
                  />
                  <motion.button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      input.trim()
                        ? 'bg-gradient-to-br from-[#EC0000] to-[#CC0000] text-white shadow-md shadow-[#EC0000]/20'
                        : isDark ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-400'
                    } disabled:opacity-40`}
                    aria-label="Enviar"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </motion.button>
                </div>
                <p className={`text-center text-[10px] mt-2 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                  TradeHub Assistant · IA + FAQs configuradas
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
