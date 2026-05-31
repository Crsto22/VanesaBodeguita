import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Mail, Phone, Plus, Eye, Filter, Bell, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClientes } from '../../context/ClientesContext';
import { useVentas } from '../../context/VentasContext';
import CrearClienteDrawer from './CrearClienteDrawer';
import EditarTelefonoModal from './EditarTelefonoModal';
import YapeLogo from '../../assets/yape-logo.png';

const ClientesDrawer = ({ isOpen, onClose, onSelectCliente }) => {
    const navigate = useNavigate();
    const { clientes, loading: clientesLoading, obtenerClientePorId } = useClientes();
    const { obtenerDeudaTotalPorCliente } = useVentas();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [drawerCrearClienteOpen, setDrawerCrearClienteOpen] = useState(false);
    const [filtroWhatsApp, setFiltroWhatsApp] = useState(false);
    const [filtroAlertasCompras, setFiltroAlertasCompras] = useState(false);
    const [editarTelefonoOpen, setEditarTelefonoOpen] = useState(false);
    const [clienteEditandoTelefono, setClienteEditandoTelefono] = useState(null);
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

    // Filtrar clientes según el término de búsqueda y filtro de WhatsApp
    useEffect(() => {
        if (!clientesLoading) {
            let filtered = clientes;
            
            // Aplicar filtro de WhatsApp si está activo
            if (filtroWhatsApp) {
                filtered = filtered.filter((cliente) => cliente.enviar_whatsapp === true);
            }
            
            // Aplicar filtro de alertas de compras si está activo
            if (filtroAlertasCompras) {
                filtered = filtered.filter((cliente) => cliente.alertas_compras_whatsapp === true);
            }
            
            // Aplicar búsqueda por texto
            if (searchTerm !== '') {
                filtered = filtered.filter((cliente) =>
                    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.telefono && cliente.telefono.includes(searchTerm)) ||
                    (cliente.correo && cliente.correo?.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }
            
            setFilteredClientes(filtered);
        }
    }, [searchTerm, clientes, clientesLoading, filtroWhatsApp, filtroAlertasCompras]);

    // Resetear búsqueda y filtros cuando se abre el drawer
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setFiltroWhatsApp(false);
            setFiltroAlertasCompras(false);
            setFilteredClientes(clientes);
        }
    }, [isOpen, clientes]);

    // Función para editar teléfono
    const handleEditarTelefono = (cliente) => {
        setClienteEditandoTelefono(cliente);
        setEditarTelefonoOpen(true);
    };

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

                    {/* Filtros */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {/* Filtro de Alertas de Compras */}
                        <button
                            onClick={() => setFiltroAlertasCompras(!filtroAlertasCompras)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                filtroAlertasCompras 
                                    ? 'bg-white text-blue-600 shadow-md' 
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <Filter size={14} />
                            <Bell className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {filtroAlertasCompras ? 'Solo Alertas' : 'Filtrar Alertas'}
                            </span>
                            {filtroAlertasCompras && (
                                <span className="ml-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                    {filteredClientes.length}
                                </span>
                            )}
                        </button>
                        {/* Filtro de WhatsApp */}
                        <button
                            onClick={() => setFiltroWhatsApp(!filtroWhatsApp)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                filtroWhatsApp 
                                    ? 'bg-white text-[#16a34a] shadow-md' 
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <Filter size={14} />
                            <svg 
                                className="h-4 w-4" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-sm font-medium">
                                {filtroWhatsApp ? 'Solo WhatsApp' : 'Filtrar WhatsApp'}
                            </span>
                            {filtroWhatsApp && (
                                <span className="ml-1 bg-[#16a34a] text-white text-xs px-2 py-0.5 rounded-full">
                                    {filteredClientes.length}
                                </span>
                            )}
                        </button>
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
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-gray-800 truncate">
                                                        {cliente.nombre}
                                                    </h4>
                                                    {(cliente.nombre_yape || (cliente.nombres_yape_alternativos && cliente.nombres_yape_alternativos.length > 0)) && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-fuchsia-700 px-2 py-0.5 text-xs font-semibold text-white">
                                                            <img src={YapeLogo} alt="Yape Logo" className="h-4 w-4 rounded-full" /> Auto Yape
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 flex-wrap">
                                                    {cliente.telefono && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone size={12} className="text-gray-400" />
                                                            <span className="text-xs text-gray-500">
                                                                {cliente.telefono}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditarTelefono(cliente);
                                                                }}
                                                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                                                title="Editar teléfonos"
                                                            >
                                                                <Edit2 size={12} className="text-gray-400" />
                                                            </button>
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
                                                    {/* Badge solo cuando WhatsApp está habilitado */}
                                                    {cliente.enviar_whatsapp && (
                                                        <div className="flex items-center gap-1">
                                                            <span 
                                                                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                                                style={{ 
                                                                    backgroundColor: '#dcfce7',
                                                                    color: '#16a34a'
                                                                }}
                                                            >
                                                                <svg 
                                                                    className="h-3 w-3" 
                                                                    fill="currentColor" 
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                                </svg>
                                                                Se envía por WhatsApp
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Badge de alertas de compras */}
                                                    {cliente.alertas_compras_whatsapp && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                                <Bell className="h-3 w-3" />
                                                                Alertas compras
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!cliente.telefono && !cliente.telefono2 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditarTelefono(cliente);
                                                            }}
                                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                        >
                                                            <Phone size={12} /> Agregar teléfono
                                                        </button>
                                                    )}
                                                </div>
                                                {deudaTotal > 0 && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                                            Deuda: S/{deudaTotal.toFixed(2)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/deudas-desktop/${cliente.id}`);
                                                                onClose();
                                                            }}
                                                            className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 border border-blue-200 transition-all"
                                                            title="Ver cuenta del cliente"
                                                        >
                                                            <Eye size={14} className="text-blue-700" />
                                                        </button>
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

                {/* Modal para editar teléfono */}
                <EditarTelefonoModal
                    isOpen={editarTelefonoOpen}
                    onClose={() => {
                        setEditarTelefonoOpen(false);
                        setClienteEditandoTelefono(null);
                    }}
                    client={clienteEditandoTelefono}
                />
                </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ClientesDrawer;
