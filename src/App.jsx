import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './page/Login';
import Dashboard from './page/Dashboard';
import Clientes from './page/Clientes';
import { AuthProvider } from './context/AuthContext';
import { ClientesProvider } from './context/ClientesContext';
import { ProductProvider } from './context/ProductContext';
import ProtectedRoute from './context/ProtectedRoute';
import Productos from './page/Productos';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ClientesProvider>
          <ProductProvider>
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
            <Route
              path="productos"
              element={
                <ProtectedRoute>
                  <Productos />
                </ProtectedRoute>
              }
            />
          </Routes>
           </ProductProvider>
        </ClientesProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;