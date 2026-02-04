import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Save, X, Users, Building2, Package, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import api from '../../lib/axios';

interface Trainer {
  id: number;
  full_name: string;
  email: string;
}

interface Bank {
  id: number;
  code: string;
  name: string;
  country: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
}

export default function CourseForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bank_ids: [] as number[],
    product_ids: [] as number[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trainersRes, banksRes, productsRes] = await Promise.all([
        api.get('/api/admin/trainers'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products')
      ]);
      setTrainers(trainersRes.data);
      setBanks(banksRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = t('admin.titleRequired');
      if (!formData.description.trim()) newErrors.description = t('admin.descriptionRequired');
    } else if (step === 2) {
      if (formData.bank_ids.length === 0) newErrors.bank_ids = t('admin.bankRequired');
      if (formData.product_ids.length === 0) newErrors.product_ids = t('admin.productTypeRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const toggleBank = (bankId: number) => {
    setFormData(prev => ({
      ...prev,
      bank_ids: prev.bank_ids.includes(bankId)
        ? prev.bank_ids.filter(id => id !== bankId)
        : [...prev.bank_ids, bankId]
    }));
  };

  const toggleProduct = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    try {
      setLoading(true);
      await api.post('/api/admin/courses', {
        title: formData.title,
        description: formData.description,
        bank_ids: formData.bank_ids,
        product_ids: formData.product_ids,
      });
      
      // Success animation
      setCurrentStep(3);
      setTimeout(() => {
        navigate('/courses');
      }, 2000);
    } catch (error) {
      console.error('Error creating course:', error);
      setErrors({ submit: t('messages.error') });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: t('admin.basicInfo'), icon: BookOpen },
    { number: 2, title: t('admin.details'), icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-xl shadow-red-900/50 animate-pulse">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300">
                  {t('admin.newCourse')}
                </h1>
                <p className="text-gray-400 mt-1">{t('admin.createNewCourse')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white rounded-xl transition-all border border-gray-200 dark:border-white/10 hover:scale-105"
            >
              <X className="w-5 h-5" />
              {t('common.cancel')}
            </button>
          </div>

          {/* Progress Steps */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between mb-8 relative max-w-md mx-auto">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                return (
                  <div key={step.number} className="flex flex-col items-center relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110' :
                      isCurrent ? 'bg-gradient-to-br from-red-600 to-red-700 scale-110 shadow-lg shadow-red-900/50' :
                      'bg-white border-2 border-gray-200 dark:bg-white/5 dark:border-white/20'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <p className={`mt-2 text-sm font-medium ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form */}
        {currentStep === 3 ? (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 p-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-6 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('admin.courseCreatedSuccess')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('admin.redirecting')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-2xl">
            <div className="min-h-[400px]">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <BookOpen className="w-4 h-4" />
                      {t('admin.courseTitle')} *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-5 py-4 bg-white dark:bg-white/5 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-lg`}
                      placeholder={t('admin.courseTitlePlaceholder')}
                    />
                    {errors.title && <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.title}</p>}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <BookOpen className="w-4 h-4" />
                      {t('admin.courseDescription')} *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      className={`w-full px-5 py-4 bg-white dark:bg-white/5 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none text-lg`}
                      placeholder={t('admin.courseDescriptionPlaceholder')}
                    />
                    {errors.description && <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.description}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <Building2 className="w-4 h-4" />
                      {t('admin.banks')} * <span className="text-gray-400 text-xs">({t('admin.selectMultiple')})</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {banks.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => toggleBank(bank.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.bank_ids.includes(bank.id)
                              ? 'border-red-500 bg-red-500/10 dark:bg-red-500/20'
                              : 'border-gray-200 dark:border-white/10 hover:border-red-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{bank.code}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{bank.name}</p>
                              <p className="text-xs text-gray-500">{bank.country}</p>
                            </div>
                            {formData.bank_ids.includes(bank.id) && (
                              <Check className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.bank_ids && <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.bank_ids}</p>}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <Package className="w-4 h-4" />
                      {t('admin.services')} * <span className="text-gray-400 text-xs">({t('admin.selectMultiple')})</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.product_ids.includes(product.id)
                              ? 'border-red-500 bg-red-500/10 dark:bg-red-500/20'
                              : 'border-gray-200 dark:border-white/10 hover:border-red-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.code}</p>
                            </div>
                            {formData.product_ids.includes(product.id) && (
                              <Check className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.product_ids && <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.product_ids}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-8 border-t border-gray-200 dark:border-white/10">
              {currentStep > 1 && currentStep < 3 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white rounded-xl font-medium transition-all border border-gray-200 dark:border-white/10 hover:scale-105"
                >
                  {t('common.back')}
                </button>
              )}
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-900/50 hover:scale-105"
                >
                  {t('common.next')}
                  <Save className="w-5 h-5" />
                </button>
              ) : currentStep === 2 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {loading ? t('messages.saving') : t('admin.createCourse')}
                </button>
              ) : null}
            </div>

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {errors.submit}
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
