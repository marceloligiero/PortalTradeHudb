import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Save, X, ChevronDown, Loader2,
  Calendar, User, Tag, Shield, Hash, CheckCircle2, Plus, Trash2,
} from 'lucide-react';
import axios from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserItem  { id: number; full_name: string }
interface Category  { id: number; name: string }
interface ProductItem { id: number; code: string; name: string }
interface Motivo    { id: string; typology: string; description: string }

const TYPOLOGY_OPTIONS: { value: string; label: string; color: string; colorLight: string }[] = [
  { value: 'METHODOLOGY', label: 'Metodologia',  color: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30', colorLight: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { value: 'KNOWLEDGE',   label: 'Conhecimento', color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',     colorLight: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { value: 'DETAIL',      label: 'Detalhe',      color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',   colorLight: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { value: 'PROCEDURE',   label: 'Procedimento', color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',   colorLight: 'bg-green-100 text-green-700 hover:bg-green-200' },
];

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ icon: Icon, children, isDark, required }: {
  icon?: React.ElementType; children: React.ReactNode; isDark: boolean; required?: boolean;
}) {
  return (
    <label className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder = '—', isDark, disabled = false }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; isDark: boolean; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border text-sm outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? 'bg-white/[0.04] border-white/10 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
            : 'bg-white border-gray-200 text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
        }`}
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : undefined }}
      >
        <option value="" style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ backgroundColor: isDark ? '#0f0f14' : undefined }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
    </div>
  );
}

function InputField({ value, onChange, placeholder = '', type = 'text', isDark }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; isDark: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
        isDark
          ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
      }`}
    />
  );
}

