import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, BookOpen, Users, Check, Building2, Package, Search } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { getTranslatedProductName } from '../../utils/productTranslation';

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

export default function TrainingPlanForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bank_ids: [] as number[],
    product_ids: [] as number[],
    start_date: '',
    end_date: '',
    selectedCourses: [] as number[],
    selectedStudents: [] as number[],
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [token, user, navigate]);

  const fetchData = async () => {
    try {
      const [coursesRes, banksRes, productsRes, studentsRes] = await Promise.all([
        api.get('/api/trainer/courses'),
        api.get('/api/admin/banks'),
        api.get('/api/admin/products'),
        api.get('/api/trainer/students/list')
      ]);
      setCourses(coursesRes.data);
      setBanks(banksRes.data);
      setProducts(productsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };


  const handleCourseToggle = (courseId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId]
    }));
  };

  const handleStudentToggle = (studentId: number) => {
    // Não permitir que o formador se selecione como aluno
    if (user?.id === studentId) {
      setError(t('trainingPlan.cannotSelectSelf'));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (!formData.title.trim()) {
      setError(t('admin.titleRequired'));
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError(t('admin.descriptionRequired'));
      setLoading(false);
      return;
    }

    if (formData.selectedCourses.length === 0) {
      setError(t('trainingPlan.selectAtLeastOneCourse'));
      setLoading(false);
      return;
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        setError(t('trainingPlan.endDateMustBeAfterStartDate'));
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.post('/api/training-plans/', {
        title: formData.title,
        description: formData.description,
        trainer_id: user?.id, // ID do trainer logado (legado)
        trainer_ids: [user?.id], // Novo formato - trainer logado como único formador
        bank_ids: formData.bank_ids,
        product_ids: formData.product_ids,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        course_ids: formData.selectedCourses,
        student_ids: formData.selectedStudents
      });

      console.log('Training plan created:', response.data);
      navigate('/training-plans');
    } catch (error: any) {
      console.error('Error creating training plan:', error);
      setError(error.response?.data?.detail || t('trainingPlan.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/training-plans')}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← {t('common.back')}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('trainingPlan.create')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-slate-400">{t('trainingPlan.createDescription')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {t('trainingPlan.basicInfo')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t('trainingPlan.title')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('trainingPlan.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t('trainingPlan.description')}
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('trainingPlan.descriptionPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {t('trainingPlan.banks')} <span className="text-gray-400 dark:text-slate-500 text-xs">({t('admin.selectMultiple')})</span>
                    </div>
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
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
                        className={`p-2 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                          formData.bank_ids.includes(bank.id)
                          ? 'bg-blue-100 dark:bg-blue-500/20 border border-blue-500'
                          : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/50'
                        }`}
                      >
                        <span className="text-gray-900 dark:text-white">{bank.name}</span>
                        {formData.bank_ids.includes(bank.id) && <Check className="w-4 h-4 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t('trainingPlan.services')} <span className="text-gray-400 dark:text-slate-500 text-xs">({t('admin.selectMultiple')})</span>
                    </div>
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
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
                        className={`p-2 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                          formData.product_ids.includes(product.id)
                          ? 'bg-blue-100 dark:bg-blue-500/20 border border-blue-500'
                          : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/50'
                        }`}
                      >
                        <span className="text-gray-900 dark:text-white">{getTranslatedProductName(t, product.code, product.name)}</span>
                        {formData.product_ids.includes(product.id) && <Check className="w-4 h-4 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    {t('trainingPlan.startDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    {t('trainingPlan.endDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Selection */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('trainingPlan.selectCourses')}
                </h2>
              </div>
              {formData.selectedCourses.length > 0 && (
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                  {formData.selectedCourses.length} {t('trainingPlan.coursesSelected')}
                </span>
              )}
            </div>

            {/* Course Search Filter */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder={t('trainingPlan.searchCourses')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {courses.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                {t('courses.noCourses')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {courses
                  .filter(course => {
                    if (!courseSearch.trim()) return true;
                    const search = courseSearch.toLowerCase();
                    return (
                      course.title.toLowerCase().includes(search) ||
                      course.description?.toLowerCase().includes(search) ||
                      course.bank_name?.toLowerCase().includes(search) ||
                      course.product_name?.toLowerCase().includes(search)
                    );
                  })
                  .map((course) => (
                  <label
                    key={course.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.selectedCourses.includes(course.id)
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/50'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      className="mt-1 w-4 h-4 text-blue-500 bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/20 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        {course.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                        {course.description}
                      </div>
                      {(course.bank_name || course.product_name) && (
                        <div className="flex gap-2 text-xs">
                          {course.bank_name && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded">
                              {course.bank_name}
                            </span>
                          )}
                          {course.product_name && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded">
                              {getTranslatedProductName(t, course.product_code, course.product_name)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
                {courses.filter(course => {
                  if (!courseSearch.trim()) return true;
                  const search = courseSearch.toLowerCase();
                  return (
                    course.title.toLowerCase().includes(search) ||
                    course.description?.toLowerCase().includes(search) ||
                    course.bank_name?.toLowerCase().includes(search) ||
                    course.product_name?.toLowerCase().includes(search)
                  );
                }).length === 0 && courseSearch.trim() && (
                  <p className="text-gray-500 dark:text-slate-400 text-center py-6 text-sm">
                    {t('common.noResults')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Student Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">
                {t('admin.students')}
              </h2>
            </div>

            {students.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                {t('trainingPlan.noStudentsAvailable')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => {
                  const isCurrentTrainer = student.id === user?.id;
                  return (
                  <label
                    key={student.id}
                    className={`flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 transition-colors ${
                      isCurrentTrainer 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      disabled={isCurrentTrainer}
                      className="mt-1 w-4 h-4 text-green-500 bg-white/5 border-white/20 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-white mb-1">
                        {student.full_name}
                        {student.role === 'TRAINER' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                            {t('roles.trainer')}
                          </span>
                        )}
                        {isCurrentTrainer && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            ({t('common.you')})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {student.email}
                      </div>
                      {isCurrentTrainer && (
                        <div className="text-xs text-amber-400 mt-1">
                          {t('trainingPlan.cannotSelectSelf')}
                        </div>
                      )}
                    </div>
                  </label>
                );})}
              </div>
            )}

            {formData.selectedStudents.length > 0 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">
                  {formData.selectedStudents.length} {t('trainingPlan.studentsSelected')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/training-plans')}
              className="px-6 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('common.loading') : t('trainingPlan.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
