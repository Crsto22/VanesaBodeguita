import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, CheckCircle, DollarSign, Square, CheckSquare, AlertCircle, AlertTriangle, ChevronDown, Eye, Loader } from 'lucide-react';
import Lottie from 'lottie-react';
import { useClientes } from '../../context/ClientesContext';
import { useVentas } from '../../context/VentasContext';
import ClientesDrawer from './ClientesDrawer';
import EstadoPagado from '../../assets/Ventas/EstadoPagado.svg';
import EstadoParcial from '../../assets/Ventas/EstadoParcial.svg';
import EstadoPendiente from '../../assets/Ventas/EstadoPendiente.svg';
import LogoIzipay from '../../assets/LogoIzipay.png';
import successAnimation from '../../assets/success-confetti.json';


const ConfirmarVentaDrawer = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onViewNotaVenta, 
  total, 
  currentUser, 
  clientesLoading, 
  clienteSeleccionado, 
  setClienteSeleccionado 
}) => {
  const { sumarDeudaCliente } = useClientes();
  const { obtenerDeudaTotalPorCliente } = useVentas();

  const [estado, setEstado] = useState('pagado');
  const [montoPagado, setMontoPagado] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [drawerClientesOpen, setDrawerClientesOpen] = useState(false);
  const [showNotas, setShowNotas] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acordeonAbierto, setAcordeonAbierto] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Nuevos estados para el sistema de notificaciones
  const [ventaStatus, setVentaStatus] = useState('idle'); // 'idle', 'uploading', 'success'
  const [ventaId, setVentaId] = useState(null);

  // Manejar la visibilidad con animación
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Resetear el estado cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setMontoPagado('');
      setMontoRecibido('');
      setNotas('');
      setEstado('pagado');
      setShowNotas(false);
      setError('');
      setAcordeonAbierto(false);
      // NO resetear ventaStatus y ventaId aquí para que el alerta persista
    }
  }, [isOpen]);

  // Efecto para resetear el estado si se quita el cliente
  useEffect(() => {
    if (!clienteSeleccionado) {
      setEstado('pagado');
      setMontoPagado('');
      setError('');
    }
  }, [clienteSeleccionado]);

  const handleSelectCliente = (cliente) => {
    if (!cliente || !cliente.id) {
      console.error('Cliente inválido seleccionado:', cliente);
      return;
    }
    setClienteSeleccionado(cliente);
    setDrawerClientesOpen(false);
  };

  const handleRemoveCliente = (e) => {
    e.stopPropagation();
    setClienteSeleccionado(null);
    setEstado('pagado');
    setMontoPagado('');
    setError('');
  };

  const calcularVuelto = () => {
    if (!montoRecibido) return 0;
    const vuelto = parseFloat(montoRecibido) - total;
    return Math.max(0, vuelto).toFixed(2);
  };

  const handleConfirm = async () => {
    if (estado === 'parcial') {
      const monto = parseFloat(montoPagado);
      if (!monto || monto <= 0 || monto >= total) {
        setError('El monto pagado debe ser mayor a 0 y menor al total.');
        return;
      }
    }

    if (!total || isNaN(total)) {
      setError('El total de la venta no es válido.');
      return;
    }

    setError('');
    setIsProcessing(true);
    setVentaStatus('uploading');

    try {
      const result = await onConfirm({
        estado,
        montoPagado: estado === 'parcial' ? parseFloat(montoPagado) : (estado === 'pagado' ? total : 0),
        notas: notas.trim() || ''
      });

      setVentaId(result);
      setVentaStatus('success');
      setIsProcessing(false);
      
      // Auto-hide después de 5 segundos con animación
      setTimeout(() => {
        // Cambiar a idle activa la animación exit de AnimatePresence
        setVentaStatus('idle');
        // Limpiar el ID después de que termine la animación
        setTimeout(() => {
          setVentaId(null);
        }, 700); // Tiempo suficiente para que complete la animación exit (0.6s + margen)
      }, 5000);
      
    } catch (error) {
      console.error('Error al confirmar la venta:', error);
      setError('Error al procesar la venta. Inténtalo de nuevo.');
      setIsProcessing(false);
      setVentaStatus('idle');
    }
  };

  // Función para ver el ticket
  const handleViewTicket = () => {
    if (ventaId) {
      setVentaStatus('idle'); // Esto activa la animación exit
      setTimeout(() => {
        setVentaId(null);
        onViewNotaVenta(ventaId);
      }, 100); // Pequeño delay para que inicie la animación
    }
  };

  // Variantes de animación para Framer Motion
  const drawerVariants = {
    hidden: {
      y: '100%',
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    }
  };

  // Cálculos para el acordeón de deuda
  let deudaActual = 0;
  let deudaDeEstaVenta = 0;
  let deudaTotalProyectada = 0;
  const mostrarAcordeonDeuda = clienteSeleccionado && (estado === 'parcial' || estado === 'pendiente');

  if (mostrarAcordeonDeuda) {
    deudaActual = obtenerDeudaTotalPorCliente(clienteSeleccionado.id);
    
    if (estado === 'parcial') {
      const montoPagadoNum = parseFloat(montoPagado) || 0;
      deudaDeEstaVenta = Math.max(0, total - montoPagadoNum);
    } else if (estado === 'pendiente') {
      deudaDeEstaVenta = total;
    }
    
    deudaTotalProyectada = deudaActual + deudaDeEstaVenta;
  }

  if (!isVisible && ventaStatus === 'idle') return null;

  return (
    <>
      {/* Notificación de estado de venta - Siempre visible cuando hay estado */}
      <AnimatePresence>
      {(ventaStatus === 'uploading' || ventaStatus === 'success') && (
        <motion.div
          key="venta-notification"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] w-full max-w-lg px-4"
          initial={{ opacity: 0, y: -80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ 
            opacity: 0, 
            y: -80, 
            scale: 0.9,
            transition: { duration: 0.6, ease: "easeInOut" }
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            duration: 0.5
          }}
        >
          <div role="alert" className="alert alert-vertical sm:alert-horizontal bg-white shadow-2xl border border-gray-200 rounded-xl p-5">
            {ventaStatus === 'uploading' ? (
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                className="h-12 w-12 shrink-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="#2cda94" 
                  strokeWidth="2"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="#2cda94" 
                  d="m12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8z"
                />
              </motion.svg>
            ) : (
              <motion.div 
                className="w-12 h-12 shrink-0 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 20,
                  delay: 0.1
                }}
              >
                <Lottie 
                  animationData={successAnimation} 
                  autoplay={true}
                  loop={false}
                  style={{ width: '100%', height: '100%' }}
                />
              </motion.div>
            )}
            
            <motion.div
              initial={ventaStatus === 'success' ? { opacity: 0, x: -20 } : false}
              animate={ventaStatus === 'success' ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.h3 
                className="font-bold text-base"
                initial={ventaStatus === 'success' ? { opacity: 0 } : false}
                animate={ventaStatus === 'success' ? { opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {ventaStatus === 'uploading' ? 'Subiendo la venta' : '¡Venta completada!'}
              </motion.h3>
              <motion.div 
                className="text-sm"
                initial={ventaStatus === 'success' ? { opacity: 0 } : false}
                animate={ventaStatus === 'success' ? { opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {ventaStatus === 'uploading' 
                  ? 'La venta se está procesando...' 
                  : 'La venta se ha registrado exitosamente'
                }
              </motion.div>
            </motion.div>
            
            {ventaStatus === 'success' && (
              <motion.button 
                className="btn btn-sm bg-[#45923a] hover:bg-[#3a7d30] text-white border-none"
                onClick={handleViewTicket}
                initial={{ opacity: 0, x: 30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ 
                  delay: 0.6, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver Ticket
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className="absolute inset-0 bg-white z-10 flex flex-col"
            variants={drawerVariants}
            initial="hidden"
            animate={isOpen ? "visible" : "exit"}
            exit="exit"
          >
            {/* Header */}
            <motion.div 
              className="p-4 bg-gradient-to-r from-[#45923a] to-[#3a7d30] flex-shrink-0"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Confirmar Venta</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div 
              className="flex-1 overflow-y-auto p-4"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <button
                  className={`flex w-full items-center justify-start gap-3 p-2 rounded-xl ${
                    clienteSeleccionado
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-gray-100 border-gray-200'
                  } border shadow-sm transition-all`}
                  onClick={() => setDrawerClientesOpen(true)}
                  disabled={clientesLoading}
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-full ${
                      clienteSeleccionado ? 'bg-amber-400' : 'bg-gray-300'
                    }`}
                  >
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium truncate flex-1 text-left">
                    {clientesLoading
                      ? 'Cargando...'
                      : clienteSeleccionado
                      ? clienteSeleccionado.nombre
                      : 'Cliente Genérico'}
                  </span>
                  {clienteSeleccionado && (
                    <button
                      onClick={handleRemoveCliente}
                      className="p-1 rounded-full hover:bg-amber-100 transition-colors"
                      aria-label="Quitar cliente"
                    >
                      <X size={14} className="text-amber-600" />
                    </button>
                  )}
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
                <div
                  className={`grid ${
                    clienteSeleccionado ? 'grid-cols-3' : 'grid-cols-1'
                  } gap-2 transition-all duration-300`}
                >
                  <button
                    className={`p-2 rounded-xl flex flex-col items-center justify-center ${
                      estado === 'pagado'
                        ? 'bg-green-50 ring-2 ring-green-500 shadow-md'
                        : 'bg-gray-100 ring-1 ring-gray-200'
                    } transition-all`}
                    onClick={() => setEstado('pagado')}
                  >
                    <img src={EstadoPagado} className="h-16 mb-1" alt="Pagado" />
                    <span
                      className={`text-xs font-semibold ${
                        estado === 'pagado' ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      Pagado
                    </span>
                  </button>

                  {clienteSeleccionado && (
                    <>
                      <button
                        className={`p-2 rounded-xl flex flex-col items-center justify-center ${
                          estado === 'parcial'
                            ? 'bg-amber-50 ring-2 ring-amber-500 shadow-md'
                            : 'bg-gray-100 ring-1 ring-gray-200'
                        } transition-all`}
                        onClick={() => setEstado('parcial')}
                      >
                        <img src={EstadoParcial} className="h-16 mb-1" alt="Parcial" />
                        <span
                          className={`text-xs font-semibold ${
                            estado === 'parcial' ? 'text-amber-700' : 'text-gray-600'
                          }`}
                        >
                          Parcial
                        </span>
                      </button>
                      <button
                        className={`p-2 rounded-xl flex flex-col items-center justify-center ${
                          estado === 'pendiente'
                            ? 'bg-red-50 ring-2 ring-red-500 shadow-md'
                            : 'bg-gray-100 ring-1 ring-gray-200'
                        } transition-all`}
                        onClick={() => setEstado('pendiente')}
                      >
                        <img src={EstadoPendiente} className="h-16 mb-1" alt="Pendiente" />
                        <span
                          className={`text-xs font-semibold ${
                            estado === 'pendiente' ? 'text-red-700' : 'text-gray-600'
                          }`}
                        >
                          Pendiente
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {mostrarAcordeonDeuda && deudaDeEstaVenta > 0 && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl shadow-md overflow-hidden">
                      <button
                        onClick={() => setAcordeonAbierto(!acordeonAbierto)}
                        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-red-50/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <AlertTriangle size={12} className="text-white" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-red-800 text-xs">NUEVO SALDO DEUDOR</h4>
                            <p className="text-red-600 text-xs opacity-80">
                              Cliente: {clienteSeleccionado?.nombre}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-600">
                            S/ {deudaTotalProyectada.toFixed(2)}
                          </span>
                          <motion.div
                            animate={{ rotate: acordeonAbierto ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={16} className="text-red-500" />
                          </motion.div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {acordeonAbierto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 bg-white/50 border-t border-red-200/50">
                              <div className="pt-2 space-y-1.5">
                                <div className="flex items-center justify-between py-1.5 border-b border-red-100">
                                  <span className="text-xs text-gray-700 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    Deuda anterior del cliente
                                  </span>
                                  <span className="text-xs font-medium text-gray-800">
                                    S/ {deudaActual.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between py-1.5 border-b border-red-100">
                                  <span className="text-xs text-orange-700 flex items-center gap-1.5 font-medium">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                    Deuda de esta venta
                                  </span>
                                  <span className="text-xs font-bold text-orange-700">
                                    + S/ {deudaDeEstaVenta.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 bg-red-50 rounded-lg px-2 py-1.5 border border-red-200">
                                  <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    TOTAL DEUDA
                                  </span>
                                  <span className="text-sm font-bold text-red-600">
                                    S/ {deudaTotalProyectada.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {estado === 'parcial' && (
                <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado</label>
                  <div className="relative">
                    <DollarSign size={14} className="text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                      className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {estado === 'pagado' && (
                <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Recibido <span className="text-xs text-gray-500">(opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 text-sm">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium flex justify-between">
                    <span className="text-gray-600">Vuelto:</span>
                    <span className="text-green-700 font-bold">
                      S/ {calcularVuelto() >= 0 ? calcularVuelto() : '0.00'}
                    </span>
                  </p>
                </div>
              )}

              <div className="mb-4 flex items-center">
                <button
                  onClick={() => setShowNotas(!showNotas)}
                  className="flex items-center gap-2"
                >
                  {showNotas ? (
                    <CheckSquare size={16} className="text-green-600" />
                  ) : (
                    <Square size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Agregar Notas</span>
                </button>
              </div>

              {showNotas && (
                <div className="mb-4">
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Agregar notas sobre la venta..."
                    rows="3"
                  />
                </div>
              )}

              {error && (
                <div className="mb-3 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center mb-4">
                <div className="bg-green-50 rounded-xl p-3 shadow-sm flex-grow">
                  <p className="text-lg font-bold text-green-700 text-center">
                    Total a Pagar: S/{(total || 0).toFixed(2)}
                  </p>
                </div>
                <a
                  href="https://play.google.com/store/apps/details?id=pe.izipay.apps.izipay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3"
                >
                  <img
                    src={LogoIzipay}
                    alt="Pagar con Izipay"
                    className="w-12 h-12 object-contain rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </a>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <button
                onClick={handleConfirm}
                className="w-full py-4 px-4 rounded-2xl text-base font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30 flex justify-center items-center gap-2 active:scale-[0.98]"
                disabled={isProcessing}
              >
                Confirmar Venta
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ClientesDrawer */}
      <ClientesDrawer
        isOpen={drawerClientesOpen}
        onClose={() => setDrawerClientesOpen(false)}
        onSelectCliente={handleSelectCliente}
      />
    </>
  );
};

export default ConfirmarVentaDrawer;
