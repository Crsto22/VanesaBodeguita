import React, { useState, useEffect } from 'react';
import { X, Scale, Check, AlertCircle, ToggleLeft, ToggleRight, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KilogramoDrawer = ({ isOpen, onClose, producto, productoCarrito, onAgregarAlCarrito, isEditing = false }) => {
  const [pesoKg, setPesoKg] = useState('0.500');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [modoPeso, setModoPeso] = useState(false); // false = modo precio (default), true = modo peso
  const [opcionesRapidasCollapsed, setOpcionesRapidasCollapsed] = useState(() => {
    const saved = localStorage.getItem('kilogramoDrawer_opcionesRapidasCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

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
      if (isEditing && productoCarrito) {
        // Si está editando, inicializar con los valores del producto del carrito
        if (productoCarrito.peso_kg) {
          setPesoKg(productoCarrito.peso_kg.toString());
          setModoPeso(true); // Empezar en modo peso si hay peso guardado
        } else {
          setPesoKg('0.500');
          setModoPeso(false);
        }
        setNuevoPrecio(productoCarrito.precio.toString());
      } else {
        // Si está agregando, usar valores por defecto
        setPesoKg('0.500');
        setNuevoPrecio(producto.precio.toString());
        setModoPeso(false); // Empezar en modo precio por defecto
      }
      setError('');
    }
  }, [isOpen, producto, isEditing, productoCarrito]);

  // Guardar estado del collapse en localStorage
  useEffect(() => {
    localStorage.setItem('kilogramoDrawer_opcionesRapidasCollapsed', JSON.stringify(opcionesRapidasCollapsed));
  }, [opcionesRapidasCollapsed]);

  const handleSubmit = () => {
    if (modoPeso) {
      // Modo peso: validar peso y calcular precio final
      const peso = parseFloat(pesoKg);
      if (isNaN(peso) || peso <= 0) {
        setError('El peso debe ser un número positivo');
        return;
      }
      if (peso > 99.999) {
        setError('El peso máximo es 99.999 kg');
        return;
      }
      
      // Calcular precio final
      const precioFinal = peso * parseFloat(producto.precio);
      onAgregarAlCarrito(producto.id, precioFinal, peso);
    } else {
      // Modo precio directo
      const precio = parseFloat(nuevoPrecio);
      if (isNaN(precio) || precio <= 0) {
        setError('El precio debe ser un número positivo');
        return;
      }
      
      onAgregarAlCarrito(producto.id, precio);
    }

    onClose();
  };

  // Funciones del teclado numérico
  const handleNumberClick = (number) => {
    setError('');
    if (modoPeso) {
      if (pesoKg.length < 6) { // Máximo 6 caracteres (XX.XXX)
        setPesoKg(prev => {
          if (prev === '0') return number;
          return prev + number;
        });
      }
    } else {
      if (nuevoPrecio.length < 8) { // Máximo 8 caracteres
        setNuevoPrecio(prev => {
          if (prev === '0') return number;
          return prev + number;
        });
      }
    }
  };

  const handleDecimalClick = () => {
    setError('');
    if (modoPeso) {
      if (!pesoKg.includes('.')) {
        setPesoKg(prev => prev + '.');
      }
    } else {
      if (!nuevoPrecio.includes('.')) {
        setNuevoPrecio(prev => prev + '.');
      }
    }
  };

  const handleClearClick = () => {
    setError('');
    if (modoPeso) {
      setPesoKg('0');
    } else {
      setNuevoPrecio('0');
    }
  };

  // Funciones para opciones rápidas de peso
  const handleOpcionRapida = (peso) => {
    setError('');
    setPesoKg(peso.toString());
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
                <Scale size={20} />
                <h3 className="font-bold text-lg">
                  {isEditing 
                    ? (modoPeso ? 'Editar Peso' : 'Editar Precio')
                    : (modoPeso ? 'Ingresar Peso' : 'Ingresar Precio')
                  }
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            {/* Toggle entre modo peso y precio - Mejorado */}
            <div className="mt-3 bg-white/15 rounded-xl p-3">
              <div className="flex bg-white rounded-xl p-1 shadow-inner">
                {/* Botón Precio */}
                <button
                  onClick={() => setModoPeso(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-300 ${
                    !modoPeso 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign size={16} />
                  <span className="font-semibold text-sm">Precio</span>
                </button>
                
                {/* Botón Peso */}
                <button
                  onClick={() => setModoPeso(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-300 ${
                    modoPeso 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Scale size={16} />
                  <span className="font-semibold text-sm">Peso</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="flex-1 p-3 overflow-y-auto flex flex-col"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {producto && (
              <div className="flex flex-col h-full space-y-3">
                {/* Producto Info - Mejorado para resaltar más */}
                <motion.div 
                  className="bg-gradient-to-r from-[#45923a] to-[#3a7d30] rounded-xl p-4 flex-shrink-0 shadow-lg"
                  variants={contentVariants}
                >
                  <div className="text-center">
                    <h4 className="font-bold text-white text-lg mb-2 tracking-wide">{producto.nombre}</h4>
                    <div className="bg-white/20 rounded-lg py-2 px-4">
                      <p className="text-white font-semibold text-base">
                        Precio por kg: <span className="font-bold text-yellow-300 text-xl">S/{producto.precio.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Display del peso/precio */}
                <motion.div 
                  className="bg-gray-900 rounded-lg p-4 flex-shrink-0"
                  variants={contentVariants}
                >
                  {modoPeso ? (
                    <>
                      {/* Peso y Precio Calculado en fila */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Peso en Kilogramos</p>
                          <div className="text-xl font-bold text-white">
                            {parseFloat(pesoKg || '0').toFixed(3)} kg
                          </div>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-400 mb-1">Precio Calculado</p>
                          <div className="text-xl font-bold text-green-400">
                            S/ {pesoKg ? (parseFloat(pesoKg) * producto.precio).toFixed(2) : '0.00'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Opciones Rápidas con Collapse */}
                      <div className="border-t border-gray-700 pt-3">
                        <div 
                          className="flex items-center justify-between cursor-pointer group mb-2"
                          onClick={() => setOpcionesRapidasCollapsed(!opcionesRapidasCollapsed)}
                        >
                          <p className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors duration-200">
                            Opciones Rápidas
                          </p>
                          <motion.div
                            animate={{ rotate: opcionesRapidasCollapsed ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400 group-hover:text-blue-400 transition-colors duration-200"
                          >
                            <ChevronDown size={16} />
                          </motion.div>
                        </div>
                        
                        <AnimatePresence>
                          {!opcionesRapidasCollapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpcionRapida(0.250)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                                >
                                  1/4 kg<br/>
                                  <span className="text-xs opacity-80">250g</span>
                                </button>
                                <button
                                  onClick={() => handleOpcionRapida(0.500)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                                >
                                  1/2 kg<br/>
                                  <span className="text-xs opacity-80">500g</span>
                                </button>
                                <button
                                  onClick={() => handleOpcionRapida(0.750)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                                >
                                  3/4 kg<br/>
                                  <span className="text-xs opacity-80">750g</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Precio y Peso Calculado en fila */}
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Precio Total</p>
                          <div className="text-xl font-bold text-white">
                            S/ {parseFloat(nuevoPrecio || '0').toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-400 mb-1">Peso Equivalente</p>
                          <div className="text-xl font-bold text-blue-400">
                            {nuevoPrecio && parseFloat(nuevoPrecio) > 0 
                              ? (parseFloat(nuevoPrecio) / producto.precio).toFixed(3) + ' kg'
                              : '0.000 kg'
                            }
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {error && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-red-400">
                      <AlertCircle size={12} />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}
                </motion.div>

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
                <motion.div 
                  className="flex gap-2 flex-shrink-0"
                  variants={contentVariants}
                >
                  <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-3 bg-[#45923a] text-white rounded-lg hover:bg-[#3a7d30] transition-colors flex items-center justify-center gap-2 text-base font-semibold shadow-md hover:shadow-lg"
                  >
                    <Check size={16} />
                    {isEditing ? 'Actualizar Producto' : 'Agregar al Carrito'}
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KilogramoDrawer;
