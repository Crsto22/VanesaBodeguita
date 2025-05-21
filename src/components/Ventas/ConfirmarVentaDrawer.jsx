import React, { useState } from 'react';
import { X, User, DollarSign, AlertCircle, CheckCircle, Loader2, CheckSquare, Square } from 'lucide-react';
import ClientesDrawer from './ClientesDrawer';
import EstadoPagado from '../../assets/Ventas/EstadoPagado.svg';
import EstadoParcial from '../../assets/Ventas/EstadoParcial.svg';
import EstadoPendiente from '../../assets/Ventas/EstadoPendiente.svg';

const ConfirmarVentaDrawer = ({ isOpen, onClose, onConfirm, onViewNotaVenta, total, currentUser, clientesLoading, clienteSeleccionado, setClienteSeleccionado }) => {
  const [estado, setEstado] = useState('pagado');
  const [montoPagado, setMontoPagado] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [drawerClientesOpen, setDrawerClientesOpen] = useState(false);
  const [showNotas, setShowNotas] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSelectCliente = (cliente) => {
    if (!cliente || !cliente.id) {
      setError('Cliente inválido seleccionado');
      console.error('Invalid client selected:', cliente);
      return;
    }
    console.log('Selected client:', cliente);
    setClienteSeleccionado(cliente);
    setDrawerClientesOpen(false);
    setError('');
  };

  const handleRemoveCliente = (e) => {
    e.stopPropagation();
    console.log('Removing client:', clienteSeleccionado);
    setClienteSeleccionado(null);
  };

  const calcularVuelto = () => {
    const recibido = parseFloat(montoRecibido) || 0;
    return (recibido - (total || 0)).toFixed(2);
  };

  const handleConfirm = async () => {
    // Validaciones
    if (estado === 'pendiente' || estado === 'parcial') {
      if (!clienteSeleccionado || !clienteSeleccionado.id || !clienteSeleccionado.nombre) {
        setError('Debe seleccionar un cliente para ventas en estado pendiente o parcial');
        return;
      }
    }

    if (estado === 'parcial') {
      const monto = parseFloat(montoPagado);
      if (isNaN(monto) || monto <= 0) {
        setError('El monto pagado debe ser un número positivo');
        return;
      }
      if (monto >= total) {
        setError('El monto pagado no puede ser igual o mayor al total en estado parcial');
        return;
      }
    }

    if (!total || isNaN(total)) {
      setError('El total de la venta es inválido');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const ventaId = await onConfirm({
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
    onClose();
  };

  return (
    <>
      {/* Loading/Success Overlay */}
      {(isProcessing || isSuccess) && (
        <div className="fixed inset-0 bg-white z-60 flex items-center justify-center">
          <div className="relative bg-white w-full max-w-2xl mx-auto p-3 flex flex-col items-center justify-center transition-all duration-500">
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
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-[#45923a] to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle size={40} className="text-white animate-[bounceIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-[#45923a] font-bold text-xl mb-2">¡Completado!</h3>
                  <p className="text-gray-700 font-medium">Venta registrada con éxito</p>
                </div>
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleNewSale}
                    className="bg-[#45923a] text-white font-medium py-2 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Nueva Venta
                  </button>
                  <button
                    onClick={onViewNotaVenta}
                    className="bg-[#ffa40c] text-white font-medium py-2 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Ver Nota de Venta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop para ConfirmarVentaDrawer */}
      {isOpen && <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />}

      {/* ConfirmarVentaDrawer */}
      <div
        className={`fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } rounded-t-2xl overflow-auto`}
        style={{ maxHeight: '95vh', top: 'auto' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="w-8"></div>
            <h2 className="text-lg font-bold text-gray-800">Confirmar Venta</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Indicador de arrastre */}
          <div className="mx-auto w-12 h-1 rounded-full bg-gray-300 mb-3"></div>

          {/* Contenido del Drawer */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Selección de Cliente */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <div className="relative">
                <button
                  className={`flex w-full items-center justify-start gap-2 p-2 rounded-lg ${
                    clienteSeleccionado ? 'bg-[#ffa40c]/10 border border-[#ffa40c]/30 text-gray-800' : 'bg-[#ffa40c]/10 border border-[#ffa40c]/30 text-gray-800'
                  } shadow-sm transition-all`}
                  onClick={() => setDrawerClientesOpen(true)}
                  disabled={clientesLoading}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ffa40c]">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium truncate flex-1">
                    {clientesLoading
                      ? 'Cargando clientes...'
                      : clienteSeleccionado
                      ? clienteSeleccionado.nombre
                      : 'Cliente Genérico'}
                  </span>
                  {clienteSeleccionado && (
                    <button
                      onClick={handleRemoveCliente}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      aria-label="Quitar cliente"
                    >
                      <X size={12} className="text-gray-600" />
                    </button>
                  )}
                </button>
              </div>
            </div>

            {/* Estado de Pago */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
              <div className="flex gap-2 w-full">
                <button
                  className={`flex-1 p-2 rounded-lg flex flex-col items-center ${
                    estado === 'pagado' ? 'bg-[#45923a]/20 border-2 border-[#45923a] shadow-md' : 'bg-gray-100 border border-gray-200'
                  } transition-all`}
                  onClick={() => setEstado('pagado')}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 ${estado === 'pagado' ? 'bg-[#45923a]' : ''}`}>
                    <img src={EstadoPagado} className="rounded-lg w-24" alt="Pagado" />
                  </div>
                  <span className={`text-xs font-medium ${estado === 'pagado' ? 'text-[#45923a]' : 'text-gray-600'}`}>Pagado</span>
                </button>

                <button
                  className={`flex-1 p-2 rounded-lg flex flex-col items-center ${
                    estado === 'parcial' ? 'bg-[#ffa40c]/20 border-2 border-[#ffa40c] shadow-md' : 'bg-gray-100 border border-gray-200'
                  } transition-all`}
                  onClick={() => setEstado('parcial')}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 ${estado === 'parcial' ? 'bg-[#ffa40c]' : ''}`}>
                    <img src={EstadoParcial} className="rounded-lg w-24" alt="Parcial" />
                  </div>
                  <span className={`text-xs font-medium ${estado === 'parcial' ? 'text-[#ffa40c]' : 'text-gray-600'}`}>Parcial</span>
                </button>

                <button
                  className={`flex-1 p-2 rounded-lg flex flex-col items-center ${
                    estado === 'pendiente' ? 'bg-[#e74b4b]/20 border-2 border-[#e74b4b] shadow-md' : 'bg-gray-100 border border-gray-200'
                  } transition-all`}
                  onClick={() => setEstado('pendiente')}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 ${estado === 'pendiente' ? 'bg-[#e74b4b]' : ''}`}>
                    <img src={EstadoPendiente} className="rounded-lg w-24" alt="Pendiente" />
                  </div>
                  <span className={`text-xs font-medium ${estado === 'pendiente' ? 'text-[#e74b4b]' : 'text-gray-600'}`}>
                    Pendiente
                  </span>
                </button>
              </div>
            </div>

            {/* Monto Pagado (para parcial) */}
            {estado === 'parcial' && (
              <div className="mb-4 bg-[#ffa40c]/10 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-500" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ffa40c] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-2 text-sm font-medium flex justify-between">
                  <span className="text-gray-600">Monto Pendiente:</span>
                  <span className="text-[#45923a]">S/{(total - (parseFloat(montoPagado) || 0)).toFixed(2)}</span>
                </p>
              </div>
            )}

            {/* Monto Recibido y Vuelto (para pagado) */}
            {estado === 'pagado' && (
              <div className="mb-4 bg-[#45923a]/10 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido <span className="text-xs text-gray-500">(opcional)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <span className="text-gray-500">S/</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-2 text-sm font-medium flex justify-between">
                  <span className="text-gray-600">Vuelto:</span>
                  <span className="text-[#45923a]">
                    S/{calcularVuelto() >= 0 ? calcularVuelto() : '0.00'}
                  </span>
                </p>
              </div>
            )}

            {/* Checkbox para mostrar el campo de Notas */}
            <div className="mb-4 flex items-center">
              <button onClick={() => setShowNotas(!showNotas)} className="flex items-center gap-2">
                {showNotas ? <CheckSquare size={16} className="text-[#45923a]" /> : <Square size={16} className="text-gray-400" />}
                <span className="text-sm font-medium text-gray-700">Agregar Notas</span>
              </button>
            </div>

            {/* Campo de Notas (Opcional) */}
            {showNotas && (
              <div className="mb-4">
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent"
                  placeholder="Agregar notas sobre la venta..."
                  rows="3"
                />
              </div>
            )}

            {/* Mensaje de error si existe */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Total a Pagar */}
            <div className="mb-4 bg-green-50 rounded-lg p-3 shadow-sm">
              <p className="text-lg font-bold text-[#45923a] text-center">Total a Pagar: S/{(total || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="px-4 pb-8 pt-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 px-4 rounded-xl text-base font-medium text-white mb-3 bg-[#45923a] hover:bg-[#3b7d31] transition-colors shadow-md flex justify-center items-center gap-2"
              disabled={isProcessing}
            >
              Confirmar Venta
            </button>
          </div>
        </div>
      </div>

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