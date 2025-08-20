import React, { useState } from 'react';
import { X, PlusCircle, DollarSign, Package } from 'lucide-react';

const QuickAddProductModal = ({ isOpen, onClose, onQuickAdd }) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const precioNumerico = parseFloat(precio);
    if (!nombre.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      setError('Por favor, introduce un precio válido y mayor a cero.');
      return;
    }
    onQuickAdd(nombre.trim(), precioNumerico);
    setNombre('');
    setPrecio('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setNombre('');
    setPrecio('');
    setError('');
    onClose();
  };

  const handleNombreChange = (e) => {
    setNombre(e.target.value.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-5 max-w-md w-full mx-4 transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: 'transform' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Agregar Producto Rápido</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="product-name" className="text-sm font-medium text-gray-700 mb-1 block">
              Nombre del Producto
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="product-name"
                type="text"
                value={nombre}
                onChange={handleNombreChange}
                placeholder="EJ: GASEOSA DE 3L"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-price" className="text-sm font-medium text-gray-700 mb-1 block">
              Precio (S/)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">S/</span>
              <input
                id="product-price"
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-4 bg-[#45923a] hover:bg-[#3a7d30] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
          >
            <PlusCircle size={20} />
            <span>Agregar al Carrito</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickAddProductModal;