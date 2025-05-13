import React, { useState } from 'react';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Menu,
    Bell,
    Filter,
    Download,
    RefreshCw,
    UserPen,
    UserRoundPlus,
    User,
    Phone,
    Mail,
    Calendar,
    Users,
    ShoppingBag,
    DollarSign,
    TruckIcon,
    ShoppingCart,
    CreditCard,
    Truck,
    Package,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Logo from '../assets/Logo.svg';
import Header from '../components/Header';
import IconoClientes from "../assets/IconoClientes.svg"
// Colores personalizados
const COLORS = {
    primary: '#45923a', // Verde
    secondary: '#ffa40c', // Naranja/Ámbar
};

const Clientes = () => {
    // Estados básicos
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState(false);
    const [dateFilter, setDateFilter] = useState('');
    const [userName] = useState('Usuario');
    const [notifications] = useState(3);

    // Opciones del menú principal - Accesos rápidos con iconos más específicos
    const quickAccessOptions = [
        { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial' },
        { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes' },
        { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes' },
        { id: 'proveedores', title: 'Proveedores', icon: <Truck className="h-6 w-6" />, color: 'bg-violet-500', description: 'Contactos y pedidos' },
        { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo' },
    ];

    // Datos de clientes
    const [clients] = useState([
        {
            id: 1,
            nombre: 'Cristhofer Leonardo',
            telefono: '+51932889985',
            correo: 'cristhofer@ejemplo.com',
            fecha_creacion: '15 de marzo de 2025, 5:03:36 p.m. UTC-5'
        },
        {
            id: 2,
            nombre: 'María González',
            telefono: '+573209876543',
            correo: 'maria.gonzalez@ejemplo.com',
            fecha_creacion: '23 de enero de 2025, 9:15:22 a.m. UTC-5'
        },
        {
            id: 3,
            nombre: 'Carlos Rodríguez',
            telefono: '+573157894561',
            correo: 'carlos.r@ejemplo.com',
            fecha_creacion: '10 de febrero de 2025, 3:45:18 p.m. UTC-5'
        },
        {
            id: 4,
            nombre: 'Ana Lucía Herrera',
            telefono: '+573187654321',
            correo: 'ana.lucia@ejemplo.com',
            fecha_creacion: '5 de abril de 2025, 11:20:07 a.m. UTC-5'
        },
        {
            id: 5,
            nombre: 'Jorge Mendoza',
            telefono: '+573124567890',
            correo: 'jorge.m@ejemplo.com',
            fecha_creacion: '17 de marzo de 2025, 2:30:45 p.m. UTC-5'
        },
        {
            id: 6,
            nombre: 'Valentina Ortiz',
            telefono: '+573176543210',
            correo: 'valentina@ejemplo.com',
            fecha_creacion: '28 de febrero de 2025, 10:05:38 a.m. UTC-5'
        },
        {
            id: 7,
            nombre: 'Roberto Díaz',
            telefono: '+573112345678',
            correo: 'roberto.diaz@ejemplo.com',
            fecha_creacion: '19 de abril de 2025, 4:12:29 p.m. UTC-5'
        }
    ]);

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
    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.telefono.includes(searchTerm);

        const matchesDate = !dateFilter || client.fecha_creacion.includes(dateFilter);

        return matchesSearch && matchesDate;
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

    // Función placeholder para editar cliente
    const handleEditClient = (client) => {
        console.log("Editar cliente:", client);
        // Aquí iría la lógica para abrir el modal de edición
    };

    // Función placeholder para eliminar cliente
    const handleDeleteClient = (client) => {
        console.log("Eliminar cliente:", client);
        // Aquí iría la lógica para confirmar la eliminación
    };

    // Función placeholder para añadir cliente
    const handleAddClient = () => {
        console.log("Añadir nuevo cliente");
        // Aquí iría la lógica para abrir el modal de añadir cliente
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
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
  {/* Background Image */}
  <img
    src={IconoClientes}
    alt="Clients Icon"
    className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0"
  />

  {/* Content */}
  <div className="relative  flex justify-between items-center">
    {/* Text and Button Column */}
    <div className="flex flex-col">
      <h1 className="mb-2 text-xl font-bold">Gestión de Clientes</h1>
      <button
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
                    <div className="relative ">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all duration-300 focus:border-[#45923a]"
                        />
                    </div>
                </div>
                {/* Panel de filtros expandible */}
                {filterActive && (
                    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow">
                        <div className="flex flex-col gap-4">
                            <div className="w-full">
                                <label className="mb-1 block text-sm font-medium" style={{ color: COLORS.primary }}>Fecha de registro</label>
                                <input
                                    type="text"
                                    placeholder="ej: marzo 2025"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDateFilter('')}
                                    className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
                                >
                                    Limpiar
                                </button>
                                <button
                                    className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                                    style={{ backgroundColor: COLORS.primary }}
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contador de resultados */}
                <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-sm text-gray-500">
                        {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
                    </p>
                </div>

                {/* Lista de clientes estilo tarjetas para móvil */}
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
                                                <span className="inline-block h-2 w-2 rounded-full bg-[#45923a]" ></span>
                                                <p className="text-xs text-gray-500">Cliente activo</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                <Mail className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <span className="text-gray-700">{client.correo}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                                <Phone className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <span className="text-gray-700">{client.telefono}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
                                        <button
                                            onClick={() => openWhatsApp(client.telefono)}
                                            className="flex items-center gap-1 bg-[#2eb843] text-white rounded-lg  px-3 py-2 text-sm font-medium"
                                        >
                                            <WhatsAppIcon className="text-white" />
                                            <span className="text-white">WhatsApp</span>
                                        </button>

                                        <div className="flex">
                                            <button
                                                onClick={() => handleEditClient(client)}
                                                className="rounded-l-lg border border-blue-600 px-3 py-2 bg-blue-600"
                                                style={{ borderRight: 'none' }}
                                            >
                                                <UserPen strokeWidth={3} className="h-4 w-4  text-white" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClient(client)}
                                                className="rounded-r-lg border border-red-500 bg-red-500 text-white px-3 py-2"
                                            >
                                                <Trash2 strokeWidth={3} className="h-4 w-4 " />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${COLORS.primary}20` }}>
                                <User className="h-8 w-8" style={{ color: COLORS.primary }} />
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

                {/* Paginación moderna y elegante */}
                {filteredClients.length > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-center">
                            <div className="inline-flex rounded-lg shadow">
                                <button
                                    className="rounded-l-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    className="rounded-r-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-white"
                                    style={{ backgroundColor: COLORS.primary, borderColor: COLORS.primary }}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-center text-xs text-gray-500">
                            Página <span className="font-medium">1</span> de <span className="font-medium">3</span>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Clientes;