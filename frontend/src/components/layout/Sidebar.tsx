import { Home, BookOpen, Award, Users, Settings, Building2, Package, GraduationCap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const studentLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.myCourses') },
    { to: '/certificates', icon: Award, label: t('navigation.certificates') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const trainerLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/students', icon: Users, label: t('navigation.students') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const adminLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/users', icon: Users, label: t('navigation.users') },
    { to: '/trainer-validation', icon: GraduationCap, label: t('navigation.trainers') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/banks', icon: Building2, label: t('navigation.banks') },
    { to: '/products', icon: Package, label: t('navigation.products') },
    { to: '/reports', icon: Award, label: t('navigation.reports') },
    { to: '/settings', icon: Settings, label: t('navigation.settings') },
  ];

  const links =
    user?.role === 'STUDENT'
      ? studentLinks
      : user?.role === 'TRAINER'
      ? trainerLinks
      : adminLinks;

  return (
    <aside className={`w-72 backdrop-blur-2xl border-r min-h-[calc(100vh-80px)] sticky top-20 transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0a0a0a]/50 border-white/5' 
        : 'bg-white/50 border-gray-200'
    }`}>
      <nav className="p-6 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-xl shadow-red-600/20'
                  : isDark 
                    ? 'text-gray-500 hover:bg-white/5 hover:text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
              }`
            }
          >
            <link.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              ({ isActive }: any) => isActive ? 'text-white' : 'text-gray-500 group-hover:text-red-500'
            }`} />
            <span className="tracking-wide">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
