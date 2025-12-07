import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Search, Calendar, User, DollarSign, Hash, RefreshCw, ArrowLeft } from 'lucide-react';
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

  // Usar el contexto de pagos
  const { pagos, loading, formatDate, formatCurrency, filtrarPagos } = usePagosYape();

  const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas', path: '/ventas' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
    { id: 'clientes', title: 'Clientes', icon: <User className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar clientes', path: '/clientes' },
  ];

  useEffect(() => {
    setAppear(true);
  }, []);

  // Filtrar pagos usando el contexto
  const pagosFiltrados = filtrarPagos(searchTerm);

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
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
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
                        <DollarSign className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">
                          {formatCurrency(pago.monto)}
                        </span>
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
    </div>
  );
};

export default PagosYape;
