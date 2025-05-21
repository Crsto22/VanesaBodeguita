import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Delete, AlertCircle, Check } from 'lucide-react';

const EditarPrecioDrawer = ({ isOpen, onClose, producto, onConfirm }) => {
  const [precio, setPrecio] = useState('0.00');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Efecto para controlar el montaje/desmontaje con animación
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      if (producto) {
        setPrecio(producto.precio_unitario.toFixed(2));
      }
    }
  }, [isOpen, producto]);

  const handleClose = () => {
    setMounted(false);
    setTimeout(() => onClose(), 300); // Espera a que termine la animación
  };

  const handleNumberClick = (number) => {
    setError('');
    setPrecio(prev => {
      if (prev === '0.00') prev = '';
      const newValue = prev + number;
      
      // Manejar decimales
      if (newValue.includes('.')) {
        const [entero, decimal] = newValue.split('.');
        if (decimal.length > 2) return `${entero}.${decimal.slice(0, 2)}`;
      }
      return newValue;
    });
  };

  const handleDecimalClick = () => {
    if (!precio.includes('.')) {
      setPrecio(prev => prev === '' ? '0.' : prev + '.');
    }
  };

  const handleDelete = () => {
    setPrecio(prev => {
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  };

  const handleConfirm = () => {
    const precioNum = parseFloat(precio || '0');
    if (isNaN(precioNum) || precioNum <= 0) {
      setError('Ingrese un precio válido');
      return;
    }
    onConfirm(precioNum);
    handleClose();
  };

  if (!isOpen && !mounted) return null;

  return (
    <>
      {/* Backdrop animado */}
      <div
        className="fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ease-in-out"
        style={{ opacity: mounted ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Drawer animado */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl shadow-xl transition-transform duration-300 ease-in-out"
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          transform: mounted ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="p-3 flex flex-col h-full">
          {/* Indicador de arrastre */}
          <div className="mx-auto w-10 h-1 rounded-full bg-gray-300 mb-2"></div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-6"></div>
            <h2 className="text-lg font-bold text-gray-800">Editar Precio</h2>
            <button
              onClick={handleClose}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Info Producto */}
          <div className="mb-4 bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Producto:</p>
            <p className="text-base font-semibold text-gray-800">
              {producto?.nombre || 'No seleccionado'}
            </p>
          </div>

          {/* Display Precio */}
          <div className="mb-4 bg-gradient-to-r from-green-50 to-green-50 p-4 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Nuevo Precio:</p>
            <div className="flex items-center justify-center bg-white py-2 px-3 rounded-lg shadow-inner">
              <span className="text-gray-700 font-medium mr-1">S/</span>
              <input
                type="text"
                value={precio}
                readOnly
                placeholder='0.00'
                className="text-3xl font-bold text-center bg-transparent w-full outline-none text-[#45923a]"
              />
            </div>
          </div>

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xl font-medium transition-all active:scale-95 shadow-sm hover:shadow text-gray-800"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDecimalClick}
              className="py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xl font-medium transition-all active:scale-95 shadow-sm hover:shadow text-gray-800"
            >
              .
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xl font-medium transition-all active:scale-95 shadow-sm hover:shadow text-gray-800"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="py-3 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-sm hover:shadow"
            >
              <Delete className="text-red-600" size={20} />
            </button>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center">
              <AlertCircle className="mr-1 flex-shrink-0" size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClose}
              className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all active:scale-98 border border-gray-200 text-gray-700 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="py-3 bg-[#45923a]  text-white rounded-lg font-medium transition-all active:scale-98 flex items-center justify-center text-sm"
            >
              <Check size={16} className="mr-1" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditarPrecioDrawer;