import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Milk, AlertCircle, Plus, Minus } from 'lucide-react';
import { useVentas } from '../../context/VentasContext';
import { useProducts } from '../../context/ProductContext';

const DevolverBotellasDrawer = ({ isOpen, onClose, cliente, onDevolverBotellas }) => {
  const { obtenerVentasPorCliente, registrarDevolucionRetornables } = useVentas();
  const { obtenerProductoPorId } = useProducts();
  const [ventas, setVentas] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [notas, setNotas] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && cliente) {
      const fetchVentas = async () => {
        try {
          setLoading(true);
          const ventasCliente = await obtenerVentasPorCliente(cliente.id, true);
          const ventasConRetornables = ventasCliente.filter((venta) => venta.total_retornables > 0);
          setVentas(ventasConRetornables);
          const initialCantidades = {};
          ventasConRetornables.forEach((venta) => {
            initialCantidades[venta.id] = 0;
          });
          setCantidades(initialCantidades);
        } catch (err) {
          setError('Error al cargar las ventas con retornables.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchVentas();
    }
  }, [isOpen, cliente, obtenerVentasPorCliente]);

  const handleCantidadChange = (ventaId, value) => {
    const cantidad = parseInt(value, 10) || 0;
    const venta = ventas.find((v) => v.id === ventaId);
    if (cantidad < 0 || cantidad > venta.total_retornables) {
      return;
    }
    setCantidades((prev) => ({
      ...prev,
      [ventaId]: cantidad,
    }));
  };

  const adjustCantidad = (ventaId, increment) => {
    const venta = ventas.find((v) => v.id === ventaId);
    const currentValue = cantidades[ventaId] || 0;
    const newValue = increment ? currentValue + 1 : currentValue - 1;

    if (newValue < 0 || newValue > venta.total_retornables) {
      return;
    }

    setCantidades((prev) => ({
      ...prev,
      [ventaId]: newValue,
    }));
  };

  const calcularTotalBotellas = () => {
    return Object.values(cantidades).reduce((sum, cantidad) => sum + cantidad, 0);
  };

  const handleConfirmarDevolucion = async () => {
    setError('');
    try {
      setLoading(true);
      const totalBotellas = calcularTotalBotellas();
      if (totalBotellas === 0) {
        setError('Debes especificar al menos una botella para devolver.');
        return;
      }

      const devoluciones = [];
      for (const [ventaId, cantidad] of Object.entries(cantidades)) {
        if (cantidad > 0) {
          const devolucion = await registrarDevolucionRetornables(ventaId, cantidad, notas);
          devoluciones.push({ ventaId, devolucion });
        }
      }

      onDevolverBotellas(devoluciones);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar la devolución.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getProductDetails = (productoRef) => {
    const producto = obtenerProductoPorId(productoRef);
    return producto || { nombre: 'Producto Desconocido', imagen: '' };
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 w-full z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="relative p-4 pb-3 border-b border-gray-100">
          <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto mb-3"></div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Devolver Botellas
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[200px]">
                {cliente?.nombre}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-3 mt-3 p-3 bg-white border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:bg-gray-100 rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ventas.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Milk className="h-6 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Sin retornables pendientes
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Este cliente no tiene botellas retornables para devolver en este momento.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {ventas.map((venta) => (
                <div
                  key={venta.id}
                  className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Venta Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <Milk className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Venta #{venta.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(venta.fecha_creacion)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-blue-600">
                      {venta.total_retornables} botellas retornables
                    </p>
                  </div>

                  {/* Productos Retornables */}
                  <div className="space-y-2 mb-3">
                    {venta.productos
                      .filter((p) => p.retornable && p.cantidad_retornable > 0)
                      .map((producto) => {
                        const { nombre, imagen } = getProductDetails(producto.producto_ref);
                        return (
                          <div
                            key={producto.producto_ref}
                            className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg"
                          >
                            <img
                              src={imagen || 'https://via.placeholder.com/40?text=40x40'}
                              alt={nombre}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/40?text=40x40';
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {nombre}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Cantidad de Selector */}
                  <div className="bg-gray-100 rounded-xl p-2 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        Botellas a devolver
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustCantidad(venta.id, false)}
                          disabled={(cantidades[venta.id] || 0) === 0}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <div className="w-12 text-center">
                          <span className="text-sm font-semibold text-gray-800">
                            {cantidades[venta.id] || 0}
                          </span>
                        </div>
                        <button
                          onClick={() => adjustCantidad(venta.id, true)}
                          disabled={(cantidades[venta.id] || 0) >= venta.total_retornables}
                          className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                          <Plus className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Notas */}
              <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm mx-4 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Escribe comentarios sobre la devolución..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none bg-gray-50"
                  rows="3"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {ventas.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
            {/* Resumen */}
            <div className="bg-green-50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <RotateCcw className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    Total a devolver
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">
                    {calcularTotalBotellas()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {calcularTotalBotellas() === 1 ? 'botella' : 'botellas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón confirmar */}
            <button
              onClick={handleConfirmarDevolucion}
              disabled={loading || calcularTotalBotellas() === 0}
              className={`w-full py-3.5 rounded-full flex items-center justify-center gap-3 px-2 transition-all duration-200 font-semibold text-sm ${
                loading || calcularTotalBotellas() === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Confirmar Devolución</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DevolverBotellasDrawer;