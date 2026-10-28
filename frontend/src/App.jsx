import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeProfilePage from './pages/employees/EmployeeProfilePage';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LeavesPage from './pages/leaves/LeavesPage';
import PayrollPage from './pages/payroll/PayrollPage';
import PerformancePage from './pages/performance/PerformancePage';
import RecruitmentPage from './pages/recruitment/RecruitmentPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import TasksPage from './pages/tasks/TasksPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employees/:id" element={<EmployeeProfilePage />} />
            <Route path="departments" element={
              <ProtectedRoute roles={['admin', 'hr_manager']}>
                <DepartmentsPage />
              </ProtectedRoute>
            } />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leaves" element={<LeavesPage />} />
            <Route path="payroll" element={
              <ProtectedRoute roles={['admin']}>
                <PayrollPage />
              </ProtectedRoute>
            } />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="recruitment" element={
              <ProtectedRoute roles={['admin', 'hr_manager']}>
                <RecruitmentPage />
              </ProtectedRoute>
            } />
            <Route path="onboarding" element={
              <ProtectedRoute roles={['admin', 'hr_manager']}>
                <OnboardingPage />
              </ProtectedRoute>
            } />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="reports" element={
              <ProtectedRoute roles={['admin', 'hr_manager']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="settings" element={
              <ProtectedRoute roles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '13px',
              borderRadius: '6px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
