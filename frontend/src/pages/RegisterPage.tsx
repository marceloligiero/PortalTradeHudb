import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { UserPlus, Mail, Lock, User, ArrowRight, GraduationCap, Users } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Button, Input, Alert, RadioGroup } from '../components';
import { useTheme } from '../contexts/ThemeContext';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'TRAINEE'
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
      const response = await api.post('/auth/register', {
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
          role: 'TRAINEE'
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
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-blob ${isDark ? 'bg-red-600/10' : 'bg-red-600/5'}`} />
        <div className={`absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-blob animation-delay-2000 ${isDark ? 'bg-blue-600/5' : 'bg-blue-600/3'}`} />
      </div>

      {/* Navigation */}
      <div className={`absolute top-0 w-full z-50 p-4 flex justify-between items-center backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/50' : 'bg-white/50'}`}>
        <img 
          src="/logo-sds.png"
          alt="Santander Digital Services"
          className={`h-8 w-auto object-contain ${isDark ? '' : ''}`}
        />
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t('common.backToHome')}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Register Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-xl">
          {/* Card */}
          <div className={`rounded-[32px] shadow-2xl p-10 border animate-scale-in backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-2xl mb-6 shadow-lg shadow-red-600/20 animate-pulse-glow">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <h1 className={`text-4xl font-black tracking-tight mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('auth.register')}
              </h1>
              <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('auth.create_account')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <Input
                  type="text"
                  name="full_name"
                  label={t('common.fullName')}
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={t('common.fullName')}
                  icon={<User className="w-5 h-5" />}
                  disabled={loading}
                />

                {/* Email */}
                <Input
                  type="email"
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  icon={<Mail className="w-5 h-5" />}
                  disabled={loading}
                />

                {/* Password */}
                <Input
                  type="password"
                  name="password"
                  label={t('auth.password')}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  icon={<Lock className="w-5 h-5" />}
                  disabled={loading}
                />

                {/* Confirm Password */}
                <Input
                  type="password"
                  name="confirmPassword"
                  label={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  icon={<Lock className="w-5 h-5" />}
                  disabled={loading}
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-400 ml-1">
                  {t('auth.selectRole')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Option */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('TRAINEE')}
                    className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${
                      formData.role === 'TRAINEE'
                        ? 'border-red-600 bg-red-600/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mr-4 transition-colors ${
                      formData.role === 'TRAINEE' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{t('common.student')}</p>
                      <p className="text-xs text-gray-500">{t('auth.roleStudentDesc')}</p>
                    </div>
                  </button>

                  {/* Trainer Option */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('TRAINER')}
                    className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${
                      formData.role === 'TRAINER'
                        ? 'border-red-600 bg-red-600/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mr-4 transition-colors ${
                      formData.role === 'TRAINER' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{t('common.trainer')}</p>
                      <p className="text-xs text-gray-500">{t('auth.roleTrainerDesc')}</p>
                    </div>
                  </button>
                </div>

                {formData.role === 'TRAINER' && (
                  <Alert 
                    type="warning" 
                    message={t('auth.trainerValidationInfo')}
                  />
                )}
              </div>

              {/* Messages */}
              {error && <Alert type="error" message={error} />}
              {success && <Alert type="success" message={success} />}

              {/* Register Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t('auth.register')}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-10 text-center">
              <p className="text-gray-400 font-medium">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link
                  to="/login"
                  className="text-red-500 hover:text-red-400 font-bold transition-colors"
                >
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-center text-gray-600 text-sm mt-10 font-medium">
            {t('common.appName')} © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
