// src/App.jsx
import React from 'react';
import { InstallBanner } from './components/InstallBanner';
import { Toaster } from 'sonner';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './layout/ProtectedRoute'
import Home from './pages/Home';


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
      </Routes>
    </>
  );
}

export default App;