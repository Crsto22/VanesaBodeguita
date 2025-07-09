import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Truck, History, Barcode, Package, User, PlusCircle, ScanBarcode, X, CheckCircle } from 'lucide-react';
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
import ProductoNinguno from '../assets/Compras/ProductoNinguno.svg';

const Compras = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { proveedores, obtenerProveedorPorId, loading: proveedoresLoading } = useProveedores();
  const { productos, productosLoading, obtenerProductoPorId, obtenerProductoPorCodigoBarrasDirecto } = useProducts();
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
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);
  const isProcessingRef = useRef(false);

  const quickAccessOptions = [
    {
      id: 'ventas',
      title: 'Ventas',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-emerald-500',
      description: 'Registrar ventas y ver historial',
      path: '/ventas',
    },
    {
      id: 'deudas',
      title: 'Pagar Deudas',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-amber-500',
      description: 'Gestionar pagos pendientes',
      path: '/deudas',
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: <User className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: 'Administrar base de clientes',
      path: '/clientes',
    },
    {
      id: 'escaner',
      title: 'Escáner de Códigos',
      icon: <Barcode className="h-6 w-6" />,
      color: 'bg-violet-500',
      description: 'Consultar precios por código de barras',
      path: '/escaner',
    },
    {
      id: 'productos',
      title: 'Productos',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-rose-500',
      description: 'Inventario y catálogo',
      path: '/productos',
    },
  ];

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Set initial appearance and focus
  useEffect(() => {
    setAppear(true);
    barcodeInputRef.current?.focus();
  }, []);

  // Re-focus input after interactions
  useEffect(() => {
    const handleGlobalClick = () => {
      if (!drawerProveedoresOpen && !drawerProductosOpen && !drawerDetallesOpen && !drawerEscanearOpen && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [drawerProveedoresOpen, drawerProductosOpen, drawerDetallesOpen, drawerEscanearOpen]);

  // Load saved purchase data
  useEffect(() => {
    try {
      const compraGuardada = localStorage.getItem('compraEnProgreso');
      if (compraGuardada) {
        const { proveedorSeleccionado, selectedProductos } = JSON.parse(compraGuardada);
        if (proveedorSeleccionado?.id) {
          const proveedorActual = obtenerProveedorPorId(proveedorSeleccionado.id);
          if (proveedorActual) {
            setProveedorSeleccionado(proveedorActual);
          } else {
            localStorage.removeItem('compraEnProgreso');
            setToast({ message: 'Proveedor guardado no encontrado', type: 'error', visible: true });
          }
        }
        if (Array.isArray(selectedProductos)) {
          const validProductos = selectedProductos
            .map((p) => {
              const productoActual = obtenerProductoPorId(p.id);
              return productoActual ? {
                ...productoActual,
                cantidad: p.cantidad,
                precioCompra: p.precioCompra,
                precio_venta: p.precio_venta,
                precio_alternativo: p.has_precio_alternativo && p.precio_alternativo ? p.precio_alternativo : null,
                motivo_precio_alternativo: p.has_precio_alternativo && p.motivo_precio_alternativo ? p.motivo_precio_alternativo : null,
                has_precio_alternativo: !!p.has_precio_alternativo,
              } : null;
            })
            .filter((p) => p !== null);
          setSelectedProductos(validProductos);
        }
      }
    } catch (err) {
      console.error('Error al recuperar datos de localStorage:', err);
      localStorage.removeItem('compraEnProgreso');
      setToast({ message: 'Error al recuperar datos guardados', type: 'error', visible: true });
    }
    barcodeInputRef.current?.focus();
  }, [obtenerProveedorPorId, obtenerProductoPorId]);

  // Save purchase data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'compraEnProgreso',
        JSON.stringify({
          proveedorSeleccionado,
          selectedProductos: selectedProductos.map((p) => ({
            id: p.id,
            cantidad: p.cantidad,
            precioCompra: p.precioCompra,
            precio_venta: p.precio_venta,
            precio_alternativo: p.has_precio_alternativo && p.precio_alternativo ? p.precio_alternativo : null,
            motivo_precio_alternativo: p.has_precio_alternativo && p.motivo_precio_alternativo ? p.motivo_precio_alternativo : null,
            has_precio_alternativo: !!p.has_precio_alternativo,
          })),
        })
      );
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
      setToast({ message: 'Error al guardar datos', type: 'error', visible: true });
    }
  }, [proveedorSeleccionado, selectedProductos]);

  // Update selected provider
  useEffect(() => {
    if (proveedorSeleccionado && !proveedoresLoading) {
      const proveedorActual = obtenerProveedorPorId(proveedorSeleccionado.id);
      if (!proveedorActual) {
        setToast({ message: 'El proveedor seleccionado ya no está disponible', type: 'error', visible: true });
        setProveedorSeleccionado(null);
        localStorage.removeItem('compraEnProgreso');
      } else if (
        proveedorActual.razon_social !== proveedorSeleccionado.razon_social ||
        proveedorActual.telefono !== proveedorSeleccionado.telefono
      ) {
        setProveedorSeleccionado(proveedorActual);
      }
    }
    barcodeInputRef.current?.focus();
  }, [proveedores, proveedoresLoading, proveedorSeleccionado, obtenerProveedorPorId]);

  // Barcode scanning logic
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key === 'Enter' && barcodeInput && !isProcessingRef.current && !drawerProveedoresOpen && !drawerProductosOpen && !drawerDetallesOpen && !drawerEscanearOpen) {
        isProcessingRef.current = true;
        try {
          if (!/^\d+$/.test(barcodeInput)) {
            setToast({ message: 'Código de barras inválido', type: 'error', visible: true });
            setBarcodeInput('');
            barcodeInputRef.current?.focus();
            isProcessingRef.current = false;
            return;
          }
          const producto = await obtenerProductoPorCodigoBarrasDirecto(barcodeInput);
          if (producto) {
            setSelectedProduct(producto);
            setDrawerDetallesOpen(true);
            setBarcodeInput('');
          } else {
            setToast({ message: 'Producto no encontrado', type: 'error', visible: true });
            setBarcodeInput('');
          }
        } catch (error) {
          setToast({ message: `Error al procesar código de barras: ${error.message}`, type: 'error', visible: true });
          setBarcodeInput('');
        } finally {
          isProcessingRef.current = false;
          barcodeInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeInput, obtenerProductoPorCodigoBarrasDirecto, drawerProveedoresOpen, drawerProductosOpen, drawerDetallesOpen, drawerEscanearOpen]);

  // Re-focus input when drawers close
  useEffect(() => {
    if (!drawerProveedoresOpen && !drawerProductosOpen && !drawerDetallesOpen && !drawerEscanearOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [drawerProveedoresOpen, drawerProductosOpen, drawerDetallesOpen, drawerEscanearOpen]);

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
    if (!proveedor?.id) {
      showToast('Proveedor inválido seleccionado', 'error');
      console.error('Invalid proveedor selected:', proveedor);
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
    if (!producto?.id) {
      showToast('Producto inválido seleccionado', 'error');
      return;
    }
    setSelectedProductos((prev) => {
      const existingProduct = prev.find((p) => p.id === producto.id);
      if (existingProduct) {
        return prev.map((p) =>
          p.id === producto.id
            ? {
                ...p,
                cantidad: p.cantidad + producto.cantidad,
                precioCompra: producto.precioCompra,
                precio_venta: producto.precio_venta,
                precio_alternativo: producto.has_precio_alternativo && producto.precio_alternativo ? producto.precio_alternativo : null,
                motivo_precio_alternativo: producto.has_precio_alternativo && producto.motivo_precio_alternativo ? producto.motivo_precio_alternativo : null,
                has_precio_alternativo: !!producto.has_precio_alternativo,
              }
            : p
        );
      }
      return [
        ...prev,
        {
          ...producto,
          cantidad: producto.cantidad,
          precioCompra: producto.precioCompra,
          precio_venta: producto.precio_venta,
          precio_alternativo: producto.has_precio_alternativo && producto.precio_alternativo ? producto.precio_alternativo : null,
          motivo_precio_alternativo: producto.has_precio_alternativo && producto.motivo_precio_alternativo ? producto.motivo_precio_alternativo : null,
          has_precio_alternativo: !!producto.has_precio_alternativo,
        },
      ];
    });
    setDrawerProductosOpen(false);
    setDrawerDetallesOpen(false);
    setDrawerEscanearOpen(false);
    setSelectedProduct(null);
    showToast(`Producto ${producto.nombre} añadido`, 'success');
    barcodeInputRef.current?.focus();
  };

  const handleRemoveProducto = (productoId) => {
    setSelectedProductos((prev) => prev.filter((p) => p.id !== productoId));
    showToast('Producto removido', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleChangeCantidad = (productoId, cantidad) => {
    if (isNaN(cantidad) || cantidad < 1) return;
    setSelectedProductos((prev) =>
      prev.map((p) => (p.id === productoId ? { ...p, cantidad: Number(cantidad) } : p))
    );
    barcodeInputRef.current?.focus();
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

    try {
      const compraData = {
        proveedor_ref: proveedorSeleccionado.id,
        productos: selectedProductos.map((p) => ({
          producto_ref: p.id,
          cantidad: p.cantidad,
          precio_unitario: p.precioCompra,
          subtotal: p.cantidad * p.precioCompra,
          precio_venta: p.precio_venta,
          precio_alternativo: p.has_precio_alternativo && p.precio_alternativo ? p.precio_alternativo : null,
          motivo_precio_alternativo: p.has_precio_alternativo && p.motivo_precio_alternativo ? p.motivo_precio_alternativo : null,
          has_precio_alternativo: !!p.has_precio_alternativo,
        })),
        notas: '',
      };

      const compraId = await crearCompra(compraData);
      setSelectedProductos([]);
      setProveedorSeleccionado(null);
      localStorage.removeItem('compraEnProgreso');
      showToast(`Compra ${compraId} registrada con éxito`, 'success');
      navigate('/compras/historial');
    } catch (error) {
      showToast(`Error al registrar compra: ${error.message}`, 'error');
    }
    barcodeInputRef.current?.focus();
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
              className={`w-full shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
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
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
          <div className="flex flex-col items-center gap-4 mb-4">
            <button
              className="btn border-none rounded-2xl flex flex-row items-center justify-center p-3 w-80 bg-blue-500 text-white shadow-md transition-all"
              onClick={() => navigate('/compras/historial')}
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
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="absolute opacity-0 pointer-events-none"
              inputMode="none"
              autoComplete="off"
              aria-hidden="true"
              aria-label="Entrada para escáner de códigos de barras"
            />
          </div>
          <div className="flex flex-col flex-1 p-1 min-h-0">
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-white via-white to-gray-50 shadow-xl p-4 flex flex-col border-0 overflow-hidden backdrop-blur-lg">
              {selectedProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto flex-1">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <img src={ProductoNinguno} className="h-32 rounded-3xl opacity-90" alt="Sin productos" />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-3xl"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    Lista de productos vacía
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Agrega productos escaneando códigos de barras o buscando en nuestro catálogo para comenzar tu compra.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {selectedProductos.map((producto) => (
                      <li key={producto.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#ffa40c] flex items-center justify-center text-white">
                            {producto.imagen ? (
                              <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                            <p className="text-xs text-gray-500">Cantidad: {producto.cantidad} {producto.tipo_unidad}</p>
                            <p className="text-xs text-gray-500">Precio Compra: S/ {producto.precioCompra?.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Costo Total: S/ {(producto.cantidad * producto.precioCompra).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Precio Venta: S/ {producto.precio_venta?.toFixed(2)}</p>
                            {producto.has_precio_alternativo && (
                              <>
                                <p className="text-xs text-gray-500">Precio Alternativo: S/ {producto.precio_alternativo?.toFixed(2)}</p>
                                {producto.motivo_precio_alternativo && (
                                  <p className="text-xs text-gray-500">Motivo: {producto.motivo_precio_alternativo}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={producto.cantidad}
                            onChange={(e) => handleChangeCantidad(producto.id, parseInt(e.target.value))}
                            className="w-16 p-1 border border-gray-300 rounded-md text-sm"
                            aria-label={`Cantidad de ${producto.nombre}`}
                          />
                          <button
                            onClick={() => handleRemoveProducto(producto.id)}
                            className="p-1 rounded-full hover:bg-gray-200"
                            aria-label={`Eliminar ${producto.nombre}`}
                          >
                            <X size={16} className="text-gray-500" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 border-t border-gray-200">
                    <button
                      onClick={handleConfirmarCompra}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#45923a] hover:bg-[#3a7d30]"
                      aria-label="Confirmar compra"
                    >
                      <CheckCircle size={17} className="inline mr-2" />
                      Confirmar Compra
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
      />
      <ProductoDetallesDrawer
        isOpen={drawerDetallesOpen}
        onClose={() => {
          setDrawerDetallesOpen(false);
          setSelectedProduct(null);
          barcodeInputRef.current?.focus();
        }}
        producto={selectedProduct}
        onAgregarProducto={handleSelectProducto}
      />
      <EscanearProductoDrawer
        isOpen={drawerEscanearOpen}
        onClose={() => {
          setDrawerEscanearOpen(false);
          barcodeInputRef.current?.focus();
        }}
        onSelectProducto={(producto) => {
          setSelectedProduct(producto);
          setDrawerDetallesOpen(true);
        }}
        setError={setToast}
      />
    </div>
  );
};

export default Compras;