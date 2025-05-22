import React, { useState, useEffect } from 'react';
import { X, Search, Package, Plus, ShoppingCart, Filter, Tag, Check, Barcode } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';

const ProductosDrawer = ({ isOpen, onClose, onSelectProducto }) => {
  const { productos, categorias, loading, obtenerCategoriaPorId } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [showCategorias, setShowCategorias] = useState(false);

  const COLORS = {
    primary: '#45923a',
    secondary: '#ffa40c',
    dark: '#2c5b24',
    light: '#f9fdf8',
    background: '#f5f7fa',
    gradient: 'linear-gradient(135deg, #45923a 0%, #3a7d30 100%)',
  };

  useEffect(() => {
    if (loading) return;

    let filtered = productos;
    
    if (selectedCategoria) {
      filtered = filtered.filter(producto => 
        producto.categoria_ref === selectedCategoria.id
      );
    }
    
    if (searchTerm !== '') {
      filtered = filtered.filter(producto => {
        const categoriaNombre = obtenerCategoriaPorId(producto.categoria_ref)?.nombre || '';
        return (
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (producto.codigo_barras || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    setFilteredProductos(filtered);
  }, [searchTerm, productos, obtenerCategoriaPorId, selectedCategoria, loading]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilteredProductos(productos);
      setImageModalOpen(false);
      setPriceModalOpen(false);
      setSelectedProduct(null);
      setSelectedCategoria(null);
    }
  }, [isOpen, productos]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const handleImageClick = (producto) => {
    setSelectedProduct(producto);
    setImageModalOpen(true);
  };

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
        imagen: producto.imagen || null
      });
      setToast({ message: 'Producto agregado', type: 'success', visible: true });
    }
  };

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
      imagen: selectedProduct.imagen || null
    });
    setToast({ message: 'Producto agregado', type: 'success', visible: true });
    setPriceModalOpen(false);
    setSelectedProduct(null);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };
  
  const toggleCategorias = () => {
    setShowCategorias(!showCategorias);
  };
  
  const handleSelectCategoria = (categoria) => {
    if (selectedCategoria && selectedCategoria.id === categoria.id) {
      setSelectedCategoria(null);
    } else {
      setSelectedCategoria(categoria);
    }
    setShowCategorias(false);
  };

  return (
    <>
      {toast.visible && (
        <div className="fixed top-0 left-0 right-0 w-full z-[100] px-4 flex justify-center pointer-events-none">
          <div
            className={`max-w-md w-full shadow-lg rounded-lg transform transition-all duration-300 ease-in-out mt-4 pointer-events-auto
              ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} 
              ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
            role="alert"
            tabIndex="-1"
            aria-labelledby="header-notification"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p id="header-notification" className="text-white font-medium">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                onClick={closeToast}
                className="text-white hover:text-gray-200 focus:outline-none"
                aria-label="Cerrar notificación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {imageModalOpen && selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setImageModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[95] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden">
              <div className="relative">
                {selectedProduct.imagen ? (
                  <div className="h-52 w-full bg-gray-100">
                    <img
                      src={selectedProduct.imagen}
                      alt={selectedProduct.nombre}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-52 w-full bg-gray-100 flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-md"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-800">{selectedProduct.nombre}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {obtenerCategoriaPorId(selectedProduct.categoria_ref)?.nombre || 'Sin categoría'}
                  </span>
                </div>
                <div className="flex items-center mb-3">
                  <Barcode className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-xs text-gray-500">
                    {selectedProduct.codigo_barras || 'Sin código'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Precio regular:</span>
                    <span className="text-lg font-bold text-green-600">
                      S/{selectedProduct.precio.toFixed(2)}
                      {selectedProduct.tipo_unidad === 'kilogramo' && ' por kg'}
                    </span>
                  </div>
                  
                  {selectedProduct.has_precio_alternativo && selectedProduct.precio_alternativo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Precio {selectedProduct.motivo_precio_alternativo || 'alternativo'}:
                      </span>
                      <span className="text-lg font-semibold text-amber-600">
                        S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && ' por kg'}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    handleAddClick(selectedProduct);
                    setImageModalOpen(false);
                  }}
                  className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Agregar al pedido</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {priceModalOpen && selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setPriceModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[95] p-4">
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-800">Seleccionar Precio</h3>
                  <button
                    onClick={() => setPriceModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
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
                    onClick={() => handleSelectPrecio(selectedProduct.precio)}
                    className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 group relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">Precio Normal</h5>
                      <p className="text-xs text-gray-500 mb-2">
                        Precio estándar del producto
                      </p>
                      <span className="text-xl font-bold text-green-600 mb-1">
                        S/{selectedProduct.precio.toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-green-500 mt-1">
                        <Check className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                  
                  <button
                    onClick={() => handleSelectPrecio(parseFloat(selectedProduct.precio_alternativo))}
                    className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 group relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">
                        Precio {selectedProduct.motivo_precio_alternativo || 'Alternativo'}
                      </h5>
                      <p className="text-xs text-gray-500 mb-2">
                        Precio especial
                      </p>
                      <span className="text-xl font-bold text-amber-600 mb-1">
                        S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-amber-500 mt-1">
                        <Check className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-0 z-[50] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } bg-gradient-to-b from-white to-gray-50 flex flex-col h-full`}
      >
        <div className="flex items-center justify-between py-4 px-5 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Seleccionar Producto</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sticky top-0 bg-white z-10 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className=" text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar producto, categoría o código..."
                className="block w-full pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-xl text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              onClick={toggleCategorias}
              className={`p-3 rounded-xl border ${selectedCategoria ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 bg-gray-50 text-gray-700'} flex items-center justify-center`}
            >
              <Filter size={17} />
            </button>
          </div>
          
          {showCategorias && (
            <div className="mt-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 overflow-hidden">
              <div className="mb-2 px-1">
                <h3 className="font-medium text-gray-700 flex items-center gap-2 text-">
                  <Tag className="h-4 w-4" />
                  <span >Categorías</span>
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto ">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => handleSelectCategoria(categoria)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategoria && selectedCategoria.id === categoria.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
              </div>

              {selectedCategoria && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Filtro activo: <span className="font-medium text-gray-700">{selectedCategoria.nombre}</span>
                  </span>
                  <button
                    onClick={() => setSelectedCategoria(null)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Limpiar filtro
                  </button>
                </div>
              )}
            </div>
          )}
          
          {!showCategorias && selectedCategoria && (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filtrado por:</span>
                <span className="px-2 py-1 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
                  {selectedCategoria.nombre}
                </span>
              </div>
              <button
                onClick={() => setSelectedCategoria(null)}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-safe">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-4 text-center">
              <Package className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">
                {searchTerm || selectedCategoria 
                  ? 'No se encontraron productos' 
                  : 'No hay productos registrados'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm || selectedCategoria
                  ? 'Intenta con otros filtros'
                  : 'Agrega productos para empezar'}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 p-4">
              {filteredProductos.map((producto) => (
                <li 
                  key={producto.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-center p-3">
                    <button
                      onClick={() => handleImageClick(producto)}
                      className="flex-shrink-0 h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden"
                    >
                      {producto.imagen ? (
                        <img 
                          src={producto.imagen} 
                          alt={producto.nombre} 
                          className="object-cover w-full h-full" 
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                    </button>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{producto.nombre}</p>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {obtenerCategoriaPorId(producto.categoria_ref)?.nombre || 'Sin categoría'}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Barcode className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-xs text-gray-500">
                          {producto.codigo_barras || 'Sin código'}
                        </p>
                      </div>
                      {producto.retornable && (
                        <p className="text-xs text-blue-600 mt-1">Retornable</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 ml-3">
                      <p className="text-sm font-bold text-green-600">
                        S/{producto.precio.toFixed(2)}
                        {producto.tipo_unidad === 'kilogramo' && <span className="text-xs"> /kg</span>}
                      </p>
                      {producto.has_precio_alternativo && producto.precio_alternativo && (
                        <p className="text-xs font-semibold text-amber-600">
                          S/{parseFloat(producto.precio_alternativo).toFixed(2)}
                          {producto.tipo_unidad === 'kilogramo' && <span className="text-xs"> /kg</span>}
                        </p>
                      )}
                      
                      <button
                        onClick={() => handleAddClick(producto)}
                        className="mt-1 p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                        aria-label="Agregar producto"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );    
};

export default ProductosDrawer;