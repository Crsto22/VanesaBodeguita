import React, { useState } from 'react';
import {
  Search,
  Plus,
  Package,
  Edit2,
  Trash2,
  DollarSign,
  ArrowUpDown,
  BarChart2,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  Tag,
  PlusCircle,
  PackagePlus,
  Layers,
  Barcode,
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
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('productos');

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
  const [productosAsociados, setProductosAsociados] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Filtrado y ordenación de productos
  const filteredProducts = productos
    .filter((product) => {
      const categoriaNombre = obtenerCategoriaPorId(product.categoria_ref)?.nombre || '';
      const matchesSearch =
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigo_barras || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let fieldA, fieldB;
      if (sortBy === 'precio') {
        fieldA = a.precio;
        fieldB = b.precio;
      } else if (sortBy === 'stock') {
        fieldA = a.stock;
        fieldB = b.stock;
      } else if (sortBy === 'categoria') {
        fieldA = obtenerCategoriaPorId(a.categoria_ref)?.nombre || '';
        fieldB = obtenerCategoriaPorId(b.categoria_ref)?.nombre || '';
      } else {
        fieldA = a.nombre.toLowerCase();
        fieldB = b.nombre.toLowerCase();
      }
      if (sortOrder === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });

  // Filtrado de categorías
  const filteredCategories = categorias.filter((category) => {
    const matchesSearch =
      category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
        setShowDeleteProductDrawer(false);
        setProductToDelete(null);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto. Intenta de nuevo.');
      } finally {
        setDeleteProductLoading(false);
      }
    }
  };

  const handleSaveProduct = async (productoData, imagenFile) => {
    try {
      if (productFormData.id) {
        // Actualizar producto existente
        await actualizarProducto(productFormData.id, productoData, imagenFile);
      } else {
        // Crear nuevo producto
        await crearProducto(productoData, imagenFile);
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
      });
    } catch (error) {
      console.error('Error al guardar producto:', error);
      throw error; // El drawer manejará el error
    }
  };

  const handleSortChange = (field) => {
    if (sortBy === 'nombre' && field === 'nombre') {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
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
      setProductosAsociados(null);
      setShowDeleteDrawer(true);
      const productosQuery = query(
        collection(db, 'productos'),
        where('categoria_ref', '==', category.id) // Ajustado para string ID
      );
      const productosSnapshot = await getDocs(productosQuery);
      setProductosAsociados(productosSnapshot.size);
    } catch (error) {
      console.error('Error al verificar productos asociados:', error);
      alert('Error al verificar productos asociados. Intenta de nuevo.');
      setShowDeleteDrawer(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      setDeleteLoading(true);
      try {
        await eliminarCategoria(categoryToDelete.id);
        setShowDeleteDrawer(false);
        setCategoryToDelete(null);
        setProductosAsociados(null);
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        alert('Error al eliminar la categoría. Intenta de nuevo.');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleSaveCategory = async (categoriaData) => {
    try {
      if (categoryFormData.id) {
        await actualizarCategoria(categoryFormData.id, categoriaData);
      } else {
        await crearCategoria(categoriaData);
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
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-sm text-gray-500">
            {loading
              ? 'Cargando...'
              : activeTab === 'productos'
              ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'producto' : 'productos'}`
              : `${filteredCategories.length} ${filteredCategories.length === 1 ? 'categoría' : 'categorías'}`}
          </p>
          {activeTab === 'productos' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSortChange('precio')}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === 'precio' ? 'border-[#45923a] bg-green-50 text-[#45923a]' : 'border-gray-300 text-gray-600'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Precio
                {sortBy === 'precio' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <button
                onClick={() => handleSortChange('stock')}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === 'stock' ? 'border-[#45923a] bg-green-50 text-[#45923a]' : 'border-gray-300 text-gray-600'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                Stock
                {sortBy === 'stock' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <button
                onClick={() => handleSortChange('categoria')}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === 'categoria' ? 'border-[#45923a] bg-green-50 text-[#45923a]' : 'border-gray-300 text-gray-600'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Categoría
                {sortBy === 'categoria' && <ArrowUpDown className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
        {activeTab === 'productos' && (
          loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <ProductoSkeleton key={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
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
                          <div className="mt-2 flex justify-between items-center">
                            <div className="text-lg font-semibold text-[#45923a]">S/{product.precio.toFixed(2)}</div>
                            <div
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                product.stock > 20
                                  ? 'bg-green-100 text-green-800'
                                  : product.stock > 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.stock} en stock
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                        <div className="flex items-center">
                          <Barcode className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{product.codigo_barras || 'Sin código'}</span>
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
                    <Plus className="h-5 w-5" />
                    Agregar Producto
                  </button>
                </div>
              )}
            </div>
          )
        )}
        {activeTab === 'categorias' && (
          loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <CategoriaSkeleton key={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
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
                          {productosAsociados === null ? 'Verificando...' : `${productosAsociados} productos`}
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
        productosAsociados={productosAsociados}
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