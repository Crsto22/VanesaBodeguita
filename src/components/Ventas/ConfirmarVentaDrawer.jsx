import React, { useState } from 'react';
import { X, User, DollarSign, AlertCircle, CheckSquare, Square } from 'lucide-react';
import ClientesDrawer from './ClientesDrawer';
import EstadoPagado from '../../assets/Ventas/EstadoPagado.svg';
import EstadoParcial from '../../assets/Ventas/EstadoParcial.svg';
import EstadoPendiente from '../../assets/Ventas/EstadoPendiente.svg';

const ConfirmarVentaDrawer = ({ isOpen, onClose, onConfirm, total, currentUser, clientesLoading, clienteSeleccionado, setClienteSeleccionado }) => {
  const [estado, setEstado] = useState('pagado');
  const [montoPagado, setMontoPagado] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [drawerClientesOpen, setDrawerClientesOpen] = useState(false);
  const [showNotas, setShowNotas] = useState(false);

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
    return (recibido - total).toFixed(2);
  };

  const handleConfirm = () => {
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

    setError('');
    onConfirm({
      estado,
      montoPagado: estado === 'parcial' ? parseFloat(montoPagado) : estado === 'pagado' ? total : 0,
      historialPagos: estado === 'parcial' ? [{
        monto: parseFloat(montoPagado),
        fecha: new Date().toISOString(),
        cajero_ref: currentUser.uid,
        notas: notas || ''
      }] : [],
      notas
    });
    setMontoPagado('');
    setMontoRecibido('');
    setNotas('');
    setEstado('pagado');
  };

  return (
    <>
      {/* Backdrop para ConfirmarVentaDrawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={onClose}
        />
      )}

      {/* ConfirmarVentaDrawer - Diseño moderno */}
      <div
        className={`fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } rounded-t-2xl overflow-auto`}
        style={{ maxHeight: '95vh', top: 'auto' }}
      >
        <div className="flex flex-col h-full">
          {/* Header con diseño moderno */}
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

            {/* Estado de Pago - Botones con iconos en fila */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
              <div className="flex gap-2 w-full">
                <button
                  className={`flex-1 p-2 rounded-lg flex flex-col items-center ${
                    estado === 'pagado' ? 'bg-[#45923a]/20 border-2 border-[#45923a] shadow-md' : 'bg-gray-100 border border-gray-200'
                  } transition-all`}
                  onClick={() => setEstado('pagado')}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 ${
                    estado === 'pagado' ? 'bg-[#45923a]' : ''
                  }`}>
                    <img src={EstadoPagado} className='rounded-lg w-24' />
                  </div>
                  <span className={`text-xs font-medium ${estado === 'pagado' ? 'text-[#45923a]' : 'text-gray-600'}`}>
                    Pagado
                  </span>
                </button>

                <button
                  className={`flex-1 p-2 rounded-lg flex flex-col items-center ${
                    estado === 'parcial' ? 'bg-[#ffa40c]/20 border-2 border-[#ffa40c] shadow-md' : 'bg-gray-100 border border-gray-200'
                  } transition-all`}
                  onClick={() => setEstado('parcial')}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 ${
                    estado === 'parcial' ? 'bg-[#ffa40c]' : ''
                  }`}>
                    <img src={EstadoParcial} className='rounded-lg w-24'/>
                  </div>
                  <span className={`text-xs font-medium ${estado === 'parcial' ? 'text-[#ffa40c]' : 'text-gray-600'}`}>
                    Parcial
                  </span>
                </button>

                <button
                  className={`flex-1 p-2 rounded-lg flex flex-col items-center ${
                    estado === 'pendiente' ? 'bg-[#e74b4b]/20 border-2 border-[#e74b4b] shadow-md' : 'bg-gray-100 border border-gray-200'
                  } transition-all`}
                  onClick={() => setEstado('pendiente')}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 ${
                    estado === 'pendiente' ? 'bg-[#e74b4b]' : ''
                  }`}>
                    <img src={EstadoPendiente} className='rounded-lg w-24 ' />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido</label>
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
              <button
                onClick={() => setShowNotas(!showNotas)}
                className="flex items-center gap-2"
              >
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
              <p className="text-lg font-bold text-[#45923a] text-center">Total a Pagar: S/{total.toFixed(2)}</p>
            </div>
          </div>
                    {/* Footer con botones */}
          <div className="px-6 pb-8 pt-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 px-4 rounded-xl text-base font-medium text-white mb-3 bg-[#45923a] hover:bg-[#3b7d31] transition-colors shadow-md flex justify-center items-center gap-2"
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
