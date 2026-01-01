import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Package, Check, X, Store, Image as ImageIcon, ChevronLeft, ChevronRight, Filter, Eye, EyeOff, Layers, RotateCcw, Ban, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import NavbarVentasDestock from '../components/VentasDestock/NavbarVentasDestock';

const ConfigTiendaVirtual = () => {
    const navigate = useNavigate();
    const { todosLosProductos, loading, actualizarProducto, recargarProductos } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('publicado'); // 'publicado' | 'precio'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshingCache, setIsRefreshingCache] = useState(false);
    const ITEMS_PER_PAGE = 12;

    // Filtrar productos
    const filteredProducts = useMemo(() => {
        if (!todosLosProductos) return [];
        return todosLosProductos.filter(product => {
            const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesFilter = true;
            if (filterStatus !== 'all') {
                if (filterMode === 'publicado') {
                    matchesFilter = filterStatus === 'active' ? product.publicado : !product.publicado;
                } else if (filterMode === 'precio') {
                    matchesFilter = filterStatus === 'active' ? product.mostrar_precio_web : !product.mostrar_precio_web;
                } else if (filterMode === 'stock') {
                    matchesFilter = filterStatus === 'active' ? (Number(product.stock) > 0) : (Number(product.stock) <= 0);
                }
            }

            return matchesSearch && matchesFilter;
        });
    }, [todosLosProductos, searchTerm, filterMode, filterStatus]);

    // Reset page on filter change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMode, filterStatus]);

    // Paginación
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const currentProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Función para alternar estado de publicado
    const handleTogglePublicado = async (product) => {
        try {
            await actualizarProducto(product.id, {
                ...product,
                publicado: !product.publicado
            });
        } catch (error) {
            console.error("Error updating product published status:", error);
        }
    };

    // Función para alternar visibilidad de precio
    const handleTogglePrecioWeb = async (product) => {
        try {
            await actualizarProducto(product.id, {
                ...product,
                mostrar_precio_web: !product.mostrar_precio_web
            });
        } catch (error) {
            console.error("Error updating product price visibility:", error);
        }
    };

    // Helper para llamadas a la API
    const callApi = async (endpoint, method, body = null) => {
        const apiKey = import.meta.env.VITE_API_KEY;
        const apiUrl = import.meta.env.VITE_API_URL;

        const headers = {
            'x-api-key': apiKey
        };

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${apiUrl}${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("API Call failed:", error);
            throw error;
        }
    };

    // Función para gestionar Stock
    const handleStockAction = async (product) => {
        const currentStock = Number(product.stock) || 0;

        try {
            if (currentStock > 0) {
                // Si tiene stock, lo ponemos a 0
                if (window.confirm(`¿Dejar sin stock a "${product.nombre}"?`)) {
                    // 1. Actualizar Firestore
                    await actualizarProducto(product.id, {
                        ...product,
                        stock: 0
                    });

                    // 2. Actualizar Cache en Worker (sin bloquear la UI si falla, o esperando ambos)
                    // Hacemos la llamada a la API para notificar el cambio al cache
                    await callApi(`/productos/${product.id}/agotado`, 'PATCH');
                }
            } else {
                // Si no tiene stock, pedimos cantidad para reponer
                const quantity = window.prompt(`Ingrese cantidad a reponer para "${product.nombre}":`, "12");
                if (quantity !== null) {
                    const newStock = parseFloat(quantity);
                    if (!isNaN(newStock) && newStock > 0) {
                        // 1. Actualizar Firestore
                        await actualizarProducto(product.id, {
                            ...product,
                            stock: newStock
                        });

                        // 2. Actualizar Cache en Worker
                        // Hacemos la llamada a la API para notificar el cambio al cache
                        await callApi(`/productos/${product.id}/stock`, 'PATCH', { stock: newStock });
                    } else if (quantity !== "") {
                        alert("Por favor ingrese un número válido mayor a 0");
                    }
                }
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            // Opcional: Notificar al usuario si alguna de las dos falló, 
            // aunque actualizarProducto ya suele manejar sus errores.
            alert("Hubo un error al sincronizar el stock. Por favor verifica.");
        }
    };

    // Función para resetear el cache global
    const handleRefreshCache = async () => {
        if (window.confirm("¿Estás seguro de resetear el caché de la tienda virtual? Esto actualizará todos los productos en la tienda.")) {
            setIsRefreshingCache(true);
            try {
                await callApi('/cache/refresh', 'POST');
                alert("¡Caché reseteado correctamente!");
            } catch (error) {
                console.error("Error refreshing cache:", error);
                alert("Error al resetear el caché. Intenta nuevamente.");
            } finally {
                setIsRefreshingCache(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#45923a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando catálogo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Header / Navbar */}
            <div className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 sm:px-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 mr-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Store className="text-[#45923a]" /> Catálogo Web
                            </h1>
                            <p className="text-sm text-gray-500">
                                {filteredProducts.length} productos • Gestiona qué productos aparecen en tu tienda virtual
                            </p>
                        </div>
                    </div>

                    {/* Cache Reset Button */}
                    <button
                        onClick={handleRefreshCache}
                        disabled={isRefreshingCache}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm border border-gray-200"
                        title="Actualizar toda la tienda virtual"
                    >
                        <RefreshCw size={18} className={isRefreshingCache ? "animate-spin" : ""} />
                        {isRefreshingCache ? "Actualizando..." : "Resetear Caché"}
                    </button>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-center justify-between mt-4">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#45923a] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border focus:border-[#45923a]/30 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#45923a]/10 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Filter Controls */}
                        <div className="flex items-center gap-2">
                            {/* Mode Selector */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={filterMode}
                                    onChange={(e) => setFilterMode(e.target.value)}
                                    className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#45923a]/50 appearance-none cursor-pointer"
                                >
                                    <option value="publicado">Estado Publicación</option>
                                    <option value="precio">Visibilidad Precio</option>
                                    <option value="stock">Estado Stock</option>
                                </select>
                            </div>

                            {/* Filter Tabs */}
                            <div className="bg-gray-100 p-1 rounded-xl flex">
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === 'all'
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('active')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === 'active'
                                        ? 'bg-white text-[#45923a] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {filterMode === 'publicado' ? 'Publicados' : filterMode === 'precio' ? 'Con Precio' : 'Con Stock'}
                                </button>
                                <button
                                    onClick={() => setFilterStatus('inactive')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === 'inactive'
                                        ? 'bg-white text-amber-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {filterMode === 'publicado' ? 'Ocultos' : filterMode === 'precio' ? 'Sin Precio' : 'Sin Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Package size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No se encontraron productos</h3>
                        <p className="text-gray-500">Intenta buscar con otros términos o cambia el filtro.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                            {currentProducts.map(product => {
                                const isPublished = product.publicado;
                                return (
                                    <div
                                        key={product.id}
                                        className={`bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md flex flex-col ${isPublished ? 'border-gray-100 opacity-100' : 'border-gray-100 opacity-75 grayscale-[0.3]'
                                            }`}
                                    >
                                        {/* Header: Status */}
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${isPublished
                                                ? 'bg-emerald-50 text-[#45923a] border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {isPublished ? 'PUBLICADO' : 'OCULTO'}
                                            </span>
                                            <div className="relative">
                                                {/* Toggle Switch */}
                                                <button
                                                    onClick={() => handleTogglePublicado(product)}
                                                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${isPublished ? 'bg-[#45923a]' : 'bg-gray-300'
                                                        }`}
                                                    title={isPublished ? "Ocultar de la tienda" : "Publicar en la tienda"}
                                                >
                                                    <div
                                                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isPublished ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                {product.imagen ? (
                                                    <img src={product.imagen} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                                ) : (
                                                    <ImageIcon className="text-gray-300 w-8 h-8" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 truncate" title={product.nombre}>
                                                    {product.nombre}
                                                </h3>
                                                <p className="text-xs text-gray-400 capitalize truncate">{product.marca || 'Sin marca'}</p>
                                            </div>
                                        </div>

                                        {/* Stock Control */}
                                        <div className="mb-3 bg-gray-50 rounded-lg p-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Layers size={14} className="text-gray-400" />
                                                <span className={`text-xs font-bold ${Number(product.stock) > 0 ? 'text-gray-700' : 'text-red-500'}`}>
                                                    {Number(product.stock) > 0 ? `${product.stock} unid.` : 'Sin Stock'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleStockAction(product)}
                                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${Number(product.stock) > 0
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                                    : 'bg-emerald-100 text-[#45923a] hover:bg-emerald-200 border border-[#45923a]/20'
                                                    }`}
                                            >
                                                {Number(product.stock) > 0 ? (
                                                    <>
                                                        <Ban size={12} /> Agotar
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw size={12} /> Reponer
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Footer: Price */}
                                        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">Precio</span>
                                                    <button
                                                        onClick={() => handleTogglePrecioWeb(product)}
                                                        className={`p-0.5 rounded transition-colors ${product.mostrar_precio_web ? 'text-[#45923a] bg-emerald-50' : 'text-gray-400 hover:text-gray-600'}`}
                                                        title={product.mostrar_precio_web ? "Precio visible en web" : "Precio oculto en web"}
                                                    >
                                                        {product.mostrar_precio_web ? <Eye size={12} /> : <EyeOff size={12} />}
                                                    </button>
                                                </div>
                                                <span className={`text-lg font-bold ${product.mostrar_precio_web ? 'text-gray-800' : 'text-gray-400'}`}>
                                                    S/ {product.precio ? Number(product.precio).toFixed(2) : '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Unidad</span>
                                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
                                                    {product.tipo_unidad}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pb-8">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-gray-200 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all text-gray-600"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-bold text-gray-600 px-4">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-gray-200 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all text-gray-600"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default ConfigTiendaVirtual;
