import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Package, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import ProductoDetallesDrawer from './ProductoDetallesDrawer';

const ProductosDrawer = ({ isOpen, onClose, onSelectProducto, onNuevoProducto }) => {
  const {
    productos,
    productosLoading,
    buscarProductos,
    cargarSiguientePagina,
    cargarPaginaAnterior,
    paginaActual,
    hayMasPaginas,
    searchQuery,
    limpiarBusqueda,
  } = useProducts();

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  const [detallesDrawerOpen, setDetallesDrawerOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);

  const searchInitiatedByUser = useRef(false);

  // Reset search and state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setLocalSearchTerm('');
      if (searchQuery) {
        limpiarBusqueda();
      }
      setDetallesDrawerOpen(false);
      setSelectedProducto(null);
    } else {
      searchInitiatedByUser.current = false;
    }
  }, [isOpen, searchQuery, limpiarBusqueda]);

  // Debounce search
  useEffect(() => {
    if (!searchInitiatedByUser.current) {
      return;
    }

    const timerId = setTimeout(() => {
      buscarProductos(localSearchTerm);
    }, 900);

    return () => clearTimeout(timerId);
  }, [localSearchTerm, buscarProductos]);

  const handleSearchChange = (e) => {
    searchInitiatedByUser.current = true;
    setLocalSearchTerm(e.target.value.toUpperCase());
  };

  const handleSelect = (producto) => {
    if (!producto?.id || !producto.nombre) {
      showToast('Producto inválido seleccionado', 'error');
      return;
    }
    setSelectedProducto(producto);
    setDetallesDrawerOpen(true);
  };

  const handleShowImage = (imageUrl) => {
    setSelectedProductImage(imageUrl);
    setShowImageModal(true);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      action();
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  return (
    <>
      {toast.visible && (
        <div className="fixed top-0 left-0 right-0 w-full z-[100] rounded-b-2xl overflow-hidden">
          <div
            className={`w-full shadow-2xl backdrop-blur-sm ${
              toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-pink-600'
            }`}
            role="alert"
          >
            <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
              <div className="flex items-center">
                <p className="text-sm text-white font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
                className="text-white hover:text-gray-200 focus:outline-none p-1 rounded-full hover:bg-white/20 transition-all"
                aria-label="Cerrar notificación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-0 bg-gradient-to-br from-slate-50 to-gray-100 z-50 transform transition-all duration-500 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Productos</h2>
              <p className="text-xs text-gray-500 mt-1">Selecciona un producto</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNuevoProducto && onNuevoProducto()}
                className="p-2 rounded-full bg-[#45923a] hover:bg-[#3a7d30] text-white transition-colors shadow-lg"
                aria-label="Agregar nuevo producto"
                title="Agregar nuevo producto"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Cerrar drawer"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-white/50 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                className="block w-full text-sm rounded-2xl pl-12 pr-6 py-3 border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent transition-all shadow-lg"
                value={localSearchTerm}
                onChange={handleSearchChange}
                disabled={productosLoading}
                aria-label="Buscar productos"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto px-4">
            {productosLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <Loader2 className="animate-spin h-10 w-10 text-[#45923a] mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Cargando productos...</p>
                </div>
              </div>
            ) : productos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-6">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-6 mb-4">
                  <Package className="h-16 w-16 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  {searchQuery ? 'Sin resultados' : 'No hay productos'}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'Intenta con otro término de búsqueda' : 'Crea un nuevo producto para comenzar'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/50"
                  >
                    <button
                      onClick={() => handleSelect(producto)}
                      className="w-full text-left p-4 flex items-center hover:bg-gray-50/50 transition-colors duration-200"
                      disabled={productosLoading}
                      aria-label={`Seleccionar producto ${producto.nombre}`}
                    >
                      <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                        {producto.imagen ? (
                          <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="h-12 w-12 rounded-2xl object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{producto.nombre}</p>
                          {producto.codigo_barras && (
                            <p className="text-xs text-gray-500 mb-1">Código: {producto.codigo_barras}</p>
                          )}
                          <div className="bg-gradient-to-r from-[#45923a] to-[#3a7d30] bg-clip-text text-transparent">
                            <p className="text-sm font-bold">
                              S/ {producto.precio?.toFixed(2) || '0.00'}/{producto.tipo_unidad === 'kilogramo' ? 'kg' : 'unidad'}
                            </p>
                          </div>
                          {producto.has_precio_alternativo && producto.precio_alternativo && (
                            <div className="mt-1">
                              <div className="bg-gradient-to-r from-[#ffa40c] to-[#e69500] bg-clip-text text-transparent">
                                <p className="text-sm font-bold">
                                  Precio Alternativo: S/ {Number(producto.precio_alternativo).toFixed(2)}
                                  {producto.tipo_unidad === 'kilogramo' && <span className="ml-1">/kg</span>}
                                </p>
                              </div>
                              {producto.motivo_precio_alternativo && (
                                <p className="text-xs text-gray-500">
                                  Motivo: {producto.motivo_precio_alternativo}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {producto.imagen && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowImage(producto.imagen);
                            }}
                            onKeyDown={(e) => handleKeyDown(e, () => handleShowImage(producto.imagen))}
                            role="button"
                            tabIndex={0}
                            className="p-2 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors ml-3"
                            aria-label="Ver imagen del producto"
                          >
                            <ImageIcon className="h-5 w-5 text-gray-500" />
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200/50 flex justify-between items-center bg-white/80 backdrop-blur-md">
            <button
              onClick={cargarPaginaAnterior}
              disabled={paginaActual <= 1 || productosLoading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed bg-gradient-to-r from-[#45923a] to-[#3a7d30] hover:from-[#3a7d30] hover:to-[#2d6025] transition-all shadow-lg disabled:shadow-none"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
              <span className="text-sm text-gray-700 font-semibold">Página {paginaActual}</span>
            </div>
            <button
              onClick={cargarSiguientePagina}
              disabled={!hayMasPaginas || productosLoading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed bg-gradient-to-r from-[#45923a] to-[#3a7d30] hover:from-[#3a7d30] hover:to-[#2d6025] transition-all shadow-lg disabled:shadow-none"
              aria-label="Siguiente página"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-4 max-w-sm w-full relative shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">Imagen del Producto</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Cerrar modal de imagen"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            {selectedProductImage ? (
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={selectedProductImage}
                  alt="Producto"
                  className="w-full h-64 object-contain bg-gray-50"
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay imagen disponible</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Producto Detalles Drawer */}
      <ProductoDetallesDrawer
        isOpen={detallesDrawerOpen}
        onClose={() => setDetallesDrawerOpen(false)}
        producto={selectedProducto}
        onAgregarProducto={(producto) => {
          onSelectProducto(producto);
          setDetallesDrawerOpen(false);
        }}
      />
    </>
  );
};

export default ProductosDrawer;