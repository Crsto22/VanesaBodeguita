
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CreditCard,
  Users,
  Barcode,
  Package,
  Milk,
  X,
  FileText,
  Filter,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DeleteVentaDrawer from '../components/Ventas/DeleteVentaDrawer';
import { useAuth } from '../context/AuthContext';
import { useVentas } from '../context/VentasContext';
import VentasHistorialIcon from '../assets/VentasHistorial/VentasHistorial.svg';

// Componente de esqueleto de carga para las cards
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
        <div className="h-3 bg-gray-300 rounded w-12"></div>
      </div>
      <div className="h-5 bg-gray-300 rounded-full w-16"></div>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded w-24"></div>
    </div>
    <div className="mb-3">
      <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
      <div className="flex gap-1 flex-wrap">
        <div className="h-6 bg-gray-300 rounded w-20"></div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
        <div className="h-6 bg-gray-300 rounded w-12"></div>
      </div>
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
      <div className="flex items-center gap-4">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-300 rounded w-12"></div>
    </div>
  </div>
);

const VentasHistorial = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    ventasHistorial,
    loadingHistorial,
    paginaActual,
    hayMasPaginas,
    VENTAS_POR_PAGINA,
    cargarPrimerasPaginaHistorial,
    cargarSiguientePaginaHistorial,
    cargarPaginaAnteriorHistorial,
    reiniciarPaginacionHistorial,
    eliminarVenta 
  } = useVentas();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [showFilters, setShowFilters] = useState(false);
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState({});

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

  // Variantes para la animación de los toasts
  const toastVariants = {
    hidden: { y: -100, opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  useEffect(() => {
    setAppear(true);
  }, []);

  // Función para obtener filtros de fecha
  const obtenerFiltrosFecha = (tipoFiltro, fechaPersonalizada = '') => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    switch (tipoFiltro) {
      case 'hoy':
        return {
          fechaInicio: inicioHoy.toISOString(),
          fechaFin: hoy.toISOString()
        };
      case 'ayer':
        const ayer = new Date(inicioHoy);
        ayer.setDate(inicioHoy.getDate() - 1);
        const finAyer = new Date(ayer);
        finAyer.setHours(23, 59, 59, 999);
        return {
          fechaInicio: ayer.toISOString(),
          fechaFin: finAyer.toISOString()
        };
      case 'semana':
        const inicioSemana = new Date(inicioHoy);
        inicioSemana.setDate(inicioHoy.getDate() - 7);
        return {
          fechaInicio: inicioSemana.toISOString(),
          fechaFin: hoy.toISOString()
        };
      case 'mes':
        const inicioMes = new Date(inicioHoy);
        inicioMes.setDate(inicioHoy.getDate() - 30);
        return {
          fechaInicio: inicioMes.toISOString(),
          fechaFin: hoy.toISOString()
        };
      case 'personalizada':
        if (fechaPersonalizada) {
          const fechaSeleccionada = new Date(fechaPersonalizada);
          fechaSeleccionada.setHours(0, 0, 0, 0);
          const finFecha = new Date(fechaSeleccionada);
          finFecha.setHours(23, 59, 59, 999);
          return {
            fechaInicio: fechaSeleccionada.toISOString(),
            fechaFin: finFecha.toISOString()
          };
        }
        return {};
      default:
        return {};
    }
  };

  // Cargar ventas iniciales
  useEffect(() => {
    const cargarVentasIniciales = async () => {
      if (!currentUser) return;

      try {
        const filtros = obtenerFiltrosFecha(filtroFecha, fechaPersonalizada);
        setFiltrosActivos(filtros);
        await cargarPrimerasPaginaHistorial(filtros);
        setError('');
      } catch (err) {
        console.error('Error fetching ventas:', err);
        setError('No se pudieron cargar las ventas. Inténtalo de nuevo.');
      }
    };

    cargarVentasIniciales();
  }, [currentUser, filtroFecha, fechaPersonalizada]);

  // Manejar cambio de filtros
  const handleFiltroChange = async (nuevoFiltro) => {
    setFiltroFecha(nuevoFiltro);
    try {
      const filtros = obtenerFiltrosFecha(nuevoFiltro, fechaPersonalizada);
      setFiltrosActivos(filtros);
      await reiniciarPaginacionHistorial(filtros);
    } catch (err) {
      console.error('Error al aplicar filtros:', err);
      setError('Error al aplicar filtros');
    }
  };

  // Manejar paginación
  const handleSiguientePagina = async () => {
    try {
      await cargarSiguientePaginaHistorial(filtrosActivos);
    } catch (err) {
      console.error('Error al cargar siguiente página:', err);
      setError('Error al cargar siguiente página');
    }
  };

  const handlePaginaAnterior = async () => {
    try {
      await cargarPaginaAnteriorHistorial(filtrosActivos);
    } catch (err) {
      console.error('Error al cargar página anterior:', err);
      setError('Error al cargar página anterior');
    }
  };

  // Efecto para manejar el tiempo de duración de las alertas
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleViewVenta = (ventaId) => {
    navigate(`/ventas/${ventaId}`);
  };

  const handleNewVenta = () => {
    navigate('/ventas');
  };

  const handleDeleteVenta = (venta, e) => {
    e.stopPropagation();
    setSelectedVenta(venta);
    setIsDeleteDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedVenta) return;

    setDeleteLoading(true);
    try {
      await eliminarVenta(selectedVenta.id);
      // Recargar la página actual después de eliminar
      await reiniciarPaginacionHistorial(filtrosActivos);
      setSuccess('Venta eliminada exitosamente.');
      setIsDeleteDrawerOpen(false);
      setSelectedVenta(null);
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      setError('No se pudo eliminar la venta. Inténtalo de nuevo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDeleteDrawerOpen(false);
    setSelectedVenta(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pagado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'parcial':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'parcial':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  // Calcular totales solo de la página actual
  const totalProductos = ventasHistorial.reduce((acc, venta) =>
    acc + venta.productos.reduce((sum, prod) => sum + prod.cantidad, 0), 0
  );
  const totalRetornables = ventasHistorial.reduce((acc, venta) =>
    acc + (venta.total_retornables || 0), 0
  );
  const totalMonto = ventasHistorial.reduce((acc, venta) => acc + venta.total, 0);

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
      <DeleteVentaDrawer
        isOpen={isDeleteDrawerOpen}
        onClose={handleCloseDrawer}
        onConfirm={handleConfirmDelete}
        venta={selectedVenta}
        loading={deleteLoading}
      />
      <main className="px-3 pb-20 pt-3">
        <div
          className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#34722c] p-6 text-white shadow-lg">
            <img
              src={VentasHistorialIcon}
              alt="Ventas Historial Icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0"
            />
            <div className="relative flex justify-between items-center">
              <div className="flex flex-col">
                <h1 className="mb-2 text-xl font-bold">Historial de Ventas</h1>
                <button
                  onClick={handleNewVenta}
                  className="bg-[#ffa40c] font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 flex items-center gap-2 w-fit hover:bg-[#e6920a]"
                  title="Agregar nueva venta"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Nueva Venta
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={toastVariants}
                className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden mb-4"
              >
                <div
                  className="w-full shadow-lg bg-green-600"
                  role="alert"
                  aria-labelledby="header-notification-success"
                >
                  <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p id="header-notification-success" className="text-sm text-white font-medium">
                          {success}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSuccess('')}
                      className="text-white hover:text-gray-200 focus:outline-none transition-colors"
                      aria-label="Cerrar mensaje de éxito"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={toastVariants}
                className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden mb-4"
              >
                <div
                  className="w-full shadow-lg bg-red-600"
                  role="alert"
                  aria-labelledby="header-notification-error"
                >
                  <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p id="header-notification-error" className="text-sm text-white font-medium">
                          {error}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setError('')}
                      className="text-white hover:text-gray-200 focus:outline-none transition-colors"
                      aria-label="Cerrar error"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden xs:inline">Filtrar</span>
              </button>
            </div>
            <div className={`transition-all duration-300 ${showFilters ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {[
                    { value: 'hoy', label: 'Hoy' },
                    { value: 'ayer', label: 'Ayer' },
                    { value: 'semana', label: '7 días' },
                    { value: 'mes', label: '30 días' },
                    { value: 'personalizada', label: 'Fecha específica' },
                    { value: 'todos', label: 'Todos' }
                  ].map((opcion) => (
                    <button
                      key={opcion.value}
                      onClick={() => handleFiltroChange(opcion.value)}
                      disabled={loadingHistorial}
                      className={`px-3 py-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 min-h-[44px] active:scale-95 ${
                        filtroFecha === opcion.value
                          ? 'bg-[#45923a] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>
                {filtroFecha === 'personalizada' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar fecha:
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <input
                        type="date"
                        value={fechaPersonalizada}
                        onChange={(e) => setFechaPersonalizada(e.target.value)}
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent min-h-[44px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loadingHistorial ? (
            <div className="space-y-3">
              {[...Array(VENTAS_POR_PAGINA)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : ventasHistorial.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No se encontraron ventas</p>
              <p className="text-gray-500 text-sm mt-1">
                {filtroFecha === 'hoy' ? 'No hay ventas registradas hoy' :
                  filtroFecha === 'ayer' ? 'No hay ventas registradas ayer' :
                    filtroFecha === 'semana' ? 'No hay ventas en los últimos 7 días' :
                      filtroFecha === 'mes' ? 'No hay ventas en los últimos 30 días' :
                        filtroFecha === 'personalizada' ? 'No hay ventas en la fecha seleccionada' :
                          'No hay ventas registradas'}
              </p>
            </div>
          ) : (
            <>
              <div className="block space-y-4">
                {ventasHistorial.map((venta) => (
                <div
                  key={venta.id}
                  onClick={() => handleViewVenta(venta.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] sm:active:scale-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#45923a] rounded-full"></div>
                      <span className="text-xs font-medium text-gray-500">
                        {formatDateShort(venta.fecha_creacion)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(venta.fecha_creacion)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                        {getEstadoIcon(venta.estado)}
                        <span>{venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteVenta(venta, e)}
                        className="p-2 bg-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
                        title="Eliminar venta"
                      >
                        <Trash2 size={18} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} strokeWidth={2.25} className="text-[#ffa40c] flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{venta.nombre_cliente}</span>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">Productos:</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {venta.productos.slice(0, 2).map((p, index) => (
                        <span key={index} className="inline-block bg-gray-100 rounded-md px-2 py-1 mr-1 mb-1 text-xs">
                          {p.nombre} ({p.cantidad})
                        </span>
                      ))}
                      {venta.productos.length > 2 && (
                        <span className="text-xs text-gray-500 font-medium">
                          +{venta.productos.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-bold text-sm">Total:</span>
                        <span className="font-bold text-green-600 text-lg">S/{venta.total.toFixed(2)}</span>
                      </div>
                      {venta.total_retornables > 0 && (
                        <div className="flex items-center gap-1">
                          <Milk className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-xs text-blue-600 font-medium">Debe botellas: {venta.total_retornables}</span>
                        </div>
                      )}
                    </div>
                    <button className="flex items-center gap-1 text-[#45923a] hover:text-[#3a7d30] text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-50 transition-colors">
                      <FileText className="w-4 h-4" />
                      <span className="hidden xs:inline">Ver</span>
                    </button>
                  </div>
                </div>
              ))}
              </div>

              {/* Controles de paginación - Diseño móvil optimizado */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Info de página - Centrada para móvil */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-800">
                      Página {loadingHistorial ? '...' : paginaActual}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ventasHistorial.length} ventas mostradas • {VENTAS_POR_PAGINA} por página
                    </div>
                  </div>
                </div>
                
                {/* Controles de navegación - Táctil para móvil */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={handlePaginaAnterior}
                      disabled={paginaActual <= 1 || loadingHistorial}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all duration-200 min-h-[52px] active:scale-95 disabled:active:scale-100"
                    >
                      <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                      <span className="hidden xs:inline">Anterior</span>
                      <span className="xs:hidden">Ant.</span>
                    </button>
                    
                    {/* Indicador visual de página actual - Más grande para móvil */}
                    <div className="flex items-center justify-center min-w-[64px] h-[52px] bg-gradient-to-r from-[#45923a] to-[#3d8033] text-white rounded-xl text-base font-bold shadow-lg">
                      {loadingHistorial ? (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      ) : (
                        paginaActual
                      )}
                    </div>
                    
                    <button
                      onClick={handleSiguientePagina}
                      disabled={!hayMasPaginas || loadingHistorial}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all duration-200 min-h-[52px] active:scale-95 disabled:active:scale-100"
                    >
                      <span className="hidden xs:inline">Siguiente</span>
                      <span className="xs:hidden">Sig.</span>
                      <ChevronRight className="w-5 h-5 flex-shrink-0" />
                    </button>
                  </div>

                  {/* Indicadores adicionales */}
                  <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                    {paginaActual > 1 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span>Páginas anteriores</span>
                      </div>
                    )}
                    {hayMasPaginas && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>Más ventas disponibles</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen de la página actual - Optimizado para móvil */}
              <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center sm:text-left">
                  Resumen de esta página:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-lg font-bold text-blue-600">{totalProductos}</div>
                    <div className="text-xs text-blue-600 mt-1">Productos vendidos</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-lg font-bold text-amber-600">{totalRetornables}</div>
                    <div className="text-xs text-amber-600 mt-1">Botellas pendientes</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-lg font-bold text-green-600">S/{totalMonto.toFixed(2)}</div>
                    <div className="text-xs text-green-600 mt-1">Total vendido</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VentasHistorial;
