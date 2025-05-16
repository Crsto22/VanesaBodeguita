import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    CreditCard,
    Users,
    Barcode,
    Package,
    Bell,
    Menu,
    X,
    Search,
    ArrowRight,
    Plus,
    Calendar,
    DollarSign,
    FileText,
    ShoppingBag,
    Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import IconoVentas from '../assets/Ventas/VentaNueva.svg'; // Assuming you'd have similar icons
import Logo from '../assets/Logo.svg';
// Colores personalizados
const COLORS = {
    primary: '#45923a', // Verde
    secondary: '#ffa40c', // Naranja/Ámbar
};

const Ventas = () => {
    // Estados básicos
    const navigate = useNavigate();
    const [appear, setAppear] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userName] = useState('Usuario');
    const [notifications] = useState(3);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });
    
    // Estado para ventas recientes
    const [ventas, setVentas] = useState([]);

    // Opciones del menú principal - Accesos rápidos
    const quickAccessOptions = [
        { 
            id: 'ventas', 
            title: 'Ventas', 
            icon: <ShoppingCart className="h-6 w-6" />, 
            color: 'bg-emerald-500', 
            description: 'Registrar ventas y ver historial',
            path: '/ventas'
        },
        { 
            id: 'deudas', 
            title: 'Pagar Deudas', 
            icon: <CreditCard className="h-6 w-6" />, 
            color: 'bg-amber-500', 
            description: 'Gestionar pagos pendientes',
            path: '/deudas'
        },
        { 
            id: 'clientes', 
            title: 'Clientes', 
            icon: <Users className="h-6 w-6" />, 
            color: 'bg-blue-500', 
            description: 'Administrar base de clientes',
            path: '/clientes'
        },
        { 
            id: 'escaner', 
            title: 'Escáner de Códigos', 
            icon: <Barcode className="h-6 w-6" />, 
            color: 'bg-violet-500', 
            description: 'Consultar precios por código de barras',
            path: '/escaner'
        },
        { 
            id: 'productos', 
            title: 'Productos', 
            icon: <Package className="h-6 w-6" />, 
            color: 'bg-rose-500', 
            description: 'Inventario y catálogo',
            path: '/productos'
        },
    ];

    // Datos de muestra para ventas recientes
    const ventasMuestra = [
        {
            id: 'V001',
            cliente: 'María González',
            fecha: '16/05/2025',
            total: 4850.50,
            estado: 'Completada',
            productos: 7
        },
        {
            id: 'V002',
            cliente: 'Juan Pérez',
            fecha: '15/05/2025',
            total: 1250.75,
            estado: 'Completada',
            productos: 3
        },
        {
            id: 'V003',
            cliente: 'Ana López',
            fecha: '14/05/2025',
            total: 3540.00,
            estado: 'Pendiente',
            productos: 5
        },
        {
            id: 'V004',
            cliente: 'Carlos Ramírez',
            fecha: '13/05/2025',
            total: 890.25,
            estado: 'Completada',
            productos: 2
        }
    ];

    // Estadísticas resumidas
    const estadisticas = [
        { titulo: 'Ventas Hoy', valor: '$9,850.50', icono: <DollarSign className="h-6 w-6" />, color: 'bg-green-100 text-green-600' },
        { titulo: 'Ventas Mes', valor: '$45,320.75', icono: <Calendar className="h-6 w-6" />, color: 'bg-blue-100 text-blue-600' },
        { titulo: 'Productos Vendidos', valor: '127', icono: <ShoppingBag className="h-6 w-6" />, color: 'bg-amber-100 text-amber-600' }
    ];

    // Filtrar ventas según término de búsqueda
    const filteredSales = ventasMuestra.filter(venta => {
        const matchesSearch =
            venta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venta.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venta.fecha.includes(searchTerm);
        return matchesSearch;
    });

    // Efecto para simular la carga de datos
    useEffect(() => {
        setAppear(true);
        
        // Simular carga de datos
        const timer = setTimeout(() => {
            setVentas(ventasMuestra);
            setLoading(false);
        }, 1500);
        
        return () => clearTimeout(timer);
    }, []);

    // Auto-dismiss toast after 3 seconds
    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);

    // Función para manejar la selección de opciones
    const handleOptionClick = (path) => {
        navigate(path);
        setMenuOpen(false);
    };

    // Función para registrar nueva venta
    const handleNewSale = () => {
        navigate('/ventas/nueva');
    };

    // Función para ver detalle de venta
    const handleViewSaleDetail = (ventaId) => {
        navigate(`/ventas/${ventaId}`);
    };

    // Función para cerrar el toast manualmente
    const closeToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Componente de esqueleto para cada tarjeta de venta durante la carga
    const VentaSkeleton = () => (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
            <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-4 w-36 rounded bg-gray-200 animate-pulse"></div>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-12 w-24 rounded-lg bg-gray-200 animate-pulse"></div>
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
                    <div className="h-8 w-24 rounded-lg bg-gray-200 animate-pulse"></div>
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

            {/* Contenido principal */}
            <main className="px-3 pb-16 pt-3">
                {/* Header con barra de búsqueda y acciones */}
                <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#34722c] p-6 text-white shadow-lg">
                    <img
                        src={IconoVentas || "https://via.placeholder.com/150"}
                        alt="Sales Icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0"
                    />
                    <div className="relative flex justify-between items-center">
                        <div className="flex flex-col">
                            <h1 className="mb-2 text-xl font-bold">Gestión de Ventas</h1>
                            <button
                                onClick={handleNewSale}
                                className="bg-[#ffa40c] font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 flex items-center gap-2 w-fit"
                                title="Registrar nueva venta"
                            >
                                <Plus size={18} strokeWidth={3} />
                                Nueva Venta
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {estadisticas.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-3 shadow">
                            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                                {stat.icono}
                            </div>
                            <p className="text-xs text-gray-500">{stat.titulo}</p>
                            <p className="text-lg font-bold">{stat.valor}</p>
                        </div>
                    ))}
                </div>

                {/* Barra de búsqueda */}
                <div className="relative mb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar venta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all duration-300 focus:border-[#45923a]"
                        />
                    </div>
                </div>

                {/* Contador de resultados */}
                <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-sm text-gray-500">
                        {loading ? 'Cargando...' : `${filteredSales.length} ${filteredSales.length === 1 ? 'venta' : 'ventas'}`}
                    </p>
                </div>

                {/* Lista de ventas estilo tarjetas para móvil */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((item) => (
                            <VentaSkeleton key={item} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSales.length > 0 ? (
                            filteredSales.map((venta) => (
                                <div
                                    key={venta.id}
                                    className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow"
                                >
                                    <div className="p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Venta #{venta.id}</h3>
                                                <div className="flex items-center gap-1">
                                                    <span className={`inline-block h-2 w-2 rounded-full ${venta.estado === 'Completada' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                                    <p className="text-xs text-gray-500">{venta.estado}</p>
                                                </div>
                                            </div>
                                            <div className="bg-[#45923a]/10 text-[#45923a] font-bold rounded-lg py-2 px-3">
                                                ${venta.total.toLocaleString('es-MX')}
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                    <Users className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <span className="text-gray-700">{venta.cliente}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <span className="text-gray-700">{venta.fecha}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                    <Tag className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <span className="text-gray-700">{venta.productos} productos</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
                                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                                                <FileText className="h-4 w-4" />
                                                <span>Ticket #{venta.id.replace('V', 'T')}</span>
                                            </div>
                                            <button
                                                onClick={() => handleViewSaleDetail(venta.id)}
                                                className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
                                            >
                                                <span>Ver detalle</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                                <div className="mb-4 flex items-center justify-center">
                                    <ShoppingCart
                                        size={80}
                                        className="text-gray-300"
                                    />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron ventas</h3>
                                <p className="mb-6 max-w-xs text-sm text-gray-500">
                                    No hay registros que coincidan con tu búsqueda. Prueba con otros filtros o registra una nueva venta.
                                </p>
                                <button
                                    onClick={handleNewSale}
                                    className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-md"
                                    style={{ backgroundColor: COLORS.secondary }}
                                >
                                    <Plus className="h-5 w-5" />
                                    Nueva Venta
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Ventas;