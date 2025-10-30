import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, X, CheckSquare, ChevronDown, ChevronUp, CreditCard, 
  Receipt, Calendar, FileText, ShoppingBag, Zap, ListOrdered, 
  Package, RefreshCw, Wallet, History, AlertCircle, Clock, Eye 
} from 'lucide-react';
import { useVentas } from '../../context/VentasContext';

const PagarDeudaDrawer = ({ isOpen, onClose, cliente, onPagarDeuda }) => {
  const { obtenerVentasPorCliente, registrarAbono, pagarVenta } = useVentas();
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [pagarTodo, setPagarTodo] = useState(false);
  const [modoAbono, setModoAbono] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedVentas, setExpandedVentas] = useState({});

  // Colores de la nueva paleta
  const colors = {
    primary: '#45923a',    // Verde
    secondary: '#ffa40c',  // Naranja
    primaryLight: '#e8f5e9',
    secondaryLight: '#fff3e0',
    textDark: '#2d3748',
    textLight: '#f8f9fa'
  };

  // Calcular total de deuda
  const totalDeuda = ventas.reduce((sum, venta) => sum + (venta.monto_pendiente || 0), 0);

  useEffect(() => {
    if (isOpen && cliente) {
      const fetchVentas = async () => {
        try {
          setLoading(true);
          const ventasCliente = await obtenerVentasPorCliente(cliente.id);
          const ventasPendientes = ventasCliente.filter(v => v.monto_pendiente > 0);
          setVentas(ventasPendientes);
          
          // Inicializar estado de acordeones
          const initialExpanded = {};
          ventasPendientes.forEach(venta => {
            initialExpanded[venta.id] = false;
          });
          setExpandedVentas(initialExpanded);
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

  const toggleExpandVenta = (ventaId) => {
    setExpandedVentas(prev => ({
      ...prev,
      [ventaId]: !prev[ventaId]
    }));
  };

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
      
      if (modoAbono) {
        const monto = parseFloat(montoAbono);
        if (isNaN(monto)) {
          setError('El monto del abono debe ser un número válido.');
          return;
        }
        
        const result = await registrarAbono(cliente.id, monto, notas);
        onPagarDeuda(result);
      } else {
        if (selectedVentas.length === 0 && !pagarTodo) {
          setError('Selecciona al menos una venta o activa "Pagar todo".');
          return;
        }
        
        const ventasAPagar = pagarTodo ? ventas : ventas.filter(v => selectedVentas.includes(v.id));
        const results = [];
        
        for (const venta of ventasAPagar) {
          const result = await pagarVenta(venta.id);
          results.push(result);
        }
        
        onPagarDeuda(results);
      }
      
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
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date: dateStr, time: timeStr };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer principal */}
      <div
        className={`fixed inset-0 z-[50] transform transition-all duration-500 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        } bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col h-full`}
      >
        {/* Header */}
        <div 
          className="px-3 py-4 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, #3a7f30 100%)`,
            boxShadow: '0 8px 32px rgba(69, 146, 58, 0.3)'
          }}
        >
          <div className="relative flex items-center justify-between">
            <div className="flex-1 pr-3">
              <h2 className="text-lg font-bold text-white mb-1 tracking-tight">
                Gestión de Pagos
              </h2>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm text-white/90 truncate font-medium">
                  {cliente?.nombre}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-white font-semibold border border-white/30 w-fit">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    Deuda: {formatCurrency(totalDeuda)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-all duration-200 backdrop-blur-sm border border-white/30"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" style={{ scrollBehavior: 'smooth' }}>
          {/* Error alert */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex justify-between items-start shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-200/50 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm animate-pulse border border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded-lg w-2/3"></div>
                      <div className="h-2.5 bg-gray-200 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ventas.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm text-center border border-gray-200/50">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                Sin deudas pendientes
              </h3>
              <p className="text-sm text-gray-500">
                Este cliente está al día con sus pagos
              </p>
            </div>
          ) : (
            <>
              {/* Modo abono */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
                <label 
                  className="flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 hover:bg-orange-50/50" 
                  style={{ backgroundColor: modoAbono ? colors.secondaryLight : 'transparent' }}
                >
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
                  <div className={`relative w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                    modoAbono ? 'border-transparent shadow-lg' : 'border-gray-300 hover:border-gray-400'
                  }`} 
                  style={{ 
                    backgroundColor: modoAbono ? colors.secondary : 'white',
                    transform: modoAbono ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {modoAbono && <CheckSquare className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.secondary}20` }}>
                      <DollarSign className="h-4 w-4" style={{ color: colors.secondary }} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                        Realizar un abono
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Pago parcial flexible</p>
                    </div>
                  </div>
                </label>
                
                {modoAbono && (
                  <div className="p-3 space-y-3 border-t border-gray-100 bg-gradient-to-br from-orange-50/30 to-transparent">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5" />
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
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white/80 backdrop-blur-sm transition-all"
                        />
                        <span className="absolute left-3 top-2.5 text-sm font-semibold text-gray-600">S/</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Opción pagar todo */}
              <div 
                className="p-3 rounded-xl shadow-lg relative overflow-hidden" 
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary} 0%, #3a7f30 100%)`,
                  boxShadow: '0 8px 32px rgba(69, 146, 58, 0.25)'
                }}
              >
                <label className="flex items-center gap-3 cursor-pointer relative z-10">
                  <input
                    type="checkbox"
                    checked={pagarTodo}
                    onChange={handlePagarTodo}
                    disabled={modoAbono}
                    className="hidden"
                  />
                  <div className={`relative w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                    pagarTodo ? 'border-white/80' : 'border-white/60 hover:border-white/80'
                  } ${modoAbono ? 'opacity-50' : ''}`} 
                  style={{ 
                    backgroundColor: pagarTodo ? 'white' : 'transparent',
                    transform: pagarTodo ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {pagarTodo && <CheckSquare className="h-3 w-3" style={{ color: colors.primary }} />}
                  </div>
                  <div className="flex-1 text-white">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold">Pagar todas las deudas</p>
                    </div>
                    <p className="text-sm text-white/90 font-semibold">
                      {formatCurrency(calcularMontoTotal())}
                    </p>
                  </div>
                </label>
              </div>

              {/* Lista de ventas */}
              <div className="space-y-2.5">
                {ventas.map((venta, index) => (
                  <div
                    key={venta.id}
                    className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                      selectedVentas.includes(venta.id) || pagarTodo
                        ? 'border-blue-300 bg-blue-50/40 shadow-blue-100/50'
                        : 'border-gray-200/50 hover:border-gray-300/70'
                    } ${modoAbono ? 'opacity-60' : ''}`}
                  >
                    {/* Encabezado de la venta */}
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <label className="flex items-start gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedVentas.includes(venta.id) || pagarTodo}
                            onChange={() => handleSelectVenta(venta.id)}
                            disabled={modoAbono || pagarTodo}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 mt-0.5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            selectedVentas.includes(venta.id) || pagarTodo
                              ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-200/50'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${modoAbono ? 'opacity-50' : ''}`}
                          style={{ transform: (selectedVentas.includes(venta.id) || pagarTodo) ? 'scale(1.1)' : 'scale(1)' }}>
                            {(selectedVentas.includes(venta.id) || pagarTodo) && (
                              <CheckSquare className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 rounded-lg bg-blue-100">
                                    <Calendar className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {formatDateTime(venta.fecha_creacion).date}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 ml-0.5">
                                  <div className="p-1 rounded-lg bg-purple-100">
                                    <Clock className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">
                                    {formatDateTime(venta.fecha_creacion).time}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="inline-flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded-lg">
                                  <p className="text-xs font-bold text-red-700">
                                    {formatCurrency(venta.monto_pendiente)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold" style={{ color: colors.textDark }}>
                                  Compra #{index + 1}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">
                                Total: {formatCurrency(venta.total)}
                              </p>
                            </div>
                          </div>
                        </label>
                        {/* Botón Ver Nota de Venta */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ventas/${venta.id}`);
                          }}
                          className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-50 hover:from-green-200 hover:to-green-100 border border-green-200 transition-all duration-200 hover:shadow-md active:scale-95 group"
                          title="Ver nota de venta"
                        >
                          <Eye className="h-4 w-4 text-green-700 group-hover:text-green-800" />
                        </button>
                      </div>
                    </div>

                    {/* Botón para expandir productos */}
                    <button
                      onClick={() => toggleExpandVenta(venta.id)}
                      className="w-full px-3 py-2.5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50/80 transition-all duration-200 rounded-b-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-purple-100">
                          <ListOrdered className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <span className="font-medium text-xs">Ver productos comprados</span>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedVentas[venta.id] ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>

                    {/* Contenido expandible - Productos */}
                    {expandedVentas[venta.id] && (
                      <div className="px-3 py-2.5 border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-transparent">
                        <div className="space-y-2">
                          {venta.productos.map((producto, pIndex) => (
                            <div key={pIndex} className="flex justify-between items-center p-2.5 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 mb-0.5 text-sm">{producto.nombre}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <Package className="h-3 w-3" />
                                  {producto.cantidad} × {formatCurrency(producto.precio_unitario)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm" style={{ color: colors.primary }}>
                                  {formatCurrency(producto.subtotal)}
                                </p>
                                {producto.retornable && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <RefreshCw className="h-3 w-3" style={{ color: colors.secondary }} />
                                    <p className="text-xs font-medium" style={{ color: colors.secondary }}>
                                      {producto.cantidad_retornable} retornables
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {(ventas.length > 0 || modoAbono) && (
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 p-3 space-y-3 shadow-lg">
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Total a pagar
              </span>
              <span className="text-lg font-bold" style={{ color: colors.primary }}>
                {formatCurrency(modoAbono ? parseFloat(montoAbono) || 0 : calcularMontoTotal())}
              </span>
            </div>
            
            {/* Botones */}
            <div className="flex gap-2.5">
              {/* Botón Ver Estado de Cuenta */}
              <button
                onClick={handleVerEstadoCuenta}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-700 active:scale-95 bg-white/80 backdrop-blur-sm"
              >
                <History className="h-4 w-4" />
                <span>Historial</span>
              </button>
              
              {/* Botón Confirmar Pago */}
              <button
                onClick={handleConfirmarPago}
                disabled={loading || 
                  (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : 
                   !pagarTodo && selectedVentas.length === 0)}
                className={`flex-[2] py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm font-bold shadow-lg ${
                  loading || 
                  (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : 
                   !pagarTodo && selectedVentas.length === 0)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                    : 'text-white hover:shadow-xl active:scale-95 transform hover:scale-105'
                }`}
                style={{ 
                  background: loading || (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : !pagarTodo && selectedVentas.length === 0) 
                    ? undefined 
                    : `linear-gradient(135deg, ${colors.secondary} 0%, #e69500 100%)`
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <DollarSign size={16} />
                )}
                <span>
                  {modoAbono ? 'Registrar Abono' : 'Realizar Pago'}
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