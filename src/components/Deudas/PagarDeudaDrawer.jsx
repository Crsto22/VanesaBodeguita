import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, X, CheckSquare, Square, CreditCard, Receipt, Calendar, FileText } from 'lucide-react';
import { useVentas } from '../../context/VentasContext';

const PagarDeudaDrawer = ({ isOpen, onClose, cliente, onPagarDeuda }) => {
  const { obtenerVentasPorCliente, registrarAbono } = useVentas();
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [pagarTodo, setPagarTodo] = useState(false);
  const [modoAbono, setModoAbono] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cliente) {
      const fetchVentas = async () => {
        try {
          setLoading(true);
          const ventasCliente = await obtenerVentasPorCliente(cliente.id);
          const ventasPendientes = ventasCliente.filter(v => v.monto_pendiente > 0);
          setVentas(ventasPendientes);
        } catch (err) {
          setError('Error al cargar las ventas del cliente.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchVentas();
    }
  }, [isOpen, cliente, obtenerVentasPorCliente]);

  const handleSelectVenta = (ventaId) => {
    setSelectedVentas((prev) =>
      prev.includes(ventaId)
        ? prev.filter((id) => id !== ventaId)
        : [...prev, ventaId]
    );
    setPagarTodo(false);
    setModoAbono(false);
    setMontoAbono('');
  };

  const handlePagarTodo = () => {
    if (pagarTodo) {
      setSelectedVentas([]);
    } else {
      setSelectedVentas(ventas.map((venta) => venta.id));
    }
    setPagarTodo(!pagarTodo);
    setModoAbono(false);
    setMontoAbono('');
  };

  const calcularMontoTotal = () => {
    if (pagarTodo) {
      return ventas.reduce((sum, venta) => sum + (venta.monto_pendiente || 0), 0);
    }
    return selectedVentas.reduce((sum, ventaId) => {
      const venta = ventas.find((v) => v.id === ventaId);
      return sum + (venta ? venta.monto_pendiente : 0);
    }, 0);
  };

  const handleConfirmarPago = async () => {
    setError('');
    try {
      setLoading(true);
      let monto = modoAbono ? parseFloat(montoAbono) : calcularMontoTotal();

      if (modoAbono && (isNaN(monto) || monto <= 0)) {
        setError('El monto del abono debe ser un número mayor a 0.');
        return;
      }

      if (!modoAbono && selectedVentas.length === 0 && !pagarTodo) {
        setError('Selecciona al menos una venta o activa "Pagar todo".');
        return;
      }

      const result = await registrarAbono(cliente.id, monto, notas);
      onPagarDeuda(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al procesar el pago.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerEstadoCuenta = () => {
    navigate(`/deudas/${cliente.id}`);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40]"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-0 z-[50] transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        } bg-gray-50 flex flex-col h-full`}
      >
        {/* Header moderno con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold truncate">
                Gestionar Deuda
              </h2>
              <p className="text-xs text-blue-100 mt-1 truncate">
                {cliente?.nombre}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-3 p-2 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {/* Error alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex justify-between items-start">
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white p-3 rounded-lg shadow-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ventas.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Sin deudas pendientes
              </h3>
              <p className="text-xs text-gray-500">
                Este cliente está al día con sus pagos
              </p>
            </div>
          ) : (
            <>
              {/* Modo abono */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <label className="flex items-center gap-3 p-3 cursor-pointer bg-gradient-to-r from-amber-50 to-orange-50">
                  <input
                    type="checkbox"
                    checked={modoAbono}
                    onChange={() => {
                      setModoAbono(!modoAbono);
                      setSelectedVentas([]);
                      setPagarTodo(false);
                    }}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    modoAbono ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                  }`}>
                    {modoAbono && <CheckSquare className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Abono personalizado
                    </span>
                  </div>
                </label>
                
                {modoAbono && (
                  <div className="p-3 space-y-3 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Monto del abono
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={montoAbono}
                          onChange={(e) => setMontoAbono(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="absolute left-3 top-2.5 text-sm text-gray-500">S/</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notas (opcional)
                      </label>
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Agregar comentarios..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        rows="2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opción pagar todo */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-xl shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pagarTodo}
                    onChange={handlePagarTodo}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    pagarTodo ? 'bg-white border-white' : 'border-white/60'
                  }`}>
                    {pagarTodo && <CheckSquare className="h-3 w-3 text-emerald-600" />}
                  </div>
                  <div className="flex-1 text-white">
                    <p className="text-sm font-medium">Liquidar todo</p>
                    <p className="text-xs text-emerald-100">
                      S/{calcularMontoTotal().toFixed(2)}
                    </p>
                  </div>
                </label>
              </div>

              {/* Lista de ventas */}
              <div className="space-y-2">
                {ventas.map((venta) => (
                  <div
                    key={venta.id}
                    className={`bg-white p-3 rounded-lg shadow-sm border transition-all ${
                      selectedVentas.includes(venta.id) || pagarTodo
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVentas.includes(venta.id) || pagarTodo}
                        onChange={() => handleSelectVenta(venta.id)}
                        disabled={pagarTodo}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedVentas.includes(venta.id) || pagarTodo
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {(selectedVentas.includes(venta.id) || pagarTodo) && (
                          <CheckSquare className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-800 truncate">
                              #{venta.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">
                              {formatDate(venta.fecha_creacion)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-medium">S/{venta.total.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pagado</p>
                            <p className="font-medium text-green-600">S/{venta.monto_pagado.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pendiente</p>
                            <p className="font-medium text-red-600">S/{venta.monto_pendiente.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer con botones */}
        {(ventas.length > 0 || modoAbono) && (
          <div className="bg-white border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Total a pagar
              </span>
              <span className="text-xl font-bold text-gray-900">
                S/{(modoAbono ? parseFloat(montoAbono) || 0 : calcularMontoTotal()).toFixed(2)}
              </span>
            </div>
            
            {/* Botones lado a lado */}
            <div className="flex gap-2">
              {/* Botón Ver Estado de Cuenta */}
              <button
                onClick={handleVerEstadoCuenta}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95"
              >
                <FileText size={16} />
                <span>Ver Estado</span>
              </button>
              
              {/* Botón Confirmar Pago */}
              <button
                onClick={handleConfirmarPago}
                disabled={loading || (!modoAbono && selectedVentas.length === 0 && !pagarTodo)}
                className={`flex-[2] py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-semibold ${
                  loading || (!modoAbono && selectedVentas.length === 0 && !pagarTodo)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl active:scale-95'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <DollarSign size={18} />
                )}
                <span>
                  {modoAbono ? 'Registrar Abono' : 'Confirmar Pago'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PagarDeudaDrawer;