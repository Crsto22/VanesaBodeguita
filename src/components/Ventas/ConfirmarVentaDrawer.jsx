import React, { useState } from 'react';
// 1. IMPORTAMOS LIBRERÍAS PARA ANIMACIÓN Y EL ICONO DE ALERTA
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, DollarSign, AlertCircle, CheckCircle, CheckSquare, Square, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import ClientesDrawer from './ClientesDrawer';
import EstadoPagado from '../../assets/Ventas/EstadoPagado.svg';
import EstadoParcial from '../../assets/Ventas/EstadoParcial.svg';
import EstadoPendiente from '../../assets/Ventas/EstadoPendiente.svg';
import LogoIzipay from "../../assets/LogoIzipay.png";
import { useClientes } from '../../context/ClientesContext';
import { useVentas } from '../../context/VentasContext';


const ConfirmarVentaDrawer = ({ isOpen, onClose, onConfirm, onViewNotaVenta, total, currentUser, clientesLoading, clienteSeleccionado, setClienteSeleccionado }) => {
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [acordeonAbierto, setAcordeonAbierto] = useState(false);

  const handleSelectCliente = (cliente) => {
    if (!cliente || !cliente.id) {
      setError('Cliente inválido seleccionado');
      return;
    }
    setClienteSeleccionado(cliente);
    setDrawerClientesOpen(false);
    setError('');
  };

  const handleRemoveCliente = (e) => {
    e.stopPropagation();
    setClienteSeleccionado(null);
  };

  const calcularVuelto = () => {
    const recibido = parseFloat(montoRecibido) || 0;
    return (recibido - (total || 0)).toFixed(2);
  };

  const handleConfirm = async () => {
    // Validaciones
    if (estado === 'pendiente' || estado === 'parcial') {
      if (!clienteSeleccionado) {
        setError('Debe seleccionar un cliente para ventas en estado pendiente o parcial.');
        return;
      }
    }

    if (estado === 'parcial') {
      const monto = parseFloat(montoPagado);
      if (isNaN(monto) || monto <= 0) {
        setError('El monto pagado debe ser un número positivo.');
        return;
      }
      if (monto >= total) {
        setError('El monto pagado no puede ser igual o mayor al total en una venta parcial.');
        return;
      }
    }

    if (!total || isNaN(total)) {
      setError('El total de la venta es inválido.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      await onConfirm({
        estado,
        montoPagado: estado === 'parcial' ? parseFloat(montoPagado) || 0 : estado === 'pagado' ? total : 0,
        historialPagos: estado === 'parcial' ? [{
          monto: parseFloat(montoPagado) || 0,
          fecha: new Date().toISOString(),
          cajero_ref: currentUser.uid,
          notas: notas || ''
        }] : [],
        notas
      });

      if ((estado === 'parcial' || estado === 'pendiente') && clienteSeleccionado) {
        const deudaDeEstaVenta = estado === 'parcial'
          ? total - (parseFloat(montoPagado) || 0)
          : total;

        if (deudaDeEstaVenta > 0) {
          await sumarDeudaCliente(clienteSeleccionado.id, deudaDeEstaVenta);
        }
      }

      setIsProcessing(false);
      setIsSuccess(true);
    } catch (error) {
      setIsProcessing(false);
      setError(`Error al procesar la venta: ${error.message}`);
    }
  };

  const handleNewSale = () => {
    setIsSuccess(false);
    setMontoPagado('');
    setMontoRecibido('');
    setNotas('');
    setEstado('pagado');
    setShowNotas(false);
    setAcordeonAbierto(false);
    onClose();
  };

  // 2. CÁLCULOS PARA EL ACORDEÓN DE DEUDA
  // Estas variables se calculan en cada render para que el acordeón siempre esté actualizado.
  let deudaActual = 0;
  let deudaDeEstaVenta = 0;
  let deudaTotalProyectada = 0;
  // La condición principal que decide si se muestra el acordeón.
  const mostrarAcordeonDeuda = clienteSeleccionado && (estado === 'parcial' || estado === 'pendiente');

  if (mostrarAcordeonDeuda) {
      deudaActual = obtenerDeudaTotalPorCliente(clienteSeleccionado.id);

      if (estado === 'parcial') {
          const montoPagadoNum = parseFloat(montoPagado) || 0;
          if (total > montoPagadoNum) {
              deudaDeEstaVenta = total - montoPagadoNum;
          }
      } else { // estado === 'pendiente'
          deudaDeEstaVenta = total;
      }
      deudaTotalProyectada = deudaActual + deudaDeEstaVenta;
  }

  return (
    <>
      {/* Loading/Success Overlay */}
      {(isProcessing || isSuccess) && (
        <div className="fixed inset-0 bg-white z-60 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center transition-all duration-500 rounded-2xl shadow-2xl">
            {isProcessing ? (
              <>
                <div className="mb-5 relative">
                  <div className="absolute inset-0 w-16 h-16 border-4 border-[#45923a]/20 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-t-[#45923a] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#45923a] rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-gray-700 font-medium text-center">Procesando venta...</p>
              </>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-[#45923a] to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle size={40} className="text-white animate-[bounceIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]" />
                  </div>
                </div>
                <h3 className="text-[#45923a] font-bold text-xl mb-2">¡Venta Completada!</h3>
                <p className="text-gray-600">La transacción se ha registrado con éxito.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={handleNewSale}
                    className="w-full bg-[#45923a] text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Nueva Venta
                  </button>
                  <button
                    onClick={onViewNotaVenta}
                    className="w-full bg-[#ffa40c] text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Ver Nota de Venta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop y Drawer principal */}
      {isOpen && <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />}
      <div
        className={`fixed overflow-auto bottom-0 left-0 right-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'
          } rounded-t-3xl shadow-2xl`}
        style={{ maxHeight: '95vh' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-3xl z-10">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-300 mb-2"></div>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Confirmar Venta</h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all">
                    <X className="h-5 w-5 text-gray-600" />
                </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <button
                  className={`flex w-full items-center justify-start gap-3 p-2 rounded-xl ${clienteSeleccionado ? 'bg-amber-50 border-amber-300' : 'bg-gray-100 border-gray-200' } border shadow-sm transition-all`}
                  onClick={() => setDrawerClientesOpen(true)}
                  disabled={clientesLoading}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full ${clienteSeleccionado ? 'bg-amber-400' : 'bg-gray-300'}`}>
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium truncate flex-1 text-left">
                    {clientesLoading ? 'Cargando...' : clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico'}
                  </span>
                  {clienteSeleccionado && (
                    <button onClick={handleRemoveCliente} className="p-1 rounded-full hover:bg-amber-100 transition-colors" aria-label="Quitar cliente">
                      <X size={14} className="text-amber-600" />
                    </button>
                  )}
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`p-2 rounded-xl flex flex-col items-center justify-center ${estado === 'pagado' ? 'bg-green-50 ring-2 ring-green-500 shadow-md' : 'bg-gray-100 ring-1 ring-gray-200' } transition-all`}
                  onClick={() => setEstado('pagado')} >
                  <img src={EstadoPagado} className="h-16 mb-1" alt="Pagado" />
                  <span className={`text-xs font-semibold ${estado === 'pagado' ? 'text-green-700' : 'text-gray-600'}`}>Pagado</span>
                </button>
                <button
                  className={`p-2 rounded-xl flex flex-col items-center justify-center ${estado === 'parcial' ? 'bg-amber-50 ring-2 ring-amber-500 shadow-md' : 'bg-gray-100 ring-1 ring-gray-200' } transition-all`}
                  onClick={() => setEstado('parcial')} >
                  <img src={EstadoParcial} className="h-16 mb-1" alt="Parcial" />
                  <span className={`text-xs font-semibold ${estado === 'parcial' ? 'text-amber-700' : 'text-gray-600'}`}>Parcial</span>
                </button>
                <button
                  className={`p-2 rounded-xl flex flex-col items-center justify-center ${estado === 'pendiente' ? 'bg-red-50 ring-2 ring-red-500 shadow-md' : 'bg-gray-100 ring-1 ring-gray-200' } transition-all`}
                  onClick={() => setEstado('pendiente')} >
                  <img src={EstadoPendiente} className="h-16 mb-1" alt="Pendiente" />
                  <span className={`text-xs font-semibold ${estado === 'pendiente' ? 'text-red-700' : 'text-gray-600'}`}>Pendiente</span>
                </button>
              </div>
            </div>

            {/* 3. ACORDEÓN MODERNO DE DEUDA */}
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
                            {/* Header del acordeón */}
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
                                        <p className="text-red-600 text-xs opacity-80">Cliente: {clienteSeleccionado?.nombre}</p>
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

                            {/* Contenido del acordeón */}
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
                  <input type="number" min="0" step="0.01" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="0.00" />
                </div>
              </div>
            )}
            
            {estado === 'pagado' && (
              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido <span className="text-xs text-gray-500">(opcional)</span></label>
                <div className="relative">
                  <span className="text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 text-sm">S/</span>
                  <input type="number" min="0" step="0.01" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="0.00" />
                </div>
                <p className="mt-2 text-sm font-medium flex justify-between">
                  <span className="text-gray-600">Vuelto:</span>
                  <span className="text-green-700 font-bold"> S/ {calcularVuelto() >= 0 ? calcularVuelto() : '0.00'} </span>
                </p>
              </div>
            )}

            <div className="mb-4 flex items-center">
              <button onClick={() => setShowNotas(!showNotas)} className="flex items-center gap-2">
                {showNotas ? <CheckSquare size={16} className="text-green-600" /> : <Square size={16} className="text-gray-400" />}
                <span className="text-sm font-medium text-gray-700">Agregar Notas</span>
              </button>
            </div>
            
            {showNotas && (
              <div className="mb-4">
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="block w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Agregar notas sobre la venta..." rows="3" />
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
                <img src={LogoIzipay} alt="Pagar con Izipay" className="w-12 h-12 object-contain rounded-lg hover:opacity-80 transition-opacity cursor-pointer" />
              </a>
            </div>

          </div>
          
          <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-200">
            <button
              onClick={handleConfirm}
              className="w-full py-4 px-4 rounded-2xl text-base font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30 flex justify-center items-center gap-2 active:scale-[0.98]"
              disabled={isProcessing}
            >
              Confirmar Venta
            </button>
          </div>
        </div>
      </div>

      <ClientesDrawer
        isOpen={drawerClientesOpen}
        onClose={() => setDrawerClientesOpen(false)}
        onSelectCliente={handleSelectCliente}
      />
    </>
  );
};

export default ConfirmarVentaDrawer;