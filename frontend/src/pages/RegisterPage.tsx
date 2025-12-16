import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { UserPlus, Mail, Lock, User, ArrowRight, GraduationCap, Users } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'STUDENT'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.full_name) {
      setError(t('auth.fillAllFields'));
      return false;
    }
    
    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError(t('auth.invalidEmail'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role
      });
      
      if (response.data) {
        setSuccess(
          formData.role === 'TRAINER'
            ? t('auth.registerTrainerSuccess')
            : t('auth.registerStudentSuccess')
        );
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          full_name: '',
          role: 'STUDENT'
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || t('auth.registrationError');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-red-950/20">
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-red-600/10 rounded-full blur-3xl animate-float"
              style={{
                width: Math.random() * 400 + 100 + 'px',
                height: Math.random() * 400 + 100 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 10 + 's',
                animationDuration: Math.random() * 20 + 10 + 's',
              }}
            />
          ))}
        </div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Back to Landing */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
      >
        <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">{t('common.backToHome')}</span>
      </Link>

      {/* Register Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl mb-4 shadow-lg shadow-red-900/50">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t('auth.register')}
              </h1>
              <p className="text-gray-400">
                {t('auth.create_account')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('common.fullName')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                placeholder={t('common.fullName')}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                placeholder="••••••"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t('auth.passwordMinLength')}
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                placeholder="••••••"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <p className="text-sm font-medium text-gray-300 mb-3">
              {t('auth.selectRole')}
            </p>
            <div className="space-y-2">
              {/* Student Option */}
              <label
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'STUDENT'
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  checked={formData.role === 'STUDENT'}
                  onChange={() => handleRoleChange('STUDENT')}
                  className="w-4 h-4 text-red-600"
                  disabled={loading}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-red-500" />
                    <p className="font-medium text-white">{t('common.student')}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('auth.roleStudentDesc')}</p>
                </div>
              </label>

              {/* Trainer Option */}
              <label
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'TRAINER'
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="TRAINER"
                  checked={formData.role === 'TRAINER'}
                  onChange={() => handleRoleChange('TRAINER')}
                  className="w-4 h-4 text-red-600"
                  disabled={loading}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-500" />
                    <p className="font-medium text-white">{t('common.trainer')}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('auth.roleTrainerDesc')}</p>
                </div>
              </label>
            </div>

            {formData.role === 'TRAINER' && (
              <div className="mt-3 bg-red-500/10 border border-red-500/50 rounded p-2">
                <p className="text-xs text-red-400">
                  {t('auth.trainerValidationInfo')}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/50 hover:shadow-red-900/70 hover:scale-[1.02] transform mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('common.loading')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                {t('auth.register')}
              </span>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-red-500 font-semibold hover:text-red-400 transition-colors">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <p className="text-center text-gray-500 text-sm mt-6">
        {t('common.appName')} © 2025
      </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
