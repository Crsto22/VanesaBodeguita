import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, X, CheckSquare, ChevronDown, ChevronUp, CreditCard, 
  Receipt, Calendar, FileText, ShoppingBag, Zap, ListOrdered, 
  Package, RefreshCw, Wallet, History, AlertCircle 
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
          className="px-4 py-6 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, #3a7f30 100%)`,
            boxShadow: '0 8px 32px rgba(69, 146, 58, 0.3)'
          }}
        >
          <div className="relative flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
                Gestión de Pagos
              </h2>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-white/90 truncate font-medium">
                  {cliente?.nombre}
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white font-semibold border border-white/30 w-fit">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs">
                    Deuda total: {formatCurrency(totalDeuda)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-all duration-200 backdrop-blur-sm border border-white/30"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" style={{ scrollBehavior: 'smooth' }}>
          {/* Error alert */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex justify-between items-start shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-200/50 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm animate-pulse border border-gray-200/50">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ventas.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm text-center border border-gray-200/50">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Sin deudas pendientes
              </h3>
              <p className="text-sm text-gray-500">
                Este cliente está al día con sus pagos
              </p>
            </div>
          ) : (
            <>
              {/* Modo abono */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
                <label 
                  className="flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-orange-50/50" 
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
                  <div className={`relative w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                    modoAbono ? 'border-transparent shadow-lg' : 'border-gray-300 hover:border-gray-400'
                  }`} 
                  style={{ 
                    backgroundColor: modoAbono ? colors.secondary : 'white',
                    transform: modoAbono ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {modoAbono && <CheckSquare className="h-4 w-4 text-white" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${colors.secondary}20` }}>
                      <DollarSign className="h-5 w-5" style={{ color: colors.secondary }} />
                    </div>
                    <div>
                      <span className="text-base font-semibold" style={{ color: colors.textDark }}>
                        Realizar un abono
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Pago parcial flexible</p>
                    </div>
                  </div>
                </label>
                
                {modoAbono && (
                  <div className="p-4 space-y-4 border-t border-gray-100 bg-gradient-to-br from-orange-50/30 to-transparent">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
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
                          className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white/80 backdrop-blur-sm transition-all"
                        />
                        <span className="absolute left-4 top-3.5 text-base font-semibold text-gray-600">S/</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Opción pagar todo */}
              <div 
                className="p-4 rounded-2xl shadow-lg relative overflow-hidden" 
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary} 0%, #3a7f30 100%)`,
                  boxShadow: '0 8px 32px rgba(69, 146, 58, 0.25)'
                }}
              >
                <label className="flex items-center gap-4 cursor-pointer relative z-10">
                  <input
                    type="checkbox"
                    checked={pagarTodo}
                    onChange={handlePagarTodo}
                    disabled={modoAbono}
                    className="hidden"
                  />
                  <div className={`relative w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                    pagarTodo ? 'border-white/80' : 'border-white/60 hover:border-white/80'
                  } ${modoAbono ? 'opacity-50' : ''}`} 
                  style={{ 
                    backgroundColor: pagarTodo ? 'white' : 'transparent',
                    transform: pagarTodo ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {pagarTodo && <CheckSquare className="h-4 w-4" style={{ color: colors.primary }} />}
                  </div>
                  <div className="flex-1 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-bold">Pagar todas las deudas</p>
                    </div>
                    <p className="text-sm text-white/90 font-semibold">
                      {formatCurrency(calcularMontoTotal())}
                    </p>
                  </div>
                </label>
              </div>

              {/* Lista de ventas */}
              <div className="space-y-3">
                {ventas.map((venta, index) => (
                  <div
                    key={venta.id}
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                      selectedVentas.includes(venta.id) || pagarTodo
                        ? 'border-blue-300 bg-blue-50/40 shadow-blue-100/50'
                        : 'border-gray-200/50 hover:border-gray-300/70'
                    } ${modoAbono ? 'opacity-60' : ''}`}
                  >
                    {/* Encabezado de la venta */}
                    <div className="p-4">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVentas.includes(venta.id) || pagarTodo}
                          onChange={() => handleSelectVenta(venta.id)}
                          disabled={modoAbono || pagarTodo}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 mt-1 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                          selectedVentas.includes(venta.id) || pagarTodo
                            ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-200/50'
                            : 'border-gray-300 hover:border-gray-400'
                        } ${modoAbono ? 'opacity-50' : ''}`}
                        style={{ transform: (selectedVentas.includes(venta.id) || pagarTodo) ? 'scale(1.1)' : 'scale(1)' }}>
                          {(selectedVentas.includes(venta.id) || pagarTodo) && (
                            <CheckSquare className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-blue-100">
                                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              <span className="text-sm text-gray-600 font-medium">
                                {formatDate(venta.fecha_creacion)}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="inline-flex items-center gap-1 bg-red-100 px-2 py-1 rounded-lg">

                                <p className="text-xs font-bold text-red-700">
                                  {formatCurrency(venta.monto_pendiente)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-bold" style={{ color: colors.textDark }}>
                                Compra #{index + 1}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              Total: {formatCurrency(venta.total)}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Botón para expandir productos */}
                    <button
                      onClick={() => toggleExpandVenta(venta.id)}
                      className="w-full px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50/80 transition-all duration-200 rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-purple-100">
                          <ListOrdered className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">Ver productos comprados</span>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedVentas[venta.id] ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </button>

                    {/* Contenido expandible - Productos */}
                    {expandedVentas[venta.id] && (
                      <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-transparent">
                        <div className="space-y-3">
                          {venta.productos.map((producto, pIndex) => (
                            <div key={pIndex} className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 mb-1">{producto.nombre}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                  <Package className="h-3.5 w-3.5" />
                                  {producto.cantidad} × {formatCurrency(producto.precio_unitario)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg" style={{ color: colors.primary }}>
                                  {formatCurrency(producto.subtotal)}
                                </p>
                                {producto.retornable && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <RefreshCw className="h-3.5 w-3.5" style={{ color: colors.secondary }} />
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
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <span className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Total a pagar
              </span>
              <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                {formatCurrency(modoAbono ? parseFloat(montoAbono) || 0 : calcularMontoTotal())}
              </span>
            </div>
            
            {/* Botones */}
            <div className="flex gap-3">
              {/* Botón Ver Estado de Cuenta */}
              <button
                onClick={handleVerEstadoCuenta}
                className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 text-base font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-700 active:scale-95 bg-white/80 backdrop-blur-sm"
              >
                <History className="h-5 w-5" />
                <span>Historial</span>
              </button>
              
              {/* Botón Confirmar Pago */}
              <button
                onClick={handleConfirmarPago}
                disabled={loading || 
                  (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : 
                   !pagarTodo && selectedVentas.length === 0)}
                className={`flex-[2] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 text-base font-bold shadow-xl ${
                  loading || 
                  (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : 
                   !pagarTodo && selectedVentas.length === 0)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                    : 'text-white hover:shadow-2xl active:scale-95 transform hover:scale-105'
                }`}
                style={{ 
                  background: loading || (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : !pagarTodo && selectedVentas.length === 0) 
                    ? undefined 
                    : `linear-gradient(135deg, ${colors.secondary} 0%, #e69500 100%)`
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <DollarSign size={20} />
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