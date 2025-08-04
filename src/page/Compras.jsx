import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Truck, History, Barcode, Package, User, PlusCircle, ScanBarcode, X, CheckCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useProveedores } from '../context/ProveedoresContext';
import { useProducts } from '../context/ProductContext';
import { useCompras } from '../context/ComprasContext';
import ProveedoresDrawer from '../components/Compra/ProveedoresDrawer';
import ProductosDrawer from '../components/Compra/ProductosDrawer';
import ProductoDetallesDrawer from '../components/Compra/ProductoDetallesDrawer';
import EscanearProductoDrawer from '../components/Compra/EscanearProductoDrawer';
import DrawerNuevoProducto from '../components/Compra/DrawerNuevoProducto';
import ProductoNinguno from '../assets/Compras/ProductoNinguno.svg';

const Compras = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { proveedores, obtenerProveedorPorId, loading: proveedoresLoading } = useProveedores();
  const { productos, categorias, productosLoading, obtenerProductoPorId, obtenerProductoPorCodigoBarrasDirecto, crearProducto } = useProducts();
  const { crearCompra } = useCompras();

  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [drawerProveedoresOpen, setDrawerProveedoresOpen] = useState(false);
  const [drawerProductosOpen, setDrawerProductosOpen] = useState(false);
  const [drawerDetallesOpen, setDrawerDetallesOpen] = useState(false);
  const [drawerEscanearOpen, setDrawerEscanearOpen] = useState(false);
  const [drawerNuevoProductoOpen, setDrawerNuevoProductoOpen] = useState(false);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [codigoBarrasNoEncontrado, setCodigoBarrasNoEncontrado] = useState('');
  const [productosNuevos, setProductosNuevos] = useState([]);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef(null);
  const isProcessingRef = useRef(false);

  const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial', path: '/ventas' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
    { id: 'clientes', title: 'Clientes', icon: <User className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes', path: '/clientes' },
    { id: 'escaner', title: 'Escáner de Códigos', icon: <Barcode className="h-6 w-6" />, color: 'bg-violet-500', description: 'Consultar precios por código de barras', path: '/escaner' },
    { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo', path: '/productos' },
  ];

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    setAppear(true);
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (!drawerProveedoresOpen && !drawerProductosOpen && !drawerDetallesOpen && !drawerEscanearOpen && !drawerNuevoProductoOpen && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [drawerProveedoresOpen, drawerProductosOpen, drawerDetallesOpen, drawerEscanearOpen, drawerNuevoProductoOpen]);

  useEffect(() => {
    try {
      const compraGuardada = localStorage.getItem('compraEnProgreso');
      if (compraGuardada) {
        const { proveedorSeleccionado: savedProvider, selectedProductos: savedProducts } = JSON.parse(compraGuardada);
        if (savedProvider?.id) {
          const proveedorActual = obtenerProveedorPorId(savedProvider.id);
          setProveedorSeleccionado(proveedorActual || null);
        }
        if (Array.isArray(savedProducts)) {
          const validProductos = savedProducts.map(p => {
            const productoActual = obtenerProductoPorId(p.id);
            return productoActual ? { ...productoActual, ...p } : null;
          }).filter(Boolean);
          setSelectedProductos(validProductos);
        }
      }
    } catch (err) {
      console.error('Error al recuperar datos de localStorage:', err);
      localStorage.removeItem('compraEnProgreso');
      showToast('Error al recuperar datos guardados', 'error');
    }
    barcodeInputRef.current?.focus();
  }, [obtenerProveedorPorId, obtenerProductoPorId]);

  useEffect(() => {
    try {
      localStorage.setItem('compraEnProgreso', JSON.stringify({ proveedorSeleccionado, selectedProductos }));
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
      showToast('Error al guardar el progreso', 'error');
    }
  }, [proveedorSeleccionado, selectedProductos]);

  useEffect(() => {
    if (proveedorSeleccionado && !proveedoresLoading) {
      const proveedorActual = obtenerProveedorPorId(proveedorSeleccionado.id);
      if (!proveedorActual) {
        setProveedorSeleccionado(null);
        showToast('El proveedor seleccionado ya no existe', 'error');
      }
    }
    barcodeInputRef.current?.focus();
  }, [proveedores, proveedoresLoading, proveedorSeleccionado, obtenerProveedorPorId]);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key === 'Enter' && barcodeInput && !isProcessingRef.current && !drawerProveedoresOpen && !drawerProductosOpen && !drawerDetallesOpen && !drawerEscanearOpen && !drawerNuevoProductoOpen) {
        isProcessingRef.current = true;
        try {
          if (!/^\d+$/.test(barcodeInput)) {
            showToast('Código de barras inválido', 'error');
            setBarcodeInput('');
            barcodeInputRef.current?.focus();
            isProcessingRef.current = false;
            return;
          }

          // Buscar primero en productos nuevos temporales
          const productoNuevoEncontrado = productosNuevos.find(p => p.codigoBarras === barcodeInput);
          
          if (productoNuevoEncontrado) {
            const yaExiste = selectedProductos.some(p => p.id === productoNuevoEncontrado.id);
            
            if (!yaExiste) {
              setSelectedProduct(productoNuevoEncontrado);
              setProductoAEditar(null);
              setEditIndex(null);
              setDrawerDetallesOpen(true);
            } else {
              showToast('Este producto ya está en la lista', 'warning');
            }
          } else {
            // Buscar en productos existentes
            const producto = await obtenerProductoPorCodigoBarrasDirecto(barcodeInput);
            if (producto) {
              const yaExiste = selectedProductos.some(p => p.id === producto.id);
              
              if (!yaExiste) {
                setSelectedProduct(producto);
                setProductoAEditar(null);
                setEditIndex(null);
                setDrawerDetallesOpen(true);
              } else {
                showToast('Este producto ya está en la lista', 'warning');
              }
            } else {
              // Producto no encontrado - abrir drawer de nuevo producto
              setCodigoBarrasNoEncontrado(barcodeInput);
              setDrawerNuevoProductoOpen(true);
            }
          }
        } catch (error) {
          showToast(`Error al buscar producto: ${error.message}`, 'error');
        } finally {
          setBarcodeInput('');
          isProcessingRef.current = false;
          barcodeInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeInput, obtenerProductoPorCodigoBarrasDirecto, drawerProveedoresOpen, drawerProductosOpen, drawerDetallesOpen, drawerEscanearOpen, drawerNuevoProductoOpen, selectedProductos, productosNuevos]);

  useEffect(() => {
    if (!drawerProveedoresOpen && !drawerProductosOpen && !drawerDetallesOpen && !drawerEscanearOpen && !drawerNuevoProductoOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [drawerProveedoresOpen, drawerProductosOpen, drawerDetallesOpen, drawerEscanearOpen, drawerNuevoProductoOpen]);

  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
    barcodeInputRef.current?.focus();
  };

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
    barcodeInputRef.current?.focus();
  };

  const handleSelectProveedor = (proveedor) => {
    if (!proveedor || !proveedor.id) {
      showToast('Proveedor inválido seleccionado', 'error');
      return;
    }
    setProveedorSeleccionado(proveedor);
    setDrawerProveedoresOpen(false);
    showToast('Proveedor seleccionado con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleRemoveProveedor = (e) => {
    e.stopPropagation();
    setProveedorSeleccionado(null);
    showToast('Proveedor removido con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleSelectProducto = (producto) => {
    if (!producto?.id || !producto.nombre) {
      showToast('Producto inválido seleccionado', 'error');
      return;
    }
    setSelectedProductos((prev) => {
      const existingProductIndex = prev.findIndex((p) => p.id === producto.id);
      if (existingProductIndex !== -1) {
        const updatedProductos = [...prev];
        updatedProductos[existingProductIndex] = {
          ...updatedProductos[existingProductIndex],
          cantidad: updatedProductos[existingProductIndex].cantidad + producto.cantidad,
          subtotal: (
            (updatedProductos[existingProductIndex].cantidad + producto.cantidad) * updatedProductos[existingProductIndex].precioCompra
          ).toFixed(2),
          precio_venta: producto.precio_venta || updatedProductos[existingProductIndex].precio_venta,
          precio_alternativo: producto.has_precio_alternativo ? producto.precio_alternativo : null,
          motivo_precio_alternativo: producto.has_precio_alternativo ? producto.motivo_precio_alternativo : null,
          has_precio_alternativo: !!producto.has_precio_alternativo,
        };
        return updatedProductos;
      }
      return [...prev, {
        ...producto,
        subtotal: (producto.cantidad * producto.precioCompra).toFixed(2),
      }];
    });
    setDrawerProductosOpen(false);
    setDrawerDetallesOpen(false);
    setDrawerEscanearOpen(false);
    setSelectedProduct(null);
    setProductoAEditar(null);
    setEditIndex(null);
    showToast(`Producto ${producto.nombre} añadido con éxito`, 'success');
    barcodeInputRef.current?.focus();
  };

  const handleUpdateProducto = (producto, index) => {
    if (!producto?.id || !producto.nombre) {
      showToast('Producto inválido seleccionado', 'error');
      return;
    }
    setSelectedProductos((prev) => {
      const updatedProductos = [...prev];
      updatedProductos[index] = {
        ...updatedProductos[index],
        cantidad: producto.cantidad,
        precioCompra: producto.precioCompra,
        precio_venta: producto.precio_venta,
        precio_alternativo: producto.has_precio_alternativo ? producto.precio_alternativo : null,
        motivo_precio_alternativo: producto.has_precio_alternativo ? producto.motivo_precio_alternativo : null,
        has_precio_alternativo: !!producto.has_precio_alternativo,
        subtotal: (producto.cantidad * producto.precioCompra).toFixed(2),
      };
      return updatedProductos;
    });
    setDrawerDetallesOpen(false);
    setProductoAEditar(null);
    setEditIndex(null);
    showToast(`Producto ${producto.nombre} actualizado con éxito`, 'success');
    barcodeInputRef.current?.focus();
  };

  const handleRemoveProducto = (index) => {
    setSelectedProductos((prev) => prev.filter((_, i) => i !== index));
    showToast('Producto eliminado con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleOpenEditarCantidad = (index) => {
    const producto = selectedProductos[index];
    setProductoAEditar(producto);
    setEditIndex(index);
    setDrawerDetallesOpen(true);
  };

  const handleNuevoProductoCreado = (nuevoProducto) => {
    // Agregar el producto temporal a la lista de productos nuevos
    setProductosNuevos(prev => [...prev, nuevoProducto]);
    
    // Cerrar el drawer de nuevo producto
    setDrawerNuevoProductoOpen(false);
    
    // Configurar el producto para abrir el drawer de detalles
    setSelectedProduct(nuevoProducto);
    setProductoAEditar(null);
    setEditIndex(null);
    setDrawerDetallesOpen(true);
    
    showToast(`Producto temporal ${nuevoProducto.nombre} creado. Configura los precios.`, 'success');
  };

  const handleConfirmarCompra = async () => {
    if (!proveedorSeleccionado) {
      showToast('Debes seleccionar un proveedor', 'error');
      return;
    }
    if (selectedProductos.length === 0) {
      showToast('Debes añadir al menos un producto', 'error');
      return;
    }
    setLoading(true);
    try {
      // Primero crear los productos nuevos si los hay
      const productosConIds = await Promise.all(
        selectedProductos.map(async (producto) => {
          if (producto.esNuevo) {
            // Este es un producto temporal, necesitamos crearlo en la base de datos
            console.log('Producto temporal a crear:', producto);
            
            const productoData = {
              nombre: producto.nombre,
              codigoBarras: producto.codigoBarras,
              categoria_ref: producto.categoria_ref,
              precio_venta: parseFloat(producto.precio_venta),
              precio_alternativo: producto.has_precio_alternativo ? parseFloat(producto.precio_alternativo) : null,
              motivo_precio_alternativo: producto.has_precio_alternativo ? producto.motivo_precio_alternativo : null,
              has_precio_alternativo: !!producto.has_precio_alternativo,
              precioCompra: parseFloat(producto.precioCompra),
              stock: 0, // El stock se actualizará con la compra
              marca: producto.marca || '',
              tipo_unidad: producto.tipo_unidad || 'unidad',
              retornable: producto.retornable || false,
              fecha_vencimiento: producto.fecha_vencimiento || null
            };
            
            console.log('Datos del producto a enviar:', productoData);
            
            // Validar que los campos requeridos no sean undefined
            if (!productoData.codigoBarras) {
              throw new Error(`El código de barras del producto ${producto.nombre} es requerido`);
            }
            if (!productoData.nombre) {
              throw new Error(`El nombre del producto es requerido`);
            }
            if (!productoData.categoria_ref) {
              throw new Error(`La categoría del producto ${producto.nombre} es requerida`);
            }
            
            try {
              const nuevoProductoId = await crearProducto(productoData);
              return {
                ...producto,
                id: nuevoProductoId,
                esNuevo: false
              };
            } catch (error) {
              console.error('Error al crear producto:', error);
              throw new Error(`Error al crear el producto ${producto.nombre}: ${error.message}`);
            }
          }
          return producto;
        })
      );

      // Ahora crear la compra con los productos que tienen IDs válidos
      const compraData = {
        proveedor_ref: proveedorSeleccionado.id,
        productos: productosConIds.map((p) => ({
          producto_ref: p.id,
          cantidad: p.cantidad,
          precio_unitario: parseFloat(p.precioCompra),
          subtotal: parseFloat(p.subtotal),
          precio_venta: parseFloat(p.precio_venta),
          precio_alternativo: p.has_precio_alternativo ? parseFloat(p.precio_alternativo) : null,
          motivo_precio_alternativo: p.has_precio_alternativo ? p.motivo_precio_alternativo : null,
          has_precio_alternativo: !!p.has_precio_alternativo,
        })),
        notas: '',
      };
      const compraId = await crearCompra(compraData);
      
      // Limpiar estados
      setSelectedProductos([]);
      setProveedorSeleccionado(null);
      setProductosNuevos([]);
      localStorage.removeItem('compraEnProgreso');
      showToast(`Compra ${compraId} registrada con éxito`, 'success');
    } catch (error) {
      showToast(`Error al registrar compra: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => {
    return selectedProductos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
  };

  const calcularTotalProductos = () => {
    return selectedProductos.reduce((sum, p) => sum + p.cantidad, 0);
  };

  const toastVariants = {
    hidden: { y: -100, opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={toastVariants}
            className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden"
          >
            <div
              className={`w-full shadow-lg ${
                toast.type === 'success' ? 'bg-green-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
              }`}
              role="alert"
              aria-labelledby="header-notification"
            >
              <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      {toast.type === 'success' ? (
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                      ) : (
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                      )}
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p id="header-notification" className="text-sm text-white font-medium">
                      {toast.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
                  className="text-white hover:text-gray-200 focus:outline-none transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} notifications={notifications} />
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />

      <main className="pt-3 px-2 sm:px-4 pb-28 flex flex-col h-full">
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
          className="absolute opacity-0 pointer-events-none"
          inputMode="none"
          autoComplete="off"
          aria-hidden="true"
          aria-label="Entrada para escáner de códigos de barras"
        />
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
          <div className="flex flex-col items-center gap-4 mb-4">
            <button
              className="btn border-none rounded-2xl flex flex-row items-center justify-center p-3 w-80 bg-blue-500 text-white shadow-md transition-all"
              onClick={() => navigate('/compras/historial')}
              aria-label="Ver historial de compras"
            >
              <History size={17} className="flex-shrink-0" />
              <span className="text-sm truncate max-w-[150px]">Ver Historial</span>
            </button>
            <div className="flex flex-row justify-center gap-2 sm:gap-6">
              <div className="relative">
                <button
                  className={`flex btn rounded-full flex-row items-center justify-center p-3 border-none text-white shadow-md transition-all ${
                    proveedorSeleccionado ? 'bg-[#ffa40c] hover:bg-[#e69500] pr-10' : 'bg-[#ffa40c] hover:bg-[#e69500]'
                  }`}
                  onClick={() => setDrawerProveedoresOpen(true)}
                  disabled={proveedoresLoading}
                  aria-label={proveedorSeleccionado ? `Proveedor seleccionado: ${proveedorSeleccionado.razon_social}` : 'Seleccionar proveedor'}
                >
                  <Truck size={17} className="flex-shrink-0" />
                  <span className="text-sm truncate max-w-[150px]">
                    {proveedoresLoading
                      ? 'Cargando proveedores...'
                      : proveedorSeleccionado
                      ? proveedorSeleccionado.razon_social
                      : 'Sin Proveedor'}
                  </span>
                </button>
                {proveedorSeleccionado && (
                  <button
                    onClick={handleRemoveProveedor}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-[#ffc157] transition-colors z-10"
                    aria-label="Quitar proveedor"
                  >
                    <X size={14} strokeWidth={2.5} className="text-white" />
                  </button>
                )}
              </div>
              <button
                className="btn border-none btn-soft rounded-full flex flex-row items-center justify-center p-3 sm:p-4 bg-[#45923a] hover:bg-[#3a7d30] text-white shadow-md transition-all"
                onClick={() => setDrawerProductosOpen(true)}
                disabled={productosLoading}
                aria-label="Seleccionar producto"
              >
                <PlusCircle size={17} />
                <span className="text-sm sm:text-base font-medium">Producto</span>
              </button>
              <button
                className="flex btn btn-dash border-none rounded-full flex-row items-center justify-center p-3 sm:p-4 bg-gray-200 hover:bg-gray-300 shadow-md transition-all"
                onClick={() => setDrawerEscanearOpen(true)}
                aria-label="Escanear código de barras con cámara"
              >
                <ScanBarcode strokeWidth={2.5} size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-1 min-h-0">
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-white via-white to-gray-50 shadow-xl p-4 flex flex-col border-0 overflow-hidden backdrop-blur-lg">
              {selectedProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto flex-1">
                  <div className="relative">
                    <img src={ProductoNinguno} className="h-32 rounded-3xl opacity-90" alt="Sin productos" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-3xl"></div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    Lista de productos vacía
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Agrega productos escaneando códigos de barras o buscando en nuestro catálogo para comenzar tu compra.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                  <div className="space-y-3 overflow-y-auto flex-1 pb-2">
                    {selectedProductos.map((producto, index) => (
                      <div
                        key={`${producto.id}-${index}`}
                        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                            {producto.imagen ? (
                              <img src={producto.imagen} alt={producto.nombre} className="object-cover w-full h-full rounded-2xl" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-bold text-gray-900 leading-tight pr-2">
                                {producto.nombre}
                              </h4>
                              <button
                                onClick={() => handleRemoveProducto(index)}
                                className="p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0 group"
                                aria-label={`Quitar producto ${producto.nombre}`}
                              >
                                <Trash2 size={16} strokeWidth={2.75} className="text-red-500 group-hover:text-red-700 transition-colors" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {producto.tipo_unidad === 'kilogramo' ? (
                                `Kilogramos: ${parseFloat(producto.cantidad).toFixed(2)} kg`
                              ) : (
                                `Cantidad: ${producto.cantidad}`
                              )}
                            </p>
                            {producto.tipo_unidad === 'kilogramo' && (
                              <p className="text-xs text-gray-500 mb-3 bg-gray-50 px-2 py-1 rounded-lg inline-block">
                                S/{parseFloat(producto.precio_venta).toFixed(2)} por kg
                              </p>
                            )}
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl">
                                    <span className="text-sm font-bold text-blue-600">
                                      Compra: S/{parseFloat(producto.precioCompra).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-xl">
                                    <span className="text-sm font-bold text-[#45923a]">
                                      Venta: S/{parseFloat(producto.precio_venta).toFixed(2)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleOpenEditarCantidad(index)}
                                    className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-3 rounded-xl transition-all active:scale-95"
                                    aria-label={`Editar cantidad de ${producto.nombre}`}
                                  >
                                    <Settings size={16} className="text-blue-600" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-medium text-gray-500">Subtotal:</span>
                                <span className="text-base font-bold text-[#45923a]">
                                  S/{producto.subtotal}
                                </span>
                              </div>
                              {producto.has_precio_alternativo && producto.precio_alternativo && (
                                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-xl border border-yellow-200">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-yellow-800">
                                      Precio Alternativo: S/{parseFloat(producto.precio_alternativo).toFixed(2)}
                                      {producto.tipo_unidad === 'kilogramo' && <span className="ml-1">/kg</span>}
                                    </span>
                                    {producto.motivo_precio_alternativo && (
                                      <span className="text-xs text-gray-500">
                                        Motivo: {producto.motivo_precio_alternativo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {selectedProductos.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl z-20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Total productos: {calcularTotalProductos()}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold bg-[#45923a] bg-clip-text text-transparent ml-2">
                    S/{calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleConfirmarCompra}
                className="w-full py-4 bg-[#45923a] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Confirmar compra"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <>
                    <ShoppingCart size={22} strokeWidth={2.5} />
                    <span className="text-lg">Confirmar Compra</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <ProveedoresDrawer
        isOpen={drawerProveedoresOpen}
        onClose={() => setDrawerProveedoresOpen(false)}
        onSelectProveedor={handleSelectProveedor}
      />
      <ProductosDrawer
        isOpen={drawerProductosOpen}
        onClose={() => setDrawerProductosOpen(false)}
        onSelectProducto={handleSelectProducto}
        onNuevoProducto={() => {
          // Abrir DrawerNuevoProducto para agregar producto manualmente
          setCodigoBarrasNoEncontrado(''); // Sin código de barras predefinido
          setDrawerNuevoProductoOpen(true);
        }}
      />
      <ProductoDetallesDrawer
        isOpen={drawerDetallesOpen}
        onClose={() => {
          setDrawerDetallesOpen(false);
          setSelectedProduct(null);
          setProductoAEditar(null);
          setEditIndex(null);
          barcodeInputRef.current?.focus();
        }}
        producto={productoAEditar || selectedProduct}
        onAgregarProducto={productoAEditar ? (producto) => handleUpdateProducto(producto, editIndex) : handleSelectProducto}
      />
      <EscanearProductoDrawer
        isOpen={drawerEscanearOpen}
        onClose={() => {
          setDrawerEscanearOpen(false);
          barcodeInputRef.current?.focus();
        }}
        onSelectProducto={(producto) => {
          setSelectedProduct(producto);
          setProductoAEditar(null);
          setEditIndex(null);
          setDrawerDetallesOpen(true);
        }}
        setError={setToast}
        productosNuevos={productosNuevos}
        selectedProductos={selectedProductos}
        onProductoNoEncontrado={(codigoBarras) => {
          // Producto no encontrado por cámara - abrir drawer de nuevo producto
          setCodigoBarrasNoEncontrado(codigoBarras);
          setDrawerNuevoProductoOpen(true);
        }}
      />
      <DrawerNuevoProducto
        isOpen={drawerNuevoProductoOpen}
        onClose={() => {
          setDrawerNuevoProductoOpen(false);
          setCodigoBarrasNoEncontrado('');
          barcodeInputRef.current?.focus();
        }}
        codigoBarras={codigoBarrasNoEncontrado}
        categorias={categorias}
        onContinuar={handleNuevoProductoCreado}
      />
      <style jsx global>{`
        .animate-in {
          animation: animateIn 0.3s ease-in-out;
        }
        @keyframes animateIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Compras;