import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import TradeDatahubLanding from './pages/TradeDatahubLanding';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
import AdminRatingsPage from './pages/admin/Ratings';
import AdminSettingsPage from './pages/admin/Settings';
import AdminBanksPage from './pages/admin/Banks';
import AdminProductsPage from './pages/admin/Products';
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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<TradeDatahubLanding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {(user?.role === 'STUDENT' || user?.role === 'TRAINEE') && (
          <>
            <Route index element={<StudentDashboard />} />
            <Route path="my-plans" element={<MyPlans />} />
            <Route path="my-challenges" element={<MyChallenges />} />
            <Route path="my-lessons" element={<MyLessons />} />
            <Route path="courses" element={<StudentCoursesPage />} />
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
        {user?.role === 'TRAINER' && (
          <>
            <Route index element={<TrainerDashboard />} />
            <Route path="courses" element={<TrainerCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetail />} />
            <Route path="training-plans" element={<TrainingPlans />} />
            <Route path="training-plan/new" element={<TrainingPlanForm />} />
            <Route path="students" element={<TrainerStudentsPage />} />
            <Route path="reports" element={<TrainerReportsPage />} />
            {/* Formador executa desafios SUMMARY e pode registar COMPLETE */}
            <Route path="challenges/:challengeId/execute/summary" element={<ChallengeExecutionSummary />} />
            <Route path="challenges/:challengeId/execute/complete" element={<ChallengeExecutionComplete />} />
            <Route path="pending-reviews" element={<PendingReviews />} />
            <Route path="courses/:courseId/lessons/new" element={<LessonForm />} />
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
        {user?.role === 'ADMIN' && (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="trainer-validation" element={<AdminTrainerValidation />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetail />} />
            <Route path="course/new" element={<AdminCourseForm />} />
            <Route path="courses/:courseId/challenges/new" element={<ChallengeForm />} />
            <Route path="courses/:courseId/challenges/:challengeId/edit" element={<ChallengeForm />} />
            <Route path="courses/:courseId/challenges/:challengeId" element={<ChallengeDetail />} />
            <Route path="courses/:courseId/challenges/:challengeId/results" element={<ChallengeResult />} />
            <Route path="courses/:courseId/lessons/new" element={<LessonForm />} />
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
            <Route path="ratings" element={<AdminRatingsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="banks" element={<AdminBanksPage />} />
            <Route path="products" element={<AdminProductsPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
