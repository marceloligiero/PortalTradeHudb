import { Home, BookOpen, Award, Users, Settings, Building2, Package, GraduationCap, BarChart3, Target, Presentation, ClipboardCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const studentLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/my-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/my-challenges', icon: Target, label: 'Meus Desafios' },
    { to: '/my-lessons', icon: Presentation, label: 'Minhas Aulas' },
    { to: '/certificates', icon: Award, label: t('navigation.certificates') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const trainerLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/pending-reviews', icon: ClipboardCheck, label: 'Pendentes de Revisão' },
    { to: '/students', icon: Users, label: t('navigation.students') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const adminLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/users', icon: Users, label: t('navigation.users') },
    { to: '/trainer-validation', icon: GraduationCap, label: t('navigation.trainers') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/pending-reviews', icon: ClipboardCheck, label: 'Pendentes de Revisão' },
    { to: '/banks', icon: Building2, label: t('navigation.banks') },
    { to: '/products', icon: Package, label: t('navigation.products') },
    { to: '/reports', icon: Award, label: t('navigation.reports') },
    { to: '/advanced-reports', icon: BarChart3, label: 'Relatórios Avançados' },
    { to: '/settings', icon: Settings, label: t('navigation.settings') },
  ];

  const links =
    user?.role === 'STUDENT' || user?.role === 'TRAINEE'
      ? studentLinks
      : user?.role === 'TRAINER'
      ? trainerLinks
      : adminLinks;

  return (
    <aside className="w-72 bg-[#0a0a0a]/50 backdrop-blur-2xl border-r border-white/5 min-h-[calc(100vh-80px)] sticky top-20 print:hidden">
      <nav className="p-6 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-xl shadow-red-600/20'
                  : 'text-gray-500 hover:bg-white/5 hover:text-white font-medium'
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
