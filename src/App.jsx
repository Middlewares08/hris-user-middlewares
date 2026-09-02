// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { InstallBanner } from './components/InstallBanner';
import { Toaster } from 'sonner';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './layout/ProtectedRoute'
import Home from './pages/Home';
import Documents from './pages/Documents';
import GovernmentDetails from './pages/GovernmentDetails';
import Settings from './pages/Settings';
import Payroll from './pages/Payroll';
import NotFound from './components/NotFound';
import Loading from './components/Loading';

// Lazy-loaded: the Home Address picker pulls in `addresspinas` (the full PSGC
// dataset, ~1.9 MB), which must stay out of the main / precached PWA bundle.
const EditProfile = lazy(() => import('./pages/EditProfile'));


function App() {

  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50"><Loading size="sm" text="Loading" /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
      </Suspense>
    </>
  );
}

export default App;