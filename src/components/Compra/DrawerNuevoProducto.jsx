import React, { useState, useEffect } from 'react';
import { X, Package, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

const DrawerNuevoProducto = ({ isOpen, onClose, codigoBarras, categorias = [], onContinuar }) => {
  const [formData, setFormData] = useState({
    categoria_ref: '',
    nombre: '',
    tipo_unidad: 'unidad',
    codigo_barras: '',
    marca: '',
    fecha_vencimiento: '',
    retornable: false,
  });
  const [errors, setErrors] = useState({});
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  // Inicializar con el código de barras escaneado
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        codigo_barras: codigoBarras || '', // Usar el código escaneado o dejar vacío para entrada manual
        categoria_ref: categorias.length > 0 ? categorias[0].id : '',
      }));
    }
  }, [codigoBarras, isOpen, categorias]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.categoria_ref) newErrors.categoria_ref = 'La categoría es obligatoria';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.codigo_barras.trim()) newErrors.codigo_barras = 'El código de barras es obligatorio';
    if (!/^\d+$/.test(formData.codigo_barras.trim())) newErrors.codigo_barras = 'El código de barras debe contener solo números';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    if (name === 'nombre') {
      processedValue = value.toUpperCase();
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleContinuar = () => {
    if (!validateForm()) return;
    
    // Crear el producto temporal con datos básicos
    const productoTemporal = {
      ...formData,
      id: `temp_${Date.now()}`, // ID temporal
      precio: 0, // Se configurará en ProductoDetallesDrawer
      stock: 0,
      imagen: '',
      esNuevo: true, // Flag para identificar que es un producto nuevo
    };
    
    // Limpiar el formulario después de crear el producto
    setFormData({
      categoria_ref: '',
      nombre: '',
      tipo_unidad: 'unidad',
      codigo_barras: '',
      marca: '',
      fecha_vencimiento: '',
      retornable: false,
    });
    setErrors({});
    setShowAdditionalFields(false);
    
    onContinuar(productoTemporal);
  };

  const handleClose = () => {
    setFormData({
      categoria_ref: '',
      nombre: '',
      tipo_unidad: 'unidad',
      codigo_barras: '',
      marca: '',
      fecha_vencimiento: '',
      retornable: false,
    });
    setErrors({});
    setShowAdditionalFields(false);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={handleClose} />
      )}
      <div
        className={`fixed inset-0 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ height: '100vh', width: '100vw', overflowY: 'auto' }}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-orange-500"></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {codigoBarras ? 'Producto No Encontrado' : 'Agregar Nuevo Producto'}
                </h2>
                <p className="text-sm text-gray-500">
                  {codigoBarras ? 'Agregar nuevo producto al catálogo' : 'Crear producto manualmente'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-6">
          {codigoBarras ? (
            // Mostrar código de barras escaneado (no editable)
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Código escaneado: <span className="font-bold">{codigoBarras}</span>
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Este producto no existe en el catálogo. Completa los datos básicos para continuar.
              </p>
            </div>
          ) : (
            // Mostrar información de producto nuevo manual
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Agregar Nuevo Producto
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Completa todos los datos para crear un nuevo producto en el catálogo.
              </p>
            </div>
          )}

          <form className="space-y-6">
            {!codigoBarras && (
              // Campo de código de barras solo cuando es entrada manual
              <div className="space-y-2">
                <label htmlFor="codigo_barras" className="block text-sm font-semibold text-gray-800">
                  Código de Barras *
                </label>
                <input
                  type="text"
                  id="codigo_barras"
                  name="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={handleChange}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    errors.codigo_barras 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                  } focus:outline-none focus:ring-4 focus:ring-opacity-20`}
                  placeholder="7750182001076"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {errors.codigo_barras && <p className="text-xs text-red-600 font-medium">{errors.codigo_barras}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-800">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  errors.nombre 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                } focus:outline-none focus:ring-4 focus:ring-opacity-20`}
                placeholder="COCA COLA 500ML"
              />
              {errors.nombre && <p className="text-xs text-red-600 font-medium">{errors.nombre}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="categoria_ref" className="block text-sm font-semibold text-gray-800">
                Categoría *
              </label>
              <select
                id="categoria_ref"
                name="categoria_ref"
                value={formData.categoria_ref}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  errors.categoria_ref 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                } focus:outline-none focus:ring-4 focus:ring-opacity-20`}
              >
                {categorias.length === 0 ? (
                  <option value="">No hay categorías</option>
                ) : (
                  <>
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.categoria_ref && <p className="text-xs text-red-600 font-medium">{errors.categoria_ref}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="tipo_unidad" className="block text-sm font-semibold text-gray-800">
                Tipo de Unidad *
              </label>
              <select
                id="tipo_unidad"
                name="tipo_unidad"
                value={formData.tipo_unidad}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
              >
                <option value="unidad">Unidad</option>
                <option value="kilogramo">Kilogramo</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <input
                type="checkbox"
                id="retornable"
                name="retornable"
                checked={formData.retornable}
                onChange={handleChange}
                className="w-5 h-5 text-amber-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-amber-200"
              />
              <label htmlFor="retornable" className="text-sm font-semibold text-gray-800">
                ¿Producto Retornable?
              </label>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                {showAdditionalFields ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar campos adicionales
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mostrar campos adicionales
                  </>
                )}
              </button>
              
              {showAdditionalFields && (
                <div className="grid grid-cols-1 gap-4 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="space-y-2">
                    <label htmlFor="marca" className="block text-sm font-semibold text-gray-800">
                      Marca
                    </label>
                    <input
                      type="text"
                      id="marca"
                      name="marca"
                      value={formData.marca}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                      placeholder="Coca Cola"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fecha_vencimiento" className="block text-sm font-semibold text-gray-800">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      id="fecha_vencimiento"
                      name="fecha_vencimiento"
                      value={formData.fecha_vencimiento}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleContinuar}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DrawerNuevoProducto;
