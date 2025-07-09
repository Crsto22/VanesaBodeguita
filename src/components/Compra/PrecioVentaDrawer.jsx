// src/components/Compra/PrecioVentaDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, Calculator, CheckCircle, Delete, AlertCircle } from 'lucide-react';

const PrecioVentaDrawer = ({ isOpen, onClose, precioCompra, cantidad, onConfirmarPrecio, isKilogramo, precioVentaInicial }) => {
  const [precioVenta, setPrecioVenta] = useState('0.00');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [error, setError] = useState('');

  // Initialize precioVenta
  useEffect(() => {
    if (isOpen) {
      setPrecioVenta(precioVentaInicial?.toFixed(2) || (precioCompra * 1.2).toFixed(2) || '0.00');
    }
  }, [isOpen, precioCompra, precioVentaInicial]);

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

  // Handle numeric keypad input
  const handleNumberClick = (number) => {
    setError('');
    setPrecioVenta((prev) => {
      if (prev === '0.00') prev = '';
      const newValue = prev + number;

      // Handle decimals
      if (newValue.includes('.')) {
        const [entero, decimal] = newValue.split('.');
        if (decimal && decimal.length > 2) return `${entero}.${decimal.slice(0, 2)}`;
      }
      return newValue;
    });
  };

  const handleDecimalClick = () => {
    if (!precioVenta.includes('.')) {
      setPrecioVenta((prev) => (prev === '' ? '0.' : prev + '.'));
    }
  };

  const handleDelete = () => {
    setPrecioVenta((prev) => {
      if (prev.length <= 1) return '0.00';
      return prev.slice(0, -1) || '0.00';
    });
  };

  const handleConfirmar = () => {
    const precio = parseFloat(precioVenta || '0');
    if (isNaN(precio) || precio <= 0) {
      showToast(`El precio de ${isKilogramo ? 'kilo de venta' : 'venta'} debe ser mayor a 0`, 'error');
      setError(`El precio de ${isKilogramo ? 'kilo de venta' : 'venta'} debe ser mayor a 0`);
      return;
    }
    if (precio < precioCompra) {
      showToast(
        `El precio de ${isKilogramo ? 'kilo de venta' : 'venta'} debe ser mayor o igual al precio de compra`,
        'error'
      );
      setError(
        `El precio de ${isKilogramo ? 'kilo de venta' : 'venta'} debe ser mayor o igual al precio de compra`
      );
      return;
    }
    onConfirmarPrecio(precio);
    showToast('Precio de venta confirmado', 'success');
    onClose();
  };

  // Calculate profits
  const gananciaPorUnidad = (Number(precioVenta || 0) - precioCompra).toFixed(2);
  const gananciaTotal = (Number(gananciaPorUnidad) * cantidad).toFixed(2);
  const isGananciaPositiva = Number(gananciaPorUnidad) >= 0;
  const isGananciaTotalPositiva = Number(gananciaTotal) >= 0;

  if (!isOpen) return null;

  return (
    <>
      {toast.visible && (
        <div className="fixed top-0 left-0 right-0 w-full z-[100] rounded-b-xl overflow-hidden">
          <div
            className={`w-full shadow-xl ${
              toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-pink-600'
            }`}
            role="alert"
          >
            <div className="flex items-center justify-between p-2 px-3">
              <p className="text-xs text-white font-medium">{toast.message}</p>
              <button
                onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
                className="text-white hover:text-gray-200 focus:outline-none p-1 rounded-full hover:bg-white/20 transition-all"
                aria-label="Cerrar notificación"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop - Animación simple */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Animación optimizada para móviles */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-3/4 bg-gradient-to-br from-slate-50 to-gray-100 z-50 rounded-t-3xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200/50 bg-white/90 backdrop-blur-md rounded-t-3xl">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">
                Precio de {isKilogramo ? 'Kilo de Venta' : 'Venta'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ingresa el precio usando el teclado
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cerrar drawer"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200/50">
              <div className="space-y-3">
                
                {/* Precio de Venta Display - Centrado y más prominente */}
                <div className="text-center mb-4">
                  <label className="flex items-center justify-center text-xs font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-bold">
                      Precio de {isKilogramo ? 'Kilo de Venta' : 'Venta'}
                    </span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 text-sm">S/</span>
                    </div>
                    <input
                      type="text"
                      value={precioVenta}
                      readOnly
                      placeholder="0.00"
                      className="block w-full text-lg font-bold text-center rounded-lg pl-8 pr-3 py-3 border-2 border-blue-200 bg-blue-50/80 focus:outline-none transition-all shadow-lg text-[#45923a] max-w-40 mx-auto"
                    />
                  </div>
                </div>

                {/* Información de ganancias - Compacto */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Ganancia por Unidad/Kilo */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 shadow-inner">
                    <div className="flex items-center mb-1">
                      <Calculator className="w-3 h-3 mr-1 text-teal-600" />
                      <span className="text-xs font-bold text-teal-700">
                        {isKilogramo ? 'Ganancia/Kilo' : 'Ganancia/Unidad'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span
                        className={`font-semibold ${
                          isGananciaPositiva ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        S/ {gananciaPorUnidad}
                      </span>
                    </div>
                  </div>

                  {/* Ganancia Total */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 shadow-inner">
                    <div className="flex items-center mb-1">
                      <Calculator className="w-3 h-3 mr-1 text-teal-600" />
                      <span className="text-xs font-bold text-teal-700">Ganancia Total</span>
                    </div>
                    <div className="text-xs">
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

                {/* Error Message */}
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center">
                    <AlertCircle className="mr-1 flex-shrink-0" size={14} />
                    <span className="text-xs font-medium">{error}</span>
                  </div>
                )}

                {/* Numeric Keypad - Más compacto */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num.toString())}
                      className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-lg font-medium transition-colors active:scale-95 shadow-sm hover:shadow text-gray-800"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleDecimalClick}
                    className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-lg font-medium transition-colors active:scale-95 shadow-sm hover:shadow text-gray-800"
                  >
                    .
                  </button>
                  <button
                    onClick={() => handleNumberClick('0')}
                    className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-lg font-medium transition-colors active:scale-95 shadow-sm hover:shadow text-gray-800"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDelete}
                    className="py-2.5 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors active:scale-95 shadow-sm hover:shadow"
                  >
                    <Delete className="text-red-600" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200/50 bg-white/90 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors active:scale-98 border border-gray-200 text-gray-700 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                className="py-2.5 bg-[#45923a] text-white rounded-lg font-medium transition-colors active:scale-98 flex items-center justify-center text-sm"
              >
                <CheckCircle className="inline w-4 h-4 mr-1" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrecioVentaDrawer;