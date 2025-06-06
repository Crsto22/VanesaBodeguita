import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Package,
  Edit2,
  Trash2,
  DollarSign,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  Tag,
  PlusCircle,
  PackagePlus,
  Layers,
  Barcode,
  ArrowLeftRight,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import IconoProductos from '../assets/Productos/IconoProductos.svg';
import IconoProductoNoEncontrado from '../assets/Productos/IconoProductoNoEncontrado.svg';
import { useProducts } from '../context/ProductContext';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import DrawerEditarAñadirCategoria from '../components/Categorias/DrawerEditarAñadir';
import DeleteDrawerCategoria from '../components/Categorias/DeleteDrawer';
import DrawerEditarAñadirProducto from '../components/Productos/DrawerEditarAñadir';
import DeleteDrawerProducto from '../components/Productos/DeleteDrawer';
import { motion, AnimatePresence } from "framer-motion";
// Colores personalizados
const COLORS = {
  primary: '#45923a', // Verde
  secondary: '#ffa40c', // Naranja/Ámbar
  delete: '#ef4444', // Rojo para eliminación
};

const Productos = () => {
  // Estados básicos
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName] = useState('Usuario');
  const [notifications] = useState(3);
  const [activeTab, setActiveTab] = useState('productos');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Estados para filtros y paginación
  const [priceSort, setPriceSort] = useState(''); // 'asc' o 'desc'
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Productos por página
  const [currentCategoryPage, setCategoryCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(8); // Categorías por página
  const [appear, setAppear] = useState(false);

  // Drawer states para categorías
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
  const [productosAsociadosPorCategoria, setProductosAsociadosPorCategoria] = useState({});

  // Drawer states para productos
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

  // Obtener datos y funciones del ProductContext
  const {
    categorias,
    productos,
    loading,
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

  useEffect(() => {
    setAppear(true);
  }, []);

  // Resetear páginas cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceSort]);

  useEffect(() => {
    setCategoryCurrentPage(1);
  }, [searchTerm]);

  // Obtener el conteo de productos asociados por categoría
  useEffect(() => {
    const fetchProductosAsociados = async () => {
      if (categorias.length === 0) {
        setProductosAsociadosPorCategoria({});
        return;
      }

      const conteoPorCategoria = {};
      try {
        for (const categoria of categorias) {
          const productosQuery = query(
            collection(db, 'productos'),
            where('categoria_ref', '==', categoria.id),
            where('estado', '==', 'activo')
          );
          const productosSnapshot = await getDocs(productosQuery);
          conteoPorCategoria[categoria.id] = productosSnapshot.size;
        }
        setProductosAsociadosPorCategoria(conteoPorCategoria);
      } catch (error) {
        console.error('Error al obtener productos asociados:', error);
        setProductosAsociadosPorCategoria({});
      }
    };

    if (!loading && categorias.length > 0) {
      fetchProductosAsociados();
    }
  }, [categorias, loading]);

  // Opciones del menú principal - Accesos rápidos
  const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes' },
    { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes' },
    { id: 'proveedores', title: 'Proveedores', icon: <Truck className="h-6 w-6" />, color: 'bg-violet-500', description: 'Contactos y pedidos' },
    { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo' },
  ];

  // Componente de esqueleto para productos
  const ProductoSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
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
  );

  // Componente de esqueleto para categorías
  const CategoriaSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
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
  );

  // Filtrado y ordenamiento de productos
  const getFilteredAndSortedProducts = () => {
    let filtered = productos.filter((product) => {
      const categoriaNombre = obtenerCategoriaPorId(product.categoria_ref)?.nombre || '';
      const matchesSearch =
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigo_barras || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.categoria_ref === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Ordenar por precio si está seleccionado
    if (priceSort === 'asc') {
      filtered = filtered.sort((a, b) => a.precio - b.precio);
    } else if (priceSort === 'desc') {
      filtered = filtered.sort((a, b) => b.precio - a.precio);
    }

    return filtered;
  };

  // Filtrado de categorías
  const filteredCategories = categorias.filter((category) => {
    const matchesSearch =
      category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Paginación de productos
  const filteredProducts = getFilteredAndSortedProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Paginación de categorías
  const totalCategoryPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const indexOfLastCategory = currentCategoryPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

  // Componente de Paginación
  const Pagination = ({ currentPage, totalPages, onPageChange, type = 'productos' }) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-6 pb-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border ${
            currentPage === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              page === currentPage
                ? 'bg-[#45923a] text-white'
                : page === '...'
                ? 'text-gray-400 cursor-default'
                : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border ${
            currentPage === totalPages
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Manejadores para productos
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
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setToast({ message: `Error al ${productFormData.id ? 'actualizar' : 'crear'} producto`, type: 'error', visible: true });
      throw error;
    }
  };

  // Animaciones para el toast
  const toastVariants = {
    hidden: { 
      y: -100, 
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  // Manejadores para categorías
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

  // Función para cerrar el toast manualmente
  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceSort('');
    setCurrentPage(1);
    setCategoryCurrentPage(1);
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
                toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}
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
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
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

      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        userName={userName}
        notifications={notifications}
      />
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        userName={userName}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={() => setMenuOpen(false)}
      />
      <main className="px-3 pb-16 pt-3">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#34722c] p-6 text-white shadow-lg">
            <img
              src={IconoProductos}
              alt="Productos Icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 object-contain z-0"
            />
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
                      <PackagePlus size={18} strokeWidth={3} />
                      Nuevo Producto
                    </button>
                  ) : (
                    <button
                      onClick={handleAddCategory}
                      className="bg-[#ffa40c] font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 flex items-center gap-2 w-fit"
                      title="Agregar nueva categoría"
                    >
                      <PlusCircle size={18} strokeWidth={3} />
                      Nueva Categoría
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 font-medium text-sm text-center ${
                activeTab === 'productos' ? 'border-b-2 border-[#45923a] text-[#45923a]' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('productos')}
            >
              <div className="flex justify-center items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </div>
            </button>
            <button
              className={`flex-1 py-3 font-medium text-sm text-center ${
                activeTab === 'categorias' ? 'border-b-2 border-[#45923a] text-[#45923a]' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('categorias')}
            >
              <div className="flex justify-center items-center gap-2">
                <Layers className="h-5 w-5" />
                Categorías
              </div>
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'productos'
                    ? 'Buscar producto por nombre, categoría o código...'
                    : 'Buscar categoría por nombre o descripción...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all duration-300 focus:border-[#45923a]"
              />
            </div>
          </div>

          {/* Filtros para productos */}
          {activeTab === 'productos' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#45923a] transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filtros {showFilters ? '▲' : '▼'}
                </button>
                {(searchTerm || selectedCategory !== 'all' || priceSort) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              
              {showFilters && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#45923a] focus:outline-none"
                      >
                        <option value="all">Todas las Categorías</option>
                        {categorias.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por Precio</label>
                      <select
                        value={priceSort}
                        onChange={(e) => setPriceSort(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#45923a] focus:outline-none"
                      >
                        <option value="">Sin ordenar</option>
                        <option value="asc">Menor a Mayor</option>
                        <option value="desc">Mayor a Menor</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conteo de resultados */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm text-gray-500">
              {loading
                ? 'Cargando...'
                : activeTab === 'productos'
                ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'producto' : 'productos'}`
                : `${filteredCategories.length} ${filteredCategories.length === 1 ? 'categoría' : 'categorías'}`}
            </p>
          </div>

          {/* Lista de productos */}
          {activeTab === 'productos' && (
            loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <ProductoSkeleton key={item} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {product.imagen ? (
                              <img src={product.imagen} alt={product.nombre} className="object-cover w-full h-full" />
                            ) : (
                              <Package className="h-10 w-10 text-gray-400" />
                            )}
                          </div>
                          <div className="flex flex-col grow">
                            <h3 className="font-medium text-gray-900">{product.nombre}</h3>
                            <div className="flex items-center gap-1">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: obtenerCategoriaPorId(product.categoria_ref)?.color || '#9ca3af',
                                }}
                              ></span>
                              <span className="text-xs text-gray-500">
                                {obtenerCategoriaPorId(product.categoria_ref)?.nombre || 'Sin categoría'}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-col">
                              <div className="flex justify-between items-center">
                                <div className="text-lg font-bold text-[#45923a]">
                                  S/{product.precio.toFixed(2)}
                                  {product.tipo_unidad === 'kilogramo' && ' por kg'}
                                </div>
                                <div
                                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    product.stock > 20
                                      ? 'bg-green-100 text-green-800'
                                      : product.stock > 5
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {product.stock} {product.tipo_unidad === 'kilogramo' ? 'kg' : ''} en stock
                                </div>
                              </div>
                              {product.has_precio_alternativo && product.precio_alternativo && (
                                <div className="mt-1 text-sm text-[#ffa40c] font-medium">
                                  Precio {product.motivo_precio_alternativo}: <span className="font-bold">S/{parseFloat(product.precio_alternativo).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Barcode className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">{product.codigo_barras || 'Sin código'}</span>
                            </div>
                            {product.retornable && (
                              <div className="flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
                                Retornable
                              </div>
                            )}
                          </div>
                          <div className="flex">
                            <button
                              onClick={() => handleEditProduct(product.id)}
                              className="rounded-l-lg border border-blue-600 px-3 py-2 bg-blue-600"
                              style={{ borderRight: 'none' }}
                            >
                              <Edit2 className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="rounded-r-lg border border-red-500 bg-red-500 text-white px-3 py-2"
                            >
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
                    <p className="mb-6 max-w-xs text-sm text-gray-500">
                      No hay registros que coincidan con tu búsqueda. Prueba con otros filtros o agrega un nuevo producto.
                    </p>
                    <button
                      onClick={handleAddProduct}
                      className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-md"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      <Plus className="h-5 w-5"He />
                      Agregar Producto
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Lista de categorías */}
          {activeTab === 'categorias' && (
            loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <CategoriaSkeleton key={item} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentCategories.length > 0 ? (
                  currentCategories.map((category) => (
                    <div
                      key={category.id}
                      className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: category.color || COLORS.primary }}
                          >
                            <Layers className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col grow">
                            <h3 className="font-medium text-gray-900">{category.nombre}</h3>
                            <p className="text-sm text-gray-500">{category.descripcion || 'Sin descripción'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                          <div className="text-sm text-gray-500">
                            {productosAsociadosPorCategoria[category.id] !== undefined
                              ? `${productosAsociadosPorCategoria[category.id]} productos`
                              : '0 productos'}
                          </div>
                          <div className="flex">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="rounded-l-lg border border-blue-600 px-3 py-2 bg-blue-600"
                              style={{ borderRight: 'none' }}
                            >
                              <Edit2 className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="rounded-r-lg border border-red-500 bg-red-500 text-white px-3 py-2"
                            >
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
                    <p className="mb-6 max-w-xs text-sm text-gray-500">
                      No hay categorías que coincidan con tu búsqueda. Prueba con otros filtros o agrega una nueva categoría.
                    </p>
                    <button
                      onClick={handleAddCategory}
                      className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-md"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      <Plus className="h-5 w-5" />
                      Agregar Categoría
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Paginación */}
          {activeTab === 'productos' && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              type="productos"
            />
          )}
          {activeTab === 'categorias' && (
            <Pagination
              currentPage={currentCategoryPage}
              totalPages={totalCategoryPages}
              onPageChange={setCategoryCurrentPage}
              type="categorias"
            />
          )}
        </div>
      </main>
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
        productosAsociados={categoryToDelete ? productosAsociadosPorCategoria[categoryToDelete.id] || 0 : 0}
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
  );
};

export default Productos;