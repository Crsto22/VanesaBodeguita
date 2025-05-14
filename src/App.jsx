import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './page/Login';
import Dashboard from './page/Dashboard';
import Clientes from './page/Clientes';
import { AuthProvider } from './context/AuthContext';
import { ClientesProvider } from './context/ClientesContext';
import ProtectedRoute from './context/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ClientesProvider>
          <Routes>
            <Route path="/">
              <Route index element={<Login />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
            </Route>
          </Routes>
        </ClientesProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;