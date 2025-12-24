import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Barcode,
  ArrowLeft,
  Settings,
  Bell,
  User,
  ShoppingCart,
  Clock,
  ScanBarcode,
  Sun,
  Moon,
  History,
  Store,
  ShoppingBag,
  X,
  AlertCircle,
  ClipboardList
} from 'lucide-react';
import Logo from '../../assets/Logo.svg';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { usePagosYape } from '../../context/PagosYapeContext';
import { motion, AnimatePresence } from 'framer-motion';
import YapeLogo from '../../assets/yape-logo.png';
import PedidosModal from './PedidosModal';

const NavbarVentasDestock = ({
  searchTerm,
  setSearchTerm,
  barcodeInput,
  setBarcodeInput,
  escanerActivo,
  setEscanerActivo,
  onBack,
  isDisabled = false,
  products = []
}) => {
  // Hook de navegación
  const navigate = useNavigate();

  // Estado para la hora actual
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estado para controlar el timeout del input de búsqueda
  const [isSearchDisabledByTimeout, setIsSearchDisabledByTimeout] = useState(false);
  const [searchTimeoutId, setSearchTimeoutId] = useState(null);

  // Estado para el dropdown de configuración
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const { configuracion, configLoaded, saving: savingConfig, toggleConfig } = useConfig();
  const [configToast, setConfigToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // Estado para el dropdown de notificaciones Yape
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);

  // Estado para el dropdown de pedidos
  const [pedidosOpen, setPedidosOpen] = useState(false);

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Funciones para manejar el toast de configuración
  const showConfigToast = (message, type = 'success') => {
    setConfigToast({ visible: true, message, type });
    setTimeout(() => {
      setConfigToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  const closeConfigToast = () => {
    setConfigToast({ visible: false, message: '', type: 'success' });
  };

  // Función para manejar cambios en la configuración
  const handleConfigToggle = async (campo) => {
    const result = await toggleConfig(campo);

    if (result.success) {
      showConfigToast('Configuración guardada correctamente', 'success');
    } else {
      showConfigToast('Error al guardar la configuración', 'error');
    }
  };

  // Formatear la fecha y hora
  const formatWeekday = (date) => {
    const options = { weekday: 'long' };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatDayMonth = (date) => {
    const options = {
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Función para determinar si es día o noche
  const isDayTime = (date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Día: 6:30 AM (390 min) a 6:30 PM (1110 min)
    // Noche: 6:30 PM (1110 min) a 6:30 AM (390 min)
    return totalMinutes >= 390 && totalMinutes < 1110; // 6:30 AM a 6:30 PM
  };

  // Función para iniciar el timeout de búsqueda
  const startSearchTimeout = () => {
    // Limpiar timeout anterior si existe
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }

    // Crear nuevo timeout de 3 minutos (180000 ms)
    const timeoutId = setTimeout(() => {
      // Limpiar el texto de búsqueda
      setSearchTerm('');
      // Deshabilitar el input por timeout
      setIsSearchDisabledByTimeout(true);
      // Reactivar el escáner
      setEscanerActivo(true);
      // Enfocar el input invisible del escáner
      setTimeout(() => {
        const scannerInput = document.querySelector('#scanner-input');
        if (scannerInput) {
          scannerInput.focus();
        }
      }, 100);
    }, 180000); // 3 minutos

    setSearchTimeoutId(timeoutId);
  };

  // Función para cancelar el timeout de búsqueda
  const cancelSearchTimeout = () => {
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
      setSearchTimeoutId(null);
    }
  };

  // Función para reactivar el input de búsqueda
  const reactivateSearchInput = () => {
    setIsSearchDisabledByTimeout(false);
    cancelSearchTimeout();
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutId) {
        clearTimeout(searchTimeoutId);
      }
    };
  }, [searchTimeoutId]);

  // Importar useAuth para obtener datos del usuario
  const { currentUser, userData } = useAuth();

  // Importar usePagosYape para las notificaciones
  const { obtenerUltimosCincoPagos, hayNuevosNoLeidos, marcarComoLeido } = usePagosYape();

  // Get user initial for avatar
  const userInitial = (userData?.nombre?.charAt(0) || currentUser?.email?.charAt(0))?.toUpperCase();
  const displayName = userData?.nombre || currentUser?.email;

  // Manejar apertura de notificaciones
  const handleNotificacionesClick = () => {
    if (!notificacionesOpen) {
      marcarComoLeido();
    }
    setNotificacionesOpen(!notificacionesOpen);
  };

  return (
    <>
      {/* Toast de configuración */}
      <AnimatePresence>
        {configToast.visible && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { y: -100, opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
              visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } }
            }}
            className="fixed top-0 left-0 right-0 w-full z-[100] rounded-b-xl overflow-hidden"
          >
            <div
              className={`w-full shadow-lg ${configToast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
              role="alert"
              tabIndex="-1"
            >
              <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      {configToast.type === 'success' ? (
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                      ) : (
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                      )}
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-white font-medium">
                      {configToast.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeConfigToast}
                  className="text-white hover:text-gray-200 focus:outline-none transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <nav className="bg-white shadow-lg border-b border-gray-200 h-16 flex items-center px-6">
        <div className="flex items-center gap-6 flex-1">
          {/* Botón de regreso */}
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Volver al Dashboard"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          {/* Logo del sistema */}
          <div className="flex items-center">
            <img
              src={Logo}
              alt="Logo"
              className="h-10 w-10 object-contain"
            />
          </div>

          {/* Barra de búsqueda */}
          <div className="flex-1 max-w-2xl mx-8 flex items-center gap-4">
            <div className="relative flex-1">
              <div className="bg-white border-2 border-gray-200 overflow-hidden focus-within:border-[#45923a] rounded-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={
                    isSearchDisabledByTimeout
                      ? "Input deshabilitado por inactividad. Haz clic para reactivar..."
                      : "Buscar productos por nombre, código de barras o categoría..."
                  }
                  value={searchTerm}
                  onChange={(e) => {
                    if (!isDisabled && !isSearchDisabledByTimeout) {
                      setSearchTerm(e.target.value);
                      // Reiniciar el timeout cada vez que el usuario escribe
                      startSearchTimeout();
                    }
                  }}
                  onFocus={() => {
                    // Si está deshabilitado por timeout, reactivarlo
                    if (isSearchDisabledByTimeout) {
                      reactivateSearchInput();
                      return;
                    }

                    // Al enfocar el input de búsqueda, deshabilitar el escáner automáticamente
                    setEscanerActivo(false);
                    const scannerInput = document.querySelector('#scanner-input');
                    if (scannerInput) {
                      scannerInput.blur();
                    }

                    // Iniciar timeout si hay texto
                    if (searchTerm.length > 0) {
                      startSearchTimeout();
                    }
                  }}
                  onBlur={() => {
                    // Si está deshabilitado por timeout, no hacer nada más
                    if (isSearchDisabledByTimeout) {
                      return;
                    }

                    // Al salir del input de búsqueda, habilitar el escáner automáticamente
                    setEscanerActivo(true);
                    // Enfocar el input invisible del escáner después de un pequeño delay
                    setTimeout(() => {
                      const scannerInput = document.querySelector('#scanner-input');
                      if (scannerInput) {
                        scannerInput.focus();
                      }
                    }, 100);
                  }}
                  onKeyDown={(e) => {
                    // Reiniciar timeout con cualquier tecla presionada
                    if (!isDisabled && !isSearchDisabledByTimeout && searchTerm.length > 0) {
                      startSearchTimeout();
                    }
                  }}
                  onClick={() => {
                    // Si está deshabilitado por timeout, reactivarlo al hacer clic
                    if (isSearchDisabledByTimeout) {
                      reactivateSearchInput();
                    }
                  }}
                  className={`w-full pl-12 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none transition-all duration-200 ${isDisabled || isSearchDisabledByTimeout
                    ? 'opacity-50 cursor-pointer bg-gray-50'
                    : ''
                    }`}
                  disabled={isDisabled}
                  readOnly={isSearchDisabledByTimeout}
                />
              </div>
            </div>

            {/* Botón de Historial */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Indicador de estado del escáner */}
              <div className="flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-gray-700" />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${escanerActivo
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500'
                  }`}>
                  {escanerActivo ? 'ESCÁNER ON' : 'ESCÁNER OFF'}
                </span>
              </div>

              {/* Botón de Historial de Ventas */}
              <button
                onClick={() => navigate('/ventas/historial')}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title="Ver historial de ventas"
                disabled={isDisabled}
              >
                <History size={16} />
                <span>Historial de Ventas</span>
              </button>
            </div>
          </div>

          {/* Controles del usuario */}
          <div className="flex items-center justify-end gap-3 ml-auto">
            {/* Alerta de Tienda Cerrada */}
            {configLoaded && !configuracion.tienda_abierta && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 bg-red-500 px-4 py-2 rounded-full shadow-lg"
              >
                <AlertCircle className="w-5 h-5 text-white animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Tienda Cerrada</span>
                  <span className="text-[10px] text-white/90">Pedidos deshabilitados</span>
                </div>
                <button
                  onClick={() => handleConfigToggle('tienda_abierta')}
                  disabled={savingConfig}
                  className="ml-2 bg-white hover:bg-gray-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Habilitar Ahora
                </button>
              </motion.div>
            )}

            {/* Alerta de Pedidos Deshabilitados (tienda abierta pero pedidos off) */}
            {configLoaded && configuracion.tienda_abierta && !configuracion.hacer_pedidos && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 bg-orange-500 px-4 py-2 rounded-full shadow-lg"
              >
                <AlertCircle className="w-5 h-5 text-white animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Pedidos Deshabilitados</span>
                  <span className="text-[10px] text-white/90">Tienda abierta</span>
                </div>
                <button
                  onClick={() => handleConfigToggle('hacer_pedidos')}
                  disabled={savingConfig}
                  className="ml-2 bg-white hover:bg-gray-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Habilitar Ahora
                </button>
              </motion.div>
            )}

            {/* Reloj y Fecha */}
            <div className="flex items-center bg-[#093a4b] px-4 py-1.5 rounded-full text-white shadow-lg">
              <div className="flex items-center gap-3">
                {/* Icono de Sol o Luna */}
                <div className="flex items-center justify-center">
                  {isDayTime(currentTime) ? (
                    <Sun className="w-6 h-6 text-yellow-300" />
                  ) : (
                    <Moon className="w-6 h-6 text-blue-200" />
                  )}
                </div>

                <div className="text-2xl font-extrabold leading-tight tracking-wide drop-shadow-sm">
                  {formatTime(currentTime)}
                </div>
                <div className="flex flex-col">
                  <div className="text-sm text-white/90 font-medium  uppercase tracking-wider">
                    {formatWeekday(currentTime)}
                  </div>
                  <div className="text-sm text-white/90 font-medium  ">
                    {formatDayMonth(currentTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Pedidos */}
            <div className="relative">
              <button
                onClick={() => setPedidosOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                title="Pedidos"
              >
                <ClipboardList size={20} className="text-gray-600" />
              </button>
            </div>

            <PedidosModal
              isOpen={pedidosOpen}
              onClose={() => setPedidosOpen(false)}
              products={products}
            />

            {/* Notificaciones Yape */}
            <div className="relative">
              <button
                onClick={handleNotificacionesClick}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {hayNuevosNoLeidos && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                )}
              </button>

              {/* Dropdown de Notificaciones */}
              <AnimatePresence>
                {notificacionesOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-[50]"
                      onClick={() => setNotificacionesOpen(false)}
                    />

                    {/* Dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[60] overflow-hidden"
                    >
                      {/* Header del dropdown */}
                      <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-white">Pagos Yape</h3>
                            <p className="text-xs text-white/80">Últimos 5 pagos recibidos</p>
                          </div>
                        </div>
                      </div>

                      {/* Lista de notificaciones */}
                      <div className="max-h-96 overflow-y-auto">
                        {obtenerUltimosCincoPagos().length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No hay pagos recientes</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {obtenerUltimosCincoPagos().map((pago) => (
                              <div
                                key={pago.id}
                                className="p-3 hover:bg-purple-50 transition-colors cursor-pointer"
                                onClick={() => navigate('/pagos-yape')}
                              >
                                <div className="flex items-center gap-3">
                                  <img src={YapeLogo} alt="Yape" className="h-8 w-8 flex-shrink-0 rounded-xl" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 line-clamp-2">
                                      {pago.mensaje || 'Pago recibido'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {obtenerUltimosCincoPagos().length > 0 && (
                        <div className="border-t border-gray-100 p-3">
                          <button
                            onClick={() => {
                              setNotificacionesOpen(false);
                              navigate('/pagos-yape');
                            }}
                            className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium py-2 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            Ver todos los pagos →
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Configuraciones */}
            <div className="relative">
              <button
                onClick={() => setConfigDropdownOpen(!configDropdownOpen)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Settings size={20} className="text-gray-600" />
              </button>

              {/* Dropdown Menu de Configuración */}
              <AnimatePresence>
                {configDropdownOpen && (
                  <>
                    {/* Backdrop para cerrar el dropdown */}
                    <div
                      className="fixed inset-0 z-[50]"
                      onClick={() => setConfigDropdownOpen(false)}
                    />

                    {/* Dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[60] overflow-hidden"
                    >
                      {/* Header del dropdown */}
                      <div className="bg-gradient-to-br from-[#45923a] to-[#3d8033] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-white" />
                          <div>
                            <h3 className="text-sm font-bold text-white">Configuración</h3>
                            <p className="text-xs text-white/80">Ajustes del sistema</p>
                          </div>
                        </div>
                      </div>

                      {/* Opciones de configuración */}
                      <div className="p-3 space-y-2">
                        {/* Tienda Abierta */}
                        <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${configuracion.tienda_abierta ? 'bg-green-100' : 'bg-gray-200'}`}>
                                <Store className={`h-4 w-4 ${configuracion.tienda_abierta ? 'text-green-600' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-900">Tienda Abierta</h4>
                                <p className="text-[10px] text-gray-500">
                                  {configuracion.tienda_abierta ? 'Abierta' : 'Cerrada'}
                                </p>
                              </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                              onClick={() => handleConfigToggle('tienda_abierta')}
                              disabled={savingConfig}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${configuracion.tienda_abierta
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                                } ${savingConfig ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${configuracion.tienda_abierta ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Hacer Pedidos */}
                        <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${configuracion.hacer_pedidos ? 'bg-blue-100' : 'bg-gray-200'}`}>
                                <ShoppingBag className={`h-4 w-4 ${configuracion.hacer_pedidos ? 'text-blue-600' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-900">Hacer Pedidos</h4>
                                <p className="text-[10px] text-gray-500">
                                  {configuracion.hacer_pedidos ? 'Habilitado' : 'Deshabilitado'}
                                </p>
                              </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                              onClick={() => handleConfigToggle('hacer_pedidos')}
                              disabled={savingConfig}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${configuracion.hacer_pedidos
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                                } ${savingConfig ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${configuracion.hacer_pedidos ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Separador */}
            <div className="w-px h-6 bg-gray-200"></div>

            {/* Usuario */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500">
                  {userData?.role || 'User'}
                </span>
              </div>

              <div className="w-9 h-9 bg-[#45923a] rounded-full flex items-center justify-center text-white">
                <span className="text-sm font-medium">{userInitial}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavbarVentasDestock;