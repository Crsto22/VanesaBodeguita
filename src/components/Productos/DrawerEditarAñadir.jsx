import React, { useState, useEffect } from 'react';
import { X, Barcode, ChevronDown, ChevronUp } from 'lucide-react';
import DrawerEscanearCodigoBarras from './DrawerEscanearCodigoBarras';
import { upload } from '@imagekit/react';
import CryptoJS from 'crypto-js';

// DrawerEditarAñadirProducto Component
const DrawerEditarAñadirProducto = ({ isOpen, onClose, isEditMode, initialData, onSubmit, colors, categorias }) => {
  const [formData, setFormData] = useState({
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
  const [imagenFile, setImagenFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        categoria_ref: initialData.categoria_ref || categorias[0]?.id || '',
        nombre: initialData.nombre || '',
        precio: initialData.precio || '',
        stock: initialData.stock || '',
        tipo_unidad: initialData.tipo_unidad || 'unidad',
        codigo_barras: initialData.codigo_barras || '',
        marca: initialData.marca || '',
        fecha_vencimiento: initialData.fecha_vencimiento || '',
        imagen: initialData.imagen || '',
        retornable: initialData.retornable || false,
        has_precio_alternativo: !!initialData.precio_alternativo || !!initialData.motivo_precio_alternativo,
        precio_alternativo: initialData.precio_alternativo || '',
        motivo_precio_alternativo: initialData.motivo_precio_alternativo || '',
      });
      setShowAdditionalFields(!!initialData.marca || !!initialData.fecha_vencimiento);
    }
  }, [initialData, categorias]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.categoria_ref) newErrors.categoria_ref = 'La categoría es obligatoria';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.precio || isNaN(formData.precio) || formData.precio <= 0) {
      newErrors.precio = 'El precio debe ser un número mayor a 0';
    }
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0) {
      newErrors.stock = 'El stock debe ser un número mayor o igual a 0';
    }
    if (formData.has_precio_alternativo && formData.precio_alternativo && (isNaN(formData.precio_alternativo) || formData.precio_alternativo <= 0)) {
      newErrors.precio_alternativo = 'El precio alternativo debe ser un número mayor a 0';
    }
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

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
    }
  };

  const handleStockQuickAction = (amount) => {
    const currentStock = parseFloat(formData.stock || '0');
    const newStock = currentStock + amount;
    setFormData((prev) => ({
      ...prev,
      stock: String(newStock >= 0 ? newStock : 0),
    }));
    if (errors.stock) {
      setErrors((prev) => ({ ...prev, stock: '' }));
    }
  };

  const handleScanBarcode = () => {
    setIsScannerOpen(true);
  };

  const handleBarcodeScanned = (barcode) => {
    setFormData((prev) => ({
      ...prev,
      codigo_barras: barcode,
    }));
    setIsScannerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData, imagenFile);
      setImagenFile(null);
      setUploadProgress(0);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const precioLabel = formData.tipo_unidad === 'kilogramo' ? 'Precio por kilo' : 'Precio';
  const stockLabel = formData.tipo_unidad === 'kilogramo' ? 'Stock (kilogramos)' : 'Stock';
  const stockPlaceholder = formData.tipo_unidad === 'kilogramo' ? 'Ej. 2.5' : 'Ej. 8';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      )}
      <div
        className={`fixed inset-0 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{
          height: '100vh',
          width: '100vw',
          overflowY: 'auto',
          '--tw-ring-color': colors.primary,
        }}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-6 sm:h-8 rounded-full" style={{ backgroundColor: colors.primary }}></div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{isEditMode ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            </div>
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-3 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="nombre" className="block text-xs sm:text-sm font-semibold text-gray-800">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full rounded-lg sm:rounded-xl border-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  errors.nombre 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                } focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-opacity-20`}
                placeholder="SUPER GLU"
                disabled={isSubmitting}
              />
              {errors.nombre && <p className="text-xs text-red-600 font-medium">{errors.nombre}</p>}
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="categoria_ref" className="block text-xs sm:text-sm font-semibold text-gray-800">
                Categoría *
              </label>
              <select
                id="categoria_ref"
                name="categoria_ref"
                value={formData.categoria_ref}
                onChange={handleChange}
                className={`w-full rounded-lg sm:rounded-xl border-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  errors.categoria_ref 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                } focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-opacity-20`}
                disabled={isSubmitting}
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

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="tipo_unidad" className="block text-xs sm:text-sm font-semibold text-gray-800">
                  Tipo de Unidad *
                </label>
                <select
                  id="tipo_unidad"
                  name="tipo_unidad"
                  value={formData.tipo_unidad}
                  onChange={handleChange}
                  className="w-full rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                  disabled={isSubmitting}
                >
                  <option value="unidad">Unidad</option>
                  <option value="kilogramo">Kilogramo</option>
                </select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="precio" className="block text-xs sm:text-sm font-semibold text-gray-800">
                  {precioLabel} *
                </label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  className={`w-full rounded-lg sm:rounded-xl border-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    errors.precio 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                  } focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-opacity-20`}
                  placeholder={formData.tipo_unidad === 'kilogramo' ? '15.99' : '0.60'}
                  step="0.01"
                  disabled={isSubmitting}
                />
                {errors.precio && <p className="text-xs text-red-600 font-medium">{errors.precio}</p>}
              </div>
            </div>

            {formData.tipo_unidad === 'unidad' && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <input
                    type="checkbox"
                    id="has_precio_alternativo"
                    name="has_precio_alternativo"
                    checked={formData.has_precio_alternativo}
                    onChange={handleChange}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="has_precio_alternativo" className="text-xs sm:text-sm font-semibold text-gray-800">
                    ¿Incluir Precio Alternativo?
                  </label>
                </div>

                {formData.has_precio_alternativo && (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 pt-2">
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="precio_alternativo" className="block text-xs sm:text-sm font-semibold text-gray-800">
                        Precio Alternativo
                      </label>
                      <input
                        type="number"
                        id="precio_alternativo"
                        name="precio_alternativo"
                        value={formData.precio_alternativo}
                        onChange={handleChange}
                        className={`w-full rounded-lg sm:rounded-xl border-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                          errors.precio_alternativo 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-200 bg-white focus:border-blue-400 hover:border-gray-300'
                        } focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-opacity-20`}
                        placeholder="0.80"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                      {errors.precio_alternativo && <p className="text-xs text-red-600 font-medium">{errors.precio_alternativo}</p>}
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="motivo_precio_alternativo" className="block text-xs sm:text-sm font-semibold text-gray-800">
                        Motivo del Precio Alternativo
                      </label>
                      <input
                        type="text"
                        id="motivo_precio_alternativo"
                        name="motivo_precio_alternativo"
                        value={formData.motivo_precio_alternativo}
                        onChange={handleChange}
                        className="w-full rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                        placeholder="Bebida helada"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="stock" className="block text-xs sm:text-sm font-semibold text-gray-800">
                {stockLabel} *
              </label>
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-grow">
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={`w-full rounded-lg sm:rounded-xl border-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                      errors.stock 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white hover:border-gray-300'
                    } focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-opacity-20`}
                    placeholder={stockPlaceholder}
                    step={formData.tipo_unidad === 'kilogramo' ? '0.1' : '1'}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleStockQuickAction(formData.tipo_unidad === 'kilogramo' ? 0.5 : 5)}
                    className="px-2 py-2 sm:px-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 text-green-700 text-xs font-semibold hover:from-green-200 hover:to-emerald-200 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {formData.tipo_unidad === 'kilogramo' ? '+0.5' : '+5'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockQuickAction(formData.tipo_unidad === 'kilogramo' ? 1 : 10)}
                    className="px-2 py-2 sm:px-3 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 text-blue-700 text-xs font-semibold hover:from-blue-200 hover:to-cyan-200 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {formData.tipo_unidad === 'kilogramo' ? '+1' : '+10'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockQuickAction(formData.tipo_unidad === 'kilogramo' ? 2 : 20)}
                    className="px-2 py-2 sm:px-3 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 border border-purple-200 text-purple-700 text-xs font-semibold hover:from-purple-200 hover:to-violet-200 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {formData.tipo_unidad === 'kilogramo' ? '+2' : '+20'}
                  </button>
                </div>
              </div>
              {errors.stock && <p className="text-xs text-red-600 font-medium">{errors.stock}</p>}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl border border-amber-100">
              <input
                type="checkbox"
                id="retornable"
                name="retornable"
                checked={formData.retornable}
                onChange={handleChange}
                className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-amber-200"
                disabled={isSubmitting}
              />
              <label htmlFor="retornable" className="text-xs sm:text-sm font-semibold text-gray-800">
                ¿Producto Retornable?
              </label>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="codigo_barras" className="block text-xs sm:text-sm font-semibold text-gray-800">
                Código de Barras
              </label>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  id="codigo_barras"
                  name="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={handleChange}
                  className="flex-1 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                  placeholder="7501234567890"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleScanBarcode}
                  className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
                  disabled={isSubmitting || isScannerOpen}
                >
                  <Barcode className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Escanear</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="imagen" className="block text-xs sm:text-sm font-semibold text-gray-800">
                Imagen del Producto
              </label>
              <input
                type="file"
                id="imagen"
                accept="image/*"
                onChange={handleImagenChange}
                className="w-full rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200"
                disabled={isSubmitting}
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <progress value={uploadProgress} max="100" className="w-full h-2 rounded-full"></progress>
                  <p className="text-xs text-gray-600">Subiendo {uploadProgress.toFixed(1)}%</p>
                </div>
              )}
              {formData.imagen && (
                <div className="mt-2 sm:mt-3">
                  <img src={formData.imagen} alt="Vista previa" className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg sm:rounded-xl border-2 border-gray-200 shadow-sm" />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                {showAdditionalFields ? (
                  <>
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    Ocultar campos adicionales
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    Mostrar campos adicionales
                  </>
                )}
              </button>
              
              {showAdditionalFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="marca" className="block text-xs sm:text-sm font-semibold text-gray-800">
                      Marca
                    </label>
                    <input
                      type="text"
                      id="marca"
                      name="marca"
                      value={formData.marca}
                      onChange={handleChange}
                      className="w-full rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                      placeholder="Faber-Castell"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="fecha_vencimiento" className="block text-xs sm:text-sm font-semibold text-gray-800">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      id="fecha_vencimiento"
                      name="fecha_vencimiento"
                      value={formData.fecha_vencimiento}
                      onChange={handleChange}
                      className="w-full rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 focus:ring-opacity-20 hover:border-gray-300"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg sm:rounded-xl px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: isSubmitting ? '#6b7280' : colors.primary,
                  boxShadow: isSubmitting ? 'none' : `0 4px 14px 0 ${colors.primary}30`
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Guardando...
                  </div>
                ) : isEditMode ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Producto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <DrawerEscanearCodigoBarras
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
        colors={colors}
      />
    </>
  );
};
export default DrawerEditarAñadirProducto;