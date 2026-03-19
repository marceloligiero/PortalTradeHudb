import { Home, BookOpen, Award, Users, Settings, GraduationCap, Target, Presentation, ClipboardCheck, BarChart3, Star, Brain, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, getEffectiveRole } from '../../stores/authStore';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const effectiveRole = getEffectiveRole(user);

  const studentLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/my-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/my-courses', icon: BookOpen, label: t('navigation.myCourses', 'Meus Cursos') },
    { to: '/my-challenges', icon: Target, label: t('navigation.myChallenges') },
    { to: '/my-lessons', icon: Presentation, label: t('myLessons.title') },
    { to: '/certificates', icon: Award, label: t('navigation.certificates') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const trainerLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/pending-reviews', icon: ClipboardCheck, label: t('navigation.pendingReviews') },
    { to: '/students', icon: Users, label: t('navigation.students') },
    { to: '/reports', icon: Settings, label: t('navigation.reports') },
  ];

  const adminLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/trainer-validation', icon: ShieldCheck, label: t('navigation.trainers') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/pending-reviews', icon: ClipboardCheck, label: t('navigation.pendingReviews') },
    { to: '/reports', icon: Award, label: t('navigation.reports') },
    { to: '/advanced-reports', icon: BarChart3, label: t('navigation.advancedReports') },
    { to: '/knowledge-matrix', icon: Brain, label: t('navigation.knowledgeMatrix') },
    { to: '/ratings', icon: Star, label: t('navigation.ratings') },
  ];

  const managerLinks = [
    { to: '/', icon: Home, label: t('navigation.dashboard') },
    { to: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { to: '/training-plans', icon: GraduationCap, label: t('navigation.trainingPlans') },
    { to: '/pending-reviews', icon: ClipboardCheck, label: t('navigation.pendingReviews') },
    { to: '/reports', icon: Award, label: t('navigation.reports') },
    { to: '/advanced-reports', icon: BarChart3, label: t('navigation.advancedReports') },
    { to: '/knowledge-matrix', icon: Brain, label: t('navigation.knowledgeMatrix') },
    { to: '/ratings', icon: Star, label: t('navigation.ratings') },
  ];

  const links =
    effectiveRole === 'STUDENT' || effectiveRole === 'TRAINEE'
      ? studentLinks
      : effectiveRole === 'TRAINER'
      ? trainerLinks
      : effectiveRole === 'MANAGER'
      ? managerLinks
      : adminLinks;

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-64px)] sticky top-16 print:hidden transition-colors duration-300">
      <nav className="p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-[#EC0000] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <link.icon className="w-4 h-4" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
