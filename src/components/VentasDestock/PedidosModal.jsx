import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Clock, Search, Filter, Phone, User, Calendar, RefreshCcw, RefreshCw, CheckCircle, Package, Truck, AlertTriangle, Eye, ArrowLeft, Plus, Trash2, Save, Minus, Ban, Snowflake, Sun } from 'lucide-react';
import { usePedidos } from '../../context/PedidosContext';

const PedidosModal = ({ isOpen, onClose, products = [] }) => {
    const { pedidos, loading, actualizarEstadoPedido, actualizarPedidoCompleto } = usePedidos();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [editedItems, setEditedItems] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);
    const [invalidFields, setInvalidFields] = useState(new Set());

    // Substitution Logic State
    const [substitutionIndex, setSubstitutionIndex] = useState(null);
    const [substSearchTerm, setSubstSearchTerm] = useState('');

    // Inicializar items editables cuando se selecciona un pedido
    React.useEffect(() => {
        if (selectedPedido) {
            setEditedItems(selectedPedido.items?.map(item => {
                // Verificar si falta precio base y recuperarlo del caché
                let precioBaseToUse = parseFloat(item.precio_base);
                let isRecoveredPrice = false;

                // Si precioBaseToUse es NaN, null, undefined o 0, intentamos recuperar
                if (!precioBaseToUse || isNaN(precioBaseToUse) || precioBaseToUse === 0) {
                    if (products.length > 0) {
                        // Búsqueda por ID (más robusta)
                        let cachedProduct = products.find(p => String(p.id).trim() === String(item.id).trim());

                        // Si falla por ID, intento de borrado/recreado o ID distinto, buscar por Nombre exacto
                        if (!cachedProduct) {
                            cachedProduct = products.find(p => p.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim());
                        }

                        if (cachedProduct) {
                            precioBaseToUse = parseFloat(cachedProduct.precio);
                            isRecoveredPrice = true;
                        }
                    }
                }

                // Asegurar que no sea NaN para cálculos
                precioBaseToUse = isNaN(precioBaseToUse) ? 0 : precioBaseToUse;

                // REGLA: No recuperar precio verde para items de kilogramo (precio variable)
                if (item.tipo_unidad === 'kilogramo') {
                    isRecoveredPrice = false;
                }

                // Cálculo del precio final inicial
                let calculatedFinalPrice = 0;

                if (item.precio_final !== undefined && item.precio_final !== null) {
                    calculatedFinalPrice = item.precio_final;
                } else {
                    if (item.tipo_unidad === 'kilogramo') {
                        if (item.peso_solicitado_gramos) {
                            calculatedFinalPrice = precioBaseToUse * (item.peso_solicitado_gramos / 1000);
                        } else {
                            // Intentar extraer precio del detalle (ej. "S/ 3.00")
                            const priceMatch = item.detalle?.match(/S\/\.?\s*(\d+(\.\d+)?)/i);
                            if (priceMatch) {
                                calculatedFinalPrice = parseFloat(priceMatch[1]);
                            } else {
                                calculatedFinalPrice = 0;
                            }
                        }
                    } else {
                        const qty = item.cantidad_solicitada || 1;
                        const qtyHelada = parseFloat(item.cantidad_helada || 0);
                        const precioHelada = parseFloat(item.precio_helada || 0);

                        if (qtyHelada > 0 && precioHelada > 0) {
                            const qtyFresca = Math.max(0, qty - qtyHelada);
                            calculatedFinalPrice = (qtyHelada * precioHelada) + (qtyFresca * precioBaseToUse);
                        } else {
                            calculatedFinalPrice = precioBaseToUse * qty;
                        }
                    }
                }

                return {
                    ...item,
                    precio_base: precioBaseToUse,
                    precio_final: calculatedFinalPrice,
                    cantidad_final: item.cantidad_final ?? (item.cantidad_solicitada || 1),
                    peso_final: item.peso_final ?? (item.peso_solicitado_gramos || 0),
                    is_recovered_price: isRecoveredPrice
                };
            }) || []);
            setIsEditing(true);
        } else {
            setIsEditing(false);
            setEditedItems([]);
        }
    }, [selectedPedido, products]);

    // Handlers para edición
    const handleUpdateItem = (index, field, value) => {
        setEditedItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updated = { ...item, [field]: value };

                // Recalcular precio_final si cambia cantidad o precio_base (solo para items NO pesables)
                // Para pesables, el precio final es 100% manual, editado directamente.
                if (updated.tipo_unidad !== 'kilogramo') {
                    if (field === 'cantidad_final' || field === 'precio_base') {
                        const pBase = parseFloat(updated.precio_base) || 0;
                        const qty = parseFloat(updated.cantidad_final) || 0;
                        updated.precio_final = pBase * qty;
                    }
                }
                return updated;
            }
            return item;
        }));
    };

    const handleRemoveItem = (index) => {
        setEditedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddItem = (product) => {
        const newItem = {
            id: product.id,
            nombre: product.nombre,
            precio_base: parseFloat(product.precio),
            precio_final: parseFloat(product.precio),
            cantidad_solicitada: 1,
            cantidad_final: 1,
            tipo_unidad: product.tipo_unidad,
            imagen: product.imagen,
            estado_item: 'disponible',
            requiere_confirmacion: false,
            mostrar_precio_web: true
        };
        setEditedItems(prev => [...prev, newItem]);
        setProductSearchTerm('');
    };

    const handleAddSubstitute = (product) => {
        if (substitutionIndex === null) return;

        const parentItem = editedItems[substitutionIndex];

        const newItem = {
            id: product.id, // ID del Producto (sku)
            itemId: `sub-${Date.now()}`, // ID único en la lista del pedido
            nombre: product.nombre,
            precio_base: parseFloat(product.precio),
            precio_final: parseFloat(product.precio),
            cantidad_solicitada: 1,
            cantidad_final: 1,
            tipo_unidad: product.tipo_unidad,
            imagen: product.imagen,
            estado_item: 'disponible',
            requiere_confirmacion: false,
            // Marca para saber que es una propuesta de sustitución (no suma al total)
            es_sustituto: true,
            sustituye_a: parentItem.itemId, // VINCULACIÓN: ID del ítem que reemplaza
            mostrar_precio_web: true
        };

        const newItems = [...editedItems];
        // Insertar justo después del ítem que se está sustituyendo
        newItems.splice(substitutionIndex + 1, 0, newItem);

        setEditedItems(newItems);
        setSubstitutionIndex(null); // Cerrar catálogo
        setSubstSearchTerm('');
    };

    const handleMarkNoStock = (index) => {
        setEditedItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const isNoStock = item.estado_item === 'sin_stock'; // Currently no stock?

            // Update status
            newItems[index] = {
                ...item,
                estado_item: isNoStock ? 'disponible' : 'sin_stock',
                precio_final: isNoStock ? (item.precio_previo || item.precio_base) : 0, // Restore price if toggling back
                cantidad_final: isNoStock ? (item.cantidad_previo || 1) : 0,
                peso_final: isNoStock ? (item.peso_previo || 0) : 0,
                // Save previous values to restore if needed
                precio_previo: isNoStock ? undefined : item.precio_final,
                cantidad_previo: isNoStock ? undefined : item.cantidad_final,
                peso_previo: isNoStock ? undefined : item.peso_final
            };

            // If we are restoring (isNoStock was true), remove all following substitutes
            if (isNoStock) {
                let nextIndex = index + 1;
                while (nextIndex < newItems.length && newItems[nextIndex].es_sustituto) {
                    newItems.splice(nextIndex, 1);
                }
            } else {
                // If marking as No Stock, open substitution panel automatically
                setSubstitutionIndex(index);
            }

            return newItems;
        });
    };

    const handleConfirmarPedido = async () => {
        if (!selectedPedido) return;

        // Validar precios (ya existente)
        const itemsSinPrecio = editedItems.filter(item => {
            if (item.estado_item === 'sin_stock' || item.es_sustituto) return false;
            const price = parseFloat(item.precio_final);
            return isNaN(price) || price <= 0;
        });

        if (itemsSinPrecio.length > 0) {
            setInvalidFields(new Set(itemsSinPrecio.map((_, i) => i))); // Highlight logic
            setError(`Ingresa el precio final para: ${itemsSinPrecio.map(i => i.nombre).join(', ')}`);
            setTimeout(() => { setError(null); setInvalidFields(new Set()); }, 5000);
            return;
        }

        // Limpieza de datos: Solo enviamos lo necesario a Firestore (Firebase rechaza undefined)
        const itemsLimpios = editedItems.map(item => {
            const cleanItem = {
                itemId: item.itemId || item.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                id: item.id || null,
                productoId: item.productoId || item.id || null,
                nombre: item.nombre || "Producto",
                imagen: item.imagen || null,
                tipo_unidad: item.tipo_unidad || 'unidad',
                estado_item: item.estado_item || 'disponible',
                
                // Cantidades y Precios
                cantidad_solicitada: Number(item.cantidad_solicitada) || 0,
                cantidad_final: Number(item.cantidad_final) || 0,
                precio_base: (item.precio_base !== undefined && item.precio_base !== null) ? Number(item.precio_base) : 0,
                precio_final: (item.precio_final !== undefined && item.precio_final !== null) ? Number(item.precio_final) : 0,
                
                // Sustitución
                es_sustituto: item.es_sustituto === true,
                sustituye_a: item.sustituye_a || null,
                
                // UI / Flags
                mostrar_precio_web: item.mostrar_precio_web === true,
                detalle: item.detalle || null,
                requiere_confirmacion: item.requiere_confirmacion === true
            };
            return cleanItem;
        });

        // Detectar estado
        const hasSubstitutes = itemsLimpios.some(i => i.es_sustituto);
        const hasNoStock = itemsLimpios.some(i => i.estado_item === 'sin_stock');
        const hadConsultations = itemsLimpios.some(i => i.requiere_confirmacion);

        const needsConfirmation = hasSubstitutes || hasNoStock || hadConsultations;
        const nuevoEstado = needsConfirmation ? 'esperando_confirmacion' : 'preparando';

        // Calcular total final
        const total = itemsLimpios.reduce((sum, item) => {
             if (item.es_sustituto || item.estado_item === 'sin_stock') return sum;
             return sum + (parseFloat(item.precio_final) || 0);
        }, 0);

        // Limpiar objeto pago: Quitamos total_estimado y requiere_confirmacion para que no estorben ahí
        const nuevoPago = { ...(selectedPedido.pago || {}) };
        delete nuevoPago.total_estimado;
        delete nuevoPago.requiere_confirmacion;

        try {
            await actualizarPedidoCompleto(selectedPedido.id, {
                items: itemsLimpios,
                estado: nuevoEstado,
                // Colocamos el total en la raíz como pediste
                total_estimado: total, 
                // Sobreescribimos pago con la versión limpia
                pago: nuevoPago, 
                fecha_actualizacion: new Date(),
                revision: {
                    requiere_accion: needsConfirmation,
                    motivo: hasSubstitutes ? 'sustitutos' : (hasNoStock ? 'stock' : 'confirmacion_precio')
                }
            });
            console.log(`Pedido actualizado a: ${nuevoEstado}`);
            setSelectedPedido(null);
        } catch (error) {
            console.error("Error al confirmar pedido:", error);
            setError("Error al guardar cambios");
        }
    };

    // Productos filtrados para agregar (buscador)
    const availableProducts = productSearchTerm
        ? products.filter(p => p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()))
        : [];


    // Filtrar pedidos
    const filteredPedidos = pedidos.filter(pedido => {
        // Excluir cancelados
        if (pedido.estado === 'cancelado') return false;

        // Filtrar por búsqueda (nombre cliente o número orden)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const cliente = pedido.cliente?.nombre?.toLowerCase() || '';
            const orden = pedido.numeroOrden?.toLowerCase() || '';
            return cliente.includes(term) || orden.includes(term);
        }

        return true;
    });

    const formatCurrency = (amount) => {
        return `S/ ${parseFloat(amount || 0).toFixed(2)}`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // Manejar timestamp de Firestore
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'en_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'esperando_confirmacion': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'confirmada': return 'bg-green-100 text-green-800 border-green-200';
            case 'preparando': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'lista': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'entregada': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-[90vw] h-[90vh] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!selectedPedido ? (
                                <>
                                    {/* Header Listado */}
                                    <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col gap-4 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                                                    <ClipboardList className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-800">Gestión de Pedidos</h2>
                                                    <p className="text-sm text-gray-500">
                                                        {loading ? 'Cargando pedidos...' : `${pedidos.length} pedidos totales`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar cliente u orden..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                                                    />
                                                </div>
                                                <button
                                                    onClick={onClose}
                                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                                <p className="text-gray-500">Cargando pedidos...</p>
                                            </div>
                                        ) : filteredPedidos.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl mx-auto max-w-lg">
                                                <div className="bg-gray-50 p-4 rounded-full mb-4">
                                                    <Filter className="w-12 h-12 text-gray-300" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    No hay pedidos en esta sección
                                                </h3>
                                                <p className="text-gray-500">
                                                    No se encontraron pedidos en este momento.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {filteredPedidos.map(pedido => (
                                                    <div key={pedido.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                                        {/* Card Header */}
                                                        <div className="p-4 border-b border-gray-50 flex items-start justify-between bg-white">
                                                            <div className="flex items-center gap-3">
                                                                {pedido.cliente?.foto_url ? (
                                                                    <img
                                                                        src={pedido.cliente.foto_url}
                                                                        alt={pedido.cliente.nombre}
                                                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                                        {pedido.cliente?.nombre?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h3 className="font-bold text-gray-900">{pedido.cliente?.nombre}</h3>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        <span>{formatDate(pedido.fecha_creacion)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(pedido.estado)}`}>
                                                                {pedido.estado.replace('_', ' ')}
                                                            </div>
                                                        </div>

                                                        {/* Info Bar */}
                                                        <div className="px-4 py-2 bg-gray-50/50 flex items-center flex-wrap gap-4 text-xs text-gray-600 border-b border-gray-50">
                                                            <div className="flex items-center gap-1.5">
                                                                <Package className="w-4 h-4 text-gray-400" />
                                                                <span>ID: {pedido.numeroOrden || '---'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="w-4 h-4 text-gray-400" />
                                                                <span>{pedido.cliente?.telefono || 'Sin teléfono'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 ml-auto">
                                                                <span className="font-medium text-gray-500">Total Est:</span>
                                                                <span className="font-bold text-gray-900 text-sm">
                                                                    {formatCurrency(pedido.pago?.total_estimado)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Products List Refactored */}
                                                        <div className="flex-1 overflow-y-auto max-h-96 bg-gray-50 relative">
                                                            <div className={`p-4 space-y-3 transition-all duration-300 ${pedido.estado === 'pendiente' ? 'blur-md opacity-60 select-none pointer-events-none' : ''}`}>
                                                                {pedido.items?.map((item, index) => (
                                                                    <div key={index} className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                                        {/* Linea lateral de estado */}
                                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.estado_item === 'disponible' ? 'bg-green-500' : 'bg-red-500'}`} />

                                                                        {/* Imagen del producto */}
                                                                        <div className="w-16 h-16 rounded-lg bg-white border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                                                                            <img
                                                                                src={item.imagen}
                                                                                alt={item.nombre}
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        </div>

                                                                        {/* Detalles del producto */}
                                                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                                                            <div>
                                                                                <div className="flex justify-between items-start">
                                                                                    <h4 className="font-bold text-gray-800 text-sm leading-tight pr-2">
                                                                                        {item.nombre}
                                                                                    </h4>

                                                                                    {/* Precio o Estado "Por confirmar" */}
                                                                                    <div className="flex-shrink-0 text-right">
                                                                                        {(item.precio_final !== undefined && item.precio_final !== null) ? (
                                                                                            <span className="text-sm font-extrabold text-blue-600 block">
                                                                                                {formatCurrency(item.precio_final)}
                                                                                            </span>
                                                                                        ) : (item.mostrar_precio_web && item.precio_base !== null && item.precio_base > 0 ? (
                                                                                            <span className="text-sm font-extrabold text-gray-900 block">
                                                                                                {formatCurrency(
                                                                                                    item.tipo_unidad === 'kilogramo'
                                                                                                        ? (item.peso_solicitado_gramos ? item.precio_base * (item.peso_solicitado_gramos / 1000) : item.precio_base)
                                                                                                        : item.precio_base * item.cantidad_solicitada
                                                                                                )}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-orange-600 border border-orange-200 bg-orange-50 whitespace-nowrap">
                                                                                                Por confirmar
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Badges y Detalles Adicionales */}
                                                                                <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                                                                                    {/* Tipo de Unidad Badge */}
                                                                                    <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
                                                                                        {item.tipo_unidad === 'kilogramo' ? 'x Kg' : 'Unidad'}
                                                                                    </span>

                                                                                    {/* Helada Badge */}
                                                                                    {item.cantidad_helada > 0 && (
                                                                                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100 flex items-center gap-1">
                                                                                            <span className="text-xs">❄️</span>
                                                                                            {item.cantidad_helada} helada
                                                                                        </span>
                                                                                    )}

                                                                                    {/* Retornable Badge */}
                                                                                    {item.es_retornable && (
                                                                                        <span className="px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-medium border border-green-100">
                                                                                            Retornable
                                                                                        </span>
                                                                                    )}

                                                                                    {/* Detalle Texto (si existe, como "2 unid" o notas) */}
                                                                                    {item.detalle && (
                                                                                        <span className="px-1.5 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-medium border border-yellow-100">
                                                                                            {item.detalle}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Cantidad Solicitada Inferior */}
                                                                            <div className="mt-1">
                                                                                <span className="text-xs font-semibold text-gray-500">
                                                                                    Cant: <span className="text-gray-900 text-sm ml-1">
                                                                                        {item.detalle || (item.tipo_unidad === 'kilogramo' ? (
                                                                                            `${item.peso_final || item.peso_solicitado_gramos || 0} g`
                                                                                        ) : (
                                                                                            item.cantidad_final || item.cantidad_solicitada
                                                                                        ))}
                                                                                    </span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Botón Ver Productos Overlay */}
                                                            {
                                                                pedido.estado === 'pendiente' && (
                                                                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                await actualizarEstadoPedido(pedido.id, 'en_revision');
                                                                                setSelectedPedido(pedido);
                                                                            }}
                                                                            className="group flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-blue-600 font-bold"
                                                                        >
                                                                            <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                                                <Eye className="w-5 h-5" />
                                                                            </div>
                                                                            Ver Productos
                                                                        </button>
                                                                    </div>
                                                                )
                                                            }
                                                        </div>

                                                        {/* Actions Footer */}
                                                        {pedido.estado !== 'pendiente' && (
                                                            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setSelectedPedido(pedido)}
                                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                                >
                                                                    Gestionar Pedido
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Vista Detallada de Gestión */
                                <div className="flex flex-col h-full bg-gray-50 relative"> {/* Added relative here for substitution panel */}
                                    {/* Header Gestión */}
                                    <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col gap-4 flex-shrink-0 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setSelectedPedido(null)}
                                                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                                >
                                                    <ArrowLeft className="w-6 h-6" />
                                                </button>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-800">
                                                        Pedido #{selectedPedido.numeroOrden || selectedPedido.id.slice(0, 6)}
                                                    </h2>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span>{selectedPedido.cliente?.nombre}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(selectedPedido.fecha_creacion)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border ${getStatusColor(selectedPedido.estado)}`}>
                                                {selectedPedido.estado.replace('_', ' ')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Gestión - Lista Editable */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                                <h3 className="font-bold text-gray-900">Productos del Pedido</h3>
                                                <span className="text-sm text-gray-500">{editedItems.length} ítems</span>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Logic to group items with their substitutes */}
                                                {(() => {
                                                    const groups = [];
                                                    let currentGroup = null;

                                                    editedItems.forEach((item, index) => {
                                                        if (item.es_sustituto) {
                                                            if (currentGroup) {
                                                                currentGroup.subs.push({ item, index });
                                                            } else {
                                                                // Should not happen normally, but handle orphan
                                                                groups.push({ main: null, subs: [{ item, index }] });
                                                            }
                                                        } else {
                                                            currentGroup = { main: { item, index }, subs: [] };
                                                            groups.push(currentGroup);
                                                        }
                                                    });

                                                    return groups.map((group, gIndex) => (
                                                        <div key={gIndex} className="group-wrapper">
                                                            {/* Render Main Item */}
                                                            {group.main && ((() => {
                                                                const { item, index } = group.main;
                                                                const isNoStock = item.estado_item === 'sin_stock';
                                                                // ... (previous item render logic)
                                                                return (
                                                                    <div
                                                                        key={`${item.id}-${index}`}
                                                                        className={`p-4 rounded-xl border transition-all duration-300 bg-white border-blue-100 shadow-sm hover:shadow-md ${isNoStock ? 'bg-gray-50 border-gray-200 opacity-75' : ''}`}
                                                                    >
                                                                        <div className="grid grid-cols-12 gap-4 items-center">
                                                                            {/* Imagen */}
                                                                            <div className="col-span-1 relative">
                                                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                                                    <img
                                                                                        src={item.imagen || "https://via.placeholder.com/150"}
                                                                                        alt={item.nombre}
                                                                                        className={`w-full h-full object-cover ${isNoStock ? 'grayscale opacity-50' : ''}`}
                                                                                    />
                                                                                </div>
                                                                                {isNoStock && (
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                                                                                        <Ban className="text-red-500 w-6 h-6" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Info Editable */}
                                                                            <div className="col-span-4">
                                                                                <h4 className={`font-bold text-sm ${isNoStock ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.nombre}</h4>
                                                                                <span className="text-xs text-gray-500 block">
                                                                                    {item.tipo_unidad === 'kilogramo'
                                                                                        ? 'Precio variable'
                                                                                        : `Base: ${item.precio_base ? `S/ ${parseFloat(item.precio_base).toFixed(2)}` : 'S/ --'}`}
                                                                                </span>

                                                                                {(item.cantidad_helada > 0 && item.tipo_unidad !== 'kilogramo') && (
                                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 font-medium whitespace-nowrap">
                                                                                            <Snowflake size={10} strokeWidth={2.5} /> {item.cantidad_helada} Heladas
                                                                                        </span>
                                                                                        <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1 font-medium whitespace-nowrap">
                                                                                            <Sun size={10} strokeWidth={2.5} /> {Math.max(0, (item.cantidad_final || 0) - item.cantidad_helada)} Frescas
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Cantidad/Peso Input */}
                                                                            <div className="col-span-2 flex flex-col gap-1 items-center">
                                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">CANT.</label>
                                                                                {item.tipo_unidad === 'kilogramo' ? (
                                                                                    <div className="bg-yellow-50 text-yellow-800 px-2 py-1.5 rounded-lg font-bold text-xs text-center border border-yellow-100 flex items-center justify-center w-full shadow-sm">
                                                                                        {item.detalle || `${item.cantidad_solicitada} unid.`}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                                                                        <button
                                                                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white rounded shadow-sm disabled:opacity-50"
                                                                                            onClick={() => handleUpdateItem(index, 'cantidad_final', Math.max(1, (item.cantidad_final || 0) - 1))}
                                                                                            disabled={isNoStock}
                                                                                        >
                                                                                            <Minus size={12} />
                                                                                        </button>
                                                                                        <span className="text-sm font-bold w-4 text-center text-gray-900">{item.cantidad_final || 0}</span>
                                                                                        <button
                                                                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white rounded shadow-sm disabled:opacity-50"
                                                                                            onClick={() => handleUpdateItem(index, 'cantidad_final', (item.cantidad_final || 0) + 1)}
                                                                                            disabled={isNoStock}
                                                                                        >
                                                                                            <Plus size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Precio Final Input */}
                                                                            <div className="col-span-3 flex flex-col gap-1">
                                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Precio Final</label>
                                                                                <div className="relative">
                                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        disabled={isNoStock}
                                                                                        value={item.precio_final || ''}
                                                                                        onChange={(e) => {
                                                                                            handleUpdateItem(index, 'precio_final', parseFloat(e.target.value));
                                                                                            if (invalidFields.has(index)) {
                                                                                                const next = new Set(invalidFields);
                                                                                                next.delete(index);
                                                                                                setInvalidFields(next);
                                                                                            }
                                                                                        }}
                                                                                        className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                                                                            isNoStock
                                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200'
                                                                                            : invalidFields.has(index)
                                                                                                ? 'bg-red-50 text-red-900 border-red-300 ring-1 ring-red-200'
                                                                                                : item.is_recovered_price
                                                                                                    ? 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-200'
                                                                                                    : 'bg-white text-gray-900 border-gray-200'
                                                                                            }`}
                                                                                    />
                                                                                    {invalidFields.has(index) && (
                                                                                        <span className="text-[10px] text-red-500 font-bold absolute -bottom-4 right-0 bg-red-50 px-1 rounded animate-pulse">
                                                                                            ¡Ingresa precio!
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Actions */}
                                                                            <div className="col-span-2 flex justify-end gap-1">
                                                                                {/* Botón para añadir propuesta (parcial o adicional) */}
                                                                                {!isNoStock && (
                                                                                    <button
                                                                                        onClick={() => setSubstitutionIndex(index)}
                                                                                        className="p-2 rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
                                                                                        title="Añadir propuesta parcial"
                                                                                    >
                                                                                        <Plus size={18} />
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (isNoStock) {
                                                                                            handleMarkNoStock(index);
                                                                                            setSubstitutionIndex(null);
                                                                                        } else {
                                                                                            handleMarkNoStock(index);
                                                                                            setSubstitutionIndex(index);
                                                                                            setSubstSearchTerm('');
                                                                                        }
                                                                                    }}
                                                                                    className={`p-2 rounded-lg transition-colors ${isNoStock ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
                                                                                    title={isNoStock ? "Restaurar item" : "Marcar sin stock / Sustituir"}
                                                                                >
                                                                                    {isNoStock ? <RefreshCw size={18} /> : <Ban size={18} />}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleRemoveItem(index)}
                                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                                    title="Eliminar ítem"
                                                                                >
                                                                                    <Trash2 size={18} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })())}

                                                            {/* Render Substitutes for this item */}
                                                            {group.subs.length > 0 && (
                                                                <div className="mt-2 ml-4 flex gap-3 overflow-x-auto pb-2 pl-4 border-l-2 border-purple-200">
                                                                    {group.subs.map(({ item, index }) => (
                                                                        <div key={`sub-${index}`} className="flex-shrink-0 w-40 bg-purple-50 rounded-xl border border-purple-100 p-3 shadow-sm relative group">
                                                                            {/* Badge Propuesta */}
                                                                            <span className="absolute -top-2 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white uppercase tracking-wider shadow-sm">
                                                                                Propuesta
                                                                            </span>

                                                                            <button
                                                                                onClick={() => handleRemoveItem(index)}
                                                                                className="absolute top-2 right-2 p-1 text-purple-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>

                                                                            <div className="flex flex-col gap-2">
                                                                                <img
                                                                                    src={item.imagen}
                                                                                    alt={item.nombre}
                                                                                    className="w-full h-24 object-cover rounded-lg bg-white"
                                                                                />

                                                                                <div className="min-h-[2.5rem]">
                                                                                    <h4 className="font-bold text-xs text-gray-800 line-clamp-2 leading-tight">{item.nombre}</h4>
                                                                                </div>

                                                                                <div className="flex items-center justify-between gap-1">
                                                                                    <div className="flex items-center gap-1 bg-white rounded-md border border-purple-100 px-1 py-0.5">
                                                                                        <button
                                                                                            className="w-5 h-5 flex items-center justify-center text-gray-900 hover:bg-purple-100 rounded"
                                                                                            onClick={() => handleUpdateItem(index, 'cantidad_final', Math.max(1, (item.cantidad_final || 0) - 1))}
                                                                                        >
                                                                                            <Minus size={10} />
                                                                                        </button>
                                                                                        <span className="text-xs font-bold w-3 text-center text-gray-900">{item.cantidad_final || 1}</span>
                                                                                        <button
                                                                                            className="w-5 h-5 flex items-center justify-center text-gray-900 hover:bg-purple-100 rounded"
                                                                                            onClick={() => handleUpdateItem(index, 'cantidad_final', (item.cantidad_final || 0) + 1)}
                                                                                        >
                                                                                            <Plus size={10} />
                                                                                        </button>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-0.5">
                                                                                        <span className="text-[10px] text-purple-700 font-bold">S/</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            value={item.precio_base || ''}
                                                                                            onChange={(e) => handleUpdateItem(index, 'precio_base', parseFloat(e.target.value))}
                                                                                            className="w-12 text-sm font-bold text-purple-700 bg-transparent border-b border-purple-200 focus:border-purple-500 focus:outline-none text-right px-0"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    
                                                                    {/* Botón para añadir otra propuesta */}
                                                                    {group.main && (
                                                                        <button 
                                                                            onClick={() => setSubstitutionIndex(group.main.index)}
                                                                            className="flex-shrink-0 w-40 bg-white rounded-xl border-2 border-dashed border-purple-200 p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all group"
                                                                        >
                                                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                                                <Plus size={20} />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-purple-600 text-center leading-tight">
                                                                                Añadir otra<br/>propuesta
                                                                            </span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>

                                            {/* Panel Lateral de Sustitución (Overlay) */}
                                            {substitutionIndex !== null && (
                                                <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
                                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                                        <div>
                                                            <h3 className="font-bold text-gray-800">Sustituir Producto</h3>
                                                            <p className="text-xs text-gray-500">Se agregará debajo del ítem original</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSubstitutionIndex(null)}
                                                            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-3 bg-white border-b border-gray-100">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar producto..."
                                                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={substSearchTerm}
                                                                onChange={(e) => setSubstSearchTerm(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                                        {products
                                                            .filter(p => !substSearchTerm || p.nombre.toLowerCase().includes(substSearchTerm.toLowerCase()))
                                                            .slice(0, 20)
                                                            .map(product => (
                                                                <button
                                                                    key={product.id}
                                                                    onClick={() => handleAddSubstitute(product)}
                                                                    className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors text-left group border border-transparent hover:border-blue-100"
                                                                >
                                                                    <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                                                        <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-xs text-gray-900 truncate group-hover:text-blue-700">{product.nombre}</p>
                                                                        <p className="text-[10px] text-gray-500">
                                                                            Stock: {product.stock} | S/ {product.precio}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Plus size={16} />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        {products.filter(p => !substSearchTerm || p.nombre.toLowerCase().includes(substSearchTerm.toLowerCase())).length === 0 && (
                                                            <div className="text-center py-8 text-gray-400 text-xs">
                                                                No se encontraron productos
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Total */}
                                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                                <div className="text-sm text-gray-500">
                                                    <span className="block">Total Original: {formatCurrency(selectedPedido.pago?.total_estimado)}</span>
                                                    <span className="block text-xs mt-1">Modifica precios y cantidades según disponibilidad</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-medium text-gray-600">Total Final</span>
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        {formatCurrency(editedItems.reduce((sum, item) => {
                                                            // Los sustitutos no suman al total (el usuario elegirá)
                                                            if (item.es_sustituto) return sum;
                                                            return sum + (parseFloat(item.precio_final) || 0);
                                                        }, 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mensaje de Error (Validación) */}
                                    {error && (
                                        <div className="mx-6 mb-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
                                            <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                                            <p className="text-sm font-medium text-red-700">{error}</p>
                                        </div>
                                    )}

                                    {/* Footer Botones */}
                                    <div className="border-t border-gray-100 px-6 py-4 bg-white flex justify-end gap-3 flex-shrink-0 z-10">
                                        {selectedPedido.estado === 'esperando_confirmacion' ? (
                                            <div className="w-full bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-center gap-2 text-orange-700 font-bold animate-pulse">
                                                <Clock size={20} />
                                                Esperando respuesta del cliente...
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setSelectedPedido(null)}
                                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleConfirmarPedido}
                                                    className={`px-6 py-2.5 font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2 text-white ${
                                                        editedItems.some(i => i.es_sustituto || i.estado_item === 'sin_stock' || i.requiere_confirmacion)
                                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                                                        : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                                    }`}
                                                >
                                                    <Save size={20} />
                                                    {editedItems.some(i => i.es_sustituto || i.estado_item === 'sin_stock' || i.requiere_confirmacion)
                                                        ? 'Solicitar Confirmación'
                                                        : 'Aceptar y Preparar'
                                                    }
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-gray-100 px-6 py-4 bg-white flex justify-end flex-shrink-0">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PedidosModal;
