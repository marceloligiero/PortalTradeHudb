import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore, getEffectiveRole } from './stores/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import StudentDashboard from './pages/student/Dashboard';
import StudentCoursesPage from './pages/student/Courses';
import CertificatesPage from './pages/student/Certificates';
import MyPlans from './pages/student/MyPlans';
import TrainerDashboard from './pages/trainer/Dashboard';
import TrainerCoursesPage from './pages/trainer/Courses';
import TrainerStudentsPage from './pages/trainer/Students';
import TrainingPlanForm from './pages/trainer/TrainingPlanForm';
import TrainingPlans from './pages/trainer/TrainingPlans';
import TrainingPlanDetail from './pages/trainer/TrainingPlanDetail';
import TrainerReportsPage from './pages/trainer/Reports';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsersPage from './pages/admin/Users';
import AdminCoursesPage from './pages/admin/Courses';
import AdminCourseForm from './pages/admin/CourseForm';
import AdminCourseDetail from './pages/admin/CourseDetail';
import AdminTrainingPlanForm from './pages/admin/TrainingPlanForm';
import AdminTrainingPlans from './pages/admin/TrainingPlans';
import AdminReportsPage from './pages/admin/Reports';
import AdminAdvancedReportsPage from './pages/admin/AdvancedReports';
import PortalTutoria from './pages/admin/PortalTutoria';
import PortalTutoriaPublic from './pages/PortalTutoriaPublic';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import TutoriaLayout from './pages/tutoria/TutoriaLayout';
import TutoriaErrors from './pages/tutoria/TutoriaErrors';
import TutoriaPlans from './pages/tutoria/TutoriaPlans';
import TutoriaReport from './pages/tutoria/TutoriaReport';
import RegisterErrors from './pages/tutoria/RegisterErrors';
import CreateActionPlan from './pages/tutoria/CreateActionPlan';
import ErrorDetail from './pages/tutoria/ErrorDetail';
import PlanDetail from './pages/tutoria/PlanDetail';
import TutoriaCategories from './pages/tutoria/TutoriaCategories';
import ChatFAQAdmin from './pages/tutoria/ChatFAQAdmin';
import InternalErrors from './pages/tutoria/InternalErrors';
import RegisterInternalError from './pages/tutoria/RegisterInternalError';
import InternalErrorDetail from './pages/tutoria/InternalErrorDetail';
import SensoManagement from './pages/tutoria/SensoManagement';
import LearningSheets from './pages/tutoria/LearningSheets';
import MyLearningSheets from './pages/tutoria/MyLearningSheets';
import TutoriaNotifications from './pages/tutoria/TutoriaNotifications';
import FeedbackSurveys from './pages/tutoria/FeedbackSurveys';
import FeedbackSurveyDetail from './pages/tutoria/FeedbackSurveyDetail';
import FeedbackRespond from './pages/tutoria/FeedbackRespond';
import FeedbackDashboard from './pages/tutoria/FeedbackDashboard';
import TutorCapsules from './pages/tutoria/TutorCapsules';
import SideBySide from './pages/tutoria/SideBySide';
// AdminTeams standalone removed — MasterData.tsx is the single source
import RelatoriosLayout from './pages/relatorios/RelatoriosLayout';
import RelatoriosOverview from './pages/relatorios/Overview';
import RelatoriosFormacoes from './pages/relatorios/FormacoesDashboard';
import RelatoriosTutoria from './pages/relatorios/TutoriaDashboard';
import RelatoriosTeams from './pages/relatorios/TeamsDashboard';
import RelatoriosMembers from './pages/relatorios/MembersDashboard';
import RelatoriosIncidents from './pages/relatorios/IncidentsReport';
import AdminRatingsPage from './pages/admin/Ratings';
import KnowledgeMatrixPage from './pages/admin/KnowledgeMatrix';
import AdminSettingsPage from './pages/admin/Settings';
// Banks.tsx and Products.tsx standalone pages removed — MasterData.tsx is the single source
import MasterDataPage from './pages/admin/MasterData';
import MasterDataLayout from './pages/admin/MasterDataLayout';
import ChamadosLayout from './pages/chamados/ChamadosLayout';
import ChamadosKanban from './pages/chamados/ChamadosKanban';
import AdminTrainerValidation from './pages/admin/TrainerValidation';
import StudentReportsPage from './pages/student/Reports';
import ChallengeForm from './pages/admin/ChallengeForm';
import LessonForm from './pages/admin/LessonForm';
import LessonDetail from './pages/admin/LessonDetail';
import ChallengeDetail from './pages/admin/ChallengeDetail';
import ChallengeExecutionComplete from './pages/trainer/ChallengeExecutionComplete';
import ChallengeExecutionSummary from './pages/trainer/ChallengeExecutionSummary';
import ChallengeResult from './pages/ChallengeResult';
import MyChallenges from './pages/student/MyChallenges';
import MyLessons from './pages/student/MyLessons';
import LessonManagement from './pages/trainer/LessonManagement';
import SubmissionReview from './pages/trainer/SubmissionReview';
import PendingReviews from './pages/trainer/PendingReviews';
import StudentChallengeExecutionComplete from './pages/student/ChallengeExecutionComplete';
import LessonView from './pages/student/LessonView';
import CertificateView from './pages/certificates/CertificateView';
import Layout from './components/layout/Layout';

