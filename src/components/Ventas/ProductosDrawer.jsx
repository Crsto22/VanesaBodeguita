import React, { useState, useEffect } from 'react';
import { X, Package, Plus, ShoppingCart, Barcode, Search, ChevronLeft, ChevronRight, Loader2, Tag } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import DrawerEditarAñadirProducto from '../Productos/DrawerEditarAñadir';

const ProductosDrawer = ({ isOpen, onClose, onSelectProducto }) => {
  const {
    productos,
    categorias,
    loading,
    productosLoading,
    paginaActual,
    hayMasPaginas,
    searchQuery,
    buscarProductos,
    cargarSiguientePagina,
    cargarPaginaAnterior,
    recargarProductos,
    obtenerCategoriaPorId,
    crearProducto,
  } = useProducts();

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showProductDrawer, setShowProductDrawer] = useState(false);

  // Colores personalizados
  const COLORS = {
    primary: '#45923a', // Verde para el buscador
    secondary: '#ffa40c', // Naranja para el botón
    delete: '#ef4444', // Red-500
    accent: '#8b5cf6', // Violet-500
  };

  // Sincronizar la búsqueda local con el contexto
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value.toUpperCase();
    setLocalSearchQuery(value);
    buscarProductos(value);
  };

  // Clear search input
  const clearSearch = () => {
    setLocalSearchQuery('');
    buscarProductos('');
  };

  // Handle image modal click
  const handleImageClick = (producto) => {
    setSelectedProduct(producto);
    setImageModalOpen(true);
  };

  // Handle add product click - LIMPIAR BÚSQUEDA AL AGREGAR
  const handleAddClick = (producto) => {
    if (producto.has_precio_alternativo && producto.precio_alternativo) {
      setSelectedProduct(producto);
      setPriceModalOpen(true);
    } else {
      onSelectProducto({
        id: producto.id,
        nombre: producto.nombre,
        cantidad: producto.tipo_unidad === 'kilogramo' ? 1 : 1,
        precio_unitario: parseFloat(producto.precio),
        subtotal: parseFloat(producto.precio).toFixed(2),
        retornable: producto.retornable || false,
        cantidad_retornable: producto.retornable && producto.tipo_unidad !== 'kilogramo' ? 1 : 0,
        tipo_unidad: producto.tipo_unidad || 'unidad',
        precio_referencia: producto.tipo_unidad === 'kilogramo' ? parseFloat(producto.precio) : null,
        imagen: producto.imagen || null,
      });
      clearSearch();
    }
  };

  // Handle price selection - LIMPIAR BÚSQUEDA AL SELECCIONAR PRECIO
  const handleSelectPrecio = (precio) => {
    if (!selectedProduct) return;
    onSelectProducto({
      id: selectedProduct.id,
      nombre: selectedProduct.nombre,
      cantidad: selectedProduct.tipo_unidad === 'kilogramo' ? 1 : 1,
      precio_unitario: parseFloat(precio),
      subtotal: parseFloat(precio).toFixed(2),
      retornable: selectedProduct.retornable || false,
      cantidad_retornable: selectedProduct.retornable && selectedProduct.tipo_unidad !== 'kilogramo' ? 1 : 0,
      tipo_unidad: selectedProduct.tipo_unidad || 'unidad',
      precio_referencia: selectedProduct.tipo_unidad === 'kilogramo' ? parseFloat(selectedProduct.precio) : null,
      imagen: selectedProduct.imagen || null,
    });
    setPriceModalOpen(false);
    setSelectedProduct(null);
    clearSearch();
  };

  // Handle add new product
  const handleAddProduct = () => {
    setShowProductDrawer(true);
  };

  // Handle save product
  const handleSaveProduct = async (productoData, imagenFile) => {
    try {
      await crearProducto(productoData, imagenFile);
      setShowProductDrawer(false);
      await recargarProductos();
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  };

  return (
    <>
      {/* Image Modal */}
      {imageModalOpen && selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90] transition-opacity duration-300"
            onClick={() => setImageModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[95] p-3">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-auto overflow-hidden transform transition-all duration-300 scale-100">
              <div className="relative">
                {selectedProduct.imagen ? (
                  <div className="h-48 w-full bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={selectedProduct.imagen}
                      alt={selectedProduct.nombre}
                      className="w-full h-full object-contain p-3"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Sin imagen</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm transition-all"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
              </div>

              <div className="p-4 bg-gradient-to-b from-white to-gray-50">
                <h3 className="text-lg font-bold mb-2 text-gray-900">{selectedProduct.nombre}</h3>
                
                <div className="flex items-center mb-2 p-2 bg-white rounded-xl">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" 
                    style={{ backgroundColor: obtenerCategoriaPorId(selectedProduct.categoria_ref)?.color || '#9ca3af' }}
                  />
                  <p className="text-xs text-gray-600 font-medium">
                    {obtenerCategoriaPorId(selectedProduct.categoria_ref)?.nombre || 'Sin categoría'}
                  </p>
                </div>
                
                <div className="flex items-center mb-3 p-2 bg-white rounded-xl">
                  <Barcode className="h-3.5 w-3.5 text-gray-400 mr-2" />
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedProduct.codigo_barras || 'Sin código de barras'}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-xs font-medium text-emerald-700">Precio regular:</span>
                    <span className="text-lg font-bold" style={{ color: COLORS.primary }}>
                      S/{selectedProduct.precio.toFixed(2)}
                      {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">por kg</span>}
                    </span>
                  </div>

                  {selectedProduct.has_precio_alternativo && selectedProduct.precio_alternativo && (
                    <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-xs font-medium text-amber-700">
                        {selectedProduct.motivo_precio_alternativo || 'Precio alternativo'}:
                      </span>
                      <span className="text-lg font-bold" style={{ color: COLORS.secondary }}>
                        S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">por kg</span>}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleAddClick(selectedProduct);
                    setImageModalOpen(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#ffa40c] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ff7400] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Agregar al pedido</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Price Selection Modal */}
      {priceModalOpen && selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90] transition-opacity duration-300"
            onClick={() => setPriceModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[95] p-3">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-auto overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Selecciona el precio</h3>
                  <button
                    onClick={() => setPriceModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {selectedProduct.imagen ? (
                      <img
                        src={selectedProduct.imagen}
                        alt={selectedProduct.nombre}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{selectedProduct.nombre}</h4>
                    <div className="flex items-center mt-1">
                      <div 
                        className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: obtenerCategoriaPorId(selectedProduct.categoria_ref)?.color || '#9ca3af' }}
                      />
                      <p className="text-xs text-gray-500">
                        {obtenerCategoriaPorId(selectedProduct.categoria_ref)?.nombre || 'Sin categoría'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleSelectPrecio(selectedProduct.precio)}
                    className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-[#45923a] hover:bg-emerald-50 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <h5 className="font-bold text-gray-900 mb-1 text-sm">Precio Normal</h5>
                      <p className="text-xs text-gray-500 mb-2">Precio estándar del producto</p>
                      <span className="text-lg font-bold" style={{ color: COLORS.primary }}>
                        S/{selectedProduct.precio.toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectPrecio(parseFloat(selectedProduct.precio_alternativo))}
                    className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-[#ffa40c] hover:bg-amber-50 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <h5 className="font-bold text-gray-900 mb-1 text-sm">
                        {selectedProduct.motivo_precio_alternativo || 'Precio Alternativo'}
                      </h5>
                      <p className="text-xs text-gray-500 mb-2">Precio especial</p>
                      <span className="text-lg font-bold" style={{ color: COLORS.secondary }}>
                        S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[40] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[50] transform transition-transform duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } bg-gradient-to-b from-white via-gray-50 to-gray-100 flex flex-col h-full`}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-4 bg-white border-b border-gray-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Productos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Selecciona un producto para agregar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar and Add Product Button */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos por nombre o código..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:ring-4 text-sm bg-gray-50 focus:bg-white transition-all duration-200 uppercase placeholder:normal-case placeholder:text-gray-400"
              style={{
                borderColor: COLORS.primary,
                focusBorderColor: COLORS.primary,
                focusRingColor: `${COLORS.primary}20`,
              }}
            />
            {localSearchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleAddProduct}
            className="py-2.5 px-4 bg-gradient-to-r from-[#ffa40c] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ff7400] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Producto</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                    <div className="flex items-center p-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-200"></div>
                      <div className="ml-3 flex-1">
                        <div className="h-3.5 bg-gray-200 rounded-lg mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded-lg w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded-lg w-1/3"></div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="h-5 bg-gray-200 rounded-lg w-16"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : productosLoading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                    <div className="flex items-center p-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-200"></div>
                      <div className="ml-3 flex-1">
                        <div className="h-3.5 bg-gray-200 rounded-lg mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}
              </h3>
              <p className="text-gray-500 mb-4 max-w-sm text-sm">
                {searchQuery 
                  ? 'Intenta con otro término de búsqueda o revisa la ortografía' 
                  : 'Comienza agregando tu primer producto para empezar a vender'
                }
              </p>
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="px-5 py-2.5 text-white rounded-xl font-medium transition-colors text-sm"
                  style={{ backgroundColor: COLORS.primary, hoverBackgroundColor: '#3a7a30' }}
                >
                  Limpiar búsqueda
                </button>
              ) : (
                <button
                  onClick={handleAddProduct}
                  className="px-5 py-2.5 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
                  style={{ backgroundColor: COLORS.secondary, hoverBackgroundColor: '#ff8c00' }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar primer producto
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="p-4 space-y-3">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
                  >
                    <div className="flex items-center p-3">
                      <button
                        onClick={() => handleImageClick(producto)}
                        className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 hover:scale-105 transition-transform"
                      >
                        {producto.imagen ? (
                          <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </button>

                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {producto.nombre}
                        </h3>
                        
                        <div className="flex items-center mb-1">
                          <div 
                            className="w-2 h-2 rounded-full mr-2 shadow-sm" 
                            style={{ backgroundColor: obtenerCategoriaPorId(producto.categoria_ref)?.color || '#9ca3af' }}
                          />
                          <p className="text-xs text-gray-500 font-medium">
                            {obtenerCategoriaPorId(producto.categoria_ref)?.nombre || 'Sin categoría'}
                          </p>
                        </div>
                        
                        <div className="flex items-center">
                          <Barcode className="h-3 w-3 text-gray-400 mr-2" />
                          <p className="text-xs text-gray-500 font-mono">
                            {producto.codigo_barras || 'Sin código'}
                          </p>
                        </div>
                        
                        {producto.retornable && (
                          <div className="flex items-center mt-1">
                            <Tag className="h-3 w-3 text-blue-500 mr-1" />
                            <span className="text-xs text-blue-600 font-medium">Retornable</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-3">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: COLORS.primary }}>
                            S/{producto.precio.toFixed(2)}
                            {producto.tipo_unidad === 'kilogramo' && (
                              <span className="text-xs text-gray-500 ml-1">/kg</span>
                            )}
                          </p>
                          {producto.has_precio_alternativo && producto.precio_alternativo && (
                            <p className="text-xs font-semibold" style={{ color: COLORS.secondary }}>
                              S/{parseFloat(producto.precio_alternativo).toFixed(2)}
                              {producto.tipo_unidad === 'kilogramo' && (
                                <span className="text-xs text-gray-500 ml-1">/kg</span>
                              )}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleAddClick(producto)}
                          className="p-2.5 rounded-xl text-white transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                          style={{ backgroundColor: COLORS.primary, hoverBackgroundColor: '#3a7a30' }}
                          aria-label="Agregar producto"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-4 pb-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-center space-x-6">
                    <button
                      onClick={cargarPaginaAnterior}
                      disabled={paginaActual <= 1 || productosLoading}
                      className={`group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                        paginaActual <= 1 || productosLoading
                          ? 'bg-gray-100 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {productosLoading && paginaActual > 1 ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      ) : (
                        <ChevronLeft className={`h-5 w-5 transition-transform duration-200 ${
                          paginaActual <= 1 ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-800 group-hover:-translate-x-0.5'
                        }`} />
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      {paginaActual > 1 && (
                        <div className="flex items-center space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-center w-10 h-10 text-white rounded-full font-bold text-sm shadow-lg"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        {paginaActual}
                      </div>
                      
                      {hayMasPaginas && (
                        <div className="flex items-center space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={cargarSiguientePagina}
                      disabled={!hayMasPaginas || productosLoading}
                      className={`group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                        !hayMasPaginas || productosLoading
                          ? 'bg-gray-100 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {productosLoading && hayMasPaginas ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      ) : (
                        <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${
                          !hayMasPaginas ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-800 group-hover:translate-x-0.5'
                        }`} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer para añadir/editar producto */}
        <DrawerEditarAñadirProducto
          isOpen={showProductDrawer}
          onClose={() => setShowProductDrawer(false)}
          isEditMode={false}
          initialData={{
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
          }}
          onSubmit={handleSaveProduct}
          colors={COLORS}
          categorias={categorias}
        />
      </div>
    </>
  );
};

export default ProductosDrawer;