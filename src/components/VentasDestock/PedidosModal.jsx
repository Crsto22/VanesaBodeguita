import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Clock, Search, Filter, Phone, User, Calendar, RefreshCcw, RefreshCw, CheckCircle, Package, Truck, AlertTriangle, Eye, ArrowLeft, Plus, Trash2, Save, Minus, Ban, Snowflake, Sun, Loader2, Smartphone, Banknote } from 'lucide-react';
import { usePedidos } from '../../context/PedidosContext';

const CATEGORIA_BEBIDAS = [
    '3gWRZpqiZd5gTLW1snA5',
    'nJNDfSudN4nVc0hxFgo7',
    'qCHp55SbEtWiSQiK4nK6',
    'uCPsgvGyH2VYN9Ai1RCD'
];

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
    const [isProcessing, setIsProcessing] = useState(false);

    // Ref para evitar resets innecesarios de editedItems si solo cambia el pago
    const prevItemsSignature = React.useRef("");

    // Inicializar items editables cuando se selecciona un pedido
    React.useEffect(() => {
        if (selectedPedido) {
            // Verificar si los items realmente cambiaron antes de resetear el estado local
            const currentSignature = JSON.stringify(selectedPedido.items);
            if (currentSignature === prevItemsSignature.current) {
                return; // Los items son idénticos, no re-inicializar (preserva edits locales)
            }
            prevItemsSignature.current = currentSignature;

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
                                // Usar precio base directo, sin calcular por peso
                                calculatedFinalPrice = precioBaseToUse;
                            }
                        }
                    } else {
                        const qty = item.cantidad_solicitada || 1;
                        const qtyHelada = parseFloat(item.cantidad_helada || 0);
                        const precioHelada = parseFloat(item.precio_helada || 0);

                        if (qtyHelada > 0 && precioHelada > 0) {
                            const qtyFresca = Math.max(0, qty - qtyHelada);
                            calculatedFinalPrice = parseFloat(((qtyHelada * precioHelada) + (qtyFresca * precioBaseToUse)).toFixed(2));
                        } else {
                            calculatedFinalPrice = parseFloat((precioBaseToUse * qty).toFixed(2));
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

    // Sincronización en tiempo real del estado del pedido (Para actualización inmediata sin recargar)
    React.useEffect(() => {
        if (selectedPedido) {
            const updatedPedido = pedidos.find(p => p.id === selectedPedido.id);
            if (updatedPedido) {
                const statusChanged = updatedPedido.estado !== selectedPedido.estado;
                const isWaiting = selectedPedido.estado === 'esperando_confirmacion';
                const pagoChanged = JSON.stringify(updatedPedido.pago) !== JSON.stringify(selectedPedido.pago);

                // Actualizamos SI:
                // 1. El estado cambió (fundamental para el flujo)
                // 2. Hubo cambios en la info de PAGO (Requerido para feedback tiempo real cliente)
                // 3. O estamos esperando confirmación y hubo cualquier cambio general
                if (statusChanged || pagoChanged || (isWaiting && JSON.stringify(updatedPedido) !== JSON.stringify(selectedPedido))) {
                    console.log("Sincronizando pedido en tiempo real...", { statusChanged, pagoChanged });
                    setSelectedPedido(updatedPedido);
                }
            }
        }
    }, [pedidos]); // Dependencia solo en pedidos para revisar cuando cambie la data global

    // Handlers para edición
    const handleUpdateItem = (index, field, value) => {
        setEditedItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updated = { ...item, [field]: value };

                // Recalcular precio_final si cambia cantidad o precio_base (solo para items NO pesables)
                // Para pesables, el precio final es 100% manual, editado directamente.
                if (updated.tipo_unidad !== 'kilogramo') {
                    if (field === 'cantidad_final') {
                        const newQty = parseFloat(value) || 0;
                        const originalQty = parseFloat(updated.cantidad_solicitada) || 0;

                        // Lógica de Stock Parcial automática
                        // Lógica de Stock Parcial automática
                        if (newQty < originalQty && newQty > 0) {
                            updated.estado_item = 'stock_parcial';
                            updated.requiere_confirmacion = true;
                        
                        } else if (newQty === originalQty) {
                            if (updated.estado_item === 'stock_parcial') {
                                updated.estado_item = 'disponible';
                                updated.requiere_confirmacion = false;
                            }
                        } else if (newQty === 0) {
                            updated.estado_item = 'sin_stock';
                            updated.requiere_confirmacion = true;
                        }

                        // Ajustar cantidad helada si excede la nueva cantidad
                        if (updated.cantidad_helada > newQty) {
                            updated.cantidad_helada = newQty;
                        }
                    }

                    if (field === 'cantidad_helada') {
                        const maxQty = parseFloat(updated.cantidad_final) || 0;
                        const newHelada = Math.min(Math.max(0, parseFloat(value) || 0), maxQty);
                        updated.cantidad_helada = newHelada;
                    }

                    // Recalculate price considering cold units if applicable
                    if (field === 'cantidad_final' || field === 'precio_base' || field === 'cantidad_helada') {
                        const pBase = parseFloat(updated.precio_base) || 0;
                        const qty = parseFloat(updated.cantidad_final) || 0;
                        const qtyHelada = parseFloat(updated.cantidad_helada) || 0;
                        
                        // Si hay precio diferenciado por helada (asumimos +0.00 por ahora o lógica futura, 
                        // pero aquí respetamos el precio base para todo SALVO que el usuario edite manualmente)
                        // Si el producto tuviera precio_helada en DB, se usaría aquí.
                        // Por ahora el precio es uniforme según tu lógica actual:
                        updated.precio_final = parseFloat((pBase * qty).toFixed(2));
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

        // Calcular cantidad faltante para sugerir
        let suggestedQty = 1;
        if (parentItem.estado_item === 'stock_parcial') {
            suggestedQty = Math.max(1, (parentItem.cantidad_solicitada || 1) - (parentItem.cantidad_final || 0));
        } else if (parentItem.estado_item === 'sin_stock') {
            suggestedQty = parentItem.cantidad_solicitada || 1;
        }

        const newItem = {
            id: product.id, // ID del Producto (sku)
            itemId: `sub-${Date.now()}`, // ID único en la lista del pedido
            nombre: product.nombre,
            categoria_ref: product.categoria_ref, // <--- IMPORTANTE: Copiar la categoría para validar si es bebida
            precio_base: parseFloat(product.precio),
            precio_final: parseFloat((parseFloat(product.precio) * suggestedQty).toFixed(2)),
            cantidad_solicitada: suggestedQty,
            cantidad_final: suggestedQty,
            cantidad_helada: 0, // Inicializar en 0 por defecto
            tipo_unidad: product.tipo_unidad,
            imagen: product.imagen,
            estado_item: 'disponible',
            requiere_confirmacion: false,
            // Marca para saber que es una propuesta de sustitución (no suma al total)
            es_sustituto: true,
            sustituye_a: parentItem.itemId, // VINCULACIÓN: ID del ítem que reemplaza
            mostrar_precio_web: true,
            es_retornable: product.retornable === true // <--- NUEVO: Indicar si es retornable
        };

        const newItems = [...editedItems];
        // Insertar justo después del ítem que se está sustituyendo
        newItems.splice(substitutionIndex + 1, 0, newItem);

        setEditedItems(newItems);
        setSubstitutionIndex(null); // Cerrar catálogo
        setSubstSearchTerm('');
    };

    // Función específica para agregar el MISMO producto como sustituto "Al tiempo"
    const handleAddAmbientSubstitute = () => {
        if (substitutionIndex === null) return;
        const parentItem = editedItems[substitutionIndex];

        // Calcular faltante
        const missingQty = Math.max(1, (parentItem.cantidad_solicitada || 1) - (parentItem.cantidad_final || 0));

        const newItem = {
            id: parentItem.id,
            itemId: `sub-${Date.now()}-ambient`,
            nombre: parentItem.nombre,
            precio_base: parseFloat(parentItem.precio_base),
            precio_final: parseFloat((parseFloat(parentItem.precio_base) * missingQty).toFixed(2)),
            cantidad_solicitada: missingQty,
            cantidad_final: missingQty,
            tipo_unidad: parentItem.tipo_unidad,
            imagen: parentItem.imagen,
            estado_item: 'disponible',
            requiere_confirmacion: false,
            es_sustituto: true,
            sustituye_a: parentItem.itemId,
            mostrar_precio_web: true,
            detalle: "Sin helar", // Mágica etiqueta
            cantidad_helada: 0 // Explícitamente no helada
        };

        const newItems = [...editedItems];
        newItems.splice(substitutionIndex + 1, 0, newItem);
        setEditedItems(newItems);
        setSubstitutionIndex(null);
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
            // Usamos spread para mantener TODOS los campos originales (incluido cantidad_helada)
            const cleanItem = {
                ...item, // <--- ESTO ES LA CLAVE: Mantenemos todo lo que ya tenía el item

                itemId: item.itemId || item.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                id: item.id || null,
                productoId: item.productoId || item.id || null,
                nombre: item.nombre || "Producto",
                imagen: item.imagen || null,
                tipo_unidad: item.tipo_unidad || 'unidad',
                estado_item: item.estado_item || 'disponible',

                // Aseguramos tipos numéricos
                cantidad_solicitada: Number(item.cantidad_solicitada) || 0,
                cantidad_final: Number(item.cantidad_final) || 0,
                // Mantener cantidad_helada si existe, asegurando que sea número
                cantidad_helada: (item.cantidad_helada !== undefined) ? Number(item.cantidad_helada) : undefined,

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

            // Limpiar undefineds explícitos si los hubiera (opcional, pero buena práctica para Firebase)
            Object.keys(cleanItem).forEach(key => cleanItem[key] === undefined && delete cleanItem[key]);

            return cleanItem;
        });

        // Detectar estado
        const hasSubstitutes = itemsLimpios.some(i => i.es_sustituto);
        const hasStockIssues = itemsLimpios.some(i => i.estado_item === 'sin_stock' || i.estado_item === 'stock_parcial');
        const hadConsultations = itemsLimpios.some(i => i.requiere_confirmacion);

        const needsConfirmation = hasSubstitutes || hasStockIssues || hadConsultations;
        const nuevoEstado = needsConfirmation ? 'esperando_confirmacion' : 'preparando';

        // Calcular total final
        const total = itemsLimpios.reduce((sum, item) => {
            if (item.es_sustituto || item.estado_item === 'sin_stock') return sum;
            // Nota: Items stock_parcial SI suman al total (con su precio_final reducido)
            return sum + (parseFloat(item.precio_final) || 0);
        }, 0);

        // Limpiar objeto pago: Quitamos total_estimado y requiere_confirmacion para que no estorben ahí
        const nuevoPago = { ...(selectedPedido.pago || {}) };
        delete nuevoPago.total_estimado;
        delete nuevoPago.requiere_confirmacion;

        try {
            setIsProcessing(true);
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
                    motivo: hasStockIssues ? 'stock' : (hasSubstitutes ? 'sustitutos' : 'confirmacion_precio')
                }
            });
            console.log(`Pedido actualizado a: ${nuevoEstado}`);
            
            if (nuevoEstado === 'esperando_confirmacion') {
                // Mantenemos modal abierto y actualizamos estado local
                setSelectedPedido(prev => ({ ...prev, estado: nuevoEstado }));
            } else {
                setSelectedPedido(null);
            }
        } catch (error) {
            console.error("Error al confirmar pedido:", error);
            setError("Error al guardar cambios");
        } finally {
            setIsProcessing(false);
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] transition-opacity duration-300"
                    />

                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 font-sans">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="bg-gray-50 rounded-[2rem] shadow-2xl w-full max-w-[1400px] h-[90vh] flex flex-col overflow-hidden border border-white/20 relative ring-1 ring-black/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!selectedPedido ? (
                                <div className="flex flex-col h-full bg-[#f8fbff]">
                                    {/* Header Listado */}
                                    <div className="bg-white px-8 py-6 border-b border-slate-100 flex-shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-blue-500/30 text-white transform rotate-3 hover:rotate-6 transition-transform duration-300">
                                                    <ClipboardList className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Control de Pedidos</h2>
                                                    <p className="text-sm text-slate-500 font-medium mt-1">
                                                        {loading ? 'Sincronizando...' : `${filteredPedidos.length} órdenes en curso`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <div className="relative group flex-1 md:flex-none">
                                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar cliente, orden..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full md:w-80 pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white border focus:border-blue-500/30 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 shadow-inner"
                                                    />
                                                </div>
                                                <button
                                                    onClick={onClose}
                                                    className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-slate-400 border border-transparent hover:border-red-100"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Listado */}
                                    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <div className="p-4 bg-white rounded-full shadow-lg mb-4">
                                                    <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
                                                </div>
                                                <p className="text-slate-500 font-medium animate-pulse">Cargando...</p>
                                            </div>
                                        ) : filteredPedidos.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] mx-auto max-w-xl bg-white/50">
                                                <div className="bg-slate-100 p-6 rounded-full mb-6">
                                                    <Filter className="w-12 h-12 text-slate-300" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 mb-2">Sin resultados</h3>
                                                <p className="text-slate-500">No hay pedidos que coincidan con tu búsqueda.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                                                {filteredPedidos.map(pedido => {
                                                    const isPendiente = pedido.estado === 'pendiente';
                                                    return (
                                                        <div
                                                            key={pedido.id}
                                                            onClick={() => !isPendiente && setSelectedPedido(pedido)}
                                                            className={`bg-white rounded-[2rem] p-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative border border-slate-100 h-full flex flex-col ${!isPendiente ? 'cursor-pointer' : 'cursor-default'}`}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                            <div className="relative z-10 p-5 flex-1 flex flex-col gap-5">
                                                                {/* Header Card */}
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="relative">
                                                                            {pedido.cliente?.foto_url ? (
                                                                                <img src={pedido.cliente.foto_url} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-1 ring-slate-100" />
                                                                            ) : (
                                                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl shadow-inner border border-white">
                                                                                    {pedido.cliente?.nombre?.charAt(0).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${isPendiente ? 'bg-amber-400' : 'bg-emerald-500'}`}>
                                                                                {isPendiente && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{pedido.cliente?.nombre}</h3>
                                                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(pedido.estado)}`}>
                                                                                    {pedido.estado.replace('_', ' ')}
                                                                                </span>
                                                                                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Clock size={10} /> {formatDate(pedido.fecha_creacion).split(',')[1]}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Preview Productos */}
                                                                <div className="bg-slate-50 rounded-2xl p-4 relative overflow-hidden flex-1 group/preview border border-slate-100">
                                                                    {isPendiente && (
                                                                        <div className="absolute inset-0 z-20 backdrop-blur-[3px] bg-white/60 flex items-center justify-center transition-all">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    actualizarEstadoPedido(pedido.id, 'en_revision');
                                                                                    setSelectedPedido(pedido);
                                                                                }}
                                                                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border border-blue-400/50"
                                                                            >
                                                                                <Eye className="w-4 h-4" /> Ver Pedido
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    <div className={`flex gap-3 overflow-hidden ${isPendiente ? 'opacity-40 blur-[1px] grayscale-0' : ''}`}>
                                                                        {pedido.items?.slice(0, 4).map((item, idx) => (
                                                                            <div key={idx} className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex-shrink-0 shadow-sm">
                                                                                <img src={item.imagen} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                                                            </div>
                                                                        ))}
                                                                        {(pedido.items?.length > 4) && (
                                                                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 shadow-inner">
                                                                                +{pedido.items.length - 4}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="mt-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{pedido.items?.length || 0} ITEMS</p>
                                                                </div>

                                                                {/* Footer Price */}
                                                                <div className="flex items-end justify-between px-1 border-t border-slate-50 pt-3">
                                                                    <span className="text-xs font-semibold text-slate-400">Total Estimado</span>
                                                                    <span className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                                                        {formatCurrency(pedido.total_estimado || pedido.pago?.total_estimado || 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full bg-slate-50 relative font-sans">
                                    {/* Header Gestión Premium */}
                                    <div className="bg-white/90 backdrop-blur-md px-6 py-4 flex flex-col gap-4 flex-shrink-0 z-20 shadow-sm sticky top-0 border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <button
                                                    onClick={() => setSelectedPedido(null)}
                                                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                                            ORDEN #{selectedPedido.numeroOrden || selectedPedido.id.slice(0, 6)}
                                                        </h2>
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(selectedPedido.estado)}`}>
                                                            {selectedPedido.estado.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                        <span className="font-bold text-slate-700">{selectedPedido.cliente?.nombre}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-600">
                                                            <Clock size={11} />
                                                            {formatDate(selectedPedido.fecha_creacion)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Gestión - Lista Editable */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 custom-scrollbar">
                                        
                                        {/* Payment Info Card */}
                                        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden mb-6 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group/toggle">
                                                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm transition-all duration-300 ${selectedPedido.pago?.rechazo_vuelto ? 'bg-red-50 border-red-100 text-red-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                        {selectedPedido.pago?.metodo === 'efectivo' ? <Banknote size={24} strokeWidth={2} /> : <Smartphone size={24} strokeWidth={2} />}
                                                    </div>
                                                    
                                                    {/* Toggle Button for Cash Rejection */}
                                                    {selectedPedido.pago?.metodo === 'efectivo' && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!selectedPedido) return;

                                                                const newValue = !selectedPedido.pago?.rechazo_vuelto;

                                                                // Optimistic update
                                                                setSelectedPedido(prev => ({
                                                                    ...prev,
                                                                    pago: {
                                                                        ...prev.pago,
                                                                        rechazo_vuelto: newValue
                                                                    }
                                                                }));

                                                                try {
                                                                    // Immediate save to Firestore
                                                                    const nuevoPago = { 
                                                                        ...selectedPedido.pago, 
                                                                        rechazo_vuelto: newValue 
                                                                    };
                                                                    // Clean up fields just in case
                                                                    delete nuevoPago.total_estimado;
                                                                    delete nuevoPago.requiere_confirmacion;

                                                                    await actualizarPedidoCompleto(selectedPedido.id, {
                                                                        pago: nuevoPago,
                                                                        fecha_actualizacion: new Date()
                                                                    });
                                                                    // Success!
                                                                    // (State is already updated optimistically)
                                                                } catch (err) {
                                                                    console.error("Error updating rejection status:", err);
                                                                    // Revert on error
                                                                    setSelectedPedido(prev => ({
                                                                        ...prev,
                                                                        pago: {
                                                                            ...prev.pago,
                                                                            rechazo_vuelto: !newValue
                                                                        }
                                                                    }));
                                                                }
                                                            }}
                                                            className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all z-10 ${selectedPedido.pago?.rechazo_vuelto ? 'bg-red-500 text-white rotate-180' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                                            title={selectedPedido.pago?.rechazo_vuelto ? "Cancelar rechazo (Dejar de esperar)" : "Rechazar billete/vuelto"}
                                                        >
                                                            {selectedPedido.pago?.rechazo_vuelto ? <X size={14} strokeWidth={3} /> : <ArrowLeft size={14} strokeWidth={3} className="rotate-[-45deg]" />}
                                                        </button>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Método de Pago</p>
                                                    <p className="text-base font-black text-slate-800 capitalize flex items-center gap-2">
                                                        {selectedPedido.pago?.metodo === 'efectivo' ? 'Efectivo' : 'Yape / Plin'}
                                                        {selectedPedido.pago?.metodo === 'efectivo' && (
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                                                                Contraentrega
                                                            </span>
                                                        )}
                                                        {selectedPedido.pago?.metodo === 'efectivo' && selectedPedido.pago?.rechazo_vuelto && (
                                                            <span className="px-2 py-0.5 bg-red-100 rounded text-[10px] font-bold text-red-600 border border-red-200 uppercase flex items-center gap-1 animate-pulse">
                                                                <AlertTriangle size={10} strokeWidth={3} /> Esperando Cliente...
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedPedido.pago?.metodo === 'efectivo' && (
                                                <div className={`flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 relative transition-all duration-300 ${selectedPedido.pago?.rechazo_vuelto ? 'opacity-40 blur-[1px] select-none pointer-events-none' : ''}`}>
                                                    {selectedPedido.pago?.rechazo_vuelto && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                                                                EN REVISIÓN
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Paga con</p>
                                                        <p className="text-sm font-bold text-slate-700 font-mono">
                                                            {formatCurrency(selectedPedido.pago?.monto_paga_con || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vuelto</p>
                                                        </div>
                                                        {(() => {
                                                            // Calculate dynamic total
                                                            const currentTotal = editedItems.reduce((sum, item) => {
                                                                if (item.es_sustituto || item.estado_item === 'sin_stock') return sum;
                                                                return sum + (parseFloat(item.precio_final) || 0);
                                                            }, 0);
                                                            
                                                            const vuelto = (parseFloat(selectedPedido.pago?.monto_paga_con) || 0) - currentTotal;
                                                            
                                                            return (
                                                                <p className={`text-xl font-black font-mono ${vuelto < 0 ? 'text-red-500' : 'text-emerald-600'} ${selectedPedido.pago?.rechazo_vuelto ? 'line-through opacity-50' : ''}`}>
                                                                    {formatCurrency(vuelto)}
                                                                </p>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden mb-6">
                                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                    <Package size={18} className="text-blue-600" />
                                                    Productos del Pedido
                                                </h3>
                                                <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                                                    {editedItems.length} ítems
                                                </span>
                                            </div>

                                            <div className="space-y-4 p-4 sm:p-6">
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
                                                        <div key={gIndex} className="group-wrapper pt-4 first:pt-0">
                                                            {/* Render Main Item */}
                                                            {group.main && ((() => {
                                                                const { item, index } = group.main;
                                                                const isNoStock = item.estado_item === 'sin_stock';
                                                                const isPartialStock = item.estado_item === 'stock_parcial';
                                                                
                                                                return (
                                                                    <div
                                                                        key={`${item.id}-${index}`}
                                                                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative group
                                                                            ${isNoStock ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[0.5]' :
                                                                                isPartialStock ? 'bg-orange-50/30 border-orange-200 ring-1 ring-orange-100' :
                                                                                    'bg-white border-slate-100 hover:border-blue-300 hover:shadow-[0_4px_20px_-12px_rgba(37,99,235,0.2)]'}`}
                                                                    >
                                                                         <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center">
                                                                            {/* Imagen */}
                                                                            <div className="col-span-12 sm:col-span-1 relative flex items-center gap-3 sm:block">
                                                                                <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex-shrink-0">
                                                                                    <img
                                                                                        src={item.imagen || "https://via.placeholder.com/150"}
                                                                                        alt={item.nombre}
                                                                                        className={`w-full h-full object-contain mix-blend-multiply ${isNoStock ? 'grayscale opacity-50' : ''}`}
                                                                                    />
                                                                                </div>
                                                                                {isNoStock && (
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 rounded-xl">
                                                                                        <Ban className="text-red-500 w-6 h-6 drop-shadow-sm" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="sm:hidden flex-1">
                                                                                     <h4 className={`font-bold text-sm line-clamp-2 ${isNoStock ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.nombre}</h4>
                                                                                </div>
                                                                            </div>

                                                                            {/* Info Editable */}
                                                                            <div className="hidden sm:block col-span-4">
                                                                                <h4 className={`font-bold text-sm line-clamp-2 leading-tight ${isNoStock ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.nombre}</h4>
                                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                        {item.tipo_unidad === 'kilogramo'
                                                                                            ? 'Variable'
                                                                                            : `S/ ${parseFloat(item.precio_base || 0).toFixed(2)}`}
                                                                                    </span>
                                                                                    
                                                                                    {isPartialStock && (
                                                                                        <span className="text-[10px] text-orange-700 font-bold bg-orange-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                                            <AlertTriangle size={10} /> Stock Parcial
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {(item.tipo_unidad !== 'kilogramo' && !isNoStock) && (
                                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                                        {item.cantidad_helada > 0 && (
                                                                                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 font-bold whitespace-nowrap">
                                                                                                <Snowflake size={10} strokeWidth={2.5} /> {item.cantidad_helada} {item.cantidad_helada === 1 ? 'Helada' : 'Heladas'}
                                                                                            </span>
                                                                                        )}
                                                                                        {((item.cantidad_final || 0) - (item.cantidad_helada || 0)) > 0 && (
                                                                                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 font-bold whitespace-nowrap">
                                                                                                <Sun size={10} strokeWidth={2.5} /> {(item.cantidad_final || 0) - (item.cantidad_helada || 0)} Sin helar
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Cantidad/Peso Input */}
                                                                            <div className="col-span-6 sm:col-span-2 flex flex-row sm:flex-col gap-2 sm:gap-1 items-center justify-between sm:justify-center w-full">
                                                                                <label className="text-[10px] font-bold text-slate-400 uppercase sm:mb-0.5">CANTIDAD</label>
                                                                                {item.tipo_unidad === 'kilogramo' ? (
                                                                                    <div className="bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg font-bold text-xs text-center border border-amber-200 flex items-center justify-center w-full shadow-sm max-w-[100px]">
                                                                                        {item.detalle || `${item.cantidad_solicitada} unid.`}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                                                                        <button
                                                                                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg shadow-sm disabled:opacity-50 transition-all font-bold bg-white border border-slate-200"
                                                                                            onClick={() => handleUpdateItem(index, 'cantidad_final', Math.max(1, (item.cantidad_final || 0) - 1))}
                                                                                            disabled={isNoStock}
                                                                                        >
                                                                                            <Minus size={12} strokeWidth={3} />
                                                                                        </button>
                                                                                        <span className="text-sm font-bold w-6 text-center text-slate-800">{item.cantidad_final || 0}</span>
                                                                                        <button
                                                                                            className="w-7 h-7 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-all"
                                                                                            onClick={() => handleUpdateItem(index, 'cantidad_final', (item.cantidad_final || 0) + 1)}
                                                                                            disabled={isNoStock}
                                                                                        >
                                                                                            <Plus size={12} strokeWidth={3} />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Precio Final Input */}
                                                                            <div className="col-span-6 sm:col-span-3 flex flex-row sm:flex-col gap-2 sm:gap-1 items-center justify-between sm:justify-start w-full">
                                                                                <label className="text-[10px] font-bold text-slate-400 uppercase sm:mb-0.5 whitespace-nowrap">PRECIO FINAL</label>
                                                                                <div className="relative w-full max-w-[120px]">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">S/</span>
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
                                                                                        className={`w-full pl-8 pr-3 py-1.5 border-2 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all ${isNoStock
                                                                                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                                                                                            : invalidFields.has(index)
                                                                                                ? 'bg-red-50 text-red-900 border-red-300 focus:border-red-400 focus:ring-red-100'
                                                                                                : item.is_recovered_price
                                                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-100'
                                                                                                    : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500'
                                                                                            }`}
                                                                                    />
                                                                                    {invalidFields.has(index) && (
                                                                                        <span className="text-[10px] text-red-500 font-bold absolute -bottom-5 right-0 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 animate-bounce">
                                                                                            ¡Requerido!
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Actions */}
                                                                            <div className="col-span-12 sm:col-span-2 flex justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 mt-2 sm:mt-0">
                                                                                <button
                                                                                    onClick={() => setSubstitutionIndex(index)}
                                                                                    className="p-2 rounded-xl text-purple-600 bg-purple-50 hover:bg-purple-100 hover:scale-110 transition-all border border-purple-100 shadow-sm"
                                                                                    title="Añadir Propuesta / Sustituto"
                                                                                >
                                                                                    <Plus size={18} strokeWidth={2.5} />
                                                                                </button>

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
                                                                                    className={`p-2 rounded-xl transition-all border shadow-sm hover:scale-110 ${isNoStock ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' : 'text-slate-400 bg-white border-slate-200 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50'}`}
                                                                                    title={isNoStock ? "Restaurar item" : "Marcar Sin Stock"}
                                                                                >
                                                                                    {isNoStock ? <RefreshCw size={18} strokeWidth={2.5} /> : <Ban size={18} strokeWidth={2.5} />}
                                                                                </button>
                                                                                
                                                                                <button
                                                                                    onClick={() => handleRemoveItem(index)}
                                                                                    className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm hover:scale-110"
                                                                                    title="Eliminar ítem"
                                                                                >
                                                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                                                </button>
                                                                            </div>
                                                                         </div>
                                                                    </div>
                                                                );
                                                            })())}

                                                            {/* Render Substitutes for this item */}
                                                            {group.subs.length > 0 && (
                                                                <div className="mt-3 ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-dashed border-purple-200 relative">
                                                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-purple-200" />
                                                                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                                                        {group.subs.map(({ item, index }) => (
                                                                            <div key={`sub-${index}`} className="flex-shrink-0 w-44 bg-purple-50/50 rounded-2xl border border-purple-100 p-3 shadow-sm relative group hover:border-purple-300 hover:bg-purple-50 transition-colors">
                                                                                <span className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-md text-[9px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white uppercase tracking-wider shadow-md">
                                                                                    Propuesta
                                                                                </span>

                                                                                <button
                                                                                    onClick={() => handleRemoveItem(index)}
                                                                                    className="absolute top-2 right-2 p-1 text-purple-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                                                >
                                                                                    <X size={14} strokeWidth={3} />
                                                                                </button>

                                                                                <div className="flex flex-col gap-2.5 mt-1">
                                                                                    <div className="w-full h-24 rounded-xl bg-white p-1 border border-purple-100/50">
                                                                                        <img
                                                                                            src={item.imagen}
                                                                                            alt={item.nombre}
                                                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                                                        />
                                                                                    </div>

                                                                                    <div className="min-h-[2.5rem]">
                                                                                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">{item.nombre}</h4>
                                                                                    </div>

                                                                                    <div className="flex items-center justify-between gap-1">
                                                                                        <div className="flex items-center gap-1 bg-white rounded-lg border border-purple-100 px-1.5 py-0.5 shadow-sm">
                                                                                            <button
                                                                                                className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-purple-100 rounded hover:text-purple-700"
                                                                                                onClick={() => handleUpdateItem(index, 'cantidad_final', Math.max(1, (item.cantidad_final || 0) - 1))}
                                                                                            >
                                                                                                <Minus size={10} strokeWidth={3} />
                                                                                            </button>
                                                                                            <span className="text-xs font-bold w-4 text-center text-slate-900">{item.cantidad_final || 1}</span>
                                                                                            <button
                                                                                                className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-purple-100 rounded hover:text-purple-700"
                                                                                                onClick={() => handleUpdateItem(index, 'cantidad_final', (item.cantidad_final || 0) + 1)}
                                                                                            >
                                                                                                <Plus size={10} strokeWidth={3} />
                                                                                            </button>
                                                                                        </div>

                                                                                        <div className="flex items-center gap-0.5 border-b-2 border-purple-100 focus-within:border-purple-500 transition-colors">
                                                                                            <span className="text-[10px] text-purple-700 font-bold">S/</span>
                                                                                            <input
                                                                                                type="number"
                                                                                                value={item.precio_base || ''}
                                                                                                onChange={(e) => handleUpdateItem(index, 'precio_base', parseFloat(e.target.value))}
                                                                                                className="w-12 text-sm font-bold text-purple-700 bg-transparent outline-none text-right px-0"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    {/* Helada Toggle for Substitutes */}
                                                                                    <div className="flex items-center justify-between mt-1 px-2 py-1.5 bg-white/80 rounded-lg border border-purple-50">
                                                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Helada</span>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const isHelada = item.cantidad_helada > 0;
                                                                                                const newStatus = !isHelada;
                                                                                                handleUpdateItem(index, 'cantidad_helada', newStatus ? item.cantidad_final : 0);
                                                                                                handleUpdateItem(index, 'detalle', newStatus ? "Helada" : "Sin helar");
                                                                                            }}
                                                                                            className={`relative inline-flex h-3.5 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.cantidad_helada > 0 ? 'bg-blue-500' : 'bg-slate-200'}`}
                                                                                        >
                                                                                            <span
                                                                                                aria-hidden="true"
                                                                                                className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.cantidad_helada > 0 ? 'translate-x-3.5' : 'translate-x-0'}`}
                                                                                            />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}

                                                                        {/* Botón para añadir otra propuesta */}
                                                                        {group.main && (
                                                                            <button
                                                                                onClick={() => setSubstitutionIndex(group.main.index)}
                                                                                className="flex-shrink-0 w-32 bg-white rounded-2xl border-2 border-dashed border-purple-200 p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all group"
                                                                            >
                                                                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                                                                    <Plus size={20} />
                                                                                </div>
                                                                                <span className="text-[10px] font-bold text-purple-400 group-hover:text-purple-700 text-center leading-tight">
                                                                                    Añadir<br />Alternativa
                                                                                </span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>

                                            {/* Panel Lateral de Sustitución (Overlay) */}
                                            {substitutionIndex !== null && (
                                                <div className="absolute top-0 right-0 w-80 md:w-96 h-full bg-white shadow-2xl z-50 border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
                                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 text-lg">Sustituir Producto</h3>
                                                            <p className="text-xs font-medium text-slate-500 mt-0.5">Se agregará debajo del ítem original</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSubstitutionIndex(null)}
                                                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar producto..."
                                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
                                                                value={substSearchTerm}
                                                                onChange={(e) => setSubstSearchTerm(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30 custom-scrollbar">
                                                        {/* Sugerencia Rápida: Mismo producto "Al tiempo" */}
                                                        {(() => {
                                                            const parent = editedItems[substitutionIndex];
                                                            // Solo sugerir si:
                                                            // 1. Tiene heladas solicitadas (esto ya confirma que es un producto refrigerable)
                                                            // 2. Estamos en stock parcial O sin stock
                                                            if (parent &&
                                                                parent.cantidad_helada > 0 &&
                                                                (parent.estado_item === 'stock_parcial' || parent.estado_item === 'sin_stock')) {
                                                                return (
                                                                    <div className="mb-4">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Sugerencia Inteligente</p>
                                                                        <button
                                                                            onClick={handleAddAmbientSubstitute}
                                                                            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-white hover:from-orange-100 hover:to-orange-50 rounded-2xl transition-all border border-orange-100 group shadow-sm hover:shadow-md"
                                                                        >
                                                                            <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-shrink-0 relative shadow-sm border border-orange-100">
                                                                                <img src={parent.imagen} alt={parent.nombre} className="w-full h-full object-contain mix-blend-multiply opacity-80" />
                                                                                <div className="absolute inset-0 flex items-center justify-center bg-orange-500/10 backdrop-blur-[1px]">
                                                                                    <Sun className="text-orange-600 drop-shadow-md" size={20} strokeWidth={2.5} />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0 text-left">
                                                                                <p className="font-bold text-sm text-slate-800 line-clamp-1">Mismo producto (Sin helar)</p>
                                                                                <p className="text-xs text-orange-700 font-medium mt-0.5">
                                                                                    Completar {Math.max(1, (parent.cantidad_solicitada || 1) - (parent.cantidad_final || 0))} unidades al tiempo
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-orange-500 bg-white rounded-full p-1.5 shadow-sm border border-orange-100 group-hover:scale-110 transition-transform">
                                                                                <Plus size={16} strokeWidth={3} />
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                        
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-2">Catálogo</p>
                                                        {products
                                                            .filter(p => !substSearchTerm || p.nombre.toLowerCase().includes(substSearchTerm.toLowerCase()))
                                                            .slice(0, 20)
                                                            .map(product => (
                                                                <button
                                                                    key={product.id}
                                                                    onClick={() => handleAddSubstitute(product)}
                                                                    className="w-full flex items-center gap-3 p-3 bg-white hover:bg-blue-50/50 rounded-2xl transition-all text-left group border border-slate-100 hover:border-blue-200 hover:shadow-md shadow-sm"
                                                                >
                                                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden flex-shrink-0 p-1">
                                                                        <img src={product.imagen} alt={product.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-sm text-slate-800 truncate group-hover:text-blue-700 transition-colors">{product.nombre}</p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">Stock: {product.stock}</span>
                                                                            <span className="text-xs text-blue-700 font-bold">S/ {parseFloat(product.precio).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                                        <div className="bg-blue-100 p-1.5 rounded-full">
                                                                            <Plus size={18} strokeWidth={2.5} />
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        {products.filter(p => !substSearchTerm || p.nombre.toLowerCase().includes(substSearchTerm.toLowerCase())).length === 0 && (
                                                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                                                <Package size={32} className="opacity-20" />
                                                                <p className="text-xs font-medium">No se encontraron productos</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Total */}
                                            {/* Total */}
                                            <div className="p-5 bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-between items-center z-10 sticky bottom-0 shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.1)]">
                                                <div className="text-sm text-slate-500">
                                                    <span className="block font-medium text-slate-700">Estimado Original: {formatCurrency(selectedPedido.total_estimado || selectedPedido.pago?.total_estimado || 0)}</span>
                                                    <span className="block text-[10px] mt-0.5 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 w-fit">Basado en solicitud inicial</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Final</span>
                                                    <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                        {formatCurrency(editedItems.reduce((sum, item) => {
                                                            // Los sustitutos no suman al total hasta que son elegidos/confirmados, 
                                                            // pero aquí asumimos que item que está en la lista principal SUMA.
                                                            // Si item.es_sustituto es true, significa que es una opción extra?
                                                            // NO, en nueva lógica los sustitutos ESTÁN en la lista principal si reemplazan.
                                                            // Pero en mi renderizado, separé groups.subs.
                                                            // Espera, reduce recorre editedItems FLAT list.
                                                            // Si un item es sustituto (es_sustituto=true), ¿debe sumar?
                                                            // Depende de la lógica de negocio. Por ahora mantenemos la lógica existente:
                                                            if (item.es_sustituto) return sum; // Solo suman los principales por ahora?
                                                            // OJO: Si reemplacé el item principal con un sustituto, el original ya no está? 
                                                            // O el sustituto se marcó como "seleccionado"?
                                                            // El array editedItems contiene TODO.
                                                            return sum + (parseFloat(item.precio_final) || 0);
                                                        }, 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mensaje de Error (Validación) */}
                                    {error && (
                                        <div className="mx-6 mb-2 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                                            <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                                            <div>
                                                <h4 className="font-bold text-red-800 text-sm">Atención requerida</h4>
                                                <p className="text-sm font-medium text-red-600">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Botones */}
                                    <div className="border-t border-slate-100 px-6 py-5 bg-white flex justify-end gap-3 flex-shrink-0 z-20 shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.05)]">
                                        {selectedPedido.estado === 'esperando_confirmacion' ? (
                                            <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-center gap-3 text-amber-700 font-bold animate-pulse shadow-inner">
                                                <Clock size={24} className="text-amber-600" />
                                                <span className="text-lg">Cliente revisando propuestas...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setSelectedPedido(null)}
                                                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm hover:shadow"
                                                >
                                                    Cancelar
                                                </button>
                                                {/* Workflow de Estados */}
                                                {(() => {
                                                    const handleStatusChange = async (newStatus) => {
                                                        try {
                                                            setIsProcessing(true);
                                                            await actualizarEstadoPedido(selectedPedido.id, newStatus);
                                                            setSelectedPedido(prev => ({ ...prev, estado: newStatus }));
                                                        } finally {
                                                            setIsProcessing(false);
                                                        }
                                                    };

                                                    if (selectedPedido.estado === 'confirmada') {
                                                        return (
                                                            <button
                                                                onClick={() => handleStatusChange('preparando')}
                                                                disabled={isProcessing}
                                                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Package size={22} strokeWidth={2.5} />}
                                                                {isProcessing ? 'Procesando...' : 'Empezar Preparación'}
                                                            </button>
                                                        );
                                                    }

                                                    if (selectedPedido.estado === 'preparando') {
                                                        return (
                                                            <button
                                                                onClick={() => handleStatusChange('lista')}
                                                                disabled={isProcessing}
                                                                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle size={22} strokeWidth={2.5} />}
                                                                {isProcessing ? 'Procesando...' : 'Marcar Listo'}
                                                            </button>
                                                        );
                                                    }

                                                    if (selectedPedido.estado === 'lista') {
                                                        return (
                                                            <button
                                                                onClick={() => handleStatusChange('entregada')}
                                                                disabled={isProcessing}
                                                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Truck size={22} strokeWidth={2.5} />}
                                                                {isProcessing ? 'Procesando...' : 'Confirmar Entrega'}
                                                            </button>
                                                        );
                                                    }

                                                    // Default: Edición / En Revisión
                                                    const isReviewNeeded = editedItems.some(i => i.es_sustituto || i.estado_item === 'sin_stock' || i.requiere_confirmacion);
                                                    return (
                                                        <button
                                                            onClick={handleConfirmarPedido}
                                                            disabled={isProcessing}
                                                            className={`px-8 py-3 font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2.5 text-white hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${isReviewNeeded
                                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                                                                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-green-200'
                                                                }`}
                                                        >
                                                            {isProcessing ? <Loader2 size={22} className="animate-spin" /> : (isReviewNeeded ? <Save size={22} strokeWidth={2.5} /> : <CheckCircle size={22} strokeWidth={2.5} />)}
                                                            {isProcessing 
                                                                ? 'Procesando...' 
                                                                : (isReviewNeeded ? 'Solicitar Confirmación' : 'Aceptar y Preparar')
                                                            }
                                                        </button>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end flex-shrink-0 rounded-b-[2rem]">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                                >
                                    Cerrar Ventana
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )
            }
        </AnimatePresence >
    );
};

export default PedidosModal;
