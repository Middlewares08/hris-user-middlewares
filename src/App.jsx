// src/App.jsx
import React from 'react';
import { InstallBanner } from './components/InstallBanner';
import { Toaster } from 'sonner';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './layout/ProtectedRoute'
import Home from './pages/Home';
import Documents from './pages/Documents';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import Payroll from './pages/Payroll';


function App() {

  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        <Route path="/login" element={<Login />} />
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
            <ProtectedRoute>
              <Payroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EditProfile />
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
      </Routes>
    </>
  );
}

export default App;