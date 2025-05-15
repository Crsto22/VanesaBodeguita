import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Menu,
    Bell,
    Users,
    ShoppingBag,
    DollarSign,
    ShoppingCart,
    CreditCard,
    Truck,
    Package,
    User,
    Phone,
    Mail,
    UserPen,
    UserRoundPlus,
    X
} from 'lucide-react';
import IconoClienteNoEncontrado from '../assets/Clientes/IconoClienteNoEncontrado.svg';
import Sidebar from '../components/Sidebar';
import Logo from '../assets/Logo.svg';
import Header from '../components/Header';
import IconoClientes from '../assets/Clientes/IconoClientes.svg';
import { useClientes } from '../context/ClientesContext';
import Drawer from '../components/Clientes/DrawerEditarAñadir';
import DeleteDrawer from '../components/Clientes/DeleteDrawer';

// Colores personalizados
const COLORS = {
    primary: '#45923a', // Verde
    secondary: '#ffa40c', // Naranja/Ámbar
};

const Clientes = () => {
    // Estados básicos
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userName] = useState('Usuario');
    const [notifications] = useState(3);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    // Obtener datos del contexto
    const { clientes, loading, crearCliente, actualizarCliente, eliminarCliente } = useClientes();

    // Auto-dismiss toast after 3 seconds
    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);

    // Opciones del menú principal - Accesos rápidos con iconos más específicos
    const quickAccessOptions = [
        { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial' },
        { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes' },
        { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes' },
        { id: 'proveedores', title: 'Proveedores', icon: <Truck className="h-6 w-6" />, color: 'bg-violet-500', description: 'Contactos y pedidos' },
        { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo' },
    ];

    // SVG de WhatsApp para usar en los botones
    const WhatsAppIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
        >
            <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
            />
        </svg>
    );

    // Filtrar clientes según término de búsqueda
    const filteredClients = clientes.filter(client => {
        const matchesSearch =
            client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.correo && client.correo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (client.telefono && client.telefono.includes(searchTerm));
        return matchesSearch;
    });

    // Función para abrir WhatsApp
    const openWhatsApp = (phone) => {
        const phoneNumber = phone.replace(/[+\s]/g, '');
        window.open(`https://wa.me/${phoneNumber}`, '_blank');
    };

    // Función para manejar la selección de opciones
    const handleOptionClick = (optionId) => {
        console.log(`Opción seleccionada: ${optionId}`);
        setMenuOpen(false);
    };

    // Función para abrir el drawer de añadir cliente
    const handleAddClient = () => {
        setIsEditMode(false);
        setCurrentClient(null);
        setDrawerOpen(true);
    };

    // Función para abrir el drawer de editar cliente
    const handleEditClient = (client) => {
        setIsEditMode(true);
        setCurrentClient(client);
        setDrawerOpen(true);
    };

    // Función para abrir el drawer de eliminación
    const handleDeleteClient = (client) => {
        setCurrentClient(client);
        setDeleteDrawerOpen(true);
    };

    // Función para confirmar la eliminación
    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await eliminarCliente(currentClient.id);
            setToast({ message: 'Cliente eliminado con éxito', type: 'success', visible: true });
            setDeleteDrawerOpen(false);
            setCurrentClient(null);
        } catch (error) {
            setToast({ message: 'Error al eliminar cliente', type: 'error', visible: true });
            setDeleteDrawerOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    // Función para manejar el envío del formulario desde el drawer
    const handleDrawerSubmit = async (formData) => {
        try {
            if (isEditMode) {
                await actualizarCliente(currentClient.id, formData);
                setToast({ message: 'Cliente actualizado con éxito', type: 'success', visible: true });
            } else {
                await crearCliente(formData);
                setToast({ message: 'Cliente creado con éxito', type: 'success', visible: true });
            }
            setDrawerOpen(false);
        } catch (error) {
            setToast({ 
                message: `Error al ${isEditMode ? 'actualizar' : 'crear'} cliente`, 
                type: 'error', 
                visible: true 
            });
            throw error; // Re-throw to let DrawerEditarAñadir handle loading state
        }
    };

    // Función para cerrar el toast manualmente
    const closeToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Componente de esqueleto para cada tarjeta de cliente durante la carga
    const ClienteSkeleton = () => (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
            <div className="p-4">
                <div className="mb-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-36 rounded bg-gray-200 animate-pulse"></div>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-48 rounded bg-gray-200 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse"></div>
                    </div>
                </div>
                <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
                    <div className="h-8 w-24 rounded-lg bg-gray-200 animate-pulse"></div>
                    <div className="flex">
                        <div className="h-8 w-10 rounded-l-lg bg-gray-200 animate-pulse"></div>
                        <div className="h-8 w-10 rounded-r-lg bg-gray-200 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Toast */}
            {toast.visible && (
    <div className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden">
        <div 
            className={`w-full shadow-lg transform transition-all duration-300 ease-in-out ${
                toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            } ${
                toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
            role="alert" 
            tabIndex="-1" 
            aria-labelledby="header-notification"
        >
            <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg 
                            className="w-4 h-4 text-white" 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            fill="currentColor" 
                            viewBox="0 0 16 16"
                        >
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p 
                            id="header-notification" 
                            className="text-sm text-white font-medium"
                        >
                            {toast.message}
                        </p>
                    </div>
                </div>
                <button
                    onClick={closeToast}
                    className="text-white hover:text-gray-200 focus:outline-none"
                    aria-label="Cerrar notificación"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
            )}

            {/* Header simplificado */}
            <Header
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                userName={userName}
                notifications={notifications}
            />

            {/* Sidebar */}
            <Sidebar
                isOpen={menuOpen}
                setIsOpen={setMenuOpen}
                userName={userName}
                quickAccessOptions={quickAccessOptions}
                onOptionClick={handleOptionClick}
                logo={Logo}
            />

            {/* Drawer para añadir/editar cliente */}
            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                isEditMode={isEditMode}
                initialData={currentClient}
                onSubmit={handleDrawerSubmit}
                colors={COLORS}
            />

            {/* Drawer para eliminar cliente */}
            <DeleteDrawer
                isOpen={deleteDrawerOpen}
                onClose={() => setDeleteDrawerOpen(false)}
                onConfirm={handleConfirmDelete}
                clientName={currentClient?.nombre || ''}
                colors={COLORS}
                loading={deleting}
            />

            {/* Contenido principal */}
            <main className="px-3 pb-16 pt-3">
                {/* Header con barra de búsqueda y acciones */}
                <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#34722c] p-6 text-white shadow-lg">
                    <img
                        src={IconoClientes}
                        alt="Clients Icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0"
                    />
                    <div className="relative flex justify-between items-center">
                        <div className="flex flex-col">
                            <h1 className="mb-2 text-xl font-bold">Gestión de Clientes</h1>
                            <button
                                onClick={handleAddClient}
                                className="bg-[#ffa40c] font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 flex items-center gap-2 w-fit"
                                title="Agregar nuevo cliente"
                            >
                                <UserRoundPlus size={18} strokeWidth={3} />
                                Nuevo Cliente
                            </button>
                        </div>
                    </div>
                </div>
                <div className="relative mb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all duration-300 focus:border-[#45923a]"
                        />
                    </div>
                </div>

                {/* Contador de resultados */}
                <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-sm text-gray-500">
                        {loading ? 'Cargando...' : `${filteredClients.length} ${filteredClients.length === 1 ? 'cliente' : 'clientes'}`}
                    </p>
                </div>

                {/* Lista de clientes estilo tarjetas para móvil */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((item) => (
                            <ClienteSkeleton key={item} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow"
                                >
                                    <div className="p-4">
                                        <div className="mb-3 flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full text-white bg-[#ffa40c]">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{client.nombre}</h3>
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block h-2 w-2 rounded-full bg-[#45923a]"></span>
                                                    <p className="text-xs text-gray-500">Cliente activo</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            {client.correo && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                        <Mail className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <span className="text-gray-700">{client.correo}</span>
                                                </div>
                                            )}
                                            {client.telefono && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                        <Phone className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <span className="text-gray-700">{client.telefono}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
                                            {client.telefono && (
                                                <button
                                                    onClick={() => openWhatsApp(client.telefono)}
                                                    className="flex items-center gap-1 bg-[#2eb843] text-white rounded-lg px-3 py-2 text-sm font-medium"
                                                >
                                                    <WhatsAppIcon className="text-white" />
                                                    <span className="text-white">WhatsApp</span>
                                                </button>
                                            )}
                                            <div className="flex ml-auto">
                                                <button
                                                    onClick={() => handleEditClient(client)}
                                                    className="rounded-l-lg border border-blue-600 px-3 py-2 bg-blue-600"
                                                    style={{ borderRight: 'none' }}
                                                >
                                                    <UserPen strokeWidth={3} className="h-4 w-4 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClient(client)}
                                                    className="rounded-r-lg border border-red-500 bg-red-500 text-white px-3 py-2"
                                                >
                                                    <Trash2 strokeWidth={3} className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                                <div className="mb-4 flex items-center justify-center">
                                    <img
                                        src={IconoClienteNoEncontrado}
                                        alt="Cliente no encontrado"
                                        className="h-32"
                                        style={{ color: COLORS.primary }}
                                    />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron clientes</h3>
                                <p className="mb-6 max-w-xs text-sm text-gray-500">
                                    No hay registros que coincidan con tu búsqueda. Prueba con otros filtros o agrega un nuevo cliente.
                                </p>
                                <button
                                    onClick={handleAddClient}
                                    className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-md"
                                    style={{ backgroundColor: COLORS.secondary }}
                                >
                                    <Plus className="h-5 w-5" />
                                    Agregar Cliente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Clientes;