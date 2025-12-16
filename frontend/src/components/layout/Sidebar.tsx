import { Home, BookOpen, Award, Users, Settings, Building2, Package, GraduationCap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const studentLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.myCourses') },
    { to: '/certificates', icon: Award, label: t('navigation.certificates') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const trainerLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: 'Planos de Formação' },
    { to: '/students', icon: Users, label: t('navigation.students') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const adminLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/users', icon: Users, label: t('navigation.users') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: 'Planos de Formação' },
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
    <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-medium shadow-lg shadow-red-900/50'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
