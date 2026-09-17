// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { InstallBanner } from './components/InstallBanner';
import { Toaster } from 'sonner';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import LicenseExpired from './pages/LicenseExpired';
import ProtectedRoute from './layout/ProtectedRoute'
import Home from './pages/Home';
import Documents from './pages/Documents';
import GovernmentDetails from './pages/GovernmentDetails';
import Settings from './pages/Settings';
import Payroll from './pages/Payroll';
import NotFound from './components/NotFound';
import Loading from './components/Loading';
import { useLicenseStatus } from './hooks/useLicense';

// App-wide gate: an expired license bounces straight to /license-expired
// before the user ever reaches the login screen — this used to only be
// caught reactively, after a failed API call (see api/index.js). Once the
// license is valid again, /license-expired itself redirects away.
const LicenseGate = ({ children }) => {
    const location = useLocation();
    const { expired, isLoading } = useLicenseStatus();

    if (isLoading) {
        return <Loading size="lg" fullPage />;
    }
    if (expired && location.pathname !== '/license-expired') {
        return <Navigate to="/license-expired" replace />;
    }
    if (!expired && location.pathname === '/license-expired') {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Lazy-loaded: the Home Address picker pulls in `addresspinas` (the full PSGC
// dataset, ~1.9 MB), which must stay out of the main / precached PWA bundle.
const EditProfile = lazy(() => import('./pages/EditProfile'));


function App() {

  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50"><Loading size="sm" text="Loading" /></div>}>
      <LicenseGate>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/license-expired" element={<LicenseExpired />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >

        </Route>
        <Route
          path="/payroll"
          element={
            <ProtectedRoute permission="my-payslips:view">
              <Payroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute permission="my-documents:view">
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute permission="my-profile:view">
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government-details"
          element={
            <ProtectedRoute permission="my-government-details:view">
              <GovernmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        {/* Any unmatched path — full-screen 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </LicenseGate>
      </Suspense>
    </>
  );
}

export default App;