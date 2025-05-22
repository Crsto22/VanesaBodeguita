
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
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DeleteVentaDrawer from '../components/Ventas/DeleteVentaDrawer'; // Import the new drawer
import { useAuth } from '../context/AuthContext';
import { useVentas } from '../context/VentasContext';
import VentasHistorialIcon from '../assets/VentasHistorial/VentasHistorial.svg';

// Componente de esqueleto de carga para las cards
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
    {/* Header del skeleton */}
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
        <div className="h-3 bg-gray-300 rounded w-12"></div>
      </div>
      <div className="h-5 bg-gray-300 rounded-full w-16"></div>
    </div>

    {/* Cliente skeleton */}
    <div className="flex items-center gap-2 mb-2">
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded w-24"></div>
    </div>

    {/* Productos skeleton */}
    <div className="mb-3">
      <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
      <div className="flex gap-1 flex-wrap">
        <div className="h-6 bg-gray-300 rounded w-20"></div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
        <div className="h-6 bg-gray-300 rounded w-12"></div>
      </div>
    </div>

    {/* Footer skeleton */}
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
  const { obtenerTodasVentas, eliminarVenta } = useVentas();
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [showFilters, setShowFilters] = useState(false);
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  // Drawer state
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  useEffect(() => {
    setAppear(true);
  }, []);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        setLoading(true);
        const ventasData = await obtenerTodasVentas();
        setVentas(ventasData);
        setError('');
      } catch (err) {
        console.error('Error fetching ventas:', err);
        setError('No se pudieron cargar las ventas. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchVentas();
    } else {
      setVentas([]);
      setLoading(false);
    }
  }, [currentUser, obtenerTodasVentas]);

  // Filtrar ventas por fecha
  useEffect(() => {
    const filtrarVentas = () => {
      if (!ventas.length) {
        setVentasFiltradas([]);
        return;
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      let ventasFiltradas = ventas;

      switch (filtroFecha) {
        case 'hoy':
          ventasFiltradas = ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_creacion);
            fechaVenta.setHours(0, 0, 0, 0);
            return fechaVenta.getTime() === hoy.getTime();
          });
          break;
        case 'ayer':
          ventasFiltradas = ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_creacion);
            fechaVenta.setHours(0, 0, 0, 0);
            return fechaVenta.getTime() === ayer.getTime();
          });
          break;
        case 'semana':
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - 7);
          ventasFiltradas = ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_creacion);
            return fechaVenta >= inicioSemana;
          });
          break;
        case 'mes':
          const inicioMes = new Date(hoy);
          inicioMes.setDate(hoy.getDate() - 30);
          ventasFiltradas = ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_creacion);
            return fechaVenta >= inicioMes;
          });
          break;
        case 'personalizada':
          if (fechaPersonalizada) {
            const fechaSeleccionada = new Date(fechaPersonalizada);
            fechaSeleccionada.setHours(0, 0, 0, 0);
            ventasFiltradas = ventas.filter(venta => {
              const fechaVenta = new Date(venta.fecha_creacion);
              fechaVenta.setHours(0, 0, 0, 0);
              return fechaVenta.getTime() === fechaSeleccionada.getTime();
            });
          }
          break;
        default:
          ventasFiltradas = ventas;
      }

      // Ordenar por fecha y hora (más recientes primero, pero dentro del mismo día, de mañana a tarde)
      ventasFiltradas.sort((a, b) => {
        const fechaA = new Date(a.fecha_creacion);
        const fechaB = new Date(b.fecha_creacion);

        // Primero ordenar por fecha (más reciente primero)
        const diferenciaFecha = fechaB.toDateString().localeCompare(fechaA.toDateString());

        if (diferenciaFecha !== 0) {
          return diferenciaFecha;
        }

        // Si es el mismo día, ordenar por hora (mañana a tarde)
        return fechaA.getTime() - fechaB.getTime();
      });

      setVentasFiltradas(ventasFiltradas);
    };

    filtrarVentas();
  }, [ventas, filtroFecha, fechaPersonalizada]);

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
    e.stopPropagation(); // Evitar que se ejecute el onClick del card
    setSelectedVenta(venta);
    setIsDeleteDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedVenta) return;

    setDeleteLoading(true);
    try {
      await eliminarVenta(selectedVenta.id);
      // Actualizar el estado local para reflejar la eliminación
      setVentas(prevVentas => prevVentas.filter(venta => venta.id !== selectedVenta.id));
      setSuccess('Venta eliminada exitosamente.');
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      setIsDeleteDrawerOpen(false);
      setSelectedVenta(null);
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      setError('No se pudo eliminar la venta. Inténtalo de nuevo.');
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => setError(''), 5000);
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

  // Calcular totales del dock
  const totalProductos = ventasFiltradas.reduce((acc, venta) =>
    acc + venta.productos.reduce((sum, prod) => sum + prod.cantidad, 0), 0
  );
  const totalRetornables = ventasFiltradas.reduce((acc, venta) =>
    acc + (venta.total_retornables || 0), 0
  );
  const totalMonto = ventasFiltradas.reduce((acc, venta) => acc + venta.total, 0);

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

      {/* Delete Drawer */}
      <DeleteVentaDrawer
        isOpen={isDeleteDrawerOpen}
        onClose={handleCloseDrawer}
        onConfirm={handleConfirmDelete}
        venta={selectedVenta}
        loading={deleteLoading}
      />

      {/* Contenido principal */}
      <main className="px-3 pb-20 pt-3">
        <div
          className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Header con gradiente */}
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

          {/* Mensaje de éxito */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex justify-between items-center">
              {success}
              <button
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900"
                aria-label="Cerrar mensaje de éxito"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
              {error}
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900"
                aria-label="Cerrar error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Filtros */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>

            <div className={`transition-all duration-300 ${showFilters ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-3 gap-2 mb-3">
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
                      onClick={() => setFiltroFecha(opcion.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        filtroFecha === opcion.value
                          ? 'bg-[#45923a] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>

                {/* Selector de fecha personalizada */}
                {filtroFecha === 'personalizada' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar fecha:
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        value={fechaPersonalizada}
                        onChange={(e) => setFechaPersonalizada(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {/* Mostrar 5 skeletons de carga */}
              {[...Array(5)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : ventasFiltradas.length === 0 ? (
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
              {/* Vista móvil - Cards */}
              <div className="block space-y-3">
                {ventasFiltradas.map((venta) => (
                  <div
                    key={venta.id}
                    onClick={() => handleViewVenta(venta.id)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* Header del card */}
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
                          {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
                        </div>
                        <button
                          onClick={(e) => handleDeleteVenta(venta, e)}
                          className="p-1 bg-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar venta"
                        >
                          <Trash2  size={20} strokeWidth={2.25} />
                        </button>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} strokeWidth={2.25} className='text-[#ffa40c]' />
                      <span className="font-medium text-gray-900">{venta.nombre_cliente}</span>
                    </div>

                    {/* Productos */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Productos:</div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {venta.productos.slice(0, 2).map((p, index) => (
                          <span key={index} className="inline-block bg-gray-100 rounded-md px-2 py-1 mr-1 mb-1 text-xs">
                            {p.nombre} ({p.cantidad})
                          </span>
                        ))}
                        {venta.productos.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{venta.productos.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-green-600 font-bold">Total:</span>
                          <span className="font-bold text-green-600">S/{venta.total.toFixed(2)}</span>
                        </div>
                        {venta.total_retornables > 0 && (
                          <div className="flex items-center gap-1">
                            <Milk className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Debe botellas: {venta.total_retornables}</span>
                          </div>
                        )}
                      </div>
                      <button className="flex items-center gap-1 text-[#45923a] hover:text-[#3a7d30] text-sm font-medium">
                        <FileText className="w-4 h-4" />
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VentasHistorial;
