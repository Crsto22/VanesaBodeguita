import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, Users, Barcode, Package, Search, DollarSign, RotateCcw, Mail, Phone, AlertCircle, Milk } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import IconoDeudas from '../assets/Deudas/IconoDeudas.svg';
import { useClientes } from '../context/ClientesContext';
import { useVentas } from '../context/VentasContext';

const Deudas = () => {
  const navigate = useNavigate();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const { clientes, loading: clientesLoading } = useClientes();
  const { obtenerDeudaTotalPorCliente, obtenerVentasPorCliente, loading: ventasLoading } = useVentas();

  // Estado para almacenar las deudas y retornables por cliente
  const [clientesConDeudas, setClientesConDeudas] = useState([]);

  // Opciones del menú principal - Accesos rápidos
  const quickAccessOptions = [
    {
      id: 'ventas',
      title: 'Ventas',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-emerald-500',
      description: 'Registrar ventas y ver historial',
      path: '/ventas',
    },
    {
      id: 'deudas',
      title: 'Pagar Deudas',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-amber-500',
      description: 'Gestionar pagos pendientes',
      path: '/deudas',
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: 'Administrar base de clientes',
      path: '/clientes',
    },
    {
      id: 'escaner',
      title: 'Escáner de Códigos',
      icon: <Barcode className="h-6 w-6" />,
      color: 'bg-violet-500',
      description: 'Consultar precios por código de barras',
      path: '/escaner',
    },
    {
      id: 'productos',
      title: 'Productos',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-rose-500',
      description: 'Inventario y catálogo',
      path: '/productos',
    },
  ];

  // Calcular deudas y retornables por cliente
  useEffect(() => {
    setAppear(true);

    const calcularDeudasYRetornables = async () => {
      if (clientesLoading || ventasLoading) return;

      const clientesConDatos = await Promise.all(
        clientes.map(async (cliente) => {
          const deudaTotal = obtenerDeudaTotalPorCliente(cliente.id);
          const ventasCliente = await obtenerVentasPorCliente(cliente.id);
          const totalRetornables = ventasCliente.reduce(
            (sum, venta) => sum + (venta.total_retornables || 0),
            0
          );

          return {
            ...cliente,
            deudaTotal,
            totalRetornables,
          };
        })
      );

      // Filtrar solo clientes con deudas o retornables pendientes
      const clientesFiltrados = clientesConDatos.filter(
        (cliente) => cliente.deudaTotal > 0 || cliente.totalRetornables > 0
      );

      setClientesConDeudas(clientesFiltrados);
    };

    calcularDeudasYRetornables();
  }, [clientes, clientesLoading, ventasLoading, obtenerDeudaTotalPorCliente, obtenerVentasPorCliente]);

  // Filtrar clientes según el término de búsqueda
  const clientesFiltrados = clientesConDeudas.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm)
  );

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handlePagarDeuda = (clienteId) => {
    // Lógica para pagar deuda
    console.log('Pagar deuda para cliente:', clienteId);
  };

  const handleDevolverBotellas = (clienteId) => {
    // Lógica para devolver botellas
    console.log('Devolver botellas para cliente:', clienteId);
  };

  // Componente de esqueleto de carga
  const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded-lg w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-red-100 rounded-full flex-1"></div>
        <div className="h-6 bg-blue-100 rounded-full flex-1"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 bg-gray-200 rounded-xl flex-1"></div>
        <div className="h-9 bg-gray-200 rounded-xl flex-1"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header component */}
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifications={notifications}
      />

      {/* Sidebar component */}
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />

      {/* Contenido principal */}
      <main className="px-3 pb-12 pt-4">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>
          {/* Hero section con saludo */}
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#45923a] to-[#3d8033] p-4 text-white shadow-lg">
            <img
              src={IconoDeudas}
              alt="Background Icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-20 h-20 object-contain opacity-80"
            />
            <div className="relative">
              <h1 className="mb-1 text-lg font-bold">Deudas Pendientes</h1>
              <p className="text-sm text-white/80">Gestiona los pagos de tus clientes</p>
            </div>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#45923a]/20 focus:border-[#45923a] bg-white"
              />
            </div>
          </div>

          {/* Lista de clientes con deudas */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                Clientes con Deudas ({clientesFiltrados.length})
              </h2>
            </div>

            {clientesLoading || ventasLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay deudas pendientes'}
                </h3>
                <p className="text-xs text-gray-500">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'Todos los clientes están al día'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                  >
                    {/* Header del cliente con avatar */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#45923a] to-[#3d8033] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                          {cliente.nombre}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{cliente.correo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{cliente.telefono}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges de deuda y retornables */}
                    <div className="flex gap-2 mb-4">
                      {cliente.deudaTotal > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full">
                          <AlertCircle className="h-3 w-3 text-red-600" />
                          <span className="text-xs font-medium text-red-700">
                            S/ {cliente.deudaTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {cliente.totalRetornables > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                          <Milk className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">
                            {cliente.totalRetornables} botellas
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción modernos */}
                    <div className="flex gap-2">
                      {cliente.deudaTotal > 0 && (
                        <button
                          onClick={() => handlePagarDeuda(cliente.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-xl hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200 shadow-sm"
                        >
                          <DollarSign className="h-4 w-4" />
                          Pagar Deuda
                        </button>
                      )}
                      {cliente.totalRetornables > 0 && (
                        <button
                          onClick={() => handleDevolverBotellas(cliente.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Devolver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Deudas;