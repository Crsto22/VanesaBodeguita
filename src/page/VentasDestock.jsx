import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import CarritoVacio from "../assets/Ventas/CarritoVacio.svg";
import successAnimation from '../assets/success-confetti.json';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import {
    Search,
    ShoppingCart,
    User,
    Barcode,
    CreditCard,
    DollarSign,
    Package,
    ArrowLeft,
    Filter,
    Plus,
    Star,
    Eye,
    Minus,
    Edit3,
    Trash2,
    X,
    AlertTriangle,
    Milk,
    CheckCircle,
    ScanBarcode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClientes } from '../context/ClientesContext';
import { useVentas } from '../context/VentasContext';
import { useProducts } from '../context/ProductContext';
import NavbarVentasDestock from '../components/VentasDestock/NavbarVentasDestock';
import ClientesDrawer from '../components/VentasDestock/ClientesDrawer';
import EditarPrecioDrawer from '../components/VentasDestock/EditarPrecioDrawer';
import KilogramoDrawer from '../components/VentasDestock/KilogramoDrawer';
import PrecioAlternativoDrawer from '../components/VentasDestock/PrecioAlternativoDrawer';
import ConfirmarVentaDrawer from '../components/VentasDestock/ConfirmarVentaDrawer';

const VentasDestock = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { clientes, obtenerClientePorId } = useClientes();
    const { obtenerDeudaTotalPorCliente, crearVenta } = useVentas();
    const { categorias, todosLosProductos, obtenerCategoriaPorId } = useProducts();

    // Cache de productos para evitar re-renderizados innecesarios
    const [cachedProducts, setCachedProducts] = useState([]);
    const [cacheTimestamp, setCacheTimestamp] = useState(null);
    const [cacheVersion, setCacheVersion] = useState(0);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [productosVisibles, setProductosVisibles] = useState(10); // Controla cuántos productos se muestran
    const [productoAnimando, setProductoAnimando] = useState(null); // Para la animación de agregar
    
    // Estado del escáner (ON por defecto, se controla automáticamente con el input de búsqueda)
    const [escanerActivo, setEscanerActivo] = useState(true); // Default: ON
    
    const [drawerClientesOpen, setDrawerClientesOpen] = useState(false);
    const [drawerEditarPrecioOpen, setDrawerEditarPrecioOpen] = useState(false);
    const [drawerKilogramoOpen, setDrawerKilogramoOpen] = useState(false);
    const [drawerPrecioAlternativoOpen, setDrawerPrecioAlternativoOpen] = useState(false);
    const [drawerConfirmarOpen, setDrawerConfirmarOpen] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [productoParaEditar, setProductoParaEditar] = useState(null);
    const [productoKilogramo, setProductoKilogramo] = useState(null);
    const [productoPrecioAlternativo, setProductoPrecioAlternativo] = useState(null);
    const [ventaId, setVentaId] = useState(null);
    const [isProcessingVenta, setIsProcessingVenta] = useState(false);
    const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
    const [barcodeNotification, setBarcodeNotification] = useState(null);
    
    // Estado de carga de productos
    const [productosLoading, setProductosLoading] = useState(true);
    
    // Estados para el sistema de alertas de venta
    const [ventaStatus, setVentaStatus] = useState('idle'); // 'idle', 'uploading', 'success'
    const [ventaAlertId, setVentaAlertId] = useState(null);

    // Funciones de gestión del caché de productos
    const updateProductsCache = React.useCallback((products) => {
        setCachedProducts([...products]);
        setCacheTimestamp(Date.now());
        console.log('🔄 Cache de productos actualizado:', products.length, 'productos');
    }, []);

    const resetProductsCache = React.useCallback(() => {
        setCachedProducts([]);
        setCacheTimestamp(null);
        setCacheVersion(prev => prev + 1);
        console.log('🗑️ Cache de productos reseteado');
    }, []);

    const getProductsFromCache = React.useCallback(() => {
        const cacheAge = Date.now() - (cacheTimestamp || 0);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutos
        
        if (cachedProducts.length > 0 && cacheAge < maxCacheAge) {
            console.log('✅ Usando productos desde cache');
            return cachedProducts;
        }
        return null;
    }, [cachedProducts, cacheTimestamp]);

    // Detectar cambios en productos externos y actualizar caché
    React.useEffect(() => {
        if (todosLosProductos && todosLosProductos.length > 0) {
            const cachedFromMemory = getProductsFromCache();
            
            // Si no hay caché o los productos han cambiado, actualizar
            if (!cachedFromMemory || 
                cachedProducts.length !== todosLosProductos.length ||
                JSON.stringify(cachedProducts.map(p => p.id).sort()) !== 
                JSON.stringify(todosLosProductos.map(p => p.id).sort())) {
                updateProductsCache(todosLosProductos);
            }
        }
    }, [todosLosProductos, updateProductsCache, getProductsFromCache, cachedProducts]);

    // Obtener productos optimizados (desde caché si está disponible)
    const productosOptimizados = React.useMemo(() => {
        const fromCache = getProductsFromCache();
        if (fromCache) {
            return fromCache;
        }
        
        // Si no hay caché válido, usar los productos externos
        if (todosLosProductos && todosLosProductos.length > 0) {
            updateProductsCache(todosLosProductos);
            return todosLosProductos;
        }
        
        return [];
    }, [todosLosProductos, getProductsFromCache, updateProductsCache, cacheVersion]);

    // Efecto para manejar el estado de carga de productos
    React.useEffect(() => {
        if (productosOptimizados && productosOptimizados.length > 0) {
            setProductosLoading(false);
        } else if (todosLosProductos === undefined || (Array.isArray(todosLosProductos) && todosLosProductos.length === 0)) {
            setProductosLoading(true);
        }
    }, [productosOptimizados, todosLosProductos]);

    // Filtrar productos según categoría seleccionada y término de búsqueda
    const productosFiltrados = React.useMemo(() => {
        let productos = productosOptimizados || [];

        // Filtrar por categoría
        if (selectedCategory !== 'all') {
            productos = productos.filter(p => p.categoria_ref === selectedCategory);
        }

        // Filtrar por término de búsqueda
        if (searchTerm.trim()) {
            const termino = searchTerm.toLowerCase();
            productos = productos.filter(p =>
                p.nombre?.toLowerCase().includes(termino) ||
                p.codigo_barras?.includes(termino)
            );
        }

        return productos;
    }, [productosOptimizados, selectedCategory, searchTerm]);

    // Productos que se muestran actualmente (con paginación)
    const productosParaMostrar = React.useMemo(() => {
        return productosFiltrados.slice(0, productosVisibles);
    }, [productosFiltrados, productosVisibles]);

    // Función para cargar más productos
    const handleVerMas = () => {
        setProductosVisibles(prev => prev + 5);
    };

    // Reset de productos visibles cuando cambia la búsqueda o categoría
    React.useEffect(() => {
        setProductosVisibles(10);
    }, [searchTerm, selectedCategory]);

    // Función para buscar producto por código de barras
    const buscarProductoPorCodigoBarras = (codigo) => {
        if (!codigo || !productosOptimizados) return null;
        
        // Buscar producto que coincida exactamente con el código de barras
        const producto = productosOptimizados.find(p => 
            p.codigo_barras && p.codigo_barras.trim() === codigo.trim()
        );
        
        return producto;
    };



    // Función para activar el escáner de código de barras
    const activarEscaner = () => {
        // Primero, desenfocar cualquier input activo
        const activeElement = document.activeElement;
        if (activeElement && activeElement.matches('input, textarea, select, [contenteditable]')) {
            activeElement.blur();
        }
        
        // Luego, enfocar el input invisible del escáner
        setTimeout(() => {
            const barcodeInput = document.querySelector('#scanner-input');
            if (barcodeInput) {
                barcodeInput.focus();
                barcodeInput.select(); // Seleccionar todo el contenido para limpiar automáticamente
                console.log('🔍 Escáner de código de barras activado y enfocado');
            } else {
                console.warn('⚠️ Input de código de barras no encontrado');
            }
        }, 100);
    };

    // Función para procesar código de barras
    const procesarCodigoBarras = (codigo) => {
        if (!codigo || !codigo.trim()) return;
        
        console.log('🔍 Procesando código de barras:', codigo);
        setIsProcessingBarcode(true);
        
        // Simular un pequeño delay para mostrar el estado de carga
        setTimeout(() => {
            // Buscar el producto por código de barras
            const producto = buscarProductoPorCodigoBarras(codigo);
            
            if (producto) {
                console.log('✅ Producto encontrado:', producto.nombre);
                
                // Mostrar notificación de éxito
                setBarcodeNotification({
                    type: 'success',
                    message: `Producto agregado: ${producto.nombre}`,
                    codigo: codigo
                });
                
                // Agregar el producto al carrito
                handleAddToCart(producto);
                
                // Animación visual
                setProductoAnimando(producto.id);
                setTimeout(() => setProductoAnimando(null), 1000);
                
            } else {
                console.log('❌ Producto no encontrado para código:', codigo);
                
                // Mostrar notificación de error
                setBarcodeNotification({
                    type: 'error',
                    message: `Producto no encontrado`,
                    codigo: codigo
                });
            }
            
            setIsProcessingBarcode(false);
            
            // Limpiar notificación después de 3 segundos
            setTimeout(() => {
                setBarcodeNotification(null);
            }, 3000);
            
        }, 200); // Delay reducido para mayor velocidad
    };

    // Efecto para manejar el escaneo de código de barras
    React.useEffect(() => {
        if (barcodeInput.trim() && escanerActivo) {
            // Solo procesar si el escáner está activo
            // Limpiar el input inmediatamente para estar listo para el siguiente escaneo
            const codigo = barcodeInput.trim();
            setBarcodeInput('');
            
            // Procesar el código
            procesarCodigoBarras(codigo);
        } else if (barcodeInput.trim() && !escanerActivo) {
            // Si el escáner está desactivado, solo limpiar el input
            setBarcodeInput('');
        }
    }, [barcodeInput, productosOptimizados, escanerActivo]);

    // Efecto para mantener el focus en el input de código de barras SOLO cuando el escáner esté activo
    React.useEffect(() => {
        if (!escanerActivo) return; // No hacer nada si el escáner está desactivado
        
        const focusBarcodeInputIfNeeded = () => {
            const barcodeInput = document.querySelector('#scanner-input');
            const activeElement = document.activeElement;
            
            // Solo enfocar si:
            // 1. El input invisible existe
            // 2. No hay otro input activo (búsqueda, textareas, etc.)
            // 3. No hay modales o drawers abiertos
            // 4. El escáner está activo
            if (barcodeInput && 
                !activeElement?.matches('input:not(#scanner-input), textarea, select, [contenteditable]') &&
                !document.querySelector('[role="dialog"], .modal-open, .drawer-open')) {
                barcodeInput.focus();
            }
        };

        // Verificar menos frecuentemente y solo cuando sea necesario
        const interval = setInterval(focusBarcodeInputIfNeeded, 3000);

        // Focus inicial si el escáner está activo
        setTimeout(focusBarcodeInputIfNeeded, 500);

        return () => clearInterval(interval);
    }, [escanerActivo]);

    // Función para agregar producto al carrito
    const handleAddToCart = (producto) => {
        // Si es un producto por kilogramo, abrir el drawer de kilogramos
        if (producto.tipo_unidad === 'kilogramo') {
            setProductoKilogramo(producto);
            setDrawerKilogramoOpen(true);
            return;
        }

        // Si tiene precio alternativo, abrir el drawer de precios
        if (producto.has_precio_alternativo && producto.precio_alternativo !== null) {
            setProductoPrecioAlternativo(producto);
            setDrawerPrecioAlternativoOpen(true);
            return;
        }

        // Producto normal - agregar directamente al carrito
        const productoCarrito = {
            id: producto.id,
            carritoId: `${producto.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único para el carrito
            nombre: producto.nombre,
            precio: parseFloat(producto.precio),
            cantidad: 1,
            subtotal: parseFloat(producto.precio),
            imagen: producto.imagen,
            categoria_ref: producto.categoria_ref,
            tipo_unidad: producto.tipo_unidad || 'unidad',
            retornable: producto.retornable || false,
            cantidad_retornable: producto.retornable && producto.tipo_unidad !== 'kilogramo' ? 1 : 0
        };

        setSelectedProducts(prev => {
            const existingIndex = prev.findIndex(p => p.id === producto.id);
            if (existingIndex !== -1) {
                return prev.map((p, index) =>
                    index === existingIndex
                        ? { 
                            ...p, 
                            cantidad: p.cantidad + 1, 
                            subtotal: (p.cantidad + 1) * p.precio,
                            cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? (p.cantidad_retornable || 0) + 1 : p.cantidad_retornable
                        }
                        : p
                );
            } else {
                return [...prev, productoCarrito];
            }
        });
    };

    // Función para aumentar cantidad
    const handleIncreaseQuantity = (productoId) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.id === productoId
                    ? { 
                        ...p, 
                        cantidad: p.cantidad + 1, 
                        subtotal: (p.cantidad + 1) * p.precio,
                        cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? p.cantidad + 1 : (p.cantidad_retornable || 0)
                    }
                    : p
            )
        );
    };

    // Función para disminuir cantidad
    const handleDecreaseQuantity = (productoId) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.id === productoId && p.cantidad > 1
                    ? { 
                        ...p, 
                        cantidad: p.cantidad - 1, 
                        subtotal: (p.cantidad - 1) * p.precio,
                        cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? p.cantidad - 1 : Math.min(p.cantidad_retornable || 0, p.cantidad - 1)
                    }
                    : p
            ).filter(p => p.cantidad > 0)
        );
    };

    // Función para eliminar producto del carrito
    const handleRemoveFromCart = (carritoId) => {
        setSelectedProducts(prev => prev.filter(p => (p.carritoId || p.id) !== carritoId));
    };

    // Función para manejar botellas retornables
    const handleUpdateRetornables = (productoId, action) => {
        setSelectedProducts(prev =>
            prev.map(p => {
                if (p.id === productoId && p.retornable) {
                    let currentRetornables = p.cantidad_retornable || 0;
                    let newRetornables = currentRetornables;
                    
                    if (action === 'increment' && newRetornables < p.cantidad) {
                        newRetornables += 1;
                    } else if (action === 'decrement' && newRetornables > 0) {
                        newRetornables -= 1;
                    }
                    
                    return { ...p, cantidad_retornable: newRetornables };
                }
                return p;
            })
        );
    };

    // Función para editar producto
    const handleEditProduct = (producto) => {
        if (producto.tipo_unidad === 'kilogramo') {
            // Para productos de kilogramo, abrir KilogramoDrawer
            const productoOriginal = productosOptimizados.find(p => p.id === producto.id);
            if (productoOriginal) {
                setProductoKilogramo(productoOriginal);
                setProductoEditando(producto); // Guardamos el producto del carrito que se está editando
                setDrawerKilogramoOpen(true);
            }
        } else {
            // Para productos normales, abrir EditarPrecioDrawer
            setProductoEditando(producto);
            setProductoParaEditar(producto);
            setDrawerEditarPrecioOpen(true);
        }
    };

    // Función para agregar producto por kilogramo al carrito
    const handleAgregarKilogramo = (productoId, precioTotal, pesoKg = null) => {
        const producto = productosOptimizados.find(p => p.id === productoId);
        if (!producto) return;

        const productoCarrito = {
            id: producto.id, // ID original del producto para referencia
            carritoId: `${producto.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único para el carrito
            nombre: producto.nombre, // Solo el nombre, sin mostrar el peso
            precio: precioTotal, // Este será el precio final (ej: S/6 por medio kilo)
            cantidad: 1, // Siempre 1 para productos por kilogramo
            subtotal: precioTotal, // cantidad (1) × precio_total
            imagen: producto.imagen,
            categoria_ref: producto.categoria_ref,
            tipo_unidad: producto.tipo_unidad,
            peso_kg: pesoKg, // Guardamos el peso solo para referencia
            precio_por_kg: parseFloat(producto.precio), // Precio original por kilo
            retornable: producto.retornable || false,
            cantidad_retornable: 0 // Los productos por kilogramo no manejan retornables
        };

        // Para productos por kilogramo, siempre agregar como nueva entrada
        setSelectedProducts(prev => [...prev, productoCarrito]);
        setDrawerKilogramoOpen(false);
        setProductoKilogramo(null);
        
        console.log('🚀 Producto por kilogramo agregado:', {
            id: productoCarrito.id,
            carritoId: productoCarrito.carritoId,
            nombre: productoCarrito.nombre,
            peso_kg: productoCarrito.peso_kg,
            precio: productoCarrito.precio
        });
    };

    // Función para actualizar producto de kilogramo en el carrito
    const handleActualizarKilogramo = (productoId, precioTotal, pesoKg = null) => {
        if (!productoEditando) return;

        const producto = productosOptimizados.find(p => p.id === productoId);
        if (!producto) return;

        const productoActualizado = {
            ...productoEditando,
            precio: precioTotal, // Precio total calculado
            subtotal: precioTotal, // cantidad (1) × precio_total
            peso_kg: pesoKg, // Peso actualizado
            precio_por_kg: parseFloat(producto.precio), // Precio original por kilo
        };

        // Actualizar el producto en el carrito
        setSelectedProducts(prev => 
            prev.map(p => 
                p === productoEditando ? productoActualizado : p
            )
        );

        setDrawerKilogramoOpen(false);
        setProductoKilogramo(null);
        setProductoEditando(null);
        
        console.log('Producto por kilogramo actualizado:', productoActualizado);
    };

    // Función para agregar producto con precio alternativo al carrito
    const handleAgregarPrecioAlternativo = (productoCarrito) => {
        setSelectedProducts(prev => {
            const existingIndex = prev.findIndex(p => 
                p.id === productoCarrito.id && 
                p.precio_usado === productoCarrito.precio_usado
            );
            
            if (existingIndex !== -1) {
                return prev.map((p, index) =>
                    index === existingIndex
                        ? { 
                            ...p, 
                            cantidad: p.cantidad + 1, 
                            subtotal: (p.cantidad + 1) * p.precio,
                            cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? (p.cantidad_retornable || 0) + 1 : p.cantidad_retornable
                        }
                        : p
                );
            } else {
                return [...prev, productoCarrito];
            }
        });
        
        setDrawerPrecioAlternativoOpen(false);
        setProductoPrecioAlternativo(null);
        
        console.log('Producto con precio alternativo agregado:', productoCarrito);
    };

    // Función para actualizar precio del producto (solo para productos normales)
    const handleUpdatePrecio = (productoId, nuevoPrecio) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.id === productoId
                    ? {
                        ...p,
                        precio: nuevoPrecio,
                        subtotal: p.cantidad * nuevoPrecio
                    }
                    : p
            )
        );
        
        setDrawerEditarPrecioOpen(false);
        setProductoParaEditar(null);
    };

    // Función para procesar pago
    const handleProcesarPago = async () => {
        if (selectedProducts.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        // Verificar si hay productos retornables que generan deuda de botellas
        const hasOwedRetornables = selectedProducts.some((p) => p.retornable && (p.cantidad_retornable || 0) < p.cantidad);
        
        if (hasOwedRetornables && !clienteSeleccionado) {
            alert('Se requiere un cliente específico para productos retornables que generan deuda de botellas');
            return;
        }

        // Si no hay cliente seleccionado (Cliente Genérico), procesar la venta directamente
        if (!clienteSeleccionado) {
            try {
                setVentaStatus('uploading'); // Mostrar alerta de carga
                
                const result = await handleConfirmarVenta({
                    estado: 'pagado',
                    montoPagado: calcularTotal(),
                    notas: ''
                });
                
                setVentaAlertId(result);
                setVentaStatus('success'); // Mostrar alerta de éxito
                
                // Auto-hide después de 5 segundos
                setTimeout(() => {
                    setVentaStatus('idle');
                    setTimeout(() => {
                        setVentaAlertId(null);
                    }, 700);
                }, 5000);
                
            } catch (error) {
                console.error('Error al procesar venta directa:', error);
                setVentaStatus('idle'); // Ocultar alerta en caso de error
                alert('Error al procesar la venta. Inténtalo de nuevo.');
            }
        } else {
            // Si hay cliente seleccionado, mostrar el drawer de confirmar venta
            setDrawerConfirmarOpen(true);
        }
    };

    // Función para confirmar venta desde el drawer
    const handleConfirmarVenta = async ({ estado, montoPagado, notas }) => {
        try {
            const total = calcularTotal();
            
            // Calcular monto pendiente
            const montoPendiente = estado === 'pendiente' ? total : 
                                   estado === 'parcial' ? total - montoPagado : 0;
            
            // Preparar datos de la venta usando la estructura del VentasContext
            const ventaData = {
                cliente_ref: clienteSeleccionado ? clienteSeleccionado.id : null,
                nombre_cliente: clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico',
                productos: selectedProducts.map((p) => ({
                    producto_ref: p.id,
                    nombre: p.nombre,
                    cantidad: p.tipo_unidad === 'kilogramo' ? 1 : p.cantidad, // Siempre 1 para kilogramo
                    precio_unitario: p.tipo_unidad === 'kilogramo' ? parseFloat(p.precio) : parseFloat(p.precio_unitario || p.precio), // Para kilogramo usar el precio final
                    subtotal: parseFloat(p.subtotal),
                    retornable: p.retornable || false,
                    cantidad_retornable: p.retornable ? p.cantidad - (p.cantidad_retornable || 0) : 0,
                })),
                notas: notas || '',
                estado: estado,
                monto_pagado: montoPagado,
                monto_pendiente: montoPendiente,
            };

            // Debug: verificar datos antes de enviar
            console.log('🔍 Datos de venta antes de enviar:', ventaData);
            console.log('🍾 Botellas adeudadas calculadas:', calcularBotellasAdeudadas());
            ventaData.productos.forEach((p, index) => {
                if (p.retornable) {
                    console.log(`🍾 Producto ${index + 1}: ${p.nombre}`);
                    console.log(`   - Cantidad total: ${p.cantidad}`);
                    console.log(`   - Botellas que debe (cantidad_retornable): ${p.cantidad_retornable}`);
                }
            });

            // Crear la venta usando el contexto de Ventas
            const newVentaId = await crearVenta(ventaData);
            setVentaId(newVentaId);

            // Limpiar el carrito y cliente
            setSelectedProducts([]);
            setClienteSeleccionado(null);
            setDrawerConfirmarOpen(false);

            // Reset del caché para reflejar cambios en stock
            resetProductsCache();

            // Retornar el ID de la venta para el drawer
            return newVentaId;

        } catch (error) {
            console.error('Error al procesar venta:', error);
            throw error; // Re-throw para que el drawer maneje el error
        }
    };

    // Función para ver nota de venta
    const handleViewNotaVenta = (ventaIdParam) => {
        const idToUse = ventaIdParam || ventaId;
        if (idToUse) {
            navigate(`/ventas/${idToUse}`);
        } else {
            console.error('No hay ID de venta disponible');
        }
    };

    // Función para ver ticket desde el alerta del componente padre
    const handleViewTicketFromAlert = () => {
        if (ventaAlertId) {
            setVentaStatus('idle');
            setTimeout(() => {
                setVentaAlertId(null);
                navigate(`/ventas/${ventaAlertId}`);
            }, 100);
        }
    };

    // Función para seleccionar cliente
    const handleSelectCliente = (cliente) => {
        // Si cliente es null, significa Cliente Genérico
        if (cliente === null) {
            setClienteSeleccionado(null);
            setDrawerClientesOpen(false);
            console.log('Cliente Genérico seleccionado');
            return;
        }

        // Validar cliente específico
        if (!cliente || !cliente.id) {
            console.error('Cliente inválido seleccionado');
            return;
        }

        setClienteSeleccionado(cliente);
        setDrawerClientesOpen(false);
        console.log('Cliente seleccionado:', cliente.nombre);
    };

    // Función para remover cliente
    const handleRemoveCliente = () => {
        setClienteSeleccionado(null);
        console.log('Cliente removido');
    };

    // Calcular total del carrito
    const calcularTotal = () => {
        return selectedProducts.reduce((total, producto) => total + producto.subtotal, 0);
    };

    // Función para obtener la cantidad de un producto en el carrito
    const getCantidadEnCarrito = (productoId) => {
        const producto = selectedProducts.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    };

    // Función para calcular total de productos en el carrito
    const calcularTotalProductos = () => {
        return selectedProducts.reduce((total, producto) => total + producto.cantidad, 0);
    };

    // Función para calcular total de botellas adeudadas
    const calcularBotellasAdeudadas = () => {
        return selectedProducts.reduce((total, producto) => {
            if (producto.retornable) {
                return total + (producto.cantidad - (producto.cantidad_retornable || 0));
            }
            return total;
        }, 0);
    };

    // Calcular deuda total del cliente
    const deudaTotalCliente = clienteSeleccionado ? obtenerDeudaTotalPorCliente(clienteSeleccionado.id) : 0;

    // Variantes de animación para Framer Motion
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        },
        hover: {
            scale: 1.02,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.98,
            transition: { duration: 0.1 }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.95,
            transition: { duration: 0.1 }
        }
    };

    const cartItemVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 10
            }
        },
        exit: {
            opacity: 0,
            x: -50,
            transition: { duration: 0.3 }
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-50"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Estilos personalizados para scrollbar */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #45923a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a7d30;
        }
      `}</style>

            {/* Navbar Superior */}
            <NavbarVentasDestock
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                barcodeInput={barcodeInput}
                setBarcodeInput={setBarcodeInput}
                escanerActivo={escanerActivo}
                setEscanerActivo={setEscanerActivo}
                onBack={() => navigate('/dashboard')}
                isDisabled={ventaStatus === 'uploading'}
            />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Panel Izquierdo - Categorías */}
                <motion.div
                    className="w-60 bg-gradient-to-b from-white to-gray-50 shadow-lg flex flex-col"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="p-4 bg-gradient-to-r from-[#45923a] to-[#3a7d30] flex-shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Filter size={20} />
                            Categorías
                        </h3>
                        <p className="text-sm text-green-100 mt-1">Filtrar productos</p>
                    </div>

                    <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Botón "Todas las categorías" */}
                        <motion.button
                            onClick={() => {
                                if (ventaStatus !== 'uploading') {
                                    setSelectedCategory('all');
                                }
                            }}
                            className={`w-full p-4 text-left rounded-xl mb-3 transition-colors shadow-sm ${
                                ventaStatus === 'uploading'
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                            } ${selectedCategory === 'all'
                                ? 'bg-[#ffa40c] text-white shadow-md'
                                : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md border border-gray-100'
                                }`}
                            variants={buttonVariants}
                            whileHover={ventaStatus !== 'uploading' ? "hover" : {}}
                            whileTap={ventaStatus !== 'uploading' ? "tap" : {}}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Todas las categorías</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === 'all'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {productosOptimizados.length}
                                </span>
                            </div>
                        </motion.button>

                        {/* Lista de categorías */}
                        <AnimatePresence>
                            {categorias.map((categoria, index) => {
                                const productCount = productosOptimizados.filter(p => p.categoria_ref === categoria.id).length;
                                return (
                                    <motion.button
                                        key={categoria.id}
                                        onClick={() => {
                                            if (ventaStatus !== 'uploading') {
                                                setSelectedCategory(categoria.id);
                                            }
                                        }}
                                        className={`w-full p-4 text-left rounded-xl mb-3 transition-colors shadow-sm ${
                                            ventaStatus === 'uploading'
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                        } ${selectedCategory === categoria.id
                                            ? 'bg-[#ffa40c] text-white shadow-md'
                                            : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md border border-gray-100'
                                            }`}
                                        variants={buttonVariants}
                                        whileHover={ventaStatus !== 'uploading' ? "hover" : {}}
                                        whileTap={ventaStatus !== 'uploading' ? "tap" : {}}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold block truncate">{categoria.nombre}</span>
                                                <span className={`text-xs block mt-1 ${selectedCategory === categoria.id
                                                    ? 'text-orange-100'
                                                    : 'text-gray-500'
                                                    }`}>
                                                    {productCount} producto{productCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ml-2 ${selectedCategory === categoria.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {productCount}
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Panel Central - Catálogo de Productos */}
                <motion.div
                    className="flex-1 p-4 min-w-0 relative"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Input invisible para códigos de barras del escáner */}
                    <input
                        id="scanner-input"
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && barcodeInput.trim() && escanerActivo) {
                                e.preventDefault();
                                console.log('🔍 Enter detectado con código:', barcodeInput);
                            }
                        }}
                        className="absolute top-[-9999px] left-[-9999px] opacity-0"
                        autoComplete="off"
                        tabIndex={-1}
                        style={{ pointerEvents: escanerActivo ? 'auto' : 'none' }}
                    />
                    <div className="bg-white rounded-xl shadow-sm h-full overflow-hidden flex flex-col">
                        {/* Contenido del catálogo */}
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                            {productosLoading ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                        {Array.from({ length: 10 }).map((_, index) => (
                                            <ProductCardSkeleton key={index} />
                                        ))}
                                    </div>
                                </div>
                            ) : productosFiltrados.length === 0 ? (
                                <div className="text-center text-gray-500 py-16">
                                    <Package size={64} className="mx-auto mb-4 text-gray-300" />
                                    <h4 className="text-xl font-semibold mb-2">No hay productos disponibles</h4>
                                    <p className="text-gray-400">
                                        {searchTerm
                                            ? 'No se encontraron productos que coincidan con tu búsqueda'
                                            : 'No hay productos en esta categoría'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                        {productosParaMostrar.map((producto) => (
                                        <div
                                            key={producto.id}
                                            className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative ${
                                                ventaStatus === 'uploading' 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : 'cursor-pointer'
                                            }`}
                                            onClick={() => {
                                                if (ventaStatus !== 'uploading') {
                                                    handleAddToCart(producto);
                                                }
                                            }}
                                        >
                                            {/* Header con precios */}
                                            <div className="flex justify-start items-start p-4 pb-2 gap-2">
                                                {/* Precio principal - Recuadro verde */}
                                                <div className="bg-[#45923a] text-white px-3 py-2 rounded-full shadow-sm">
                                                    <span className="font-bold text-sm">S/{parseFloat(producto.precio).toFixed(2)}</span>
                                                    <span className="text-xs ml-1 opacity-90">
                                                        {producto.tipo_unidad === 'kilogramo' ? '/kg' : '/ud'}
                                                    </span>
                                                </div>

                                                {/* Precio alternativo (si lo tiene) - Recuadro azul */}
                                                {producto.has_precio_alternativo && producto.precio_alternativo !== null && (
                                                    <div className="bg-blue-500 text-white px-3 py-2 rounded-full shadow-sm">
                                                        <span className="font-bold text-sm">S/{parseFloat(producto.precio_alternativo).toFixed(2)}</span>
                                                        <span className="text-xs ml-1 opacity-90">
                                                            {producto.tipo_unidad === 'kilogramo' ? '/kg' : '/ud'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Imagen del producto - Centrada */}
                                            <div className="relative h-40  bg-white flex items-center justify-center mx-4 mb-4">
                                                {producto.imagen ? (
                                                    <img
                                                        src={producto.imagen}
                                                        alt={producto.nombre}
                                                        className="w-full h-full  object-contain"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                                                        <Package className="text-gray-300" size={48} />
                                                    </div>
                                                )}
                                                
                                                {/* Overlay cuando está en carrito */}
                                                {getCantidadEnCarrito(producto.id) > 0 && (
                                                    <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                                                        <div className="bg-green-500 text-white rounded-full px-3 py-1 shadow-lg">
                                                            <span className="font-bold text-sm flex items-center gap-1">
                                                                <ShoppingCart size={14} />
                                                                En carrito
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Badge de cantidad */}
                                                {getCantidadEnCarrito(producto.id) > 0 && (
                                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-10">
                                                        {getCantidadEnCarrito(producto.id)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Nombre del producto - Debajo de la imagen */}
                                            <div className="px-4 mb-3">
                                                <h4 className="font-bold text-gray-900 text-sm leading-tight text-center uppercase tracking-wide">
                                                    {producto.nombre}
                                                </h4>
                                            </div>

                                            {/* Categoría y Stock - Badge bonito y colorido */}
                                            <div className="px-4 pb-4">
                                                <div className="text-center flex flex-wrap justify-center items-center gap-2">
                                                    <span className="inline-flex items-center font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2 rounded-full text-white shadow-md hover:shadow-lg transition-all duration-200 border border-amber-400">
                                                        {obtenerCategoriaPorId(producto.categoria_ref)?.nombre || 'Sin categoría'}
                                                    </span>
                                                    <span className="inline-flex items-center font-bold text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full shadow-sm">
                                                        Stock: {producto.stock || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Botón Ver Más */}
                                {productosVisibles < productosFiltrados.length && (
                                    <div className="flex justify-center pt-6">
                                        <motion.button
                                            onClick={handleVerMas}
                                            className="bg-[#45923a] hover:bg-[#3a7d30] text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                                            variants={buttonVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <Eye size={20} />
                                            Ver más productos ({Math.min(5, productosFiltrados.length - productosVisibles)} más)
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Panel Derecho - Carrito */}
                <motion.div
                    className="w-96 bg-white shadow-lg flex flex-col relative overflow-hidden"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Overlay del carrito cuando hay venta en proceso */}
                    <AnimatePresence>
                        {ventaStatus === 'uploading' && (
                            <motion.div
                                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    className="bg-white rounded-xl p-6 shadow-2xl text-center"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <div className="w-12 h-12 border-4 border-[#50d05c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">ESPERE UN MOMENTO</h3>
                                    <p className="text-sm text-gray-600">Procesando su venta...</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4 bg-gradient-to-r from-[#45923a] to-[#3a7d30] flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <ShoppingCart size={20} />
                                <h3 className="font-bold">Carrito</h3>
                            </div>
                            <div className="flex items-center gap-2">

                                {/* Contador de productos */}
                                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                                    <Package size={14} className="text-white" />
                                    <span className="text-white text-sm font-bold">
                                        {calcularTotalProductos()}
                                    </span>
                                </div>
                                
                                {/* Contador de botellas adeudadas */}
                                {calcularBotellasAdeudadas() > 0 && (
                                    <div className="flex items-center gap-1 bg-red-500/90 px-2 py-1 rounded-full">
                                        <Milk size={14} className="text-white" />
                                        <span className="text-white text-sm font-bold">
                                            {calcularBotellasAdeudadas()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cliente seleccionado */}
                        <div className="mt-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setDrawerClientesOpen(true)}
                                    className="cursor-pointer text-white bg-[#ffa40c] p-2 rounded-full font-bold flex items-center gap-2 "
                                >
                                    <User size={16} strokeWidth={4} />
                                    <span className="text-sm flex-1 text-left">
                                        {clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico'}
                                    </span>
                                    {clienteSeleccionado && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveCliente();
                                            }}
                                            className="p-1 hover:bg-white/20 rounded"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </button>
                                
                                {/* Badge de deuda */}
                                {clienteSeleccionado && deudaTotalCliente > 0 && (
                                    <span className="bg-red-500 text-white px-3 py-2.5 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1">
                                        <AlertTriangle size={14} />
                                        Debe : S/{deudaTotalCliente.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lista de productos en carrito */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar min-h-0">
                        {selectedProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
                                <img src={CarritoVacio} className="w-28 mb-4" alt="Carrito vacío" />
                                <p className="font-medium mb-2">Carrito vacío</p>
                                <p className="text-sm mb-4">Añade productos del catálogo</p>
                                
                                {/* Indicador de estado del escáner en carrito vacío */}
                                <div className="flex items-center gap-3 bg-[#45923a] px-4 py-3 rounded-xl">
                                    <ScanBarcode className="w-5 h-5 text-white" />
                                    <span className="text-white font-medium text-sm">Estado del escáner:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                        escanerActivo 
                                            ? 'bg-green-200 text-green-800' 
                                            : 'bg-gray-200 text-gray-800'
                                    }`}>
                                        {escanerActivo ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <motion.div className="space-y-4">
                                <AnimatePresence>
                                    {selectedProducts.map((producto, index) => (
                                        <motion.div
                                            key={`${producto.id}-${index}`}
                                            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4"
                                            variants={cartItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                        >
                                            {/* Header del producto */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                    {producto.imagen ? (
                                                        <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={24} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 text-base leading-tight">{producto.nombre}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-gray-500">S/{producto.precio.toFixed(2)} c/u</span>
                                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                        <span className="text-sm font-medium text-[#45923a]">S/{producto.subtotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => {
                                                            if (ventaStatus !== 'uploading') {
                                                                handleEditProduct(producto);
                                                            }
                                                        }}
                                                        className={`p-2 text-blue-600 bg-blue-50 rounded-xl transition-colors active:scale-95 ${
                                                            ventaStatus === 'uploading' 
                                                                ? 'opacity-50 cursor-not-allowed' 
                                                                : ''
                                                        }`}
                                                        title="Editar producto"
                                                        disabled={ventaStatus === 'uploading'}
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (ventaStatus !== 'uploading') {
                                                                handleRemoveFromCart(producto.carritoId || producto.id);
                                                            }
                                                        }}
                                                        className={`p-2 text-red-600 bg-red-50 rounded-xl transition-colors active:scale-95 ${
                                                            ventaStatus === 'uploading' 
                                                                ? 'opacity-50 cursor-not-allowed' 
                                                                : ''
                                                        }`}
                                                        title="Eliminar producto"
                                                        disabled={ventaStatus === 'uploading'}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Controles de cantidad - No mostrar para productos por kilogramo */}
                                            {producto.tipo_unidad !== 'kilogramo' && (
                                                <div className="bg-gray-50 rounded-xl p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-600">Cantidad:</span>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleDecreaseQuantity(producto.id)}
                                                                className="w-8 h-8 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
                                                                disabled={producto.cantidad <= 1 || ventaStatus === 'uploading'}
                                                            >
                                                                <Minus size={16} className={producto.cantidad <= 1 || ventaStatus === 'uploading' ? 'text-gray-300' : 'text-gray-600'} />
                                                            </button>
                                                            <span className="min-w-[3rem] text-center font-bold text-lg text-gray-800">{producto.cantidad}</span>
                                                            <button
                                                                onClick={() => handleIncreaseQuantity(producto.id)}
                                                                className="w-8 h-8 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
                                                                disabled={ventaStatus === 'uploading'}
                                                            >
                                                                <Plus size={16} className={ventaStatus === 'uploading' ? 'text-gray-300' : 'text-gray-600'} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Controles de botellas retornables */}
                                            {producto.retornable && (
                                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200 mt-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <Milk size={16} className="text-blue-600" />
                                                            <span className="text-sm font-medium text-blue-800">Debe botellas:</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (ventaStatus !== 'uploading') {
                                                                        handleUpdateRetornables(producto.id, 'increment');
                                                                    }
                                                                }} 
                                                                className={`w-8 h-8 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 ${
                                                                    ventaStatus === 'uploading' 
                                                                        ? 'cursor-not-allowed' 
                                                                        : ''
                                                                }`}
                                                                disabled={(producto.cantidad_retornable || 0) >= producto.cantidad || ventaStatus === 'uploading'}
                                                            >
                                                                <Minus size={16} className={(producto.cantidad_retornable || 0) >= producto.cantidad || ventaStatus === 'uploading' ? 'text-gray-300' : 'text-blue-600'} />
                                                            </button>
                                                            <span className="min-w-[3rem] text-center font-bold text-lg text-blue-800">
                                                                {producto.cantidad - (producto.cantidad_retornable || 0)}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    if (ventaStatus !== 'uploading') {
                                                                        handleUpdateRetornables(producto.id, 'decrement');
                                                                    }
                                                                }} 
                                                                className={`w-8 h-8 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 ${
                                                                    ventaStatus === 'uploading' 
                                                                        ? 'cursor-not-allowed' 
                                                                        : ''
                                                                }`}
                                                                disabled={(producto.cantidad_retornable || 0) <= 0 || ventaStatus === 'uploading'}
                                                            >
                                                                <Plus size={16} className={(producto.cantidad_retornable || 0) <= 0 || ventaStatus === 'uploading' ? 'text-gray-300' : 'text-blue-600'} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>

                    {/* Panel de pago - Solo visible cuando hay productos */}
                    {selectedProducts.length > 0 && (
                        <div className="p-4 bg-gray-50 flex-shrink-0">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-medium text-gray-700">Total:</span>
                                    <span className="text-4xl font-bold text-[#45923a]">S/{calcularTotal().toFixed(2)}</span>
                                </div>

                                {/* Deuda Total con el mismo estilo que Total */}
                                {clienteSeleccionado && deudaTotalCliente > 0 && selectedProducts.length > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-red-700 flex items-center gap-2">
                                            Deuda Total:
                                        </span>
                                        <span className="text-xl font-bold text-red-600">
                                            S/{(deudaTotalCliente + calcularTotal()).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <motion.button
                                    className={`w-full p-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
                                        ventaStatus === 'uploading' 
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                            : 'bg-[#45923a] text-white'
                                    }`}
                                    onClick={handleProcesarPago}
                                    disabled={ventaStatus === 'uploading'}
                                >
                                    <DollarSign size={20} />
                                    {clienteSeleccionado ? 'Procesar Pago' : 'Finalizar Venta'}
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* Drawer de Clientes - Solo en el carrito */}
                    <ClientesDrawer
                        isOpen={drawerClientesOpen}
                        onClose={() => setDrawerClientesOpen(false)}
                        onSelectCliente={handleSelectCliente}
                    />

                    {/* Drawer de Editar Precio - Solo para productos normales */}
                    <EditarPrecioDrawer
                        isOpen={drawerEditarPrecioOpen}
                        onClose={() => {
                            setDrawerEditarPrecioOpen(false);
                            setProductoParaEditar(null);
                        }}
                        producto={productoParaEditar}
                        onUpdatePrecio={handleUpdatePrecio}
                    />

                    {/* Drawer de Kilogramos - Solo para productos por kilogramo */}
                    <KilogramoDrawer
                        isOpen={drawerKilogramoOpen}
                        onClose={() => {
                            setDrawerKilogramoOpen(false);
                            setProductoKilogramo(null);
                            setProductoEditando(null);
                        }}
                        producto={productoKilogramo}
                        productoCarrito={productoEditando} // Producto del carrito que se está editando
                        onAgregarAlCarrito={productoEditando ? handleActualizarKilogramo : handleAgregarKilogramo}
                        isEditing={!!productoEditando}
                    />

                    {/* Drawer de Precio Alternativo - Solo para productos con precios alternativos */}
                    <PrecioAlternativoDrawer
                        isOpen={drawerPrecioAlternativoOpen}
                        onClose={() => {
                            setDrawerPrecioAlternativoOpen(false);
                            setProductoPrecioAlternativo(null);
                        }}
                        producto={productoPrecioAlternativo}
                        onAgregarAlCarrito={handleAgregarPrecioAlternativo}
                    />

                    {/* Drawer de Confirmar Venta */}
                    <ConfirmarVentaDrawer
                        isOpen={drawerConfirmarOpen}
                        onClose={() => setDrawerConfirmarOpen(false)}
                        onConfirm={handleConfirmarVenta}
                        onViewNotaVenta={handleViewNotaVenta}
                        total={calcularTotal()}
                        currentUser={currentUser}
                        clientesLoading={false}
                        clienteSeleccionado={clienteSeleccionado}
                        setClienteSeleccionado={setClienteSeleccionado}
                    />

                    {/* Notificaciones */}
                    <AnimatePresence>
                    {/* Alerta de venta principal */}
                    {(ventaStatus === 'uploading' || ventaStatus === 'success') && (
                        <motion.div 
                            key="venta-notification-main"
                            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] w-full max-w-xl  px-4"
                            initial={{ opacity: 0, y: -80, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ 
                                opacity: 0, 
                                y: -80, 
                                scale: 0.9,
                                transition: { duration: 0.6, ease: "easeInOut" }
                            }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 20,
                                duration: 0.5
                            }}
                        >
                            <div role="alert" className="alert alert-vertical sm:alert-horizontal bg-white shadow-2xl border border-gray-200 rounded-xl p-5">
                                {ventaStatus === 'uploading' ? (
                                    <motion.svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        className="h-12 w-12 shrink-0"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <circle 
                                            className="opacity-25" 
                                            cx="12" 
                                            cy="12" 
                                            r="10" 
                                            stroke="#2cda94" 
                                            strokeWidth="2"
                                            fill="none"
                                        />
                                        <path 
                                            className="opacity-75" 
                                            fill="#2cda94" 
                                            d="m12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8z"
                                        />
                                    </motion.svg>
                                ) : (
                                    <motion.div 
                                        className="w-12 h-12 shrink-0 flex items-center justify-center"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 500, 
                                            damping: 20,
                                            delay: 0.1
                                        }}
                                    >
                                        <Lottie 
                                            animationData={successAnimation} 
                                            autoplay={true}
                                            loop={false}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </motion.div>
                                )}
                                
                                <motion.div
                                    initial={ventaStatus === 'success' ? { opacity: 0, x: -20 } : false}
                                    animate={ventaStatus === 'success' ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                >
                                    <motion.h3 
                                        className="font-bold text-base"
                                        initial={ventaStatus === 'success' ? { opacity: 0 } : false}
                                        animate={ventaStatus === 'success' ? { opacity: 1 } : {}}
                                        transition={{ delay: 0.4, duration: 0.3 }}
                                    >
                                        {ventaStatus === 'uploading' ? 'Subiendo la venta' : '¡Venta completada!'}
                                    </motion.h3>
                                    <motion.div 
                                        className="text-sm"
                                        initial={ventaStatus === 'success' ? { opacity: 0 } : false}
                                        animate={ventaStatus === 'success' ? { opacity: 1 } : {}}
                                        transition={{ delay: 0.5, duration: 0.3 }}
                                    >
                                        {ventaStatus === 'uploading' 
                                            ? 'La venta se está procesando...' 
                                            : 'La venta se ha registrado exitosamente'
                                        }
                                    </motion.div>
                                </motion.div>
                                
                                {ventaStatus === 'success' && (
                                    <motion.button 
                                        className="btn btn-sm bg-[#45923a] hover:bg-[#3a7d30] text-white border-none"
                                        onClick={handleViewTicketFromAlert}
                                        initial={{ opacity: 0, x: 30, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{ 
                                            delay: 0.6, 
                                            duration: 0.4,
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Ver Ticket
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                        {/* Notificación de código de barras */}
                        {barcodeNotification && (
                            <motion.div
                                className={`mb-4 rounded-lg shadow-lg p-4 min-w-80 ${
                                    barcodeNotification.type === 'success' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-red-500 text-white'
                                }`}
                                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {barcodeNotification.type === 'success' ? (
                                            <CheckCircle size={24} />
                                        ) : (
                                            <AlertTriangle size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            {barcodeNotification.message}
                                        </p>
                                        <p className="text-xs opacity-90">
                                            Código: {barcodeNotification.codigo}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setBarcodeNotification(null)}
                                        className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Notificación de código de barras */}
                        <AnimatePresence>
                        {barcodeNotification && (
                            <motion.div
                                className={`mb-4 rounded-lg shadow-lg p-4 min-w-80 ${
                                    barcodeNotification.type === 'success' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-red-500 text-white'
                                }`}
                                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {barcodeNotification.type === 'success' ? (
                                            <CheckCircle size={24} />
                                        ) : (
                                            <AlertTriangle size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            {barcodeNotification.message}
                                        </p>
                                        {barcodeNotification.details && (
                                            <p className="text-xs opacity-90 mt-1">
                                                {barcodeNotification.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Indicador de procesamiento de código de barras */}
                        <AnimatePresence>
                        {isProcessingBarcode && (
                            <motion.div
                                className="mb-4 bg-blue-500 text-white rounded-lg shadow-lg p-4 min-w-80"
                                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        <Barcode size={24} className="animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            Procesando código de barras...
                                        </p>
                                        <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                                            <div className="bg-white h-1 rounded-full animate-pulse w-3/4"></div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default VentasDestock;
