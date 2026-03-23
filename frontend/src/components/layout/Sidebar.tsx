import {
  Home, BookOpen, Award, Users, GraduationCap, Target,
  Presentation, ClipboardCheck, BarChart3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, getEffectiveRole } from '../../stores/authStore';
import { SidebarLink } from './sidebar/index';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const effectiveRole = getEffectiveRole(user);

  const isStudentRole = effectiveRole === 'STUDENT' || effectiveRole === 'TRAINEE';
  const isTrainer = effectiveRole === 'TRAINER';
  const isAdmin = effectiveRole === 'ADMIN';

  return (
    <>
      {/* Core — all roles */}
      <SidebarLink to="/" icon={Home} label={t('navigation.dashboard')} end />

      {/* Student / Trainee */}
      {isStudentRole && (
        <>
          <SidebarLink to="/my-plans" icon={GraduationCap} label={t('navigation.trainingPlans')} />
          <SidebarLink to="/my-courses" icon={BookOpen} label={t('navigation.myCourses', 'Meus Cursos')} />
          <SidebarLink to="/my-challenges" icon={Target} label={t('navigation.myChallenges')} />
          <SidebarLink to="/my-lessons" icon={Presentation} label={t('myLessons.title')} />
          <SidebarLink to="/certificates" icon={Award} label={t('navigation.certificates')} />
          <SidebarLink to="/reports" icon={BarChart3} label={t('navigation.reports')} />
        </>
      )}

      {/* Trainer */}
      {isTrainer && (
        <>
          <SidebarLink to="/courses" icon={BookOpen} label={t('navigation.courses')} />
          <SidebarLink to="/training-plans" icon={GraduationCap} label={t('navigation.trainingPlans')} />
          <SidebarLink to="/pending-reviews" icon={ClipboardCheck} label={t('navigation.pendingReviews')} />
          <SidebarLink to="/students" icon={Users} label={t('navigation.students')} />
          <SidebarLink to="/reports" icon={BarChart3} label={t('navigation.reports')} />
        </>
      )}

      {/* Admin / Manager — core */}
      {(isAdmin || effectiveRole === 'MANAGER') && (
        <>
          <SidebarLink to="/courses" icon={BookOpen} label={t('navigation.courses')} />
          <SidebarLink to="/training-plans" icon={GraduationCap} label={t('navigation.trainingPlans')} />
          <SidebarLink to="/pending-reviews" icon={ClipboardCheck} label={t('navigation.pendingReviews')} />
        </>
      )}
    </>
  );
}
