import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Calendar, CheckCircle2, AlertCircle, Users, Building2, Package, Check } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Trainer {
  id: number;
  full_name: string;
  email: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  bank_name?: string;
  product_name?: string;
  product_code?: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  country?: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  role?: 'TRAINEE' | 'TRAINER';
}

export default function AdminTrainingPlanForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bank_ids: [] as number[],
    product_ids: [] as number[],
    start_date: '',
    end_date: '',
    trainer_ids: [] as number[],
    course_ids: [] as number[],
    student_id: null as number | null,
  });

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do formulário...');
      
      const [trainersRes, coursesRes, banksRes, productsRes, studentsRes] = await Promise.all([
        api.get('/api/admin/trainers'),
        api.get('/api/admin/courses'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products'),
        api.get('/api/admin/students')
      ]);
      
      console.log('✅ Formadores carregados:', trainersRes.data.length);
      console.log('✅ Cursos carregados:', coursesRes.data.length);
      console.log('✅ Bancos carregados:', banksRes.data.length);
      console.log('✅ Produtos carregados:', productsRes.data.length);
      console.log('✅ Formandos carregados:', studentsRes.data.length);
      
      setTrainers(trainersRes.data || []);
      setCourses(coursesRes.data || []);
      setBanks(banksRes.data || []);
      setProducts(productsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      console.error('❌ Detalhes:', error.response?.data);
      setErrors({ 
        submit: `Erro ao carregar dados: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Validar título
      if (!formData.title.trim()) {
        newErrors.title = 'Título é obrigatório';
      } else if (formData.title.trim().length < 3) {
        newErrors.title = 'Título deve ter pelo menos 3 caracteres';
      }

      // Validar descrição
      if (!formData.description.trim()) {
        newErrors.description = 'Descrição é obrigatória';
      } else if (formData.description.trim().length < 10) {
        newErrors.description = 'Descrição deve ter pelo menos 10 caracteres';
      }

      // Validar datas
      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (endDate < startDate) {
          newErrors.end_date = 'Data de fim deve ser posterior à data de início';
        }
      }
    }

    if (step === 2) {
      // Formadores são opcionais - podem ser adicionados depois
      // Apenas validar conflito se ambos foram selecionados
      if (formData.student_id && formData.trainer_ids.includes(formData.student_id)) {
        newErrors.trainer_ids = 'O aluno selecionado não pode ser também formador';
      }
    }

    if (step === 3) {
      // Validar cursos
      if (formData.course_ids.length === 0) {
        newErrors.course_ids = 'Selecione pelo menos um curso';
      }
    }

    if (step === 4) {
      // Validar que o formando não seja também formador
      if (formData.student_id && formData.trainer_ids.includes(formData.student_id)) {
        newErrors.student_id = 'O aluno não pode ser também formador do mesmo plano';
      }
    }

    // Step 5 - validação final completa
    if (step === 5) {
      // Revalidar todos os campos obrigatórios
      if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
      if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
      if (formData.course_ids.length === 0) newErrors.course_ids = 'Pelo menos um curso é obrigatório';
      // Validar conflito aluno/formador (apenas se ambos foram selecionados)
      if (formData.student_id && formData.trainer_ids.includes(formData.student_id)) {
        newErrors.student_id = 'O aluno não pode ser também formador do mesmo plano';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      
      // Preparar payload com validações
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        bank_ids: formData.bank_ids,
        product_ids: formData.product_ids,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        trainer_id: formData.trainer_ids[0] || null,
        trainer_ids: formData.trainer_ids,
        course_ids: formData.course_ids,
        student_id: formData.student_id
      };

      console.log('📤 Enviando plano de formação:', payload);

      // Usar rota correta /api/training-plans/
      await api.post('/api/training-plans/', payload);
      
      console.log('✅ Plano de formação criado com sucesso');
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/admin/training-plans');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Erro ao criar plano de formação:', error);
      console.error('❌ Response:', error.response?.data);
      setErrors({ submit: error.response?.data?.detail || 'Falha ao criar plano de formação' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Informações Básicas', icon: Target },
    { number: 2, title: 'Atribuir Formadores', icon: Users },
    { number: 3, title: 'Selecionar Cursos', icon: Calendar },
    { number: 4, title: 'Selecionar Formandos', icon: Users },
    { number: 5, title: 'Revisão', icon: CheckCircle2 }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/50">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Plano criado com sucesso!
          </h2>
          <p className="text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto carrega dados iniciais
  if (loading && trainers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando dados...</p>
          <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se falhou ao carregar
  if (errors.submit && trainers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8">
        <div className="max-w-md w-full glass rounded-2xl border border-red-500/20 p-8 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Falha ao Carregar</h2>
          <p className="text-gray-400 mb-6">{errors.submit}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                Novo Plano de Formação
              </h1>
              <p className="text-gray-400">Criar novo plano de formação</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-2 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-900/50'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <span className={`text-xs md:text-sm font-medium truncate ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? 'bg-purple-600' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="glass rounded-2xl border border-white/10 p-8 animate-fadeIn">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Informações Básicas</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título do Plano *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  placeholder="Ex: Formação em Produtos Bancários"
                />
                {errors.title && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  placeholder="Descreva os objetivos e conteúdo do plano de formação..."
                />
                {errors.description && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Bancos <span className="text-gray-400 text-xs">(selecione múltiplos)</span>
                    </div>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {banks.map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            bank_ids: prev.bank_ids.includes(bank.id)
                              ? prev.bank_ids.filter(id => id !== bank.id)
                              : [...prev.bank_ids, bank.id]
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.bank_ids.includes(bank.id)
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{bank.code}</p>
                            <p className="text-sm text-gray-400">{bank.name}</p>
                            {bank.country && <p className="text-xs text-gray-500">{bank.country}</p>}
                          </div>
                          {formData.bank_ids.includes(bank.id) && (
                            <Check className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {banks.length === 0 && (
                    <div className="text-yellow-400 text-xs mt-1">⚠️ {t('errors.noBanks')}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Serviços <span className="text-gray-400 text-xs">(selecione múltiplos)</span>
                    </div>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {products.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            product_ids: prev.product_ids.includes(product.id)
                              ? prev.product_ids.filter(id => id !== product.id)
                              : [...prev.product_ids, product.id]
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.product_ids.includes(product.id)
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{getTranslatedProductName(t, product.code, product.name)}</p>
                            <p className="text-xs text-gray-500">{product.code}</p>
                          </div>
                          {formData.product_ids.includes(product.id) && (
                            <Check className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {products.length === 0 && (
                    <div className="text-yellow-400 text-xs mt-1">⚠️ {t('errors.noProducts')}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      errors.end_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                  {errors.end_date && (
                    <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.end_date}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assign Trainers */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Atribuir Formadores</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Selecione os formadores responsáveis por este plano de formação *
                  <span className="text-gray-500 ml-2">(O primeiro selecionado será o formador principal)</span>
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {trainers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p>{t('errors.noTrainers')}</p>
                    </div>
                  ) : (
                    trainers.map((trainer) => {
                      const isSelected = formData.trainer_ids.includes(trainer.id);
                      const selectionIndex = formData.trainer_ids.indexOf(trainer.id);
                      return (
                        <label 
                          key={trainer.id}
                          className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-500'
                              : 'bg-white/5 border-white/10 hover:border-purple-500/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setFormData({ 
                                  ...formData, 
                                  trainer_ids: formData.trainer_ids.filter(id => id !== trainer.id) 
                                });
                              } else {
                                setFormData({ 
                                  ...formData, 
                                  trainer_ids: [...formData.trainer_ids, trainer.id] 
                                });
                              }
                            }}
                            className="w-5 h-5 text-purple-600 focus:ring-2 focus:ring-purple-500/20 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-white font-medium flex items-center gap-2">
                              {trainer.full_name}
                              {selectionIndex === 0 && (
                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                                  Principal
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400 text-sm">{trainer.email}</div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {errors.trainer_ids && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.trainer_ids}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Select Courses */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Selecionar Cursos</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Selecione os cursos que farão parte deste plano de formação *
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {courses.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p>{t('errors.noCourses')}</p>
                    </div>
                  ) : (
                    courses.map((course) => (
                      <label 
                        key={course.id}
                        className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                          formData.course_ids.includes(course.id)
                            ? 'bg-purple-500/10 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.course_ids.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, course_ids: [...formData.course_ids, course.id] });
                            } else {
                              setFormData({ ...formData, course_ids: formData.course_ids.filter(id => id !== course.id) });
                            }
                          }}
                          className="mt-1 w-5 h-5 rounded border-white/20 text-purple-600 focus:ring-2 focus:ring-purple-500/20"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">{course.title}</div>
                          <div className="text-sm text-gray-400 mb-2">{course.description}</div>
                          {(course.bank_name || course.product_name) && (
                            <div className="flex gap-2 text-xs">
                              {course.bank_name && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                  {course.bank_name}
                                </span>
                              )}
                              {course.product_name && (
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                  {getTranslatedProductName(t, course.product_code, course.product_name)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {errors.course_ids && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.course_ids}
                  </div>
                )}
                {formData.course_ids.length > 0 && (
                  <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="text-purple-300 font-medium">
                      {formData.course_ids.length} {t('errors.coursesSelected')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Select Students */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-semibold text-white">{t('trainingPlans.selectStudent')}</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('trainingPlans.selectStudentDesc')}
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p>{t('errors.noStudents')}</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <label 
                        key={student.id}
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                          formData.student_id === student.id
                            ? formData.trainer_ids.includes(student.id)
                              ? 'bg-red-500/10 border-red-500/50'
                              : 'bg-green-500/10 border-green-500/50'
                            : 'bg-white/5 border-white/10 hover:border-green-500/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="student"
                          checked={formData.student_id === student.id}
                          onChange={() => setFormData({ ...formData, student_id: student.id })}
                          className="w-5 h-5 border-white/20 text-green-600 focus:ring-2 focus:ring-green-500/20"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{student.full_name}</span>
                            {student.role === 'TRAINER' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                Formador
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm">{student.email}</div>
                          {formData.trainer_ids.includes(student.id) && (
                            <div className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Este utilizador é formador deste plano
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {errors.student_id && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {errors.student_id}
                  </div>
                )}
                {formData.student_id && !formData.trainer_ids.includes(formData.student_id) && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-green-300 font-medium">
                      {t('trainingPlans.studentSelected')}: {students.find(s => s.id === formData.student_id)?.full_name}
                    </div>
                  </div>
                )}
                {formData.student_id && formData.trainer_ids.includes(formData.student_id) && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="text-red-300 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      O aluno selecionado não pode ser também formador do mesmo plano
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Revisão</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Informações Básicas</div>
                  <div className="text-white font-medium text-lg mb-2">{formData.title}</div>
                  <div className="text-gray-300">{formData.description}</div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-3">Detalhes</div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Bancos:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.bank_ids.length > 0 ? formData.bank_ids.map(bid => {
                          const bank = banks.find(b => b.id === bid);
                          return bank ? (
                            <span key={bid} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                              {bank.name}
                            </span>
                          ) : null;
                        }) : <span className="text-gray-500">Nenhum selecionado</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Serviços:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.product_ids.length > 0 ? formData.product_ids.map(pid => {
                          const product = products.find(p => p.id === pid);
                          return product ? (
                            <span key={pid} className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                              {getTranslatedProductName(t, product.code, product.name)}
                            </span>
                          ) : null;
                        }) : <span className="text-gray-500">Nenhum selecionado</span>}
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <span className="text-gray-400">Data de Início:</span>
                        <span className="text-white ml-2">{formData.start_date || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Data de Fim:</span>
                        <span className="text-white ml-2">{formData.end_date || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Formadores ({formData.trainer_ids.length})</div>
                  <div className="space-y-1">
                    {formData.trainer_ids.map((tid, idx) => {
                      const trainer = trainers.find(t => t.id === tid);
                      return trainer ? (
                        <div key={tid} className="text-white flex items-center gap-2">
                          <span>{trainer.full_name}</span>
                          {idx === 0 && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                      ) : null;
                    })}
                    {formData.trainer_ids.length === 0 && <span className="text-gray-500">N/A</span>}
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Cursos</div>
                  <div className="text-white font-medium">
                    {formData.course_ids.length} {t('errors.coursesSelected')}
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">{t('trainingPlans.student')}</div>
                  <div className="text-white font-medium">
                    {formData.student_id 
                      ? students.find(s => s.id === formData.student_id)?.full_name 
                      : t('trainingPlans.noStudentSelected')}
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5" />
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all border border-white/10"
              >
                Voltar
              </button>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-900/50"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Criar Plano'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
