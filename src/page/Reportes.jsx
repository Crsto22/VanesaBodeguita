import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    ShoppingBag,
    CreditCard,
    Users,
    Truck,
    Package,
    FileText,
    BarChart2,
    Calendar,
    TrendingUp,
    Milk,
    Filter,
    ArrowRight,
    Download,
    Printer
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Logo from '../assets/Logo.svg';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportes } from '../context/ReportesContext';



const Reportes = () => {
    const navigate = useNavigate();
    const { obtenerReporteRetornables, loading } = useReportes();

    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notifications] = useState(3);
    const [appear, setAppear] = useState(false);

    // Filtros de fecha
    // Filtros de fecha - Native inputs use YYYY-MM-DD string format
    // Default to start of current month and today
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    const [reporteRetornables, setReporteRetornables] = useState([]);
    const [filteredReporte, setFilteredReporte] = useState([]);

    const quickAccessOptions = [
        { id: 'ventas', title: 'Ventas', icon: <ShoppingBag className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial', path: '/ventas', },
        { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas', },
        { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes', path: '/clientes', },
        { id: 'proveedores', title: 'Proveedores', icon: <Truck className="h-6 w-6" />, color: 'bg-violet-500', description: 'Contactos y pedidos', path: '/proveedores', },
        { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo', path: '/productos', },
        { id: 'reportes', title: 'Reportes', icon: <FileText className="h-6 w-6" />, color: 'bg-teal-600', description: 'Ver reportes y estadísticas', path: '/reportes' },
    ];

    useEffect(() => {
        setAppear(true);
    }, []);

    const fetchReporte = async () => {
        // Ajustar fechaFin para incluir todo el día seleccionado
        // Correct timezone offset issue by treating the input string as local time
        // or just constructing date components. 
        // Simple way for local usage: new Date(fechaInicio + 'T00:00:00')

        // Pass Date objects to the context function
        const data = await obtenerReporteRetornables(
            new Date(fechaInicio + 'T00:00:00'),
            new Date(fechaFin + 'T23:59:59')
        );
        setReporteRetornables(data);
    };

    useEffect(() => {
        fetchReporte();
    }, [fechaInicio, fechaFin]);

    useEffect(() => {
        const filtered = reporteRetornables.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredReporte(filtered);
    }, [searchTerm, reporteRetornables]);


    const handlePrintReport = async () => {
        try {
            const startDate = new Date(fechaInicio + 'T00:00:00.000Z');
            const endDate = new Date(fechaFin + 'T23:59:59.999Z');

            const response = await fetch('http://localhost:5003/api/imprimir-reporte-retornables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha_inicio: startDate.toISOString(),
                    fecha_fin: endDate.toISOString()
                })
            });

            if (response.ok) {
                alert('Reporte enviado a la impresora térmica.');
            } else {
                console.error('Error al imprimir:', response.statusText);
                alert('Error al enviar a la impresora.');
            }
        } catch (error) {
            console.error('Error de red al imprimir:', error);
            alert('No se pudo conectar con el servicio de impresión.');
        }
    };

    const handleOptionClick = useCallback((path) => {
        navigate(path);
        setMenuOpen(false);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} notifications={notifications} />
            <Sidebar
                isOpen={menuOpen}
                setIsOpen={setMenuOpen}
                quickAccessOptions={quickAccessOptions}
                onOptionClick={handleOptionClick}
                logo={Logo}
            />
            <main className="px-3 pb-16 pt-3">
                <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>

                    {/* Header Card */}
                    <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d9488] to-[#115e59] p-6 text-white shadow-lg">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 flex items-center justify-center opacity-20">
                            <Milk size={100} />
                        </div>
                        <div className="relative flex justify-between items-center">
                            <div className="flex flex-col">
                                <h1 className="mb-2 text-xl font-bold">Reporte de Retornables</h1>
                                <p className="text-teal-100 text-sm mb-4">Control de botellas pendientes por cliente</p>
                            </div>
                            <button
                                onClick={handlePrintReport}
                                className="bg-white text-[#0d9488] px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2 hover:bg-teal-50 transition-colors"
                            >
                                <Printer size={20} />
                                <span className="hidden sm:inline">Imprimir</span>
                            </button>
                        </div>
                    </div>

                    {/* Filtros y Busqueda */}
                    <div className="mb-4 space-y-3">
                        {/* Buscador */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all duration-300 focus:border-[#0d9488]"
                            />
                        </div>

                        {/* Filtros de Fecha */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Filter size={18} className="text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-700">Rango de Fechas:</span>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none">
                                        <input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 text-gray-700"
                                        />
                                    </div>
                                    <span className="text-gray-400 self-center">-</span>
                                    <div className="relative flex-1 sm:flex-none">
                                        <input
                                            type="date"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            min={fechaInicio}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 text-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumen Totales */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Clientes con Deuda</p>
                            <h3 className="text-2xl font-bold text-gray-800">{filteredReporte.length}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Botellas</p>
                            <h3 className="text-2xl font-bold text-[#0d9488]">
                                {filteredReporte.reduce((acc, curr) => acc + curr.totalBotellas, 0)}
                            </h3>
                        </div>
                    </div>

                    {/* Lista de Reportes */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9488] mx-auto"></div>
                                <p className="mt-2 text-gray-500 text-sm">Cargando reporte...</p>
                            </div>
                        ) : filteredReporte.length > 0 ? (
                            filteredReporte.map((cliente) => (
                                <div
                                    key={cliente.clienteId}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                                >
                                    {/* Cabecera Cliente */}
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold">
                                                {cliente.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{cliente.nombre}</h3>
                                                <p className="text-xs text-gray-500">ID: {cliente.clienteId.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-2">
                                            <Milk size={16} />
                                            {cliente.totalBotellas} Pendientes
                                        </div>
                                    </div>

                                    {/* Detalle de Ventas */}
                                    <div className="p-4 space-y-3">
                                        {cliente.ventas.map((venta, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm py-2 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
                                                <div className="mb-2 sm:mb-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        <span className="text-gray-600">
                                                            {new Date(venta.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-gray-500 font-medium h-6 px-2 bg-gray-100 rounded text-xs flex items-center">
                                                            Venta #{venta.ventaId.substring(0, 6)}
                                                        </span>
                                                    </div>
                                                    <div className="pl-6 space-y-1">
                                                        {venta.productos.map((prod, pIdx) => (
                                                            <p key={pIdx} className="text-gray-700 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 bg-[#45923a] rounded-full"></span>
                                                                {prod.nombre} <span className="text-gray-400">x{prod.cantidad}</span>
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end sm:justify-start gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-semibold self-start sm:self-center">
                                                    <span>{venta.pendientes}</span>
                                                    <span className="text-xs font-normal">debe(n)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-gray-900 font-medium mb-1">No se encontraron registros</h3>
                                <p className="text-gray-500 text-sm">Prueba ajustando el rango de fechas o la búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reportes;
