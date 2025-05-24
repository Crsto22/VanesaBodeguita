
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './page/Login';
import Dashboard from './page/Dashboard';
import Clientes from './page/Clientes';
import { AuthProvider } from './context/AuthContext';
import { ClientesProvider } from './context/ClientesContext';
import { ProductProvider } from './context/ProductContext';
import { VentasProvider } from './context/VentasContext';
import ProtectedRoute from './context/ProtectedRoute';
import Productos from './page/Productos';
import EscanerCodigoBarras from './page/EscanerCodigoBarras';
import Ventas from './page/Ventas';
import NotaVenta from './page/NotaVenta';
import VentasHistorial from './page/VentasHistorial';
import Deudas from './page/Deudas';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ClientesProvider>
          <ProductProvider>
            <VentasProvider>
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
                  <Route
                    path="productos"
                    element={
                      <ProtectedRoute>
                        <Productos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="escaner"
                    element={
                      <ProtectedRoute>
                        <EscanerCodigoBarras />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ventas"
                    element={
                      <ProtectedRoute>
                        <Ventas />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ventas/historial"
                    element={
                      <ProtectedRoute>
                        <VentasHistorial />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ventas/:id"
                    element={
                      <ProtectedRoute>
                        <NotaVenta />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="deudas"
                    element={
                      <ProtectedRoute>
                        <Deudas />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
                </Route>
              </Routes>
            </VentasProvider>
          </ProductProvider>
        </ClientesProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