function App() {
  const { user, isAuthenticated } = useAuthStore();
  const effectiveRole = getEffectiveRole(user);

  if (!isAuthenticated) {
    return (
      <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal-tutoria" element={<PortalTutoriaPublic />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </>
    );
  }

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* ── Portal de Tutoria (layout próprio, todos os roles) ── */}
      <Route path="/tutoria" element={<TutoriaLayout />}>
        <Route index element={<PortalTutoria />} />
        <Route path="errors" element={<TutoriaErrors />} />
        <Route path="errors/new" element={<RegisterErrors />} />
        <Route path="errors/:id" element={<ErrorDetail />} />
        <Route path="errors/:errorId/plans/new" element={<CreateActionPlan />} />
        <Route path="report" element={<TutoriaReport />} />
        <Route path="plans" element={<TutoriaPlans />} />
        <Route path="plans/new" element={<CreateActionPlan />} />
        <Route path="plans/:planId" element={<PlanDetail />} />
        <Route path="my-errors" element={<TutoriaErrors />} />
        <Route path="my-plans" element={<TutoriaPlans />} />
        <Route path="categories" element={<TutoriaCategories />} />
        <Route path="chat-faqs" element={<ChatFAQAdmin />} />
        <Route path="internal-errors" element={<InternalErrors />} />
        <Route path="internal-errors/new" element={<RegisterInternalError />} />
        <Route path="internal-errors/:id" element={<InternalErrorDetail />} />
        <Route path="censos" element={<SensoManagement />} />
        <Route path="learning-sheets" element={<LearningSheets />} />
        <Route path="my-learning-sheets" element={<MyLearningSheets />} />
        <Route path="analysis" element={<TutoriaErrors />} />
        <Route path="tutor-review" element={<TutoriaErrors />} />
        <Route path="notifications" element={<TutoriaNotifications />} />
        <Route path="feedback" element={<FeedbackSurveys />} />
        <Route path="feedback/dashboard" element={<FeedbackDashboard />} />
        <Route path="feedback/respond" element={<FeedbackRespond />} />
        <Route path="feedback/:id" element={<FeedbackSurveyDetail />} />
        <Route path="capsulas" element={<TutorCapsules />} />
        <Route path="capsulas/:courseId" element={<AdminCourseDetail />} />
        <Route path="capsulas/:courseId/challenges/new" element={<ChallengeForm />} />
        <Route path="capsulas/:courseId/challenges/:challengeId/edit" element={<ChallengeForm />} />
        <Route path="capsulas/:courseId/challenges/:challengeId" element={<ChallengeDetail />} />
        <Route path="capsulas/:courseId/challenges/:challengeId/results" element={<ChallengeResult />} />
        <Route path="capsulas/:courseId/lessons/new" element={<LessonForm />} />
        <Route path="capsulas/:courseId/lessons/:lessonId/edit" element={<LessonForm />} />
        <Route path="capsulas/:courseId/lessons/:lessonId" element={<LessonDetail />} />
        <Route path="side-by-side" element={<SideBySide />} />
      </Route>

      {/* ── Portal de Relatórios (todos os roles autenticados) ── */}
      <Route path="/relatorios" element={<RelatoriosLayout />}>
        <Route index element={<RelatoriosOverview />} />
        <Route path="formacoes" element={<RelatoriosFormacoes />} />
        <Route path="tutoria" element={<RelatoriosTutoria />} />
        <Route path="teams" element={<RelatoriosTeams />} />
        <Route path="members" element={<RelatoriosMembers />} />
        <Route path="incidents" element={<RelatoriosIncidents />} />
        {/* Analytics — movidos do portal de formações */}
        <Route path="reports" element={<Navigate to="/relatorios/advanced-reports" replace />} />
        <Route path="advanced-reports" element={<AdminAdvancedReportsPage />} />
        <Route path="knowledge-matrix" element={<KnowledgeMatrixPage />} />
        <Route path="ratings" element={<AdminRatingsPage />} />
        <Route path="tutoria-report" element={<TutoriaReport />} />
        <Route path="feedback-dashboard" element={<FeedbackDashboard />} />
      </Route>

      {/* ── Portal de Dados Mestres (ADMIN only, layout próprio) ── */}
      <Route path="/master-data" element={<MasterDataLayout />}>
        <Route index element={<MasterDataPage tab="banks" />} />
        <Route path="products" element={<MasterDataPage tab="products" />} />
        <Route path="teams" element={<MasterDataPage tab="teams" />} />
        <Route path="categories" element={<MasterDataPage tab="categories" />} />
        <Route path="impacts" element={<MasterDataPage tab="impacts" />} />
        <Route path="origins" element={<MasterDataPage tab="origins" />} />
        <Route path="detected-by" element={<MasterDataPage tab="detected_by" />} />
        <Route path="departments" element={<MasterDataPage tab="departments" />} />
        <Route path="activities" element={<MasterDataPage tab="activities" />} />
        <Route path="error-types" element={<MasterDataPage tab="error_types" />} />
        <Route path="faqs" element={<MasterDataPage tab="faqs" />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="trainer-validation" element={<AdminTrainerValidation />} />
      </Route>

      {/* ── Portal de Chamados (todos os roles autenticados) ── */}
      <Route path="/chamados" element={<ChamadosLayout />}>
        <Route index element={<ChamadosKanban />} />
      </Route>

      {/* ── Portal de Formações ─────────────────────────────── */}
      <Route path="/" element={<Layout />}>
        {effectiveRole === 'GERENTE' && (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetail />} />
            <Route path="training-plans" element={<AdminTrainingPlans />} />
            <Route path="training-plan/:id" element={<TrainingPlanDetail />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="advanced-reports" element={<AdminAdvancedReportsPage />} />
            <Route path="pending-reviews" element={<PendingReviews />} />
            <Route path="courses/:courseId/challenges/:challengeId" element={<ChallengeDetail />} />
            <Route path="courses/:courseId/challenges/:challengeId/results" element={<ChallengeResult />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
            <Route path="lessons/:lessonId/manage" element={<LessonManagement />} />
            <Route path="submissions/:submissionId/review" element={<SubmissionReview />} />
            <Route path="challenges/:challengeId/execute/summary" element={<ChallengeExecutionSummary />} />
            <Route path="challenges/:challengeId/execute/complete" element={<ChallengeExecutionComplete />} />
            <Route path="knowledge-matrix" element={<KnowledgeMatrixPage />} />
            <Route path="ratings" element={<AdminRatingsPage />} />
          </>
        )}
        {(effectiveRole === 'USUARIO' || effectiveRole === 'CHEFE_EQUIPE') && (
          <>
            <Route index element={<StudentDashboard />} />
            <Route path="my-plans" element={<MyPlans />} />
            <Route path="my-courses" element={<StudentCoursesPage />} />
            <Route path="my-challenges" element={<MyChallenges />} />
            <Route path="my-lessons" element={<MyLessons />} />
            <Route path="courses" element={<StudentCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetail />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="reports" element={<StudentReportsPage />} />
            <Route path="training-plan/:id" element={<TrainingPlanDetail />} />
            <Route path="lessons/:lessonId/view" element={<LessonView />} />
            {/* Formando executa desafios COMPLETE (linha a linha) */}
            <Route path="challenges/:challengeId/execute" element={<StudentChallengeExecutionComplete />} />
            <Route path="challenges/:challengeId/execute/complete" element={<StudentChallengeExecutionComplete />} />
          </>
        )}
        {/* Rotas compartilhadas por todos os roles */}
        <Route path="challenges/result/:submissionId" element={<ChallengeResult />} />
        <Route path="certificates/:id" element={<CertificateView />} />
        {effectiveRole === 'FORMADOR' && (
          <>
            <Route index element={<TrainerDashboard />} />
            <Route path="courses" element={<TrainerCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetail />} />
            <Route path="course/new" element={<AdminCourseForm />} />
            <Route path="courses/:courseId/edit" element={<AdminCourseForm />} />
            <Route path="courses/:courseId/challenges/new" element={<ChallengeForm />} />
            <Route path="courses/:courseId/challenges/:challengeId/edit" element={<ChallengeForm />} />
            <Route path="training-plans" element={<TrainingPlans />} />
            <Route path="training-plan/new" element={<TrainingPlanForm />} />
            <Route path="students" element={<TrainerStudentsPage />} />
            <Route path="reports" element={<TrainerReportsPage />} />
            <Route path="challenges/:challengeId/execute/summary" element={<ChallengeExecutionSummary />} />
            <Route path="challenges/:challengeId/execute/complete" element={<ChallengeExecutionComplete />} />
            <Route path="pending-reviews" element={<PendingReviews />} />
            <Route path="courses/:courseId/lessons/new" element={<LessonForm />} />
            <Route path="courses/:courseId/lessons/:lessonId/edit" element={<LessonForm />} />
            <Route path="courses/:courseId/challenges/:challengeId" element={<ChallengeDetail />} />
            <Route path="courses/:courseId/challenges/:challengeId/results" element={<ChallengeResult />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
            <Route path="training-plan/:id" element={<TrainingPlanDetail />} />
            <Route path="lessons/:lessonId/manage" element={<LessonManagement />} />
            <Route path="submissions/:submissionId/review" element={<SubmissionReview />} />
          </>
        )}
        {/* Support direct links that include a 'trainer/' or 'admin/' prefix used in some navigation code */}
        <Route path="trainer/training-plan/:id" element={<TrainingPlanDetail />} />
        <Route path="training-plan/:id" element={<TrainingPlanDetail />} />
        {(effectiveRole === 'ADMIN' || effectiveRole === 'DIRETOR') && (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="trainer-validation" element={<Navigate to="/master-data/trainer-validation" replace />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetail />} />
            <Route path="course/new" element={<AdminCourseForm />} />
            <Route path="courses/:courseId/edit" element={<AdminCourseForm />} />
            <Route path="courses/:courseId/challenges/new" element={<ChallengeForm />} />
            <Route path="courses/:courseId/challenges/:challengeId/edit" element={<ChallengeForm />} />
            <Route path="courses/:courseId/challenges/:challengeId" element={<ChallengeDetail />} />
            <Route path="courses/:courseId/challenges/:challengeId/results" element={<ChallengeResult />} />
            <Route path="courses/:courseId/lessons/new" element={<LessonForm />} />
            <Route path="courses/:courseId/lessons/:lessonId/edit" element={<LessonForm />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
            <Route path="training-plans" element={<AdminTrainingPlans />} />
            <Route path="training-plan/new" element={<AdminTrainingPlanForm />} />
            <Route path="admin/training-plan/:id" element={<TrainingPlanDetail />} />
            {/* Admin executa desafios SUMMARY e pode registar COMPLETE */}
            <Route path="challenges/:challengeId/execute/summary" element={<ChallengeExecutionSummary />} />
            <Route path="challenges/:challengeId/execute/complete" element={<ChallengeExecutionComplete />} />
            <Route path="pending-reviews" element={<PendingReviews />} />
            <Route path="lessons/:lessonId/manage" element={<LessonManagement />} />
            <Route path="submissions/:submissionId/review" element={<SubmissionReview />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="advanced-reports" element={<AdminAdvancedReportsPage />} />
            <Route path="knowledge-matrix" element={<KnowledgeMatrixPage />} />
            <Route path="ratings" element={<AdminRatingsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="banks" element={<Navigate to="/master-data" replace />} />
            <Route path="products" element={<Navigate to="/master-data/products" replace />} />
            <Route path="teams" element={<Navigate to="/master-data/teams" replace />} />
            {/* tutoria movido para layout próprio abaixo */}
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
