import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Mail, Phone, Plus } from 'lucide-react';
import { useClientes } from '../../context/ClientesContext';
import { useVentas } from '../../context/VentasContext';
import CrearClienteDrawer from './CrearClienteDrawer';

const ClientesDrawer = ({ isOpen, onClose, onSelectCliente }) => {
    const { clientes, loading: clientesLoading, obtenerClientePorId } = useClientes();
    const { obtenerDeudaTotalPorCliente } = useVentas();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [drawerCrearClienteOpen, setDrawerCrearClienteOpen] = useState(false);
    const searchInputRef = useRef(null);

    // Manejar la visibilidad con animación
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Duración de la animación
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Filtrar clientes según el término de búsqueda
    useEffect(() => {
        if (!clientesLoading) {
            if (searchTerm === '') {
                setFilteredClientes(clientes);
            } else {
                const filtered = clientes.filter((cliente) =>
                    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.telefono && cliente.telefono.includes(searchTerm)) ||
                    (cliente.correo && cliente.correo?.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                setFilteredClientes(filtered);
            }
        }
    }, [searchTerm, clientes, clientesLoading]);

    // Resetear búsqueda cuando se abre el drawer
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setFilteredClientes(clientes);
        }
    }, [isOpen, clientes]);

    // Enfocar el input de búsqueda cuando se abre el drawer
    useEffect(() => {
        if (isOpen && isVisible && searchInputRef.current) {
            // Delay mayor para asegurar que la animación termine
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isVisible]);

    // Variantes de animación para Framer Motion
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
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95
        },
        visible: (custom) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 20,
                stiffness: 300,
                delay: custom * 0.05
            }
        })
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
                <div className="relative flex flex-col h-full">
                {/* Header */}
                <motion.div 
                    className="p-4 bg-gradient-to-r from-[#45923a] to-[#3a7d30] flex-shrink-0"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    onAnimationComplete={() => {
                        // Enfocar el input cuando la animación termine
                        if (isOpen && searchInputRef.current) {
                            searchInputRef.current.focus();
                        }
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <User size={20} />
                            <h3 className="font-bold text-lg">Seleccionar Cliente</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Barra de búsqueda */}
                    <div className="mt-4 relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full bg-white outline-none text-gray-800"
                        />
                    </div>
                </motion.div>

                {/* Lista de clientes */}
                <motion.div 
                    className="flex-1 overflow-y-auto p-4"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {clientesLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#45923a]"></div>
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <div className="text-center py-8">
                            <User size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 font-medium">
                                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer cliente'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Cliente Genérico */}
                            <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectCliente(null)}
                                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors border border-gray-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">Cliente Genérico</h4>
                                        <p className="text-sm text-gray-500">Venta sin cliente específico</p>
                                    </div>
                                </div>
                            </motion.button>

                            {/* Lista de clientes */}
                            {filteredClientes.map((cliente, index) => {
                                const deudaTotal = obtenerDeudaTotalPorCliente(cliente.id);
                                return (
                                    <motion.button
                                        key={cliente.id}
                                        variants={itemVariants}
                                        custom={index}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSelectCliente(cliente)}
                                        className="w-full p-4 bg-white hover:bg-gray-50 rounded-xl text-left transition-colors border border-gray-200 hover:border-[#45923a] hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#fa9f01]  to-[#ffa40c] rounded-full flex items-center justify-center">
                                                <User size={20} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-800 truncate">
                                                    {cliente.nombre}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    {cliente.telefono && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone size={12} className="text-gray-400" />
                                                            <span className="text-xs text-gray-500">
                                                                {cliente.telefono}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {cliente.correo && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail size={12} className="text-gray-400" />
                                                            <span className="text-xs text-gray-500 truncate">
                                                                {cliente.correo}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {deudaTotal > 0 && (
                                                    <div className="mt-2">
                                                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                                            Deuda: S/{deudaTotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Footer */}
                <motion.div 
                    className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <button 
                        onClick={() => setDrawerCrearClienteOpen(true)}
                        className="w-full bg-[#45923a] hover:bg-[#3a7d30] text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Crear Nuevo Cliente
                    </button>
                </motion.div>

                {/* Drawer para crear cliente */}
                <CrearClienteDrawer
                    isOpen={drawerCrearClienteOpen}
                    onClose={() => setDrawerCrearClienteOpen(false)}
                    onClienteCreado={(nuevoClienteId) => {
                        // Cerrar el drawer de crear
                        setDrawerCrearClienteOpen(false);
                        
                        // Obtener el cliente recién creado y seleccionarlo automáticamente
                        const nuevoCliente = obtenerClientePorId(nuevoClienteId);
                        if (nuevoCliente) {
                            onSelectCliente(nuevoCliente);
                            onClose();
                        }
                    }}
                />
                </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ClientesDrawer;
