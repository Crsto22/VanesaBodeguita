import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PrecioAlternativoDrawer = ({ isOpen, onClose, producto, onAgregarAlCarrito }) => {
  const [precioSeleccionado, setPrecioSeleccionado] = useState('normal');
  const [isVisible, setIsVisible] = useState(false);

  // Manejar la visibilidad con animación
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setPrecioSeleccionado('normal'); // Reset al precio normal por defecto
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAgregar = () => {
    if (!producto) return;

    const precioFinal = precioSeleccionado === 'alternativo' 
      ? producto.precio_alternativo 
      : producto.precio;

    const motivoTexto = precioSeleccionado === 'alternativo' && producto.motivo_precio_alternativo
      ? ` (${producto.motivo_precio_alternativo})`
      : '';

    const productoCarrito = {
      id: producto.id,
      carritoId: `${producto.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único para el carrito
      nombre: producto.nombre + motivoTexto,
      precio: parseFloat(precioFinal),
      cantidad: 1,
      subtotal: parseFloat(precioFinal),
      imagen: producto.imagen,
      categoria_ref: producto.categoria_ref,
      tipo_unidad: producto.tipo_unidad || 'unidad',
      retornable: producto.retornable || false,
      cantidad_retornable: producto.retornable && producto.tipo_unidad !== 'kilogramo' ? 1 : 0,
      precio_usado: precioSeleccionado,
      motivo_precio_alternativo: producto.motivo_precio_alternativo
    };

    onAgregarAlCarrito(productoCarrito);
    onClose();
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
                <h3 className="font-bold text-lg">Seleccionar Precio</h3>
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
            className="flex-1 p-4 flex flex-col"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col h-full space-y-4">
              {/* Producto Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                    {producto?.imagen ? (
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre || 'Producto'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <DollarSign size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">
                      {producto?.nombre || 'Producto no encontrado'}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Este producto tiene precios diferentes disponibles
                    </p>
                  </div>
                </div>
              </div>

              {/* Opciones de Precio */}
              <div className="space-y-3 flex-1">
                {/* Precio Normal */}
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    precioSeleccionado === 'normal' 
                      ? 'border-[#45923a] bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setPrecioSeleccionado('normal')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        precioSeleccionado === 'normal' 
                          ? 'border-[#45923a] bg-[#45923a]' 
                          : 'border-gray-300'
                      }`}>
                        {precioSeleccionado === 'normal' && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-800">Precio Normal</h5>
                        <p className="text-sm text-gray-500">Precio estándar del producto</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#45923a]">
                        S/{parseFloat(producto?.precio || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Precio Alternativo */}
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    precioSeleccionado === 'alternativo' 
                      ? 'border-[#ffa40c] bg-orange-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setPrecioSeleccionado('alternativo')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        precioSeleccionado === 'alternativo' 
                          ? 'border-[#ffa40c] bg-[#ffa40c]' 
                          : 'border-gray-300'
                      }`}>
                        {precioSeleccionado === 'alternativo' && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-800">Precio {producto?.motivo_precio_alternativo || 'Precio especial'}</h5>
                        <p className="text-sm text-gray-500">
                          Precio alternativo del producto
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#ffa40c]">
                        S/{parseFloat(producto?.precio_alternativo || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Agregar */}
              <motion.button
                onClick={handleAgregar}
                className="w-full bg-[#45923a] hover:bg-[#3a7d30] text-white p-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <DollarSign size={20} />
                Agregar al Carrito - S/{parseFloat(
                  precioSeleccionado === 'alternativo' 
                    ? producto?.precio_alternativo || 0 
                    : producto?.precio || 0
                ).toFixed(2)}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrecioAlternativoDrawer;
