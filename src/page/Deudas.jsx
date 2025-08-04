import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, Users, Barcode, Package, Search, DollarSign, RotateCcw, Mail, Phone, AlertCircle, Milk, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import IconoDeudas from '../assets/Deudas/IconoDeudas.svg';
import { useClientes } from '../context/ClientesContext';
import { useVentas } from '../context/VentasContext';
import PagarDeudaDrawer from '../components/Deudas/PagarDeudaDrawer';
import DevolverBotellasDrawer from '../components/Deudas/DevolverBotellasDrawer';

const Deudas = () => {
  const navigate = useNavigate();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const { clientes, loading: clientesLoading } = useClientes();
  const { obtenerDeudaTotalPorCliente, obtenerVentasPorCliente, loading: ventasLoading } = useVentas();
  const [clientesConDeudas, setClientesConDeudas] = useState([]);
  const [drawerPagarDeudaOpen, setDrawerPagarDeudaOpen] = useState(false);
  const [drawerDevolverBotellasOpen, setDrawerDevolverBotellasOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // ✨ NUEVO ESTADO: Controla el proceso de cálculo de deudas.
  const [isCalculating, setIsCalculating] = useState(true);

  // ✨ ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Número de clientes por página - Reducido para optimizar Firebase
  const [totalClientes, setTotalClientes] = useState(0);

  const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial', path: '/ventas' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
    { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes', path: '/clientes' },
    { id: 'escaner', title: 'Escáner de Códigos', icon: <Barcode className="h-6 w-6" />, color: 'bg-violet-500', description: 'Consultar precios por código de barras', path: '/escaner' },
    { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo', path: '/productos' },
  ];

  useEffect(() => {
    setAppear(true);

    const calcularDeudasYRetornables = async () => {
      // Si los contextos están cargando, no hacemos nada aún.
      if (clientesLoading || ventasLoading) {
        setIsCalculating(true); // Mantenemos el estado de cálculo como verdadero
        return;
      }

      // Iniciamos el cálculo
      setIsCalculating(true);

      const clientesConDatos = await Promise.all(
        clientes.map(async (cliente) => {
          const deudaTotal = obtenerDeudaTotalPorCliente(cliente.id);
          const ventasCliente = await obtenerVentasPorCliente(cliente.id, true);
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

      const clientesFiltrados = clientesConDatos.filter(
        (cliente) => cliente.deudaTotal > 0 || cliente.totalRetornables > 0
      );

      setClientesConDeudas(clientesFiltrados);
      setTotalClientes(clientesFiltrados.length);
      // Resetear a la primera página cuando cambian los datos
      setCurrentPage(1);
      // Finalizamos el cálculo
      setIsCalculating(false);
    };

    calcularDeudasYRetornables();
  }, [clientes, clientesLoading, ventasLoading, obtenerDeudaTotalPorCliente, obtenerVentasPorCliente]);
  
  // ✨ ESTADO DE CARGA COMBINADO: Muestra el esqueleto si cualquiera de las cargas está activa.
  const isLoading = clientesLoading || ventasLoading || isCalculating;

  const clientesFiltrados = clientesConDeudas.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm)
  );

  // ✨ LÓGICA DE PAGINACIÓN
  const totalFilteredClientes = clientesFiltrados.length;
  const totalPages = Math.ceil(totalFilteredClientes / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);

  // ✨ Efecto para resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handlePagarDeuda = (clienteId) => {
    const cliente = clientesConDeudas.find((c) => c.id === clienteId);
    setSelectedCliente(cliente);
    setDrawerPagarDeudaOpen(true);
  };

  const handleDevolverBotellas = (clienteId) => {
    const cliente = clientesConDeudas.find((c) => c.id === clienteId);
    setSelectedCliente(cliente);
    setDrawerDevolverBotellasOpen(true);
  };
  
  // ✨ Lógica de actualización simplificada para evitar repetición de código
  const actualizarListaClientes = async () => {
    setIsCalculating(true); // Mostramos el loader mientras recalculamos
    const updatedClientes = await Promise.all(
      clientes.map(async (cliente) => { // Usamos la lista original de clientes
        const deudaTotal = obtenerDeudaTotalPorCliente(cliente.id);
        const ventasCliente = await obtenerVentasPorCliente(cliente.id, true);
        const totalRetornables = ventasCliente.reduce(
          (sum, venta) => sum + (venta.total_retornables || 0),
          0
        );
        return { ...cliente, deudaTotal, totalRetornables };
      })
    );
    setClientesConDeudas(updatedClientes.filter((c) => c.deudaTotal > 0 || c.totalRetornables > 0));
    setTotalClientes(updatedClientes.filter((c) => c.deudaTotal > 0 || c.totalRetornables > 0).length);
    setIsCalculating(false); // Ocultamos el loader
  };

  const handlePagarDeudaSuccess = () => {
    actualizarListaClientes();
  };

  const handleDevolverBotellasSuccess = () => {
    actualizarListaClientes();
  };

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
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifications={notifications}
      />
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />
      <main className="px-3 pb-12 pt-4">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#34722c] p-6 text-white shadow-lg">
            <img
              src={IconoDeudas}
              alt="Background Icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0"
            />
            <div className="relative">
              <h1 className="mb-2 text-xl font-bold">Deudas y Retornables Pendientes</h1>
              <p className="text-sm text-white/80">Gestiona los pagos y botellas retornables de tus clientes</p>
            </div>
          </div>

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

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                Clientes con Deudas o Retornables ({isLoading ? '...' : totalFilteredClientes})
              </h2>
              {totalPages > 1 && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              )}
            </div>
            
            {/* ✨ CONDICIONAL DE RENDERIZADO ACTUALIZADO */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : clientesPaginados.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay deudas ni retornables pendientes'}
                </h3>
                <p className="text-xs text-gray-500">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'Todos los clientes están al día'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {clientesPaginados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                  >
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
                            {cliente.totalRetornables} {cliente.totalRetornables === 1 ? 'botella' : 'botellas'}
                          </span>
                        </div>
                      )}
                    </div>

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

                {/* ✨ CONTROLES DE PAGINACIÓN */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, totalFilteredClientes)} de {totalFilteredClientes} clientes
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-[#45923a] hover:bg-green-50'
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          const isCurrentPage = pageNumber === currentPage;
                          
                          // Mostrar solo algunas páginas para no saturar la UI
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                                  isCurrentPage
                                    ? 'bg-[#45923a] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-[#45923a] hover:bg-green-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return (
                              <span key={pageNumber} className="text-gray-400 px-1">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-[#45923a] hover:bg-green-50'
                        }`}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <PagarDeudaDrawer
        isOpen={drawerPagarDeudaOpen}
        onClose={() => {
          setDrawerPagarDeudaOpen(false);
          setSelectedCliente(null);
        }}
        cliente={selectedCliente}
        onPagarDeuda={handlePagarDeudaSuccess}
      />

      <DevolverBotellasDrawer
        isOpen={drawerDevolverBotellasOpen}
        onClose={() => {
          setDrawerDevolverBotellasOpen(false);
          setSelectedCliente(null);
        }}
        cliente={selectedCliente}
        onDevolverBotellas={handleDevolverBotellasSuccess}
      />
    </div>
  );
};

export default Deudas;