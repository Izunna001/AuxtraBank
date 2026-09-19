import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { ReactNode } from 'react';
import Transfers from './pages/Transfers';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Cards from './pages/Cards';
import Payments from './pages/Payments';
import Savings from './pages/Savings';
import Loans from './pages/Loans';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Admin from './pages/admin/Admin';
import PayLoanFee from './pages/PayLoanFee';
import { PageLoader } from './components/ui/PageLoader';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified && user.role !== 'admin') {
    return <Navigate to="/verify-email" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    if (!user.emailVerified && user.role !== 'admin') {
      return <Navigate to="/verify-email" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-gray-400">This section is available and ready for expansion.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <Placeholder title="Forgot Password" />
              </PublicRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<Transactions />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/pay-loan-fee" element={<PayLoanFee />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
