import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Search, Calendar, User, Hash, RefreshCw, ArrowLeft, Trash2, Filter } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import YapeLogo from '../assets/yape-logo.png';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { usePagosYape } from '../context/PagosYapeContext';

const PagosYape = () => {
  const navigate = useNavigate();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [showFilters, setShowFilters] = useState(false);
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');

  // Usar el contexto de pagos
  const { pagos, loading, formatDate, formatCurrency, filtrarPagos, eliminarPago } = usePagosYape();

  const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas', path: '/ventas' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
    { id: 'clientes', title: 'Clientes', icon: <User className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar clientes', path: '/clientes' },
  ];

  useEffect(() => {
    setAppear(true);
  }, []);

  // Función para filtrar por fecha
  const filtrarPorFecha = (pagos) => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    hoy.setHours(0, 0, 0, 0);
    
    return pagos.filter(pago => {
      const fechaPago = new Date(pago.timestamp);
      
      switch (filtroFecha) {
        case 'hoy':
          const inicioHoy = new Date(hoy);
          const finHoy = new Date(hoy);
          finHoy.setHours(23, 59, 59, 999);
          return fechaPago >= inicioHoy && fechaPago <= finHoy;
          
        case 'ayer':
          const inicioAyer = new Date(hoy);
          inicioAyer.setDate(hoy.getDate() - 1);
          const finAyer = new Date(inicioAyer);
          finAyer.setHours(23, 59, 59, 999);
          return fechaPago >= inicioAyer && fechaPago <= finAyer;
          
        case 'semana':
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - 7);
          const finSemana = new Date(ahora);
          finSemana.setHours(23, 59, 59, 999);
          return fechaPago >= inicioSemana && fechaPago <= finSemana;
          
        case 'mes':
          const inicioMes = new Date(hoy);
          inicioMes.setDate(hoy.getDate() - 30);
          const finMes = new Date(ahora);
          finMes.setHours(23, 59, 59, 999);
          return fechaPago >= inicioMes && fechaPago <= finMes;
          
        case 'personalizada':
          if (!fechaPersonalizada) return true;
          const fechaSeleccionada = new Date(fechaPersonalizada);
          fechaSeleccionada.setHours(0, 0, 0, 0);
          const finFecha = new Date(fechaSeleccionada);
          finFecha.setHours(23, 59, 59, 999);
          return fechaPago >= fechaSeleccionada && fechaPago <= finFecha;
          
        case 'todos':
          return true;
          
        default:
          return true;
      }
    });
  };

  // Filtrar pagos usando el contexto y luego por fecha
  const pagosPorTexto = filtrarPagos(searchTerm);
  const pagosFiltrados = filtrarPorFecha(pagosPorTexto);

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleEliminarPago = async () => {
    if (!pagoAEliminar) return;

    setEliminando(true);
    const result = await eliminarPago(pagoAEliminar.id);
    setEliminando(false);

    if (result.success) {
      setPagoAEliminar(null);
    } else {
      alert('Error al eliminar el pago. Intenta nuevamente.');
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-20 bg-purple-100 rounded-full"></div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-6 bg-gray-100 rounded-full flex-1"></div>
        <div className="h-6 bg-gray-100 rounded-full flex-1"></div>
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
          {/* Header con botón de regreso */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-[#600E80] to-[#8A26A9] p-6 text-white shadow-lg">
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <img src={YapeLogo} alt="Yape Logo" className="h-20 w-20 rounded-full" />
              </div>
              <div className="relative">
                <h1 className="mb-2 text-xl font-bold">Pagos Yape</h1>
                <p className="text-sm text-white/80">Visualiza los pagos recibidos</p>
              </div>
            </div>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, monto o número de operación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
            </div>
          </div>

          {/* Filtros de fecha */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Filtros</h2>
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
                      onClick={() => setFiltroFecha(opcion.value)}
                      className={`px-3 py-3 rounded-lg text-xs font-medium transition-colors min-h-[44px] active:scale-95 ${
                        filtroFecha === opcion.value
                          ? 'bg-purple-600 text-white shadow-md'
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
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista de pagos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                Pagos Recibidos ({loading ? '...' : pagosFiltrados.length})
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : pagosFiltrados.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'No se encontraron pagos' : 'No hay pagos registrados'}
                </h3>
                <p className="text-xs text-gray-500">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los pagos aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagosFiltrados.map((pago) => (
                  <div
                    key={pago.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {pago.nombre || 'Sin nombre'}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(pago.timestamp, pago.fecha)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
                          <span className="text-xs font-medium text-purple-700">
                            {formatCurrency(pago.monto)}
                          </span>
                        </div>
                        <button
                          onClick={() => setPagoAEliminar(pago)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Eliminar pago"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                        </button>
                      </div>
                    </div>

                    {pago.codigo && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg mt-2">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 font-mono">
                          {pago.codigo}
                        </span>
                      </div>
                    )}

                    {pago.mensaje && (
                      <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                        {pago.mensaje}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de confirmación de eliminación */}
      {pagoAEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Pago</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700">{pagoAEliminar.nombre || 'Sin nombre'}</span>
                <span className="text-sm font-bold text-purple-600">{formatCurrency(pagoAEliminar.monto)}</span>
              </div>
              <p className="text-xs text-gray-500">{formatDate(pagoAEliminar.timestamp, pagoAEliminar.fecha)}</p>
              {pagoAEliminar.mensaje && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{pagoAEliminar.mensaje}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPagoAEliminar(null)}
                disabled={eliminando}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarPago}
                disabled={eliminando}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {eliminando ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosYape;
