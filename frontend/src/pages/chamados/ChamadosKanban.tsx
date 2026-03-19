import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import {
  Plus, Bug, Lightbulb, ArrowUp, ArrowDown, Minus, AlertTriangle,
  User, MessageSquare, GripVertical, ChevronDown,
  Send, X, Trash2, ImagePlus, ZoomIn, Archive, Eye, Clock, FolderOpen,
} from 'lucide-react';
import api from '../../lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChamadoComment {
  id: number;
  chamado_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface Chamado {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  portal: string;
  created_by_id: number;
  creator_name: string;
  assigned_to_id: number | null;
  assignee_name: string | null;
  admin_notes: string | null;
  attachments?: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  comments: ChamadoComment[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const KANBAN_COLUMNS = ['ABERTO', 'EM_ANDAMENTO', 'EM_REVISAO'] as const;

const COLUMN_STYLES: Record<string, { bg: string; darkBg: string; border: string; darkBorder: string; dot: string; text: string; darkText: string }> = {
  ABERTO:       { bg: 'bg-blue-50',    darkBg: 'dark:bg-blue-900/10',    border: 'border-blue-200',    darkBorder: 'dark:border-blue-800',    dot: 'bg-blue-500',    text: 'text-blue-600',    darkText: 'dark:text-blue-400' },
  EM_ANDAMENTO: { bg: 'bg-amber-50',   darkBg: 'dark:bg-amber-900/10',   border: 'border-amber-200',   darkBorder: 'dark:border-amber-800',   dot: 'bg-amber-500',   text: 'text-amber-600',   darkText: 'dark:text-amber-400' },
  EM_REVISAO:   { bg: 'bg-purple-50',  darkBg: 'dark:bg-purple-900/10',  border: 'border-purple-200',  darkBorder: 'dark:border-purple-800',  dot: 'bg-purple-500',  text: 'text-purple-600',  darkText: 'dark:text-purple-400' },
  CONCLUIDO:    { bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/10', border: 'border-emerald-200', darkBorder: 'dark:border-emerald-800', dot: 'bg-emerald-500', text: 'text-emerald-600', darkText: 'dark:text-emerald-400' },
};

const PRIORITY_CONFIG: Record<string, { icon: typeof ArrowUp; color: string }> = {
  CRITICA: { icon: AlertTriangle, color: 'text-red-500' },
  ALTA:    { icon: ArrowUp,       color: 'text-orange-500' },
  MEDIA:   { icon: Minus,         color: 'text-yellow-500' },
  BAIXA:   { icon: ArrowDown,     color: 'text-green-500' },
};

const PRIO_STYLES = {
  BAIXA:   { border: 'border-green-500',  activeBg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-600 dark:text-green-400' },
  MEDIA:   { border: 'border-yellow-500', activeBg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
  ALTA:    { border: 'border-orange-500', activeBg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  CRITICA: { border: 'border-red-500',    activeBg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-600 dark:text-red-400' },
};

const PRIO_LABEL_KEY: Record<string, string> = {
  BAIXA: 'priorityLow', MEDIA: 'priorityMedium', ALTA: 'priorityHigh', CRITICA: 'priorityCritical',
};

const PORTALS = ['GERAL', 'FORMACOES', 'TUTORIA', 'RELATORIOS', 'DADOS_MESTRES', 'CHAMADOS'] as const;

const selectCls = "w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:border-[#EC0000]/40 focus:ring-2 focus:ring-[#EC0000]/10 outline-none transition-all";

// ─── Image compression ───────────────────────────────────────────────────────
async function compressImage(file: File, maxW = 1200, quality = 0.72): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Create Wizard ───────────────────────────────────────────────────────────
interface WizardProps { onClose: () => void; onCreated: () => void; }

function CreateWizard({ onClose, onCreated }: WizardProps) {
  const { t } = useTranslation();
  const TOTAL = 3;
  const [step, setStep]               = useState(1);
  const [type, setType]               = useState('BUG');
  const [priority, setPriority]       = useState('MEDIA');
  const [portal, setPortal]           = useState('GERAL');
  const [title, setTitle]             = useState('');
  const [desc, setDesc]               = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [dragging, setDragging]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canStep2 = title.trim().length >= 3 && desc.trim().length >= 5;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 5 - attachments.length);
    if (!imgs.length) return;
    const compressed = await Promise.all(imgs.map(f => compressImage(f)));
    setAttachments(prev => [...prev, ...compressed].slice(0, 5));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!canStep2 || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/chamados', {
        title: title.trim(),
        description: desc.trim(),
        type, priority, portal,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Error creating chamado', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selCard = (active: boolean, activeCls: string) =>
    `cursor-pointer rounded-xl border-2 p-4 transition-all text-left w-full ${
      active ? activeCls
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-[3px] bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-[#EC0000] transition-all duration-300"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {t('chamados.wizardStep', { step, total: TOTAL })}
            </p>
            <h2 className="text-base font-headline font-bold mt-0.5 text-gray-900 dark:text-white">
              {step === 1 ? t('chamados.wizardStep1Title') : step === 2 ? t('chamados.wizardStep2Title') : t('chamados.wizardStep3Title')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[330px]">

          {/* ── Step 1: Type + Priority ── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400 dark:text-gray-500">
                  {t('chamados.wizardTypeLabel')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setType('BUG')} className={selCard(type === 'BUG', 'border-red-500 bg-red-50 dark:bg-red-900/20')}>
                    <Bug className={`w-7 h-7 mb-2 ${type === 'BUG' ? 'text-red-500' : 'text-gray-400'}`} />
                    <p className={`text-sm font-bold ${type === 'BUG' ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{t('chamados.typeBug')}</p>
                    <p className="text-[11px] mt-0.5 leading-snug text-gray-400 dark:text-gray-500">{t('chamados.typeBugDesc')}</p>
                  </button>
                  <button onClick={() => setType('MELHORIA')} className={selCard(type === 'MELHORIA', 'border-amber-500 bg-amber-50 dark:bg-amber-900/20')}>
                    <Lightbulb className={`w-7 h-7 mb-2 ${type === 'MELHORIA' ? 'text-amber-500' : 'text-gray-400'}`} />
                    <p className={`text-sm font-bold ${type === 'MELHORIA' ? 'text-amber-500' : 'text-gray-800 dark:text-white'}`}>{t('chamados.typeImprovement')}</p>
                    <p className="text-[11px] mt-0.5 leading-snug text-gray-400 dark:text-gray-500">{t('chamados.typeImprovementDesc')}</p>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400 dark:text-gray-500">
                  {t('chamados.wizardPriorityLabel')}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(PRIO_STYLES) as Array<keyof typeof PRIO_STYLES>).map(key => {
                    const cfg = PRIO_STYLES[key];
                    const active = priority === key;
                    return (
                      <button key={key} onClick={() => setPriority(key)}
                        className={`rounded-xl border-2 py-3 px-1 transition-all text-center ${
                          active ? `${cfg.border} ${cfg.activeBg}` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <p className={`text-[11px] font-bold ${active ? cfg.text : 'text-gray-500 dark:text-gray-400'}`}>
                          {t(`chamados.${PRIO_LABEL_KEY[key]}`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Portal + Title + Description ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500">
                  {t('chamados.portalLabel')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PORTALS.map(p => (
                    <button key={p} onClick={() => setPortal(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        portal === p
                          ? 'border-[#EC0000] bg-red-50 dark:bg-red-900/20 text-[#EC0000]'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {t(`chamados.portal_${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-gray-400 dark:text-gray-500">
                  {t('chamados.titleLabel')} *
                </label>
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={300}
                  placeholder={t('chamados.titlePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-[#EC0000]/10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#EC0000]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-gray-400 dark:text-gray-500">
                  {t('chamados.descLabel')} *
                </label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  rows={4}
                  placeholder={t('chamados.descPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border resize-none outline-none transition-all focus:ring-2 focus:ring-[#EC0000]/10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#EC0000]/40"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Attachments + Summary ── */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Summary card */}
              <div className="rounded-xl p-3 border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${type === 'BUG' ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400' : 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'}`}>
                    {type === 'BUG' ? t('chamados.typeBug') : t('chamados.typeImprovement')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIO_STYLES[priority as keyof typeof PRIO_STYLES]?.border} ${PRIO_STYLES[priority as keyof typeof PRIO_STYLES]?.text}`}>
                    {t(`chamados.${PRIO_LABEL_KEY[priority]}`)}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    {t(`chamados.portal_${portal}`)}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{title}</p>
                <p className="text-[11px] mt-1 line-clamp-2 text-gray-500 dark:text-gray-400">{desc}</p>
              </div>

              {/* Drop zone */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500">
                  {t('chamados.wizardAttachLabel')} ({attachments.length}/5)
                </p>

                {attachments.length < 5 && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragging
                        ? 'border-[#EC0000] bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <ImagePlus className={`w-8 h-8 mx-auto mb-2 transition-colors ${dragging ? 'text-[#EC0000]' : 'text-gray-400'}`} />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('chamados.wizardAttachHint')}</p>
                    <p className="text-[10px] mt-0.5 text-gray-400 dark:text-gray-500">{t('chamados.wizardAttachSub')}</p>
                  </div>
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

                {attachments.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {attachments.map((src, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={src} alt={t('chamados.attachmentAlt', { num: i + 1 })} className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#EC0000] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {step > 1 ? t('chamados.wizardBack') : t('chamados.wizardCancel')}
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${
                i + 1 === step ? 'w-4 h-1.5 bg-[#EC0000]' :
                i + 1 < step  ? 'w-1.5 h-1.5 bg-[#EC0000]/40' :
                'w-1.5 h-1.5 bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>

          {step < TOTAL ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 2 && !canStep2}
              className="px-5 py-2 bg-[#EC0000] hover:bg-[#CC0000] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
            >
              {t('chamados.wizardNext')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-[#EC0000] hover:bg-[#CC0000] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
            >
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Send className="w-3.5 h-3.5" />
              {t('chamados.createBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChamadosKanban() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'ADMIN';

  const [chamados, setChamados]         = useState<Chamado[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<number | null>(null);
  const [commentText, setCommentText]   = useState('');
  const [showArchive, setShowArchive]   = useState(false);
  const [adminNotes, setAdminNotes]     = useState<Record<number, string>>({});
  const [filterPortal, setFilterPortal] = useState<string>('');
  const [filterType, setFilterType]     = useState<string>('');
  const [draggedId, setDraggedId]       = useState<number | null>(null);
  const [users, setUsers]               = useState<{ id: number; full_name: string }[]>([]);
  const [lightboxSrc, setLightboxSrc]   = useState<string | null>(null);

  const fetchChamados = useCallback(async () => {
    try {
      const { data } = await api.get('/chamados');
      setChamados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching chamados', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChamados(); }, [fetchChamados]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/admin/users', { params: { page_size: 100 } }).then(r => {
      const data = r.data;
      setUsers(Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []);
    }).catch(() => {});
  }, [isAdmin]);

  const handleStatusChange = async (chamadoId: number, newStatus: string) => {
    if (!isAdmin) return;
    try {
      await api.put(`/chamados/${chamadoId}`, { status: newStatus });
      fetchChamados();
    } catch (err) { console.error('Error changing status', err); }
  };

  const handleAssign = async (chamadoId: number, userId: number) => {
    if (!isAdmin) return;
    try {
      await api.put(`/chamados/${chamadoId}`, { assigned_to_id: userId });
      fetchChamados();
    } catch (err) { console.error('Error assigning', err); }
  };

  const handleUpdateNotes = async (chamadoId: number) => {
    try {
      await api.put(`/chamados/${chamadoId}`, { admin_notes: adminNotes[chamadoId] || '' });
      fetchChamados();
    } catch (err) { console.error('Error updating notes', err); }
  };

  const handleAddComment = async (chamadoId: number) => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/chamados/${chamadoId}/comments`, { content: commentText.trim() });
      setCommentText('');
      fetchChamados();
    } catch (err) { console.error('Error adding comment', err); }
  };

  const handleDelete = async (chamadoId: number) => {
    if (!isAdmin) return;
    try {
      await api.delete(`/chamados/${chamadoId}`);
      setSelectedChamado(null);
      fetchChamados();
    } catch (err) { console.error('Error deleting', err); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragStart = (e: any, id: number) => {
    if (!isAdmin) return;
    setDraggedId(id);
    if (e?.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!isAdmin || draggedId === null) return;
    handleStatusChange(draggedId, targetStatus);
    setDraggedId(null);
  };

  const filtered = chamados.filter(c => {
    if (filterPortal && c.portal !== filterPortal) return false;
    if (filterType && c.type !== filterType) return false;
    return true;
  });

  const getColumnChamados = (status: string) => filtered.filter(c => c.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC0000]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
            {t('chamados.title')}
          </h1>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            {t('chamados.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#EC0000] hover:bg-[#CC0000] text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('chamados.newTicket')}
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <select value={filterPortal} onChange={e => setFilterPortal(e.target.value)}
          className={selectCls + ' max-w-[200px]'}
        >
          <option value="">{t('chamados.allPortals')}</option>
          {PORTALS.map(p => <option key={p} value={p}>{t(`chamados.portal_${p}`)}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className={selectCls + ' max-w-[200px]'}
        >
          <option value="">{t('chamados.allTypes')}</option>
          <option value="BUG">{t('chamados.typeBug')}</option>
          <option value="MELHORIA">{t('chamados.typeImprovement')}</option>
        </select>
      </div>

      {/* ── Kanban Board ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KANBAN_COLUMNS.map(status => {
          const colStyle = COLUMN_STYLES[status];
          const items = getColumnChamados(status);
          return (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={e => handleColumnDrop(e, status)}
              className={`rounded-2xl border p-4 min-h-[400px] transition-all ${colStyle.bg} ${colStyle.darkBg} ${colStyle.border} ${colStyle.darkBorder}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${colStyle.dot}`} />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${colStyle.text} ${colStyle.darkText}`}>{t(`chamados.status_${status}`)}</h3>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-gray-900/40 ${colStyle.text} ${colStyle.darkText}`}>{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map(chamado => {
                  const PriorityIcon = PRIORITY_CONFIG[chamado.priority]?.icon || Minus;
                  const priorityColor = PRIORITY_CONFIG[chamado.priority]?.color || 'text-gray-400';
                  const hasAttachments = (chamado.attachments?.length ?? 0) > 0;

                  return (
                    <div key={chamado.id}
                      draggable={isAdmin}
                      onDragStart={e => handleDragStart(e, chamado.id)}
                      className={`rounded-xl border p-4 transition-all ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md ${draggedId === chamado.id ? 'opacity-50' : ''}`}
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-2">
                        {isAdmin && <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {chamado.type === 'BUG'
                              ? <Bug className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              : <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${chamado.type === 'BUG' ? 'text-red-500' : 'text-amber-500'}`}>
                              {t(`chamados.type${chamado.type === 'BUG' ? 'Bug' : 'Improvement'}`)}
                            </span>
                            <PriorityIcon className={`w-3.5 h-3.5 ml-auto flex-shrink-0 ${priorityColor}`} />
                          </div>
                          <h4 className="text-sm font-bold leading-snug text-gray-900 dark:text-white">{chamado.title}</h4>
                          <p className="text-xs mt-1 line-clamp-2 text-gray-500 dark:text-gray-400">{chamado.description}</p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                          {t(`chamados.portal_${chamado.portal}`)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          <User className="w-3 h-3 inline mr-0.5" />{chamado.creator_name}
                        </span>
                        {chamado.comments.length > 0 && (
                          <span className="text-[10px] text-gray-400">
                            <MessageSquare className="w-3 h-3 inline mr-0.5" />{chamado.comments.length}
                          </span>
                        )}
                        {hasAttachments && (
                          <span className="text-[10px] text-gray-400">
                            <ImagePlus className="w-3 h-3 inline mr-0.5" />{chamado.attachments!.length}
                          </span>
                        )}
                      </div>

                      {/* View details */}
                      <button
                        onClick={() => {
                          setSelectedChamado(chamado.id);
                          setAdminNotes(prev => ({ ...prev, [chamado.id]: chamado.admin_notes || '' }));
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t('chamados.expand')}
                      </button>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">
                    {t('chamados.emptyColumn')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Archive: Completed ────────────────────────────── */}
      {(() => {
        const archiveItems = filtered.filter(c => c.status === 'CONCLUIDO');
        return (
          <div
            onDragOver={handleDragOver}
            onDrop={e => handleColumnDrop(e, 'CONCLUIDO')}
            className="rounded-2xl border transition-all bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          >
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
                <Archive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('chamados.archiveTitle')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('chamados.archiveSub')}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                {archiveItems.length}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform text-gray-400 ${showArchive ? 'rotate-180' : ''}`} />
            </button>

            {showArchive && archiveItems.length > 0 && (
              <div className="overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {archiveItems.map(chamado => {
                    const PriorityIcon = PRIORITY_CONFIG[chamado.priority]?.icon || Minus;
                    const priorityColor = PRIORITY_CONFIG[chamado.priority]?.color || 'text-gray-400';
                    return (
                      <div
                        key={chamado.id}
                        draggable={isAdmin}
                        onDragStart={e => handleDragStart(e, chamado.id)}
                        onClick={() => {
                          setSelectedChamado(chamado.id);
                          setAdminNotes(prev => ({ ...prev, [chamado.id]: chamado.admin_notes || '' }));
                        }}
                        className={`cursor-pointer text-left rounded-xl border p-3.5 transition-all ${isAdmin ? 'active:cursor-grabbing' : ''} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md ${draggedId === chamado.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {chamado.type === 'BUG'
                            ? <Bug className="w-3 h-3 text-red-500 flex-shrink-0" />
                            : <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${chamado.type === 'BUG' ? 'text-red-500' : 'text-amber-500'}`}>
                            {t(`chamados.type${chamado.type === 'BUG' ? 'Bug' : 'Improvement'}`)}
                          </span>
                          <PriorityIcon className={`w-3 h-3 ml-auto ${priorityColor}`} />
                        </div>
                        <h4 className="text-xs font-bold leading-snug line-clamp-1 text-gray-900 dark:text-white">{chamado.title}</h4>
                        <p className="text-[11px] mt-1 line-clamp-1 text-gray-500 dark:text-gray-400">{chamado.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                          <FolderOpen className="w-3 h-3 flex-shrink-0" />
                          <span>{chamado.completed_at ? new Date(chamado.completed_at).toLocaleDateString() : new Date(chamado.updated_at || chamado.created_at).toLocaleDateString()}</span>
                          <span className="ml-auto font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {t(`chamados.portal_${chamado.portal}`)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Create Wizard ───────────────────────────────────── */}
      {showCreate && (
        <CreateWizard onClose={() => setShowCreate(false)} onCreated={fetchChamados} />
      )}

      {/* ── Detail Modal ─────────────────────────────────── */}
      {selectedChamado && (() => {
        const chamado = chamados.find(c => c.id === selectedChamado);
        if (!chamado) return null;
        const PIcon = PRIORITY_CONFIG[chamado.priority]?.icon || Minus;
        const pColor = PRIORITY_CONFIG[chamado.priority]?.color || 'text-gray-400';
        const hasAtt = (chamado.attachments?.length ?? 0) > 0;
        const colStyle = COLUMN_STYLES[chamado.status];
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedChamado(null)}
          >
            <div
              className="w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        chamado.type === 'BUG' ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      }`}>
                        {chamado.type === 'BUG' ? <Bug className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                        {t(`chamados.type${chamado.type === 'BUG' ? 'Bug' : 'Improvement'}`)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colStyle?.border || 'border-gray-200'} ${colStyle?.darkBorder || 'dark:border-gray-700'} ${colStyle?.text || 'text-gray-400'} ${colStyle?.darkText || ''} ${colStyle?.bg || ''} ${colStyle?.darkBg || ''}`}>
                        {t(`chamados.status_${chamado.status}`)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        {t(`chamados.portal_${chamado.portal}`)}
                      </span>
                      <PIcon className={`w-4 h-4 ${pColor}`} />
                    </div>
                    <h2 className="text-lg font-headline font-bold text-gray-900 dark:text-white">{chamado.title}</h2>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{chamado.creator_name}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(chamado.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedChamado(null)}
                    className="p-1.5 rounded-xl transition-colors flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  {/* Left: Description + Attachments */}
                  <div className="lg:col-span-3 p-6 space-y-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('chamados.description')}</span>
                      <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">{chamado.description}</p>
                    </div>

                    {hasAtt && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          {t('chamados.attachments')} ({chamado.attachments!.length})
                        </span>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {chamado.attachments!.map((src, i) => (
                            <button key={i} onClick={() => setLightboxSrc(src)}
                              className="relative group aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-[#EC0000] transition-all"
                            >
                              <img src={src} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Sidebar */}
                  <div className="lg:col-span-2 p-6 space-y-5 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {/* Assignee */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('chamados.assignedTo')}</span>
                      {isAdmin ? (
                        <select value={chamado.assigned_to_id || ''} onChange={e => handleAssign(chamado.id, Number(e.target.value) || 0)}
                          className={selectCls + ' mt-1.5 text-xs'}
                        >
                          <option value="">{t('chamados.unassigned')}</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                      ) : (
                        <p className="text-xs mt-1.5 text-gray-600 dark:text-gray-300">{chamado.assignee_name || t('chamados.unassigned')}</p>
                      )}
                    </div>

                    {/* Admin Notes */}
                    {isAdmin ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('chamados.adminNotes')}</span>
                        <textarea
                          value={adminNotes[chamado.id] ?? chamado.admin_notes ?? ''}
                          onChange={e => setAdminNotes(prev => ({ ...prev, [chamado.id]: e.target.value }))}
                          onBlur={() => handleUpdateNotes(chamado.id)}
                          rows={3}
                          placeholder={t('chamados.notesPlaceholder')}
                          className="mt-1.5 w-full px-3 py-2 rounded-xl text-xs border resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-[#EC0000]/40"
                        />
                      </div>
                    ) : chamado.admin_notes ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('chamados.adminNotes')}</span>
                        <p className="text-xs mt-1.5 whitespace-pre-wrap text-gray-600 dark:text-gray-300">{chamado.admin_notes}</p>
                      </div>
                    ) : null}

                    {/* Dates */}
                    <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t('chamados.createdAt')}: {new Date(chamado.created_at).toLocaleString()}</span>
                      </div>
                      {chamado.completed_at && (
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{t('chamados.completedAt')}: {new Date(chamado.completed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    {isAdmin && (
                      <button onClick={() => handleDelete(chamado.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t('chamados.delete')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {t('chamados.comments')} ({chamado.comments.length})
                  </span>
                  <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                    {chamado.comments.map(cm => (
                      <div key={cm.id} className="text-xs p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white">{cm.author_name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-400">{new Date(cm.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{cm.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input type="text"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddComment(chamado.id); }}
                      placeholder={t('chamados.commentPlaceholder')}
                      className="flex-1 px-3 py-2 rounded-xl text-xs border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#EC0000]/40"
                    />
                    <button onClick={() => handleAddComment(chamado.id)} className="px-3 py-2 rounded-xl bg-[#EC0000] hover:bg-[#CC0000] text-white transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc} alt={t('chamados.attachmentAlt', { num: '' })}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
