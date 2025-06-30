import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Pencil, CreditCard, Users, History, Barcode, Package, User, PlusCircle, ScanBarcode, X, Milk, Minus, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useClientes } from '../context/ClientesContext';
import { useVentas } from '../context/VentasContext';
import { useProducts } from '../context/ProductContext';
import ProductoNinguno from '../assets/Ventas/ProductoNinguno.svg';
import ClientesDrawer from '../components/Ventas/ClientesDrawer';
import ProductosDrawer from '../components/Ventas/ProductosDrawer';
import ConfirmarVentaDrawer from '../components/Ventas/ConfirmarVentaDrawer';
import EditarPrecioDrawer from '../components/Ventas/EditarPrecioDrawer';
import EscanearProductoDrawer from '../components/Ventas/EscanearProductoDrawer';

const Ventas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clientes, obtenerClientePorId, loading: clientesLoading } = useClientes();
  const { crearVenta } = useVentas();
  const { obtenerProductoPorCodigoBarrasDirecto, obtenerCategoriaPorId } = useProducts();

  // Estados existentes
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [drawerClientesOpen, setDrawerClientesOpen] = useState(false);
  const [drawerProductosOpen, setDrawerProductosOpen] = useState(false);
  const [drawerConfirmarOpen, setDrawerConfirmarOpen] = useState(false);
  const [drawerEditarPrecioOpen, setDrawerEditarPrecioOpen] = useState(false);
  const [drawerEscanearOpen, setDrawerEscanearOpen] = useState(false);
  const [productoEditIndex, setProductoEditIndex] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [ventaId, setVentaId] = useState(null);

  // Estados para el escáner de pistola
  const [barcodeInput, setBarcodeInput] = useState('');
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const barcodeInputRef = useRef(null);
  const isProcessingRef = useRef(false); // Para evitar procesar códigos mientras uno está en curso

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
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-amber-500',
      description: 'Gestionar pagos pendientes',
      path: '/deudas',
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: <Users className="h-6 w-6" />,
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

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Enfocar el input al montar el componente
  useEffect(() => {
    setAppear(true);
    barcodeInputRef.current?.focus();
  }, []);

  // Reenfocar el input después de cualquier clic en la página, si no hay drawers/modales abiertos
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (
        !drawerEscanearOpen &&
        !drawerClientesOpen &&
        !drawerProductosOpen &&
        !drawerConfirmarOpen &&
        !drawerEditarPrecioOpen &&
        !priceModalOpen &&
        barcodeInputRef.current
      ) {
        console.log('Reenfocando input después de clic global');
        barcodeInputRef.current.focus();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [drawerEscanearOpen, drawerClientesOpen, drawerProductosOpen, drawerConfirmarOpen, drawerEditarPrecioOpen, priceModalOpen]);

  // Cargar datos de localStorage
  useEffect(() => {
    try {
      const ventaGuardada = localStorage.getItem('ventaEnProgreso');
      if (ventaGuardada) {
        const { clienteSeleccionado, selectedProductos } = JSON.parse(ventaGuardada);
        if (clienteSeleccionado && clienteSeleccionado.id) {
          const clienteActual = obtenerClientePorId(clienteSeleccionado.id);
          if (clienteActual) {
            setClienteSeleccionado(clienteActual);
          }
        }
        if (Array.isArray(selectedProductos) && selectedProductos.length > 0) {
          setSelectedProductos(
            selectedProductos.filter(
              (p) =>
                p.id &&
                p.nombre &&
                typeof p.cantidad === 'number' &&
                typeof p.precio_unitario === 'number' &&
                typeof p.subtotal === 'string'
            )
          );
        }
      }
    } catch (err) {
      console.error('Error al recuperar datos de localStorage:', err);
      localStorage.removeItem('ventaEnProgreso');
      setToast({ message: 'Error al recuperar datos guardados', type: 'error', visible: true });
    }
    barcodeInputRef.current?.focus();
  }, [obtenerClientePorId]);

  // Guardar datos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'ventaEnProgreso',
        JSON.stringify({
          clienteSeleccionado,
          selectedProductos,
        })
      );
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
      setToast({ message: 'Error al guardar datos', type: 'error', visible: true });
    }
  }, [clienteSeleccionado, selectedProductos]);

  // Actualizar cliente seleccionado
  useEffect(() => {
    if (clienteSeleccionado && !clientesLoading) {
      const clienteActual = obtenerClientePorId(clienteSeleccionado.id);
      if (!clienteActual) {
        setToast({ message: 'El cliente seleccionado ya no está disponible', type: 'error', visible: true });
        setClienteSeleccionado(null);
      } else if (
        clienteActual.nombre !== clienteSeleccionado.nombre ||
        clienteActual.telefono !== clienteSeleccionado.telefono
      ) {
        setClienteSeleccionado(clienteActual);
      }
    }
    barcodeInputRef.current?.focus();
  }, [clientes, clientesLoading, clienteSeleccionado, obtenerClientePorId]);

  // Lógica para manejar el escáner de pistola
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key === 'Enter' && barcodeInput && !isProcessingRef.current && !drawerEscanearOpen && !drawerClientesOpen && !drawerProductosOpen && !drawerConfirmarOpen && !drawerEditarPrecioOpen) {
        console.log('Código escaneado:', barcodeInput); // Para depuración
        isProcessingRef.current = true; // Bloquear procesamiento de nuevos códigos
        try {
          // Validar que el código sea un string válido
          if (!/^\d+$/.test(barcodeInput)) {
            setToast({ message: 'Código de barras inválido', type: 'error', visible: true });
            setBarcodeInput('');
            barcodeInputRef.current?.focus();
            isProcessingRef.current = false;
            return;
          }
          const foundProduct = await obtenerProductoPorCodigoBarrasDirecto(barcodeInput);
          if (foundProduct) {
            setSelectedProduct(foundProduct);
            if (foundProduct.has_precio_alternativo && foundProduct.precio_alternativo) {
              setPriceModalOpen(true);
            } else {
              handleSelectProducto({
                id: foundProduct.id,
                nombre: foundProduct.nombre,
                cantidad: 1,
                precio_unitario: parseFloat(foundProduct.precio),
                subtotal: parseFloat(foundProduct.precio).toFixed(2),
                retornable: foundProduct.retornable || false,
                cantidad_retornable: foundProduct.retornable && foundProduct.tipo_unidad !== 'kilogramo' ? 1 : 0,
                tipo_unidad: foundProduct.tipo_unidad || 'unidad',
                precio_referencia: foundProduct.tipo_unidad === 'kilogramo' ? parseFloat(foundProduct.precio) : null,
                imagen: foundProduct.imagen || null,
              });
              barcodeInputRef.current?.focus();
            }
          } else {
            setToast({ message: 'Producto no encontrado', type: 'error', visible: true });
            barcodeInputRef.current?.focus();
          }
        } catch (err) {
          console.error('Error al buscar producto:', err);
          setToast({ message: 'Error al procesar el código de barras', type: 'error', visible: true });
          barcodeInputRef.current?.focus();
        }
        setBarcodeInput('');
        setTimeout(() => {
          isProcessingRef.current = false; // Liberar después de un pequeño retraso
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeInput, obtenerProductoPorCodigoBarrasDirecto, drawerEscanearOpen, drawerClientesOpen, drawerProductosOpen, drawerConfirmarOpen, drawerEditarPrecioOpen]);

  // Reenfocar el input cuando el modal de precios se cierra
  useEffect(() => {
    if (!priceModalOpen) {
      console.log('Reenfocando input después de cerrar modal de precios');
      barcodeInputRef.current?.focus();
    }
  }, [priceModalOpen]);

  // Reenfocar el input cuando los drawers se cierran
  useEffect(() => {
    if (!drawerEscanearOpen && !drawerClientesOpen && !drawerProductosOpen && !drawerConfirmarOpen && !drawerEditarPrecioOpen) {
      console.log('Reenfocando input después de cerrar drawers');
      barcodeInputRef.current?.focus();
    }
  }, [drawerEscanearOpen, drawerClientesOpen, drawerProductosOpen, drawerConfirmarOpen, drawerEditarPrecioOpen]);

  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
    barcodeInputRef.current?.focus();
  };

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
    barcodeInputRef.current?.focus();
  };

  const handleSelectCliente = (cliente) => {
    if (!cliente || !cliente.id) {
      showToast('Cliente inválido seleccionado', 'error');
      console.error('Invalid client selected:', cliente);
      return;
    }
    console.log('Selected client:', cliente);
    setClienteSeleccionado(cliente);
    setDrawerClientesOpen(false);
    showToast('Cliente seleccionado con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleRemoveCliente = (e) => {
    e.stopPropagation();
    console.log('Removing client:', clienteSeleccionado);
    setClienteSeleccionado(null);
    showToast('Cliente removido con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleSelectProducto = (producto) => {
    setSelectedProductos((prev) => {
      const existingProductIndex = prev.findIndex((p) => p.id === producto.id && p.precio_unitario === producto.precio_unitario);
      if (existingProductIndex !== -1) {
        const updatedProductos = [...prev];
        updatedProductos[existingProductIndex] = {
          ...updatedProductos[existingProductIndex],
          cantidad: updatedProductos[existingProductIndex].cantidad + producto.cantidad,
          subtotal: (
            (updatedProductos[existingProductIndex].cantidad + producto.cantidad) * producto.precio_unitario
          ).toFixed(2),
          cantidad_retornable:
            producto.retornable && producto.tipo_unidad !== 'kilogramo'
              ? updatedProductos[existingProductIndex].cantidad_retornable + producto.cantidad
              : 0,
        };
        return updatedProductos;
      }
      return [...prev, producto];
    });
    setPriceModalOpen(false);
    setSelectedProduct(null);
    showToast('Producto añadido con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleRemoveProducto = (index) => {
    setSelectedProductos((prev) => prev.filter((_, i) => i !== index));
    showToast('Producto eliminado con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleUpdateCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
            ...p,
            cantidad: nuevaCantidad,
            subtotal: (nuevaCantidad * p.precio_unitario).toFixed(2),
            cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? nuevaCantidad : 0,
          }
          : p
      )
    );
    barcodeInputRef.current?.focus();
  };

  const handleUpdatePrecio = (index, nuevoPrecio) => {
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio <= 0) {
      showToast('El precio debe ser un número positivo', 'error');
      return;
    }
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
            ...p,
            precio_unitario: precio,
            subtotal: (p.cantidad * precio).toFixed(2),
          }
          : p
      )
    );
    setDrawerEditarPrecioOpen(false);
    showToast('Precio actualizado con éxito', 'success');
    barcodeInputRef.current?.focus();
  };

  const handleFractionPrice = (index, fraction) => {
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index && p.tipo_unidad === 'kilogramo'
          ? {
            ...p,
            precio_unitario: parseFloat((p.precio_referencia * fraction).toFixed(2)),
            subtotal: parseFloat((p.cantidad * p.precio_referencia * fraction).toFixed(2)),
          }
          : p
      )
    );
    barcodeInputRef.current?.focus();
  };

  const handleUpdateRetornables = (index, retornablesDevueltos) => {
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
            ...p,
            cantidad_retornable: retornablesDevueltos,
          }
          : p
      )
    );
    barcodeInputRef.current?.focus();
  };

  const handleOpenEditarPrecio = (index) => {
    setProductoEditIndex(index);
    setDrawerEditarPrecioOpen(true);
  };

  const handleRegistrarVenta = () => {
    if (selectedProductos.length === 0) {
      showToast('Debe seleccionar al menos un producto', 'error');
      return;
    }
    const hasOwedRetornables = selectedProductos.some((p) => p.retornable && p.cantidad_retornable > 0);
    if (hasOwedRetornables && !clienteSeleccionado) {
      showToast('Se requiere un cliente registrado para productos retornables con botellas pendientes', 'error');
      return;
    }
    setDrawerConfirmarOpen(true);
  };

  const handleConfirmarVenta = async ({ estado, montoPagado, historialPagos, notas }) => {
    try {
      const total = calcularTotal();
      const ventaData = {
        cliente_ref: clienteSeleccionado ? clienteSeleccionado.id : null,
        nombre_cliente: clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico',
        productos: selectedProductos.map((p) => ({
          producto_ref: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio_unitario: parseFloat(p.precio_unitario),
          subtotal: parseFloat(p.subtotal),
          retornable: p.retornable,
          cantidad_retornable: p.cantidad_retornable,
        })),
        notas: notas || '',
        estado,
        monto_pagado: montoPagado,
        monto_pendiente: total - montoPagado,
        historial_pagos: historialPagos,
      };
      console.log('Venta Data to be sent:', ventaData);
      const ventaId = await crearVenta(ventaData);
      setVentaId(ventaId);
      showToast(`Venta registrada con éxito (ID: ${ventaId})`, 'success');
      setClienteSeleccionado(null);
      setSelectedProductos([]);
      localStorage.removeItem('ventaEnProgreso');
      setDrawerConfirmarOpen(false);
      barcodeInputRef.current?.focus();
      return ventaId;
    } catch (error) {
      showToast(`Error al registrar venta: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleViewNotaVenta = () => {
    if (ventaId) {
      navigate(`/ventas/${ventaId}`);
    } else {
      showToast('No se pudo cargar la nota de venta: ID no disponible', 'error');
    }
    barcodeInputRef.current?.focus();
  };

  const calcularTotal = () => {
    return selectedProductos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
  };

  const calcularTotalProductos = () => {
    return selectedProductos.reduce((sum, p) => sum + p.cantidad, 0);
  };

  const handleSelectPrecio = (precio) => {
    if (selectedProduct) {
      handleSelectProducto({
        id: selectedProduct.id,
        nombre: selectedProduct.nombre,
        cantidad: 1,
        precio_unitario: parseFloat(precio),
        subtotal: parseFloat(precio).toFixed(2),
        retornable: selectedProduct.retornable || false,
        cantidad_retornable: selectedProduct.retornable && selectedProduct.tipo_unidad !== 'kilogramo' ? 1 : 0,
        tipo_unidad: selectedProduct.tipo_unidad || 'unidad',
        precio_referencia: selectedProduct.tipo_unidad === 'kilogramo' ? parseFloat(selectedProduct.precio) : null,
        imagen: selectedProduct.imagen || null,
      });
    }
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
              className={`w-full shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
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

      {/* Modal de selección de precios */}
      {priceModalOpen && selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => {
              setPriceModalOpen(false);
              barcodeInputRef.current?.focus();
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[95] p-4">
            <div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-800">Seleccionar Precio</h3>
                  <button
                    onClick={() => {
                      setPriceModalOpen(false);
                      barcodeInputRef.current?.focus();
                    }}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {selectedProduct.imagen ? (
                        <img
                          src={selectedProduct.imagen}
                          alt={selectedProduct.nombre}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{selectedProduct.nombre}</h4>
                      <span className="text-xs text-gray-500">
                        {obtenerCategoriaPorId(selectedProduct.categoria_ref)?.nombre || 'Sin categoría'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      handleSelectPrecio(selectedProduct.precio);
                      barcodeInputRef.current?.focus();
                    }}
                    className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-[#45923a] hover:bg-[#f9fdf8] transition-all focus:outline-none focus:ring-2 focus:ring-[#45923a] group relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">Precio Normal</h5>
                      <p className="text-xs text-gray-500 mb-2">Precio estándar del producto</p>
                      <span className="text-xl font-bold text-[#45923a] mb-1">
                        S/{parseFloat(selectedProduct.precio).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#45923a] mt-1">
                        <Check className="h-4 w-4 text-[#45923a] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-[#45923a] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                  <button
                    onClick={() => {
                      handleSelectPrecio(parseFloat(selectedProduct.precio_alternativo));
                      barcodeInputRef.current?.focus();
                    }}
                    className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-[#ffa40c] hover:bg-[#fff8e6] transition-all focus:outline-none focus:ring-2 focus:ring-[#ffa40c] group relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">
                        Precio {selectedProduct.motivo_precio_alternativo || 'Alternativo'}
                      </h5>
                      <p className="text-xs text-gray-500 mb-2">Precio especial</p>
                      <span className="text-xl font-bold text-[#ffa40c] mb-1">
                        S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#ffa40c] mt-1">
                        <Check className="h-4 w-4 text-[#ffa40c] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-[#ffa40c] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
          onChange={(e) => setBarcodeInput(e.target.value)}
          className="absolute opacity-0 pointer-events-none"
          inputMode="none"      // ← Esto evita el teclado en móviles
          autoComplete="off"
          aria-hidden="true"
        />
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
          <div className="flex flex-col items-center gap-4 mb-4">
            <button
              className="btn border-none rounded-2xl flex flex-row items-center justify-center p-3 w-80 bg-blue-500 text-white shadow-md transition-all"
              onClick={() => navigate('/ventas/historial')}
            >
              <History size={17} className="flex-shrink-0" />
              <span className="text-sm truncate max-w-[150px]"> Ver Historial</span>
            </button>
            <div className="flex flex-row justify-center gap-2 sm:gap-6">
              <div className="relative">
                <button
                  className={`flex btn rounded-full flex-row items-center justify-center p-3 border-none text-white shadow-md transition-all ${clienteSeleccionado ? 'bg-[#ffa40c] hover:bg-[#e69500] pr-10' : 'bg-[#ffa40c] hover:bg-[#e69500]'
                    }`}
                  onClick={() => setDrawerClientesOpen(true)}
                  disabled={clientesLoading}
                >
                  <User size={17} className="flex-shrink-0" />
                  <span className="text-sm truncate max-w-[150px]">
                    {clientesLoading
                      ? 'Cargando clientes...'
                      : clienteSeleccionado
                        ? clienteSeleccionado.nombre
                        : 'Cliente Genérico'}
                  </span>
                </button>
                {clienteSeleccionado && (
                  <button
                    onClick={handleRemoveCliente}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-[#ffc157] transition-colors z-10"
                    aria-label="Quitar cliente"
                  >
                    <X size={14} strokeWidth={2.5} className="text-white" />
                  </button>
                )}
              </div>
              <button
                className="btn border-none btn-soft rounded-full flex flex-row items-center justify-center p-3 sm:p-4 bg-[#45923a] hover:bg-[#3a7d30] text-white shadow-md transition-all"
                onClick={() => setDrawerProductosOpen(true)}
              >
                <PlusCircle size={17} />
                <span className="text-sm sm:text-base font-medium">Producto</span>
              </button>
              <button
                className="flex btn btn-dash border-none rounded-full flex-row items-center justify-center p-3 sm:p-4 bg-gray-200 hover:bg-gray-300 shadow-md transition-all"
                onClick={() => setDrawerEscanearOpen(true)}
              >
                <ScanBarcode strokeWidth={2.5} size={20} />
              </button>
            </div>
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
                    Agrega productos escaneando códigos de barras o buscando en nuestro catálogo para comenzar tu venta.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                  <div className="space-y-3 overflow-y-auto flex-1 pb-2">
                    {selectedProductos.map((producto, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
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
                                aria-label="Quitar producto"
                              >
                                <Trash2 size={16} strokeWidth={2.75} className="text-red-500 group-hover:text-red-700 transition-colors" />
                              </button>
                            </div>
                            {producto.tipo_unidad === 'kilogramo' && (
                              <p className="text-xs text-gray-500 mb-3 bg-gray-50 px-2 py-1 rounded-lg inline-block">
                                S/{producto.precio_referencia.toFixed(2)} por kg
                              </p>
                            )}
                            <div className="space-y-3">
                              {producto.tipo_unidad === 'kilogramo' ? (
                                <>
                                  <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2">
                                      <span className="text-sm font-bold text-emerald-800">S/{producto.precio_unitario.toFixed(2)}</span>
                                    </div>
                                    <button
                                      onClick={() => handleOpenEditarPrecio(index)}
                                      className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-3 rounded-xl transition-all active:scale-95"
                                      aria-label="Editar precio"
                                    >
                                      <Pencil size={16} className="text-blue-600" />
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    {[
                                      { fraction: 0.25, label: '1/4 kg', title: '250g' },
                                      { fraction: 0.5, label: '1/2 kg', title: '500g' },
                                      { fraction: 0.75, label: '3/4 kg', title: '750g' },
                                    ].map(({ fraction, label, title }) => (
                                      <button
                                        key={fraction}
                                        onClick={() => handleFractionPrice(index, fraction)}
                                        className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-md transition-all active:scale-95"
                                        title={title}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
                                    <button
                                      onClick={() => handleUpdateCantidad(index, producto.cantidad - 1)}
                                      className="p-3 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors active:scale-95"
                                      disabled={producto.cantidad <= 1}
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="px-4 text-sm font-bold text-gray-800 min-w-[40px] text-center">
                                      {producto.cantidad}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateCantidad(index, producto.cantidad + 1)}
                                      className="p-3 text-gray-600 hover:bg-gray-200 transition-colors active:scale-95"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-xl">
                                      <span className="text-sm font-bold text-[#45923a]">S/{producto.precio_unitario.toFixed(2)}</span>
                                    </div>
                                    <button
                                      onClick={() => handleOpenEditarPrecio(index)}
                                      className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-3 rounded-xl transition-all active:scale-95"
                                      aria-label="Editar precio"
                                    >
                                      <Pencil size={16} className="text-blue-600" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-medium text-gray-500">Subtotal:</span>
                                <span className="text-base font-bold text-[#45923a]">
                                  S/{producto.subtotal}
                                </span>
                              </div>
                              {producto.retornable && (
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Milk size={16} className="text-blue-600" />
                                      <span className="text-sm font-medium text-blue-800">Botellas pendientes:</span>
                                    </div>
                                    <select
                                      value={producto.cantidad_retornable}
                                      onChange={(e) => handleUpdateRetornables(index, parseInt(e.target.value) || 0)}
                                      className="px-3 py-1 border border-blue-300 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      {[...Array(producto.cantidad + 1)].map((_, i) => (
                                        <option key={i} value={i}>
                                          {i} {i === 1 ? 'botella' : 'botellas'}
                                        </option>
                                      ))}
                                    </select>
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
                onClick={handleRegistrarVenta}
                className="w-full py-4 bg-[#45923a] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98]"
              >
                <ShoppingCart size={22} strokeWidth={2.5} />
                <span className="text-lg">Registrar Venta</span>
              </button>
            </div>
          )}
        </div>
      </main>
      <ClientesDrawer
        isOpen={drawerClientesOpen}
        onClose={() => setDrawerClientesOpen(false)}
        onSelectCliente={handleSelectCliente}
      />
      <ProductosDrawer
        isOpen={drawerProductosOpen}
        onClose={() => setDrawerProductosOpen(false)}
        onSelectProducto={handleSelectProducto}
      />
      <ConfirmarVentaDrawer
        isOpen={drawerConfirmarOpen}
        onClose={() => setDrawerConfirmarOpen(false)}
        onConfirm={handleConfirmarVenta}
        onViewNotaVenta={handleViewNotaVenta}
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        total={calcularTotal()}
        currentUser={currentUser}
        clientesLoading={clientesLoading}
      />
      {productoEditIndex !== null && (
        <EditarPrecioDrawer
          isOpen={drawerEditarPrecioOpen}
          onClose={() => {
            setDrawerEditarPrecioOpen(false);
            setProductoEditIndex(null);
          }}
          producto={selectedProductos[productoEditIndex]}
          onConfirm={(nuevoPrecio) => handleUpdatePrecio(productoEditIndex, nuevoPrecio)}
        />
      )}
      <EscanearProductoDrawer
        isOpen={drawerEscanearOpen}
        onClose={() => setDrawerEscanearOpen(false)}
        onSelectProducto={handleSelectProducto}
        setError={setToast}
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

export default Ventas;