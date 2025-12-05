import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import PricingPage from './pages/PricingPage';
import EmployeesPage from './pages/EmployeesPage';
import PayRunsPage from './pages/PayRunsPage';
import PayRunDetailsPage from './pages/PayRunDetailsPage';
import PaymentsPage from './pages/PaymentsPage';
import PayslipPage from './pages/PayslipPage';
import SettingsPage from './pages/SettingsPage';
import UserSettingsPage from './pages/UserSettingsPage';
import AttendancePage from './pages/AttendancePage';
import PublicAttendancePage from './pages/PublicAttendancePage';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout Component
const AppLayout = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/checkin" element={<PublicAttendancePage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Routes */}
              <Route
                path="/companies"
                element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <CompaniesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                    <CompanyDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <PricingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-settings"
                element={
                  <ProtectedRoute>
                    <UserSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/employees"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                    <EmployeesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/attendance"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super-admin', 'employe', 'vigile']}>
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payruns"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                    <PayRunsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payruns/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super-admin', 'caissier']}>
                    <PayRunDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Caissier Routes */}
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['caissier', 'admin', 'super-admin']}>
                    <PaymentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Payslip Route */}
              <Route
                path="/payslips"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                    <PayslipPage />
                  </ProtectedRoute>
                }
              />

              {/* Vigile Routes */}
              <Route
                path="/attendance-reports"
                element={
                  <ProtectedRoute allowedRoles={['vigile', 'admin', 'super-admin']}>
                    <div>Page Rapports Présence - À développer</div>
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;