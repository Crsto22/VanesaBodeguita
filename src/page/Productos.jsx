import React, { useState, useEffect } from 'react';
import { Plus, Package, Edit2, Trash2, ShoppingCart, Users, Truck, CreditCard, Layers, Barcode, ArrowLeftRight, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import IconoProductos from '../assets/Productos/IconoProductos.svg';
import IconoProductoNoEncontrado from '../assets/Productos/IconoProductoNoEncontrado.svg';
import { useProducts } from '../context/ProductContext';
import DrawerEditarAñadirCategoria from '../components/Categorias/DrawerEditarAñadir';
import DeleteDrawerCategoria from '../components/Categorias/DeleteDrawer';
import DrawerEditarAñadirProducto from '../components/Productos/DrawerEditarAñadir';
import DeleteDrawerProducto from '../components/Productos/DeleteDrawer';
import { motion, AnimatePresence } from "framer-motion";

// Custom colors
const COLORS = {
  primary: '#45923a',
  secondary: '#ffa40c',
  delete: '#ef4444',
};

const Productos = () => {
  // Basic states
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName] = useState('Usuario');
  const [notifications] = useState(3);
  const [activeTab, setActiveTab] = useState('productos');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [appear, setAppear] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Category states
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    color: COLORS.primary,
  });
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Product states
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [productFormData, setProductFormData] = useState({
    id: null,
    categoria_ref: '',
    nombre: '',
    precio: '',
    stock: '',
    tipo_unidad: 'unidad',
    codigo_barras: '',
    marca: '',
    fecha_vencimiento: '',
    imagen: '',
    retornable: false,
    has_precio_alternativo: false,
    precio_alternativo: '',
    motivo_precio_alternativo: '',
  });
  const [showDeleteProductDrawer, setShowDeleteProductDrawer] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);

  // Context data and functions
  const {
    categorias,
    productos,
    loading,
    productosLoading,
    paginaActual,
    hayMasPaginas,
    searchQuery,
    setSearchQuery,
    buscarProductos,
    cargarSiguientePagina,
    cargarPaginaAnterior,
    recargarProductos,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    obtenerCategoriaPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerProductoPorId,
  } = useProducts();

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Initialize appear animation
  useEffect(() => {
    setAppear(true);
  }, []);

  // Product handlers
  const handleAddProduct = () => {
    setProductFormData({
      id: null,
      categoria_ref: categorias[0]?.id || '',
      nombre: '',
      precio: '',
      stock: '',
      tipo_unidad: 'unidad',
      codigo_barras: '',
      marca: '',
      fecha_vencimiento: '',
      imagen: '',
      retornable: false,
      has_precio_alternativo: false,
      precio_alternativo: '',
      motivo_precio_alternativo: '',
    });
    setShowProductDrawer(true);
  };

  const handleEditProduct = (id) => {
    const product = obtenerProductoPorId(id);
    if (product) {
      setProductFormData({
        id: product.id,
        categoria_ref: product.categoria_ref,
        nombre: product.nombre,
        precio: product.precio.toString(),
        stock: product.stock.toString(),
        tipo_unidad: product.tipo_unidad,
        codigo_barras: product.codigo_barras || '',
        marca: product.marca || '',
        fecha_vencimiento: product.fecha_vencimiento || '',
        imagen: product.imagen || '',
        retornable: product.retornable || false,
        has_precio_alternativo: !!product.precio_alternativo || !!product.motivo_precio_alternativo,
        precio_alternativo: product.precio_alternativo ? product.precio_alternativo.toString() : '',
        motivo_precio_alternativo: product.motivo_precio_alternativo || '',
      });
      setShowProductDrawer(true);
    }
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteProductDrawer(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      setDeleteProductLoading(true);
      try {
        await eliminarProducto(productToDelete.id, productToDelete.imagen);
        setToast({ message: 'Producto eliminado con éxito', type: 'success', visible: true });
        setShowDeleteProductDrawer(false);
        setProductToDelete(null);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        setToast({ message: 'Error al eliminar producto', type: 'error', visible: true });
        setShowDeleteProductDrawer(false);
      } finally {
        setDeleteProductLoading(false);
      }
    }
  };

  const handleSaveProduct = async (productoData, imagenFile) => {
    try {
      if (productFormData.id) {
        await actualizarProducto(productFormData.id, productoData, imagenFile);
        setToast({ message: 'Producto actualizado con éxito', type: 'success', visible: true });
      } else {
        await crearProducto(productoData, imagenFile);
        setToast({ message: 'Producto creado con éxito', type: 'success', visible: true });
      }
      setShowProductDrawer(false);
      setProductFormData({
        id: null,
        categoria_ref: categorias[0]?.id || '',
        nombre: '',
        precio: '',
        stock: '',
        tipo_unidad: 'unidad',
        codigo_barras: '',
        marca: '',
        fecha_vencimiento: '',
        imagen: '',
        retornable: false,
        has_precio_alternativo: false,
        precio_alternativo: '',
        motivo_precio_alternativo: '',
      });
      await recargarProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setToast({ message: `Error al ${productFormData.id ? 'actualizar' : 'crear'} producto`, type: 'error', visible: true });
      throw error;
    }
  };

  // Category handlers
  const handleAddCategory = () => {
    setCategoryFormData({
      id: null,
      nombre: '',
      descripcion: '',
      color: COLORS.primary,
    });
    setShowCategoryDrawer(true);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData({
      id: category.id,
      nombre: category.nombre,
      descripcion: category.descripcion || '',
      color: category.color || COLORS.primary,
    });
    setShowCategoryDrawer(true);
  };

  const handleDeleteCategory = async (category) => {
    try {
      setCategoryToDelete(category);
      setShowDeleteDrawer(true);
    } catch (error) {
      console.error('Error al preparar eliminación de categoría:', error);
      setToast({ message: 'Error al preparar eliminación de categoría', type: 'error', visible: true });
      setShowDeleteDrawer(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      setDeleteLoading(true);
      try {
        await eliminarCategoria(categoryToDelete.id);
        setToast({ message: 'Categoría eliminada con éxito', type: 'success', visible: true });
        setShowDeleteDrawer(false);
        setCategoryToDelete(null);
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        setToast({ message: 'Error al eliminar categoría', type: 'error', visible: true });
        setShowDeleteDrawer(false);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleSaveCategory = async (categoriaData) => {
    try {
      if (categoryFormData.id) {
        await actualizarCategoria(categoryFormData.id, categoriaData);
        setToast({ message: 'Categoría actualizada con éxito', type: 'success', visible: true });
      } else {
        await crearCategoria(categoriaData);
        setToast({ message: 'Categoría creada con éxito', type: 'success', visible: true });
      }
      setShowCategoryDrawer(false);
      setCategoryFormData({
        id: null,
        nombre: '',
        descripcion: '',
        color: COLORS.primary,
      });
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      setToast({ message: `Error al ${categoryFormData.id ? 'actualizar' : 'crear'} categoría`, type: 'error', visible: true });
      throw error;
    }
  };

  // Function to close the toast manually
  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value.toUpperCase();
    setLocalSearchQuery(value);
    setSearchQuery(value);
    buscarProductos(value);
  };

  // Clear search
  const clearSearch = () => {
    setLocalSearchQuery('');
    setSearchQuery('');
    buscarProductos('');
  };

  // Function to optimize image URL with ImageKit
  const optimizeImageUrl = (url) => {
    if (!url) return url;
    return `${url}?tr=w-100,h-100`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { y: -100, opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
              visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } }
            }}
            className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden"
          >
            <div
              className={`w-full shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
              role="alert"
              tabIndex="-1"
              aria-labelledby="header-notification"
            >
              <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
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
                  onClick={closeToast}
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

      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} userName={userName} notifications={notifications} />
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        userName={userName}
        quickAccessOptions={[
          { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial' },
          { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes' },
          { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes' },
          { id: 'proveedores', title: 'Proveedores', icon: <Truck className="h-6 w-6" />, color: 'bg-violet-500', description: 'Contactos y pedidos' },
          { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo' },
        ]}
        onOptionClick={() => setMenuOpen(false)}
      />

      <main className="px-3 pb-16 pt-3">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#34722c] p-6 text-white shadow-lg">
            <img src={IconoProductos} alt="Productos Icon" className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0" />
            <div className="relative flex justify-between items-center">
              <div className="flex flex-col">
                <h1 className="mb-2 text-xl font-bold">Gestión de Productos</h1>
                <div className="flex gap-2">
                  {activeTab === 'productos' ? (
                    <button
                      onClick={handleAddProduct}
                      className="bg-[#ffa40c] font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 flex items-center gap-2 w-fit"
                      title="Agregar nuevo producto"
                    >
                      <Package size={18} strokeWidth={3} />Nuevo Producto
                    </button>
                  ) : (
                    <button
                      onClick={handleAddCategory}
                      className="bg-[#ffa40c] font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 flex items-center gap-2 w-fit"
                      title="Agregar nueva categoría"
                    >
                      <Plus size={18} strokeWidth={3} />Nueva Categoría
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 font-medium text-sm text-center ${activeTab === 'productos' ? 'border-b-2 border-[#45923a] text-[#45923a]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('productos')}
            >
              <div className="flex justify-center items-center gap-2">
                <Package className="h-5 w-5" />Productos
              </div>
            </button>
            <button
              className={`flex-1 py-3 font-medium text-sm text-center ${activeTab === 'categorias' ? 'border-b-2 border-[#45923a] text-[#45923a]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('categorias')}
            >
              <div className="flex justify-center items-center gap-2">
                <Layers className="h-5 w-5" />Categorías
              </div>
            </button>
          </div>

          {/* Product List */}
          {activeTab === 'productos' && (
            <>
              {/* Search Input */}
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#45923a] text-sm uppercase"
                  placeholder="Buscar producto..."
                  disabled={productosLoading || loading}
                />
                {localSearchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              {loading || productosLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-20 w-20 rounded-lg bg-gray-200 animate-pulse"></div>
                          <div className="flex flex-col grow">
                            <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-2"></div>
                            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse mb-1"></div>
                            <div className="mt-2 flex justify-between">
                              <div className="h-6 w-20 rounded bg-gray-200 animate-pulse"></div>
                              <div className="h-6 w-16 rounded bg-gray-200 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                          <div className="flex items-center">
                            <div className="h-6 w-16 rounded bg-gray-200 animate-pulse mr-2"></div>
                            <div className="h-6 w-10 rounded bg-gray-200 animate-pulse"></div>
                          </div>
                          <div className="flex">
                            <div className="h-8 w-8 rounded-l-lg bg-gray-200 animate-pulse"></div>
                            <div className="h-8 w-8 rounded-r-lg bg-gray-200 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productos.length > 0 ? (
                    productos.map((product) => (
                      <div key={product.id} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                              {product.imagen ? (
                                <img src={optimizeImageUrl(product.imagen)} alt={product.nombre} className="object-cover w-full h-full" />
                              ) : (
                                <Package className="h-12 w-12 text-gray-400" />
                              )}
                            </div>
                            <div className="flex flex-col grow min-w-0">
                              <h3 className="font-bold text-gray-900 text-base truncate">{product.nombre}</h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: obtenerCategoriaPorId(product.categoria_ref)?.color || '#9ca3af' }}></span>
                                <span className="text-xs text-gray-600 font-medium">{obtenerCategoriaPorId(product.categoria_ref)?.nombre || 'Sin categoría'}</span>
                              </div>
                              <div className="mt-2.5 flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                  <div className="text-xl font-bold text-[#45923a]">
                                    S/{product.precio.toFixed(2)}{product.tipo_unidad === 'kilogramo' && <span className="text-sm font-medium">/kg</span>}
                                  </div>
                                  <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${product.stock > 20 ? 'bg-green-100 text-green-700' : product.stock > 5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock} {product.tipo_unidad === 'kilogramo' ? 'kg' : 'und'}
                                  </div>
                                </div>
                                {product.has_precio_alternativo && product.precio_alternativo && (
                                  <div className="text-xs text-[#ffa40c] font-semibold bg-orange-50 px-2 py-1 rounded-lg">
                                    {product.motivo_precio_alternativo || 'Alternativo'}: <span className="font-bold">S/{parseFloat(product.precio_alternativo).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between items-center border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                                <Barcode className="h-3.5 w-3.5 text-gray-500 mr-1" />
                                <span className="text-xs text-gray-600 font-medium">{product.codigo_barras || 'Sin código'}</span>
                              </div>
                              {product.retornable && (
                                <div className="flex items-center bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
                                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />Retornable
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditProduct(product.id)} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 transition-colors">
                                <Edit2 className="h-4 w-4 text-white" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product)} className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-3 py-2 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                      <div className="mb-4 flex items-center justify-center">
                        <img src={IconoProductoNoEncontrado} alt="Producto no encontrado" className="h-32" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron productos</h3>
                      <p className="mb-6 max-w-xs text-sm text-gray-500">No hay registros que coincidan con tu búsqueda. Prueba con otros filtros o agrega un nuevo producto.</p>
                      <button onClick={handleAddProduct} className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-md" style={{ backgroundColor: COLORS.secondary }}>
                        <Plus className="h-5 w-5" />Agregar Producto
                      </button>
                      {localSearchQuery && (
                        <button
                          onClick={clearSearch}
                          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Pagination controls */}
              {productos.length > 0 && (
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={cargarPaginaAnterior}
                    disabled={paginaActual === 1 || productosLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      paginaActual === 1 || productosLoading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#45923a] text-white hover:bg-[#34722c]'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Anterior
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Página {paginaActual}
                  </span>
                  <button
                    onClick={cargarSiguientePagina}
                    disabled={!hayMasPaginas || productosLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      !hayMasPaginas || productosLoading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#45923a] text-white hover:bg-[#34722c]'
                    }`}
                  >
                    Siguiente
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Category List */}
          {activeTab === 'categorias' && (
            loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="flex flex-col grow">
                          <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-2"></div>
                          <div className="h-4 w-48 rounded bg-gray-200 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                        <div className="h-6 w-24 rounded bg-gray-200 animate-pulse"></div>
                        <div className="flex">
                          <div className="h-8 w-8 rounded-l-lg bg-gray-200 animate-pulse"></div>
                          <div className="h-8 w-8 rounded-r-lg bg-gray-200 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {categorias.length > 0 ? (
                  categorias.map((category) => (
                    <div key={category.id} className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: category.color || COLORS.primary }}>
                            <Layers className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col grow">
                            <h3 className="font-medium text-gray-900">{category.nombre}</h3>
                            <p className="text-sm text-gray-500">{category.descripcion || 'Sin descripción'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end items-center border-t border-gray-100 pt-3">
                          <div className="flex">
                            <button onClick={() => handleEditCategory(category)} className="rounded-l-lg border border-blue-600 px-3 py-2 bg-blue-600" style={{ borderRight: 'none' }}>
                              <Edit2 className="h-4 w-4 text-white" />
                            </button>
                            <button onClick={() => handleDeleteCategory(category)} className="rounded-r-lg border border-red-500 bg-red-500 text-white px-3 py-2">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                    <div className="mb-4 flex items-center justify-center">
                      <img src={IconoProductoNoEncontrado} alt="Producto no encontrado" className="h-32" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron categorías</h3>
                    <p className="mb-6 max-w-xs text-sm text-gray-500">No hay categorías que coincidan con tu búsqueda. Prueba con otros filtros o agrega una nueva categoría.</p>
                    <button onClick={handleAddCategory} className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-md" style={{ backgroundColor: COLORS.secondary }}>
                      <Plus className="h-5 w-5" />Agregar Categoría
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </main>

      <div>
        <DrawerEditarAñadirCategoria
          isOpen={showCategoryDrawer}
          onClose={() => setShowCategoryDrawer(false)}
          isEditMode={!!categoryFormData.id}
          initialData={categoryFormData}
          onSubmit={handleSaveCategory}
          colors={COLORS}
        />

        <DeleteDrawerCategoria
          isOpen={showDeleteDrawer}
          onClose={() => setShowDeleteDrawer(false)}
          onConfirm={confirmDeleteCategory}
          categoryName={categoryToDelete?.nombre || ''}
          productosAsociados={0}
          colors={COLORS}
          loading={deleteLoading}
        />

        <DrawerEditarAñadirProducto
          isOpen={showProductDrawer}
          onClose={() => setShowProductDrawer(false)}
          isEditMode={!!productFormData.id}
          initialData={productFormData}
          onSubmit={handleSaveProduct}
          colors={COLORS}
          categorias={categorias}
        />

        <DeleteDrawerProducto
          isOpen={showDeleteProductDrawer}
          onClose={() => setShowDeleteProductDrawer(false)}
          onConfirm={confirmDeleteProduct}
          productName={productToDelete?.nombre || ''}
          colors={COLORS}
          loading={deleteProductLoading}
        />
      </div>
    </div>
  );
};

export default Productos;
