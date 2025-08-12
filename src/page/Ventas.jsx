import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ShoppingCart, Zap, Trash2, Pencil, CreditCard, Users, History, Barcode, Package, User, PlusCircle, ScanBarcode, X, Milk, Minus, Plus, Check, AlertTriangle, Scale } from 'lucide-react';
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

// --- FUNCIÓN ASISTENTE ---
const obtenerCategoriasSugeridasPorHora = () => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const hora = now.getHours();
  if (hora >= 6 && hora < 10.5) return ['Panadería'];
  if (hora >= 10.5 && hora < 13) return ['Verduras', 'Carnes'];
  if (hora >= 13 && hora < 18) return ['Galletas o Snacks', 'Cereales'];
  if (hora >= 18 && hora < 24) return ['Panadería', 'Lacteos y huevos'];
  return ['Panadería', 'Lacteos y huevos'];
};

// --- OPTIMIZACIÓN: Hook para debouncing ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


// --- OPTIMIZACIÓN: Componente de producto memoizado ---
const ProductoEnVentaCard = React.memo(({
  producto,
  index,
  onRemove,
  onUpdateCantidad,
  onOpenEditarPrecio,
  onFractionPrice,
  onUpdateRetornables,
  onManualWeight
}) => {
  const [isManualWeight, setIsManualWeight] = useState(false);
  const [manualWeightValue, setManualWeightValue] = useState('');

  const handleConfirmManualWeight = () => {
    if (manualWeightValue) {
      onManualWeight(index, manualWeightValue);
      setIsManualWeight(false);
      setManualWeightValue('');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/50 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
          {producto.imagen ? <img src={producto.imagen} alt={producto.nombre} className="object-cover w-full h-full rounded-2xl" /> : <Package className="h-8 w-8 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-bold text-gray-900 leading-tight pr-2">{producto.nombre}</h4>
            <button onClick={() => onRemove(index)} className="p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0 group" aria-label="Quitar producto">
              <Trash2 size={16} strokeWidth={2.75} className="text-red-500 group-hover:text-red-700 transition-colors" />
            </button>
          </div>
          {producto.tipo_unidad === 'kilogramo' && (<p className="text-xs text-gray-500 mb-3 bg-gray-50 px-2 py-1 rounded-lg inline-block">S/{producto.precio_referencia?.toFixed(2) || 'N/A'} por kg</p>)}
          <div className="space-y-3">
            {producto.tipo_unidad === 'kilogramo' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2"><span className="text-sm font-bold text-emerald-800">S/{producto.precio_unitario.toFixed(2)}</span></div>
                  <button onClick={() => onOpenEditarPrecio(index)} className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-3 rounded-xl transition-all active:scale-95" aria-label="Editar precio"><Pencil size={16} className="text-blue-600" /></button>
                </div>

                {isManualWeight ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={manualWeightValue}
                      onChange={(e) => setManualWeightValue(e.target.value)}
                      placeholder="e.g. 1.5"
                      className="w-full px-3 py-2 text-sm font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      autoFocus
                    />
                     <span className="text-sm font-bold text-gray-500">kg</span>
                    <button onClick={handleConfirmManualWeight} className="p-2 bg-green-500 text-white rounded-xl active:scale-95 transition-transform"><Check size={16} /></button>
                    <button onClick={() => setIsManualWeight(false)} className="p-2 bg-gray-400 text-white rounded-xl active:scale-95 transition-transform"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {[{ fraction: 0.25, label: '1/4 kg', title: '250g' }, { fraction: 0.5, label: '1/2 kg', title: '500g' }, { fraction: 0.75, label: '3/4 kg', title: '750g' }].map(({ fraction, label, title }) => (
                      <button key={fraction} onClick={() => onFractionPrice(index, fraction)} className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-md transition-all active:scale-95" title={title}>{label}</button>
                    ))}
                    <button onClick={() => setIsManualWeight(true)} className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-xl shadow-md transition-all active:scale-95" title="Ingresar peso manual">
                      <Scale size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
                  <button onClick={() => onUpdateCantidad(index, producto.cantidad - 1)} className="p-3 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors active:scale-95" disabled={producto.cantidad <= 1}><Minus size={16} /></button>
                  <span className="px-4 text-sm font-bold text-gray-800 min-w-[40px] text-center">{producto.cantidad}</span>
                  <button onClick={() => onUpdateCantidad(index, producto.cantidad + 1)} className="p-3 text-gray-600 hover:bg-gray-200 transition-colors active:scale-95"><Plus size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-xl"><span className="text-sm font-bold text-[#45923a]">S/{producto.precio_unitario.toFixed(2)}</span></div>
                  <button onClick={() => onOpenEditarPrecio(index)} className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-3 rounded-xl transition-all active:scale-95" aria-label="Editar precio"><Pencil size={16} className="text-blue-600" /></button>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-medium text-gray-500">Subtotal:</span>
              <span className="text-base font-bold text-[#45923a]">S/{producto.subtotal}</span>
            </div>
            {producto.retornable && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200 mt-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Milk size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Debe botellas:</span>
                  </div>
                  <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
                    <button onClick={() => onUpdateRetornables(index, 'increment')} className="p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors active:scale-95" disabled={(producto.cantidad_retornable || 0) >= producto.cantidad}><Minus size={16} /></button>
                    <span className="px-4 text-sm font-bold text-gray-800 min-w-[40px] text-center">{producto.cantidad - (producto.cantidad_retornable || 0)}</span>
                    <button onClick={() => onUpdateRetornables(index, 'decrement')} className="p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors active:scale-95" disabled={(producto.cantidad_retornable || 0) <= 0}><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const Ventas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clientes, obtenerClientePorId, loading: clientesLoading } = useClientes();
  const { crearVenta, obtenerDeudaTotalPorCliente } = useVentas();
  const {
    obtenerProductoPorCodigoBarrasDirecto,
    obtenerCategoriaPorId,
    todosLosProductos,
    obtenerProductosRelacionados,
    categorias,
  } = useProducts();

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

  const [showCarousel, setShowCarousel] = useState(() => {
    try {
      const savedState = localStorage.getItem('showCarouselState');
      return savedState !== null ? JSON.parse(savedState) : false;
    } catch (error) {
      console.error("Error al leer 'showCarouselState' desde localStorage:", error);
      return false;
    }
  });

  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 2500, stopOnInteraction: false })]
  );
  
    const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial', path: '/ventas' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
    { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes', path: '/clientes' },
    { id: 'escaner', title: 'Escáner de Códigos', icon: <Barcode className="h-6 w-6" />, color: 'bg-violet-500', description: 'Consultar precios por código de barras', path: '/escaner' },
    { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo', path: '/productos' },
  ];
  
  // --- Handlers y funciones ---
  const showToast = useCallback((message, type) => {
    setToast({ message, type, visible: true });
  }, []);
  
  const formatProductForCarousel = (product) => ({
    id: product.id,
    nombre: product.nombre,
    precio: parseFloat(product.precio),
    imagen: product.imagen || null,
    retornable: product.retornable || false,
    tipo_unidad: product.tipo_unidad || 'unidad',
    precio_referencia: product.tipo_unidad === 'kilogramo' ? parseFloat(product.precio) : null,
    categoria_ref: product.categoria_ref,
    has_precio_alternativo: product.has_precio_alternativo || false,
    precio_alternativo: product.precio_alternativo ? parseFloat(product.precio_alternativo) : null,
    motivo_precio_alternativo: product.motivo_precio_alternativo || null,
  });
  
  const handleSelectProducto = useCallback((producto) => {
    setSelectedProductos((prev) => {
      const existingProductIndex = prev.findIndex((p) => p.id === producto.id && p.precio_unitario === producto.precio_unitario);
      if (existingProductIndex !== -1) {
        return prev.map((p, index) => {
          if (index === existingProductIndex) {
            const newQuantity = p.cantidad + 1;
            return {
              ...p,
              cantidad: newQuantity,
              subtotal: (newQuantity * p.precio_unitario).toFixed(2),
              cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? (p.cantidad_retornable || 0) + 1 : p.cantidad_retornable,
            };
          }
          return p;
        });
      } else {
        return [...prev, producto];
      }
    });
    setPriceModalOpen(false);
    setSelectedProduct(null);
    showToast('Producto añadido con éxito', 'success');
  }, [showToast]);

  const handleUpdateCantidad = useCallback((index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              cantidad: nuevaCantidad,
              subtotal: (nuevaCantidad * p.precio_unitario).toFixed(2),
              cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? nuevaCantidad : (p.cantidad_retornable || 0),
            }
          : p
      )
    );
  }, []);

  const handleRemoveProducto = useCallback((index) => {
    setSelectedProductos((prev) => prev.filter((_, i) => i !== index));
    showToast('Producto eliminado con éxito', 'success');
  }, [showToast]);

  const handleUpdatePrecio = useCallback((index, nuevoPrecio) => {
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
  }, [showToast]);
  
  const handleFractionPrice = useCallback((index, fraction) => {
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
  }, []);

  const handleManualWeight = useCallback((index, weightString) => {
    const weight = parseFloat(weightString);
    if (isNaN(weight) || weight <= 0) {
      showToast('Por favor, ingrese un peso válido y positivo.', 'error');
      return;
    }

    setSelectedProductos((prev) =>
      prev.map((p, i) => {
        if (i === index && p.tipo_unidad === 'kilogramo') {
          const newPrice = parseFloat((p.precio_referencia * weight).toFixed(2));
          return {
            ...p,
            precio_unitario: newPrice,
            subtotal: (p.cantidad * newPrice).toFixed(2),
          };
        }
        return p;
      })
    );
    showToast('Peso actualizado correctamente', 'success');
  }, [showToast]);


  const handleUpdateRetornables = useCallback((index, action) => {
    setSelectedProductos((prev) =>
      prev.map((p, i) => {
        if (i === index) {
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
  }, []);

  const handleOpenEditarPrecio = useCallback((index) => {
    setProductoEditIndex(index);
    setDrawerEditarPrecioOpen(true);
  }, []);


  // --- Efectos (useEffect) ---
  
  useEffect(() => {
    try {
      localStorage.setItem('showCarouselState', JSON.stringify(showCarousel));
    } catch (error) {
      console.error("Error al guardar 'showCarouselState' en localStorage:", error);
    }
  }, [showCarousel]);

  useEffect(() => {
    if (selectedProductos.length > 0) {
      const ultimoProducto = selectedProductos[selectedProductos.length - 1];
      const productoBase = todosLosProductos.find(p => p.id === ultimoProducto.id);
      if (productoBase) {
        const sugerencias = obtenerProductosRelacionados(productoBase);
        if (sugerencias.length > 0) {
          setProductosSugeridos(sugerencias.map(formatProductForCarousel));
        }
      }
    } else {
      if (todosLosProductos.length > 0 && categorias.length > 0) {
        const nombresCategoriasSugeridas = obtenerCategoriasSugeridasPorHora();
        const idsCategoriasSugeridas = categorias.filter(cat => nombresCategoriasSugeridas.includes(cat.nombre)).map(cat => cat.id);
        let productosFiltrados = todosLosProductos.filter(p => idsCategoriasSugeridas.includes(p.categoria_ref));
        let productosParaMostrar = (productosFiltrados.length > 0 ? productosFiltrados : todosLosProductos).sort(() => 0.5 - Math.random()).slice(0, 10);
        setProductosSugeridos(productosParaMostrar.map(formatProductForCarousel));
      }
    }
  }, [selectedProductos, todosLosProductos, categorias, obtenerProductosRelacionados]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    setAppear(true);
    barcodeInputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('button, a, input, [role="button"]')) return;
      if (!drawerEscanearOpen && !drawerClientesOpen && !drawerProductosOpen && !drawerConfirmarOpen && !drawerEditarPrecioOpen && !priceModalOpen && barcodeInputRef.current) {
        barcodeInputRef.current.focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [drawerEscanearOpen, drawerClientesOpen, drawerProductosOpen, drawerConfirmarOpen, drawerEditarPrecioOpen, priceModalOpen]);

  useEffect(() => {
    try {
      const ventaGuardada = localStorage.getItem('ventaEnProgreso');
      if (ventaGuardada) {
        const { clienteSeleccionado, selectedProductos } = JSON.parse(ventaGuardada);
        if (clienteSeleccionado && clienteSeleccionado.id) {
          const clienteActual = obtenerClientePorId(clienteSeleccionado.id);
          if (clienteActual) setClienteSeleccionado(clienteActual);
        }
        if (Array.isArray(selectedProductos) && selectedProductos.length > 0) {
          setSelectedProductos(selectedProductos.filter(p => p.id && p.nombre && typeof p.cantidad === 'number' && typeof p.precio_unitario === 'number' && typeof p.subtotal === 'string'));
        }
      }
    } catch (err) {
      console.error('Error al recuperar datos de localStorage:', err);
      localStorage.removeItem('ventaEnProgreso');
      showToast('Error al recuperar datos guardados', 'error');
    }
  }, [obtenerClientePorId, showToast]);
  
  const debouncedVentaState = useDebounce({ clienteSeleccionado, selectedProductos }, 500);
  
  useEffect(() => {
      try {
        localStorage.setItem('ventaEnProgreso', JSON.stringify(debouncedVentaState));
      } catch (err) {
        console.error('Error al guardar en localStorage:', err);
        showToast('Error al guardar datos', 'error');
      }
  }, [debouncedVentaState, showToast]);


  useEffect(() => {
    if (clienteSeleccionado && !clientesLoading) {
      const clienteActual = obtenerClientePorId(clienteSeleccionado.id);
      if (!clienteActual) {
        showToast('El cliente seleccionado ya no está disponible', 'error');
        setClienteSeleccionado(null);
      } else if (JSON.stringify(clienteActual) !== JSON.stringify(clienteSeleccionado)) {
        setClienteSeleccionado(clienteActual);
      }
    }
  }, [clientes, clientesLoading, clienteSeleccionado, obtenerClientePorId, showToast]);

  useEffect(() => {
    const handleProcessBarcode = async (code) => {
      if (isProcessingRef.current || drawerEscanearOpen || drawerClientesOpen || drawerProductosOpen || drawerConfirmarOpen || drawerEditarPrecioOpen || priceModalOpen) {
        return;
      }
      isProcessingRef.current = true;
      try {
        if (!/^\d+$/.test(code)) {
          showToast('Código de barras inválido', 'error');
          return;
        }
        const foundProduct = await obtenerProductoPorCodigoBarrasDirecto(code);
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
          }
        } else {
          showToast('Producto no encontrado', 'error');
        }
      } catch (err) {
        console.error('Error al buscar producto:', err);
        showToast('Error al procesar el código de barras', 'error');
      } finally {
        setTimeout(() => { isProcessingRef.current = false; }, 100);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && barcodeInput.trim()) {
        e.preventDefault();
        handleProcessBarcode(barcodeInput.trim());
        setBarcodeInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeInput, drawerEscanearOpen, drawerClientesOpen, drawerProductosOpen, drawerConfirmarOpen, drawerEditarPrecioOpen, priceModalOpen, showToast, obtenerProductoPorCodigoBarrasDirecto, handleSelectProducto]);

  const handleOptionClick = (path) => { navigate(path); setMenuOpen(false);};
  const handleSelectCliente = (cliente) => { if (!cliente || !cliente.id) { showToast('Cliente inválido seleccionado', 'error'); return; } setClienteSeleccionado(cliente); setDrawerClientesOpen(false); showToast('Cliente seleccionado con éxito', 'success'); };
  const handleRemoveCliente = (e) => { e.stopPropagation(); setClienteSeleccionado(null); showToast('Cliente removido con éxito', 'success'); };
  const handleQuickAddProducto = async (nombre, precio) => { if (!nombre || !precio || isNaN(precio) || parseFloat(precio) <= 0) { showToast('Nombre o precio inválido', 'error'); return; } const producto = { id: `temp_${Date.now().toString()}`, nombre, cantidad: 1, precio_unitario: parseFloat(precio), subtotal: parseFloat(precio).toFixed(2), retornable: false, cantidad_retornable: 0, tipo_unidad: 'unidad', precio_referencia: null, imagen: null, }; setSelectedProductos((prev) => [...prev, producto]); showToast('Producto rápido añadido con éxito', 'success'); };
  const handleRegistrarVenta = () => { 
    if (selectedProductos.length === 0) { 
      showToast('Debe seleccionar al menos un producto', 'error'); 
      return; 
    } 
    
    // Verificar si hay productos retornables que generan deuda de botellas
    const hasOwedRetornables = selectedProductos.some((p) => p.retornable && (p.cantidad_retornable || 0) < p.cantidad); 
    
    if (hasOwedRetornables && !clienteSeleccionado) { 
      showToast('Se requiere un cliente específico para productos retornables que generan deuda de botellas', 'error'); 
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
          producto_ref: p.id && !p.id.startsWith('temp_') ? p.id : null, 
          nombre: p.nombre, 
          cantidad: p.cantidad, 
          precio_unitario: parseFloat(p.precio_unitario), 
          subtotal: parseFloat(p.subtotal), 
          retornable: p.retornable, 
          cantidad_retornable: p.retornable ? p.cantidad - (p.cantidad_retornable || 0) : 0, 
        })), 
        notas: notas || '', 
        estado, 
        monto_pagado: montoPagado, 
        monto_pendiente: total - montoPagado, 
        historial_pagos: historialPagos, 
      }; 
      const newVentaId = await crearVenta(ventaData); 
      setVentaId(newVentaId); 
      showToast(`Venta registrada con éxito (ID: ${newVentaId})`, 'success'); 
      setClienteSeleccionado(null); 
      setSelectedProductos([]); 
      localStorage.removeItem('ventaEnProgreso'); 
      setDrawerConfirmarOpen(false); 
      return newVentaId; 
    } catch (error) { 
      showToast(`Error al registrar venta: ${error.message}`, 'error'); 
      throw error; 
    } 
  };
  const handleViewNotaVenta = () => { if (ventaId) { navigate(`/ventas/${ventaId}`); } else { showToast('No se pudo cargar la nota de venta: ID no disponible', 'error'); } };
  const calcularTotal = () => selectedProductos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
  const calcularTotalProductos = () => selectedProductos.reduce((sum, p) => sum + p.cantidad, 0);
  const handleSelectPrecio = (precio) => { if (selectedProduct) { handleSelectProducto({ id: selectedProduct.id, nombre: selectedProduct.nombre, cantidad: 1, precio_unitario: parseFloat(precio), subtotal: parseFloat(precio).toFixed(2), retornable: selectedProduct.retornable || false, cantidad_retornable: selectedProduct.retornable && selectedProduct.tipo_unidad !== 'kilogramo' ? 1 : 0, tipo_unidad: selectedProduct.tipo_unidad || 'unidad', precio_referencia: selectedProduct.tipo_unidad === 'kilogramo' ? parseFloat(selectedProduct.precio) : null, imagen: selectedProduct.imagen || null, }); } };
  const handleCarouselToggle = () => { setShowCarousel((prev) => !prev); };
  const handleSelectCarouselProduct = (product) => { if (product.has_precio_alternativo && product.precio_alternativo) { setSelectedProduct(product); setPriceModalOpen(true); } else { handleSelectProducto({ id: product.id, nombre: product.nombre, cantidad: 1, precio_unitario: parseFloat(product.precio), subtotal: parseFloat(product.precio).toFixed(2), retornable: product.retornable || false, cantidad_retornable: product.retornable && product.tipo_unidad !== 'kilogramo' ? 1 : 0, tipo_unidad: product.tipo_unidad || 'unidad', precio_referencia: product.tipo_unidad === 'kilogramo' ? parseFloat(product.precio) : null, imagen: product.imagen || null, }); } };
  
  const toastVariants = { hidden: { y: -100, opacity: 0 }, visible: { y: 0, opacity: 1 }, };
  const carouselVariants = {
    hidden: { opacity: 0, height: 0, y: -10, transition: { duration: 0.3, ease: 'easeInOut' } },
    visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  };
  const deudaTotalClienteSeleccionado = clienteSeleccionado ? obtenerDeudaTotalPorCliente(clienteSeleccionado.id) : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AnimatePresence>
        {toast.visible && (
          <motion.div initial="hidden" animate="visible" exit="hidden" variants={toastVariants} transition={{ duration: 0.3, ease: 'easeInOut' }} className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden" >
            <div className={`w-full shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} role="alert">
              <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                        {toast.type === 'success' ? ( <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" /> ) : ( <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" /> )}
                      </svg>
                  </div>
                  <div className="ml-3"><p className="text-sm text-white font-medium">{toast.message}</p></div>
                </div>
                <button onClick={() => setToast((prev) => ({ ...prev, visible: false }))} className="text-white hover:text-gray-200 focus:outline-none transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {priceModalOpen && selectedProduct && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => { setPriceModalOpen(false); setSelectedProduct(null); }} />
          <div className="fixed inset-0 flex items-center justify-center z-[95] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-800">Seleccionar Precio</h3>
                  <button onClick={() => { setPriceModalOpen(false); setSelectedProduct(null); }} className="p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {selectedProduct.imagen ? <img src={selectedProduct.imagen} alt={selectedProduct.nombre} className="w-full h-full object-cover rounded-lg" /> : <Package className="h-6 w-6 text-gray-400" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{selectedProduct.nombre}</h4>
                      <span className="text-xs text-gray-500">{obtenerCategoriaPorId(selectedProduct.categoria_ref)?.nombre || 'Sin categoría'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => handleSelectPrecio(selectedProduct.precio)} className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-[#45923a] hover:bg-[#f9fdf8] transition-all focus:outline-none focus:ring-2 focus:ring-[#45923a] group relative">
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">Precio Normal</h5>
                      <p className="text-xs text-gray-500 mb-2">Precio estándar del producto</p>
                      <span className="text-xl font-bold text-[#45923a] mb-1">S/{parseFloat(selectedProduct.precio).toFixed(2)}{selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}</span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#45923a] mt-1"><Check className="h-4 w-4 text-[#45923a] opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-[#45923a] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                  <button onClick={() => handleSelectPrecio(parseFloat(selectedProduct.precio_alternativo))} className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-[#ffa40c] hover:bg-[#fff8e6] transition-all focus:outline-none focus:ring-2 focus:ring-[#ffa40c] group relative">
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">Precio {selectedProduct.motivo_precio_alternativo || 'Alternativo'}</h5>
                      <p className="text-xs text-gray-500 mb-2">Precio especial</p>
                      <span className="text-xl font-bold text-[#ffa40c] mb-1">S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}{selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}</span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#ffa40c] mt-1"><Check className="h-4 w-4 text-[#ffa40c] opacity-0 group-hover:opacity-100 transition-opacity" /></div>
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
      <Sidebar isOpen={menuOpen} setIsOpen={setMenuOpen} quickAccessOptions={quickAccessOptions} onOptionClick={handleOptionClick} logo={Logo} />
      <main className="pt-3 px-2 sm:px-4 pb-28 flex flex-col h-full">
        <input ref={barcodeInputRef} type="text" inputMode="none" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" autoComplete="off" />
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
          <div className="flex flex-col items-center gap-4 mb-4">
            <button className="btn border-none rounded-2xl flex flex-row items-center justify-center p-3 w-80 bg-blue-500 text-white shadow-md transition-all" onClick={() => navigate('/ventas/historial')}>
              <History size={17} className="flex-shrink-0" /><span className="text-sm truncate max-w-[150px]"> Ver Historial</span>
            </button>
            <div className="flex flex-row justify-center gap-2 sm:gap-6">
              <div className="relative">
                <button className={`flex btn rounded-full flex-row items-center justify-center p-3 border-none text-white shadow-md transition-all ${clienteSeleccionado ? 'bg-[#ffa40c] hover:bg-[#e69500] pr-10' : 'bg-[#ffa40c] hover:bg-[#e69500]'}`} onClick={() => setDrawerClientesOpen(true)} disabled={clientesLoading}>
                  <User size={17} className="flex-shrink-0" />
                  <span className="text-sm truncate max-w-[150px]">{clientesLoading ? 'Cargando...' : clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico'}</span>
                </button>
                {clienteSeleccionado && (<button onClick={handleRemoveCliente} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-[#ffc157] transition-colors z-10" aria-label="Quitar cliente"><X size={14} strokeWidth={2.5} className="text-white" /></button>)}
              </div>
              <button className="btn border-none btn-soft rounded-full flex flex-row items-center justify-center p-3 sm:p-4 bg-[#45923a] hover:bg-[#3a7d30] text-white shadow-md transition-all" onClick={() => setDrawerProductosOpen(true)}>
                <PlusCircle size={17} /><span className="text-sm sm:text-base font-medium">Producto</span>
              </button>
              <button className={`border-none btn btn-accent rounded-full flex flex-row items-center justify-center p-3 sm:p-4 text-white shadow-md transition-all ${showCarousel ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`} onClick={handleCarouselToggle}>
                <Zap size={17} />
              </button>
              <button className="flex btn btn-dash border-none rounded-full flex-row items-center justify-center p-3 sm:p-4 bg-gray-200 hover:bg-gray-300 shadow-md transition-all" onClick={() => setDrawerEscanearOpen(true)}>
                <ScanBarcode strokeWidth={2.5} size={20} />
              </button>
            </div>
            
            <AnimatePresence>
              {showCarousel && productosSugeridos.length > 0 && (
                <motion.div
                  className="w-full overflow-hidden"
                  variants={carouselVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="py-4" ref={emblaRef}>
                    <div className="flex gap-4">
                      {productosSugeridos.map((product) => (
                        <div className="flex-none w-44 snap-center" key={`${product.id}-carousel`}>
                          <div className="w-44 bg-white rounded-lg border border-gray-200 cursor-pointer shadow-sm overflow-hidden transition-transform active:scale-95" onClick={() => handleSelectCarouselProduct(product)}>
                            <div className="p-2 pb-1">
                              <h4 className="text-xs font-medium text-gray-900 leading-tight min-h-[2rem] flex items-center">{product.nombre}</h4>
                            </div>
                            <div className="px-2 pb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-10 w-10 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                  {product.imagen ? (<img src={product.imagen} alt={product.nombre} className="h-full w-full object-cover rounded-md" />) : (<Package className="h-4 w-4 text-gray-400" />)}
                                </div>
                                <div className="flex-1 flex justify-end">
                                  {/* --- CAMBIO: Se añade la indicación "/kg" si el producto es por kilogramo --- */}
                                  <span className="text-xs font-bold text-white bg-[#45923a] px-2 py-1 rounded-full">
                                    S/{(product.precio || 0).toFixed(2)}
                                    {product.tipo_unidad === 'kilogramo' && <span className="font-normal text-white/90"> /kg</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {clienteSeleccionado && deudaTotalClienteSeleccionado > 0 && (
              <div className="mt-2">
                <div className="flex alert alert-error items-center gap-2 text-sm px-4 py-2 rounded-full text-white shadow-sm" role="alert">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span className="font-medium">Este cliente tiene una deuda de <strong>S/ {deudaTotalClienteSeleccionado.toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1 p-1 min-h-0">
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-white via-white to-gray-50 shadow-xl p-4 flex flex-col border-0 overflow-hidden backdrop-blur-lg">
              {selectedProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto flex-1">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative"><img src={ProductoNinguno} className="h-32 rounded-3xl opacity-90" alt="Sin productos" /><div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-3xl"></div></div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Lista de productos vacía</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Agrega productos escaneando códigos de barras o buscando en nuestro catálogo para comenzar tu venta.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-2">
                    {selectedProductos.map((producto, index) => (
                      <ProductoEnVentaCard
                        key={`${producto.id}-${producto.precio_unitario}`}
                        producto={producto}
                        index={index}
                        onRemove={handleRemoveProducto}
                        onUpdateCantidad={handleUpdateCantidad}
                        onOpenEditarPrecio={handleOpenEditarPrecio}
                        onFractionPrice={handleFractionPrice}
                        onUpdateRetornables={handleUpdateRetornables}
                        onManualWeight={handleManualWeight}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {selectedProductos.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl z-20">
              <div className="flex items-center justify-between mb-3">
                <div><span className="text-sm font-medium text-gray-600">Total productos: {calcularTotalProductos()}</span></div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold bg-[#45923a] bg-clip-text text-transparent ml-2">S/{calcularTotal().toFixed(2)}</span>
                </div>
              </div>
              <button onClick={handleRegistrarVenta} className="w-full py-4 bg-[#45923a] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98]">
                <ShoppingCart size={22} strokeWidth={2.5} /><span className="text-lg">Registrar Venta</span>
              </button>
            </div>
          )}
        </div>
      </main>
      <ClientesDrawer isOpen={drawerClientesOpen} onClose={() => setDrawerClientesOpen(false)} onSelectCliente={handleSelectCliente} />
      <ProductosDrawer isOpen={drawerProductosOpen} onClose={() => setDrawerProductosOpen(false)} onSelectProducto={handleSelectProducto} onQuickAddProducto={handleQuickAddProducto} />
      <ConfirmarVentaDrawer isOpen={drawerConfirmarOpen} onClose={() => setDrawerConfirmarOpen(false)} onConfirm={handleConfirmarVenta} onViewNotaVenta={handleViewNotaVenta} clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado} total={calcularTotal()} currentUser={currentUser} clientesLoading={clientesLoading} />
  {productoEditIndex !== null && (<EditarPrecioDrawer isOpen={drawerEditarPrecioOpen} onClose={() => setDrawerEditarPrecioOpen(false)} producto={selectedProductos[productoEditIndex]} onConfirm={(nuevoPrecio) => handleUpdatePrecio(productoEditIndex, nuevoPrecio)} />)}
      <EscanearProductoDrawer isOpen={drawerEscanearOpen} onClose={() => setDrawerEscanearOpen(false)} onSelectProducto={handleSelectProducto} />
    </div>
  );
};

export default Ventas;
