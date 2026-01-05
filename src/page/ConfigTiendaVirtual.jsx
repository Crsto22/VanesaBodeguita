import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Package, X, Store, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, EyeOff, Layers, RefreshCw, Loader2, ShoppingCart, ShoppingBag, CreditCard, Users, Truck, Barcode, Settings, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { motion, AnimatePresence } from 'framer-motion';

// Imports used in Dashboard
import Sidebar from '../components/Sidebar';
import Logo from '../assets/Logo.svg';
import Header from '../components/Header';

const ConfigTiendaVirtual = () => {
    const navigate = useNavigate();
    const { todosLosProductos, loading, actualizarProducto, categorias, obtenerCategoriaPorId } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filterMode, setFilterMode] = useState('publicado');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSinImagen, setFilterSinImagen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshingCache, setIsRefreshingCache] = useState(false);

    // Track loading states for specific actions on products
    // Structure: { [productId]: { publicado: boolean, precio: boolean, stock: boolean } }
    const [productLoadingStates, setProductLoadingStates] = useState({});

    const itemsPerPage = 18; // Adjusted for the new layout

    // Navigation state
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifications] = useState(3);
    const [appear, setAppear] = useState(false);

    useEffect(() => {
        setAppear(true);
    }, []);

    const quickAccessOptions = [
        { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registro rápido de ventas', path: '/ventas' },
        { id: 'compras', title: 'Compras', icon: <ShoppingBag className="h-6 w-6" />, color: 'bg-indigo-500', description: 'Registrar compras e inventario', path: '/compras' },
        { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
        { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes', path: '/clientes' },
        { id: 'proveedores', title: 'Proveedores', icon: <Truck className="h-6 w-6" />, color: 'bg-orange-500', description: 'Gestionar proveedores y contactos', path: '/proveedores' },
        { id: 'escaner', title: 'Escáner de Códigos', icon: <Barcode className="h-6 w-6" />, color: 'bg-violet-500', description: 'Consultar precios por código de barras', path: '/escaner' },
        { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo', path: '/productos' },
        { id: 'configuracion', title: 'Configuración', icon: <Settings className="h-6 w-6" />, color: 'bg-gray-500', description: 'Ajustes del sistema', path: '/configuracion' },
        { id: 'pagos-yape', title: 'Pagos Yape', icon: <CreditCard className="h-6 w-6" />, color: 'bg-purple-600', description: 'Visualizar pagos de Yape', path: '/pagos-yape' },
        { id: 'config-tienda', title: 'Tienda Virtual', icon: <Store className="h-6 w-6" />, color: 'bg-cyan-600', description: 'Configurar apariencia y opciones', path: '/configuracion-tienda' },
        { id: 'reportes', title: 'Reportes', icon: <FileText className="h-6 w-6" />, color: 'bg-teal-600', description: 'Ver reportes y estadísticas', path: '/reportes' },
    ];

    const handleOptionClick = useCallback((path) => {
        if (path === '/ventas') {
            const isMobile = window.innerWidth < 768;
            navigate(isMobile ? '/ventas' : '/ventas-destock');
        } else if (path === '/deudas') {
            const isLargeScreen = window.innerWidth >= 1024;
            navigate(isLargeScreen ? '/deudas-desktop' : '/deudas');
        } else {
            navigate(path);
        }
        setMenuOpen(false);
    }, [navigate]);

    const callApi = async (endpoint, method, body = null) => {
        const apiKey = import.meta.env.VITE_API_KEY;
        const apiUrl = import.meta.env.VITE_API_URL;

        const headers = { 'x-api-key': apiKey };
        if (body) headers['Content-Type'] = 'application/json';

        try {
            const response = await fetch(`${apiUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("API Call failed:", error);
            throw error;
        }
    };

    const handleRefreshCache = async () => {
        if (!window.confirm("⚠️ ¿Estás seguro de resetear el caché de la tienda virtual?")) {
            return;
        }
        
        setIsRefreshingCache(true);
        try {
            await callApi('/cache/refresh', 'POST');
            alert("✅ ¡Caché reseteado correctamente!");
        } catch (error) {
            console.error("Error al resetear el caché:", error);
            alert("❌ Error al resetear el caché. Intenta nuevamente.");
        } finally {
            setIsRefreshingCache(false);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!todosLosProductos) return [];
        return todosLosProductos.filter(product => {
            const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filtrar por categoría
            let matchesCategory = true;
            if (selectedCategory !== 'all') {
                matchesCategory = product.categoria_ref === selectedCategory;
            }
            
            // Filtrar por imagen
            let matchesImagen = true;
            if (filterSinImagen) {
                matchesImagen = !product.imagen || product.imagen.trim() === '';
            }
            
            let matchesFilter = true;
            if (filterStatus !== 'all') {
                if (filterMode === 'publicado') matchesFilter = filterStatus === 'active' ? product.publicado : !product.publicado;
                else if (filterMode === 'precio') matchesFilter = filterStatus === 'active' ? product.mostrar_precio_web : !product.mostrar_precio_web;
                else if (filterMode === 'stock') matchesFilter = filterStatus === 'active' ? (Number(product.stock) > 0) : (Number(product.stock) <= 0);
            }
            return matchesSearch && matchesCategory && matchesImagen && matchesFilter;
        });
    }, [todosLosProductos, searchTerm, selectedCategory, filterSinImagen, filterMode, filterStatus]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, filterSinImagen, filterMode, filterStatus]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const setProductLoading = (id, key, isLoading) => {
        setProductLoadingStates(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: isLoading }
        }));
    };

    const handleTogglePublicado = async (product) => {
        setProductLoading(product.id, 'publicado', true);
        try {
            await actualizarProducto(product.id, { ...product, publicado: !product.publicado });
        } catch (error) {
            console.error("Error updating published status:", error);
        } finally {
            setProductLoading(product.id, 'publicado', false);
        }
    };

    const handleTogglePrecioWeb = async (product) => {
        setProductLoading(product.id, 'precio', true);
        try {
            const newPrecioWebValue = !product.mostrar_precio_web;
            
            // Actualizar en Firebase primero
            await actualizarProducto(product.id, { ...product, mostrar_precio_web: newPrecioWebValue });
            
            // Sincronizar con la API externa
            const endpoint = newPrecioWebValue 
                ? `/productos/${product.id}/mostrar-precio`
                : `/productos/${product.id}/ocultar-precio`;
            
            await callApi(endpoint, 'PATCH');
        } catch (error) {
            console.error("Error updating price visibility:", error);
            alert("❌ Error al actualizar visibilidad de precio. Por favor, intenta nuevamente.");
        } finally {
            setProductLoading(product.id, 'precio', false);
        }
    };

    const handleStockAction = async (product) => {
        const currentStock = Number(product.stock) || 0;
        
        // Confirmación antes de establecer loading state
        if (currentStock > 0) {
            if (!window.confirm(`¿Dejar sin stock a "${product.nombre}"?`)) {
                return; // Usuario canceló
            }
        }

        setProductLoading(product.id, 'stock', true);

        try {
            if (currentStock > 0) {
                await actualizarProducto(product.id, { ...product, stock: 0 });
                await callApi(`/productos/${product.id}/agotado`, 'PATCH');
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Error al sincronizar stock. Por favor, intenta nuevamente.");
        } finally {
            setProductLoading(product.id, 'stock', false);
        }
    };

    // Manejo de acciones de stock (reponer o agotar)
    const onStockClick = async (product) => {
        const currentStock = Number(product.stock) || 0;

        if (currentStock <= 0) {
            // Producto agotado - solicitar reposición
            const quantity = window.prompt(`Ingrese cantidad a reponer para "${product.nombre}":`, "12");
            
            if (quantity === null) return; // Usuario canceló
            
            const newStock = parseFloat(quantity);
            
            if (isNaN(newStock) || newStock <= 0) {
                if (quantity !== "") {
                    alert("❌ Ingrese un número válido mayor a 0.");
                }
                return;
            }

            setProductLoading(product.id, 'stock', true);
            try {
                await actualizarProducto(product.id, { ...product, stock: newStock });
                await callApi(`/productos/${product.id}/stock`, 'PATCH', { stock: newStock });
            } catch (error) {
                console.error("Error al actualizar stock:", error);
                alert("❌ Error al actualizar stock. Por favor, intenta nuevamente.");
            } finally {
                setProductLoading(product.id, 'stock', false);
            }
        } else {
            // Producto con stock - marcar como agotado
            await handleStockAction(product);
        }
    }


    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #06b6d4;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #0e7490;
                }
            `}</style>

            <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} notifications={notifications} />
            <Sidebar isOpen={menuOpen} setIsOpen={setMenuOpen} quickAccessOptions={quickAccessOptions} onOptionClick={handleOptionClick} logo={Logo} />

            <main className="pb-16 pt-3">
                <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>

                    {/* Layout Principal: Sidebar + Hero + Filtros */}
                    <div className="flex gap-4 mx-3 mb-6">
                        {/* Sidebar de Categorías */}
                        <motion.div
                            className="w-72 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col sticky top-20 self-start"
                            style={{ maxHeight: 'calc(100vh - 100px)' }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="p-4 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-t-2xl flex-shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layers size={20} />
                                    Categorías
                                </h3>
                                <p className="text-sm text-cyan-100 mt-1">Filtrar por categoría</p>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Botón Todas las Categorías */}
                                <motion.button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`w-full p-4 text-left rounded-xl mb-3 transition-all shadow-sm ${
                                        selectedCategory === 'all'
                                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-md border border-gray-200'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">Todas las categorías</span>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                            selectedCategory === 'all'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {todosLosProductos?.length || 0}
                                        </span>
                                    </div>
                                </motion.button>

                                {/* Lista de Categorías */}
                                {categorias?.map((categoria) => {
                                    const productosEnCategoria = todosLosProductos?.filter(
                                        p => p.categoria_ref === categoria.id
                                    ).length || 0;

                                    return (
                                        <motion.button
                                            key={categoria.id}
                                            onClick={() => setSelectedCategory(categoria.id)}
                                            className={`w-full p-4 text-left rounded-xl mb-2 transition-all shadow-sm ${
                                                selectedCategory === categoria.id
                                                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-md border border-gray-200'
                                            }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold truncate">{categoria.nombre}</span>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ml-2 shrink-0 ${
                                                    selectedCategory === categoria.id
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {productosEnCategoria}
                                                </span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Contenedor derecho: Hero + Filtros */}
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Header */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06b6d4] to-[#0e7490] p-6 text-white shadow-lg">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-40 flex items-center justify-center opacity-10">
                                    <Store size={150} />
                                </div>
                                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h1 className="mb-2 text-2xl font-bold flex items-center gap-3"><Store /> Configuración Tienda Virtual</h1>
                                        <p className="text-cyan-100 text-sm">Administra la visibilidad y disponibilidad de tus productos</p>
                                    </div>
                                    <button onClick={handleRefreshCache} disabled={isRefreshingCache} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold shadow-md transition-all ${isRefreshingCache ? 'bg-cyan-800/50 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'}`}>
                                        <RefreshCw size={20} className={isRefreshingCache ? "animate-spin" : ""} />
                                        <span>{isRefreshingCache ? "Reseteando..." : "Resetear Caché"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 sticky top-20 z-20">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                            <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" />
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['publicado', 'precio', 'stock'].map(mode => (
                                <button key={mode} onClick={() => { setFilterMode(mode); setFilterStatus('all'); }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${filterMode === mode ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Todos</button>
                            <button onClick={() => setFilterStatus('active')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{filterMode === 'stock' ? 'Con Stock' : 'Activos'}</button>
                            <button onClick={() => setFilterStatus('inactive')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterStatus === 'inactive' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{filterMode === 'stock' ? 'Agotados' : 'Inactivos'}</button>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setFilterSinImagen(!filterSinImagen)} 
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                    filterSinImagen 
                                        ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <ImageIcon size={14} />
                                Sin Imagen
                                {filterSinImagen && (
                                    <span className="bg-orange-200 text-orange-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                        {filteredProducts.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Grid de Productos */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div key={n} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 animate-pulse flex h-32">
                                    <div className="w-28 bg-gray-200 rounded-lg h-full mr-3 shrink-0"></div>
                                    <div className="flex-1 py-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                            {currentProducts.map((product) => {
                                const currentStock = Number(product.stock) || 0;
                                const hasStock = currentStock > 0;
                                const loadingState = productLoadingStates[product.id] || {};

                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-row h-36"
                                    >
                                        {/* Left: Image (Full Contain) */}
                                        <div className="w-32 bg-white p-2 flex items-center justify-center shrink-0 border-r border-gray-50 relative">
                                            {product.imagen ? (
                                                <img src={product.imagen} alt={product.nombre} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-300">
                                                    <ImageIcon size={32} />
                                                    <span className="text-[10px]">Sin imagen</span>
                                                </div>
                                            )}
                                            {/* Stock Badge Overlay (Small) */}
                                            {hasStock ? (
                                                <div className="absolute top-1 right-1 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 shadow-sm">
                                                    {currentStock} unid.
                                                </div>
                                            ) : (
                                                <div className="absolute top-1 right-1 bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-200 shadow-sm">
                                                    Agotado
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Data & Controls */}
                                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm leading-tight truncate mb-1" title={product.nombre}>
                                                    {product.nombre}
                                                </h3>
                                                <p className="text-[11px] text-gray-500 line-clamp-1 h-4">
                                                    {product.descripcion || 'Sin descripción'}
                                                </p>
                                            </div>

                                            <div className="space-y-2 mt-1">
                                                {/* Button Row 1: Toggles */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleTogglePublicado(product)}
                                                        disabled={loadingState.publicado}
                                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${product.publicado
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                                : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {loadingState.publicado ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${product.publicado ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                                                {product.publicado ? 'Visible' : 'Oculto'}
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleTogglePrecioWeb(product)}
                                                        disabled={loadingState.precio}
                                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${product.mostrar_precio_web
                                                                ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                                                                : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {loadingState.precio ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                {product.mostrar_precio_web ? <Eye size={12} /> : <EyeOff size={12} />}
                                                                {product.mostrar_precio_web ? `S/ ${product.precio}` : 'Privado'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Button Row 2: Stock */}
                                                <button
                                                    onClick={() => onStockClick(product)}
                                                    disabled={loadingState.stock}
                                                    className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm border ${hasStock
                                                            ? 'bg-white text-red-600 border-red-100 hover:bg-red-50'
                                                            : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                                        }`}
                                                >
                                                    {loadingState.stock ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        hasStock ? "Marcar Agotado" : "Reponer Stock"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredProducts.length > 0 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-600">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-600">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {filteredProducts.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300"><Search size={32} /></div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1">No se encontraron productos</h3>
                            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
            </main>
        </div>
    );
};

export default ConfigTiendaVirtual;
