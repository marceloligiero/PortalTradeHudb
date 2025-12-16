import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, BookOpen, Users } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

interface Course {
  id: number;
  title: string;
  description: string;
  bank_name?: string;
  product_name?: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
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
}

export default function TrainingPlanForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bank_id: '',
    product_id: '',
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
        api.get('/api/admin/students')
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
      setError('O título é obrigatório');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('A descrição é obrigatória');
      setLoading(false);
      return;
    }

    if (formData.selectedCourses.length === 0) {
      setError('Selecione pelo menos um curso');
      setLoading(false);
      return;
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        setError('A data de fim deve ser posterior à data de início');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.post('/api/training-plans/', {
        title: formData.title,
        description: formData.description,
        trainer_id: user?.id, // ID do trainer logado
        bank_id: formData.bank_id ? parseInt(formData.bank_id) : null,
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        course_ids: formData.selectedCourses,
        student_ids: formData.selectedStudents
      });

      console.log('Training plan created:', response.data);
      navigate('/trainer/training-plans');
    } catch (error: any) {
      console.error('Error creating training plan:', error);
      setError(error.response?.data?.detail || 'Falha ao criar plano de formação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/trainer/training-plans')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← {t('common.back')}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">
              {t('trainingPlan.create')}
            </h1>
          </div>
          <p className="text-slate-400">{t('trainingPlan.createDescription')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {t('trainingPlan.basicInfo')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('trainingPlan.title')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('trainingPlan.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('trainingPlan.description')}
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('trainingPlan.descriptionPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Banco
                  </label>
                  <select
                    value={formData.bank_id}
                    onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="" className="bg-slate-800 text-white">Selecione um banco</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id} className="bg-slate-800 text-white">{bank.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Produto
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="" className="bg-slate-800 text-white">Selecione um produto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id} className="bg-slate-800 text-white">{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">
                {t('trainingPlan.selectCourses')}
              </h2>
            </div>

            {courses.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                {t('trainingPlan.noCoursesAvailable')}
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <label
                    key={course.id}
                    className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      className="mt-1 w-4 h-4 text-blue-500 bg-white/5 border-white/20 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">
                        {course.title}
                      </div>
                      <div className="text-sm text-slate-400 mb-2">
                        {course.description}
                      </div>
                      {(course.bank_name || course.product_name) && (
                        <div className="flex gap-2 text-xs">
                          {course.bank_name && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                              {course.bank_name}
                            </span>
                          )}
                          {course.product_name && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                              {course.product_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {formData.selectedCourses.length > 0 && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  {formData.selectedCourses.length} {t('trainingPlan.coursesSelected')}
                </p>
              </div>
            )}
          </div>

          {/* Student Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">
                Formandos
              </h2>
            </div>

            {students.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Nenhum formando disponível
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="mt-1 w-4 h-4 text-green-500 bg-white/5 border-white/20 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">
                        {student.full_name}
                      </div>
                      <div className="text-sm text-slate-400">
                        {student.email}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {formData.selectedStudents.length > 0 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">
                  {formData.selectedStudents.length} formando{formData.selectedStudents.length !== 1 ? 's' : ''} selecionado{formData.selectedStudents.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/trainer/training-plans')}
              className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('common.saving') : t('trainingPlan.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
