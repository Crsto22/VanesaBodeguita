
import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EditarPrecioDrawer = ({ isOpen, onClose, producto, onUpdatePrecio }) => {
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Manejar la visibilidad con animación
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && producto) {
      setNuevoPrecio(producto.precio?.toString() || '0');
      setError('');
    }
  }, [isOpen, producto]);

  const handleSubmit = () => {
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio <= 0) {
      setError('El precio debe ser un número positivo');
      return;
    }

    onUpdatePrecio(producto.id, precio);
    onClose();
  };

  // Funciones del teclado numérico
  const handleNumberClick = (number) => {
    setError('');
    if (nuevoPrecio.length < 8) {
      setNuevoPrecio(prev => {
        if (prev === '0') return number;
        return prev + number;
      });
    }
  };

  const handleDecimalClick = () => {
    setError('');
    if (!nuevoPrecio.includes('.')) {
      setNuevoPrecio(prev => prev + '.');
    }
  };

  const handleClearClick = () => {
    setError('');
    setNuevoPrecio('0');
  };

  // Variantes de animación
  const drawerVariants = {
    hidden: {
      y: '100%',
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 bg-white z-10 flex flex-col"
          variants={drawerVariants}
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          exit="exit"
        >
          {/* Header */}
          <motion.div
            className="p-4 bg-gradient-to-r from-[#45923a] to-[#3a7d30] flex-shrink-0"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <DollarSign size={20} />
                <h3 className="font-bold text-lg">Editar Precio</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="flex-1 p-3 flex flex-col"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col h-full space-y-3">
              {/* Producto Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-40">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                    {producto?.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre || 'Producto'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DollarSign size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {producto?.nombre || 'Producto no encontrado'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Actual: S/{producto?.precio?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Display del precio */}
              <div className="bg-gray-900 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Nuevo Precio</p>
                <div className="text-2xl font-bold text-white">
                  S/ {parseFloat(nuevoPrecio || '0').toFixed(2)}
                </div>
                {error && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-red-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>

              {/* Teclado Numérico */}
              <div
                className="grid grid-cols-3 gap-1 flex-1"
                style={{ minHeight: '200px' }}
              >
                {/* Fila 1 */}
                {['1', '2', '3'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="bg-white border border-gray-200 rounded-full flex items-center justify-center text-3xl font-extrabold text-gray-800 hover:bg-gray-50 hover:border-[#45923a] transition-colors shadow-sm min-h-[2.5rem]"
                  >
                    {num}
                  </button>
                ))}

                {/* Fila 2 */}
                {['4', '5', '6'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="bg-white border border-gray-200 rounded-full flex items-center justify-center text-3xl font-extrabold text-gray-800 hover:bg-gray-50 hover:border-[#45923a] transition-colors shadow-sm min-h-[2.5rem]"
                  >
                    {num}
                  </button>
                ))}

                {/* Fila 3 */}
                {['7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="bg-white border border-gray-200 rounded-full flex items-center justify-center text-3xl font-extrabold text-gray-800 hover:bg-gray-50 hover:border-[#45923a] transition-colors shadow-sm min-h-[2.5rem]"
                  >
                    {num}
                  </button>
                ))}

                {/* Fila 4 */}
                <button
                  onClick={handleClearClick}
                  className="bg-red-500 text-white border border-red-600 rounded-full flex items-center justify-center text-base font-extrabold hover:bg-red-600 transition-colors shadow-sm min-h-[2.5rem]"
                >
                  C
                </button>

                <button
                  onClick={() => handleNumberClick('0')}
                  className="bg-white border border-gray-200 rounded-full flex items-center justify-center text-3xl font-extrabold text-gray-800 hover:bg-gray-50 hover:border-[#45923a] transition-colors shadow-sm min-h-[2.5rem]"
                >
                  0
                </button>

                <button
                  onClick={handleDecimalClick}
                  className="bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg font-extrabold text-gray-800 hover:bg-gray-50 hover:border-[#45923a] transition-colors shadow-sm min-h-[2.5rem]"
                >
                  .
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-[#45923a] text-white rounded-lg hover:bg-[#3a7d30] transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Check size={16} />
                  Actualizar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditarPrecioDrawer;
