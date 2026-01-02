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
    <aside className="w-72 bg-[#0a0a0a]/50 backdrop-blur-2xl border-r border-white/5 min-h-[calc(100vh-80px)] sticky top-20">
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

      {/* Decorative Sidebar Element */}
      <div className="absolute bottom-10 left-6 right-6 p-6 rounded-[24px] bg-gradient-to-br from-red-600/10 to-transparent border border-white/5">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-black text-white uppercase tracking-widest mb-1">TradeHub Pro</p>
        <p className="text-[10px] text-gray-500 font-bold">Acesso Premium Ativo</p>
      </div>
    </aside>
  );
}