function TextareaField({ value, onChange, placeholder = '', rows = 4, isDark }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; isDark: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${
        isDark
          ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/10'
      }`}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RegisterErrors() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Form fields
  const [dateOccurrence, setDate]     = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [tutoradoId, setTutorado]     = useState('');
  const [categoryId, setCategory]     = useState('');
  const [productId, setProduct]       = useState('');
  const [severity, setSeverity]       = useState('MEDIA');
  const [analysis5Why, setAnalysis]   = useState('');

  // Lists
  const [users, setUsers]             = useState<UserItem[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [products, setProducts]       = useState<ProductItem[]>([]);

  // UI
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  // Motivos (multiple per error)
  const [motivos, setMotivos] = useState<Motivo[]>([]);

  const addMotivo = (typology: string) => {
    setMotivos(prev => [...prev, { id: Date.now().toString(), typology, description: '' }]);
  };
  const removeMotivo = (id: string) => {
    setMotivos(prev => prev.filter(m => m.id !== id));
  };
  const updateMotivoDesc = (id: string, description: string) => {
    setMotivos(prev => prev.map(m => m.id === id ? { ...m, description } : m));
  };

  useEffect(() => {
    (async () => {
      // Load categories
      try {
        const r = await axios.get('/api/tutoria/categories');
        setCategories(Array.isArray(r.data) ? r.data : []);
      } catch { /* ignore */ }

      // Load products (serviços)
      try {
        const r = await axios.get('/api/tutoria/products');
        setProducts(Array.isArray(r.data) ? r.data : []);
      } catch { /* ignore */ }

      // Load tutorados visible to current user
      try {
        const r = await axios.get('/api/tutoria/students');
        const data = Array.isArray(r.data) ? r.data : [];
        if (data.length > 0) {
          setUsers(data);
        } else if (user) {
          // Fallback: at least current user
          setUsers([{ id: user.id, full_name: user.full_name }]);
        }
      } catch {
        if (user) setUsers([{ id: user.id, full_name: user.full_name }]);
      }
    })();
  }, [user]);

  const canSave = description.trim() && tutoradoId;

  const handleSave = async () => {
    if (!canSave) {
      setError('Preencha obrigatoriamente a descrição e o tutorado.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await axios.post('/api/tutoria/errors', {
        date_occurrence: dateOccurrence,
        description:     description.trim(),
        tutorado_id:     Number(tutoradoId),
        category_id:     categoryId ? Number(categoryId) : null,
        product_id:      productId ? Number(productId) : null,
        severity,
        analysis_5_why:  analysis5Why.trim() || null,
        motivos:         motivos.length > 0 ? motivos.map(m => ({ typology: m.typology, description: m.description.trim() || null })) : null,
      });
      setSaved(true);
      setTimeout(() => navigate('/tutoria/errors'), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erro ao guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Erro registado!</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>A redirecionar…</p>
        </motion.div>
      </div>
    );
  }

  const severityOptions = [
    { value: 'BAIXA',   label: 'Baixa — impacto mínimo' },
    { value: 'MEDIA',   label: 'Média — impacto moderado' },
    { value: 'ALTA',    label: 'Alta — impacto significativo' },
    { value: 'CRITICA', label: 'Crítica — impacto grave' },
  ];

  const severityColors: Record<string, string> = {
    BAIXA:   isDark ? 'border-green-500/30 bg-green-500/5'  : 'border-green-200 bg-green-50',
    MEDIA:   isDark ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50',
    ALTA:    isDark ? 'border-orange-500/30 bg-orange-500/5' : 'border-orange-200 bg-orange-50',
    CRITICA: isDark ? 'border-red-500/30 bg-red-500/5'      : 'border-red-200 bg-red-50',
  };

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`border-b pb-8 ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <div className="flex items-center gap-5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30"
          >
            <AlertTriangle className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-red-400' : 'text-red-500'}`}>Tutoria</span>
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Registar Erro</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Registe um erro cometido pela equipa para análise e acompanhamento
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Card: Informação do Erro ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md shadow-red-500/20">
            <Hash className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Informação do Erro</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Dados de contexto sobre a ocorrência</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Linha 1: Data + Tutorado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={Calendar} isDark={isDark} required>Data da Ocorrência</FieldLabel>
              <InputField type="date" value={dateOccurrence} onChange={setDate} isDark={isDark} />
            </div>
            <div>
              <FieldLabel icon={User} isDark={isDark} required>Tutorado</FieldLabel>
              <SelectField
                value={tutoradoId}
                onChange={setTutorado}
                options={users.map(u => ({ value: String(u.id), label: u.full_name }))}
                placeholder="Seleccionar tutorado"
                isDark={isDark}
              />
            </div>
          </div>

          {/* Linha 2: Categoria + Gravidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={Tag} isDark={isDark}>Categoria</FieldLabel>
              <SelectField
                value={categoryId}
                onChange={setCategory}
                options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                placeholder="Seleccionar categoria"
                isDark={isDark}
              />
            </div>
            <div>
              <FieldLabel icon={Tag} isDark={isDark}>Serviço</FieldLabel>
              <SelectField
                value={productId}
                onChange={setProduct}
                options={products.map(p => ({ value: String(p.id), label: p.name }))}
                placeholder="Seleccionar serviço"
                isDark={isDark}
              />
            </div>
          </div>

          {/* Linha 3: Gravidade */}
          <div>
            <FieldLabel icon={Shield} isDark={isDark} required>Gravidade</FieldLabel>
            <SelectField
              value={severity}
              onChange={setSeverity}
              options={severityOptions}
              isDark={isDark}
            />
          </div>

          {/* Severity visual indicator */}
          {severity && (
            <div className={`rounded-xl border p-3 text-xs font-medium transition-all ${severityColors[severity]}`}>
              <strong className={isDark ? 'text-white' : 'text-gray-900'}>Gravidade {severity === 'CRITICA' ? 'Crítica' : severity === 'ALTA' ? 'Alta' : severity === 'MEDIA' ? 'Média' : 'Baixa'}:</strong>{' '}
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                {severity === 'CRITICA' ? 'Este erro tem impacto grave. Será notificado ao administrador.' :
                 severity === 'ALTA' ? 'Este erro tem impacto significativo na operação.' :
                 severity === 'MEDIA' ? 'Este erro tem impacto moderado e requer acompanhamento.' :
                 'Este erro tem impacto mínimo mas deve ser acompanhado.'}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Card: Motivos ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Motivos do Erro</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cada erro pode ter vários motivos — adicione por tipologia</p>
          </div>
          {motivos.length > 0 && (
            <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
              {motivos.length} motivo{motivos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Botões para adicionar motivo por tipologia */}
          <div>
            <p className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Adicionar motivo por tipologia:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPOLOGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => addMotivo(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? opt.color : opt.colorLight}`}
                >
                  <Plus className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de motivos adicionados */}
          {motivos.length === 0 ? (
            <div className={`text-center py-6 text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Nenhum motivo adicionado — clique nos botões acima para adicionar
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {motivos.map((m, idx) => {
                  const opt = TYPOLOGY_OPTIONS.find(o => o.value === m.typology);
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? (opt?.color.split(' hover:')[0] || 'bg-white/5 text-gray-400') : (opt?.colorLight.split(' hover:')[0] || 'bg-gray-100 text-gray-600')}`}>
                          #{idx + 1} {opt?.label || m.typology}
                        </span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={m.description}
                          onChange={e => updateMotivoDesc(m.id, e.target.value)}
                          placeholder="Descrição do motivo (opcional)…"
                          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                            isDark
                              ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-600 focus:border-indigo-500'
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMotivo(m.id)}
                        className={`flex-shrink-0 mt-0.5 p-2 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:bg-red-500/15 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Card: Descrição + Análise ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Descrição e Análise</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Detalhe o erro e a sua causa raiz</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <FieldLabel isDark={isDark} required>Descrição do Erro</FieldLabel>
            <TextareaField
              value={description}
              onChange={setDescription}
              placeholder="Descreva em detalhe o que aconteceu, o contexto e o impacto…"
              rows={4}
              isDark={isDark}
            />
            <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {description.length} caracteres — seja específico para facilitar a criação do plano de ação
            </p>
          </div>

          <div>
            <FieldLabel isDark={isDark}>Análise de Causa Raiz (5 Porquês)</FieldLabel>
            <TextareaField
              value={analysis5Why}
              onChange={setAnalysis}
              placeholder="Por que ocorreu? Por que esse motivo ocorreu? (Continue a perguntar 'porquê' até identificar a causa raiz)…"
              rows={3}
              isDark={isDark}
            />
            <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Opcional — pode ser preenchido agora ou mais tarde no detalhe do erro
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Error message ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm ${
              isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom action bar ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className={`rounded-2xl border p-5 flex items-center justify-between gap-4 flex-wrap ${
          isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        {/* Validation summary */}
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {!tutoradoId && !description.trim()
            ? <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>Preencha os campos obrigatórios *</span>
            : !tutoradoId
              ? <span className="text-orange-400">Seleccione o tutorado *</span>
              : !description.trim()
                ? <span className="text-orange-400">Preencha a descrição *</span>
                : <span className={isDark ? 'text-green-400' : 'text-green-600'}>✓ Pronto para guardar</span>}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/tutoria/errors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" /> Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(239,68,68,.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar…</>
              : <><Save className="w-4 h-4" /> Guardar Erro</>}
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}
