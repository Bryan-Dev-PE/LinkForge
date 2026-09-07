import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/PublicLayout';
import { DashboardLayout } from './components/DashboardLayout';
import { GuestRoute, ProtectedRoute } from './components/routes';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Overview } from './pages/dashboard/Overview';
import { Links } from './pages/dashboard/Links';
import { LinkAnalytics } from './pages/dashboard/LinkAnalytics';
import { QrStudio } from './pages/dashboard/QrStudio';
import { Settings } from './pages/dashboard/Settings';
import { InternalError, LinkDisabled, LinkExpired, NotFound } from './pages/errors';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="links" element={<Links />} />
            <Route path="links/:id/analytics" element={<LinkAnalytics />} />
            <Route path="links/:id/qr" element={<QrStudio />} />
            <Route path="qr" element={<QrStudio />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/link-expired" element={<LinkExpired />} />
          <Route path="/link-disabled" element={<LinkDisabled />} />
          <Route path="/500" element={<InternalError />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}