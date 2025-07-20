import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle, Plus, Minus, DollarSign, TrendingUp, Calculator, Scale, Hash, Pencil } from 'lucide-react';
import PrecioVentaDrawer from './PrecioVentaDrawer';
import PrecioAlternativoDrawer from './PrecioAlternativoDrawer';

const ProductoDetallesDrawer = ({ isOpen, onClose, producto, onAgregarProducto }) => {
  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioAlternativo, setPrecioAlternativo] = useState('');
  const [motivoPrecioAlternativo, setMotivoPrecioAlternativo] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [precioVentaDrawerOpen, setPrecioVentaDrawerOpen] = useState(false);
  const [precioAlternativoDrawerOpen, setPrecioAlternativoDrawerOpen] = useState(false);

  const isKilogramo = producto?.tipo_unidad === 'kilogramo';
  // Determinar si estamos en modo edición (producto tiene cantidad definida)
  const isEditing = !!producto?.cantidad;

  // Inicializar estados cuando cambia el producto
  useEffect(() => {
    if (producto) {
      // Si estamos editando, usar los valores del producto
      if (isEditing) {
        setCantidad(isKilogramo ? producto.cantidad.toFixed(2) : producto.cantidad.toString());
        setCostoTotal((producto.cantidad * producto.precioCompra).toFixed(2));
        setPrecioCompra(producto.precioCompra.toFixed(2));
        setPrecioVenta(producto.precio_venta.toFixed(2));
        setPrecioAlternativo(
          producto.has_precio_alternativo && producto.precio_alternativo
            ? Number(producto.precio_alternativo).toFixed(2)
            : ''
        );
        setMotivoPrecioAlternativo(
          producto.has_precio_alternativo && producto.motivo_precio_alternativo
            ? producto.motivo_precio_alternativo
            : ''
        );
      } else {
        // Modo adición: valores iniciales
        setCantidad(isKilogramo ? '1.00' : '1');
        setCostoTotal('');
        setPrecioCompra('0.00');
        setPrecioVenta(producto.precio?.toFixed(2) || '0.00');
        setPrecioAlternativo(
          producto.has_precio_alternativo && producto.precio_alternativo
            ? Number(producto.precio_alternativo).toFixed(2)
            : ''
        );
        setMotivoPrecioAlternativo(
          producto.has_precio_alternativo && producto.motivo_precio_alternativo
            ? producto.motivo_precio_alternativo
            : ''
        );
      }
    }
  }, [producto, isKilogramo, isEditing]);

  // Calcular precio de compra automáticamente cuando cambian cantidad o costo total
  useEffect(() => {
    if (Number(cantidad) > 0 && costoTotal && Number(costoTotal) > 0) {
      const precio = (Number(costoTotal) / Number(cantidad)).toFixed(2);
      setPrecioCompra(precio);
    } else {
      setPrecioCompra('0.00');
    }
  }, [cantidad, costoTotal]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
  };

  const handleCantidadChange = (e) => {
    const value = e.target.value;
    if (value === '' || Number(value) > 0) {
      setCantidad(isKilogramo ? value : Math.floor(Number(value)).toString());
    }
  };

  const incrementarCantidad = (increment = 1) => {
    setCantidad((prev) => {
      const newValue = Number(prev) + increment;
      return isKilogramo ? newValue.toFixed(2) : Math.floor(newValue).toString();
    });
  };

  const decrementarCantidad = () => {
    setCantidad((prev) => {
      const newValue = Number(prev) - 1;
      if (newValue <= 0) return isKilogramo ? '0.01' : '1';
      return isKilogramo ? newValue.toFixed(2) : Math.floor(newValue).toString();
    });
  };

  const handleCostoTotalChange = (e) => {
    const value = e.target.value;
    if (value === '' || Number(value) >= 0) {
      setCostoTotal(value);
    }
  };

  const handlePrecioAlternativoChange = (e) => {
    const value = e.target.value;
    if (value === '' || Number(value) >= 0) {
      setPrecioAlternativo(value);
    }
  };

  const handleMotivoPrecioAlternativoChange = (e) => {
    setMotivoPrecioAlternativo(e.target.value);
  };

  const handleAgregar = () => {
    if (!cantidad || Number(cantidad) <= 0) {
      showToast(`Los ${isKilogramo ? 'kilogramos' : 'cantidad'} deben ser mayores a 0`, 'error');
      return;
    }
    if (!costoTotal || Number(costoTotal) <= 0) {
      showToast('El costo total debe ser mayor a 0', 'error');
      return;
    }
    if (!precioCompra || Number(precioCompra) <= 0) {
      showToast(`El precio de ${isKilogramo ? 'kilo' : 'compra'} debe ser mayor a 0`, 'error');
      return;
    }
    if (!precioVenta || Number(precioVenta) <= 0) {
      showToast(`El precio de ${isKilogramo ? 'kilo de venta' : 'venta'} debe ser mayor a 0`, 'error');
      return;
    }
    onAgregarProducto({
      ...producto,
      cantidad: Number(cantidad),
      precioCompra: Number(precioCompra),
      precio_venta: Number(precioVenta),
      precio_alternativo: precioAlternativo ? Number(precioAlternativo) : null,
      motivo_precio_alternativo: motivoPrecioAlternativo || null,
      has_precio_alternativo: !!precioAlternativo,
      subtotal: (Number(cantidad) * Number(precioCompra)).toFixed(2), // Añadir subtotal
    });
    showToast(`Producto ${producto.nombre} ${isEditing ? 'actualizado' : 'añadido'}`, 'success');
    onClose();
  };

  // Calcular ganancias
  const gananciaPorProducto = (Number(precioVenta) - Number(precioCompra)).toFixed(2);
  const gananciaTotal = (Number(gananciaPorProducto) * Number(cantidad)).toFixed(2);
  const isGananciaPositiva = Number(gananciaPorProducto) >= 0;
  const isGananciaTotalPositiva = Number(gananciaTotal) >= 0;

  if (!producto) return null;

  return (
    <>
      {toast.visible && (
        <div className="fixed top-0 left-0 right-0 w-full z-[100]">
          <div
            className={`w-full shadow-xl ${
              toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-pink-600'
            }`}
            role="alert"
          >
            <div className="flex items-center justify-between p-3 px-4">
              <div className="flex items-center">
                <p className="text-xs text-white font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
                className="text-white hover:text-gray-200 focus:outline-none p-1 rounded-full hover:bg-white/20 transition-all"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-0 bg-gradient-to-br from-slate-50 to-gray-100 z-50 transform transition-all duration-500 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200/50 bg-white/90 backdrop-blur-md">
            <div>
              <h2 className="text-base font-bold text-gray-900">Detalles del Producto</h2>
              <p className="text-xs text-gray-500 mt-0.5">{isEditing ? 'Editar producto' : 'Configura la compra'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cerrar drawer"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200/50">
              {/* Product Info */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-base font-semibold text-gray-900">{producto.nombre}</p>
                  {producto.codigo_barras && (
                    <p className="text-xs text-gray-500">Código: {producto.codigo_barras}</p>
                  )}
                  <div className="bg-gradient-to-r from-[#45923a] to-[#3a7d30] bg-clip-text text-transparent">
                    <p className="text-sm font-bold">
                      S/ {producto.precio?.toFixed(2) || '0.00'}/{isKilogramo ? 'kg' : 'unidad'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cantidad/Kilogramos con controles modernos */}
                <div>
                  <label className="flex items-center text-xs font-medium text-gray-700 mb-3">
                    {isKilogramo ? (
                      <>
                        <Scale className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-bold">
                          Kilogramos
                        </span>
                      </>
                    ) : (
                      <>
                        <Hash className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-bold">
                          Cantidad
                        </span>
                      </>
                    )}
                  </label>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={decrementarCantidad}
                      disabled={Number(cantidad) <= (isKilogramo ? 0.01 : 1)}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      aria-label={`Decrementar ${isKilogramo ? 'kilogramos' : 'cantidad'}`}
                    >
                      <Minus className="w-5 h-5 text-white" />
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        min={isKilogramo ? '0.01' : '1'}
                        step={isKilogramo ? '0.01' : '1'}
                        value={cantidad}
                        onChange={handleCantidadChange}
                        className={`w-20 h-12 text-center text-lg font-bold rounded-2xl border-3 ${
                          isKilogramo
                            ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 focus:border-blue-500 focus:ring-blue-500'
                            : 'border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 focus:border-purple-500 focus:ring-purple-500'
                        } focus:outline-none focus:ring-2 transition-all shadow-lg hover:shadow-xl`}
                        aria-label={isKilogramo ? 'Kilogramos a comprar' : 'Cantidad a comprar'}
                      />
                      <div
                        className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
                          isKilogramo ? 'text-blue-600' : 'text-purple-600'
                        }`}
                      >
                        {isKilogramo ? 'kg' : 'unid'}
                      </div>
                    </div>
                    <button
                      onClick={() => incrementarCantidad(isKilogramo ? 0.1 : 1)}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#45923a] to-[#3a7d30] hover:from-[#3a7d30] hover:to-[#2d6025] flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      aria-label={`Incrementar ${isKilogramo ? 'kilogramos' : 'cantidad'}`}
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {isKilogramo && (
                    <div className="flex justify-center space-x-2 mt-6">
                      <button
                        onClick={() => incrementarCantidad(0.5)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        +0.5kg
                      </button>
                      <button
                        onClick={() => incrementarCantidad(1)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        +1kg
                      </button>
                      <button
                        onClick={() => incrementarCantidad(2)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        +2kg
                      </button>
                    </div>
                  )}
                  {!isKilogramo && (
                    <div className="flex justify-center space-x-2 mt-6">
                      <button
                        onClick={() => incrementarCantidad(5)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => incrementarCantidad(10)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => incrementarCantidad(20)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        +20
                      </button>
                    </div>
                  )}
                </div>

                {/* Costo Total y Precio de Compra en fila */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Costo Total */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Costo Total</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 text-sm">S/</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={costoTotal}
                        onChange={handleCostoTotalChange}
                        className="block w-full text-sm rounded-lg pl-7 pr-3 py-2.5 border-2 border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent transition-all shadow-lg hover:shadow-xl"
                        placeholder="0.00"
                        aria-label="Costo total de la compra"
                      />
                    </div>
                  </div>

                  {/* Precio de Compra (Display) */}
                  <div>
                    <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent font-bold">
                        Precio de {isKilogramo ? 'Kilo' : 'Compra'}
                      </span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 text-sm">S/</span>
                      </div>
                      <div className="block w-full text-sm rounded-lg pl-7 pr-3 py-2.5 border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100 shadow-lg hover:shadow-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:-translate-y-0.5">
                        <span className="text-green-800 font-extrabold text-lg tracking-wide">
                          {precioCompra}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precio de Venta */}
                <div>
                  <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-bold">
                      Precio de {isKilogramo ? 'Kilo de Venta' : 'Venta'}
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 text-sm">S/</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={precioVenta}
                      readOnly
                      className="block w-full text-sm rounded-lg pl-7 pr-10 py-2.5 border-2 border-gray-200 bg-gray-100/80 focus:outline-none transition-all shadow-lg"
                      aria-label={`Precio de ${isKilogramo ? 'kilo de venta' : 'venta'}`}
                    />
                    <button
                      onClick={() => setPrecioVentaDrawerOpen(true)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label="Editar precio de venta"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Precio Alternativo y Motivo en fila */}
                {producto.has_precio_alternativo && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Precio Alternativo */}
                    <div>
                      <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                        <DollarSign className="w-4 h-4 mr-1 text-orange-600" />
                        <span className="bg-gradient-to-r from-[#ffa40c] to-[#e69500] bg-clip-text text-transparent font-bold">
                          Precio Alternativo
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 text-sm">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={precioAlternativo}
                          readOnly
                          className="block w-full text-sm rounded-lg pl-7 pr-8 py-2.5 border-2 border-gray-200 bg-gray-100/80 focus:outline-none transition-all shadow-lg"
                          aria-label={`Precio alternativo${isKilogramo ? ' por kilo' : ''}`}
                        />
                        <button
                          onClick={() => setPrecioAlternativoDrawerOpen(true)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                          aria-label="Editar precio alternativo"
                        >
                          <Pencil className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Motivo Precio Alternativo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                      <input
                        type="text"
                        value={motivoPrecioAlternativo}
                        onChange={handleMotivoPrecioAlternativoChange}
                        className="block w-full text-sm rounded-lg px-3 py-2.5 border-2 border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ffa40c] focus:border-transparent transition-all shadow-lg hover:shadow-xl"
                        placeholder="Motivo..."
                        aria-label="Motivo del precio alternativo"
                      />
                    </div>
                  </div>
                )}

                {/* Ganancia */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 shadow-inner">
                  <div className="flex items-center mb-2">
                    <Calculator className="w-4 h-4 mr-2 text-teal-600" />
                    <span className="text-xs font-bold text-teal-700">Estimación de Ganancia</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Por {isKilogramo ? 'Kilo' : 'Unidad'}:</span>
                    <span
                      className={`font-semibold ${
                        isGananciaPositiva ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      S/ {gananciaPorProducto}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">Total:</span>
                    <span
                      className={`font-semibold ${
                        isGananciaTotalPositiva ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      S/ {gananciaTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200/50 bg-white/90 backdrop-blur-md">
            <button
              onClick={handleAgregar}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#45923a] to-[#3a7d30] hover:from-[#3a7d30] hover:to-[#2d6025] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              aria-label={isEditing ? 'Actualizar producto' : 'Agregar producto a la compra'}
            >
              <CheckCircle className="inline w-4 h-4 mr-2" />
              {isEditing ? 'Actualizar Producto' : 'Agregar Producto'}
            </button>
          </div>
        </div>
      </div>

      {/* Precio Venta Drawer */}
      <PrecioVentaDrawer
        isOpen={precioVentaDrawerOpen}
        onClose={() => setPrecioVentaDrawerOpen(false)}
        precioCompra={Number(precioCompra)}
        cantidad={Number(cantidad)}
        onConfirmarPrecio={(nuevoPrecio) => {
          setPrecioVenta(nuevoPrecio.toFixed(2));
          setPrecioVentaDrawerOpen(false);
        }}
        isKilogramo={isKilogramo}
        precioVentaInicial={Number(precioVenta)}
      />

      {/* Precio Alternativo Drawer */}
      <PrecioAlternativoDrawer
        isOpen={precioAlternativoDrawerOpen}
        onClose={() => setPrecioAlternativoDrawerOpen(false)}
        precioCompra={Number(precioCompra)}
        cantidad={Number(cantidad)}
        onConfirmarPrecio={(nuevoPrecio) => {
          setPrecioAlternativo(nuevoPrecio.toFixed(2));
          setPrecioAlternativoDrawerOpen(false);
        }}
        isKilogramo={isKilogramo}
        precioAlternativoInicial={Number(precioAlternativo) || 0}
      />
    </>
  );
};

export default ProductoDetallesDrawer;