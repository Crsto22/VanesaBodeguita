import React, { useState, useEffect } from 'react';
import { X, Package, Barcode, ChevronDown, ChevronUp } from 'lucide-react';
import DrawerEscanearCodigoBarras from './DrawerEscanearCodigoBarras';

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
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
      });
      // Mostrar campos adicionales solo si hay datos en marca o fecha_vencimiento
      if (initialData.marca || initialData.fecha_vencimiento) {
        setShowAdditionalFields(true);
      } else {
        setShowAdditionalFields(false);
      }
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    const currentStock = parseInt(formData.stock || '0', 10);
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
      await onSubmit(
        {
          ...formData,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock, 10),
        },
        imagenFile
      );
      setImagenFile(null);
      onClose();
    } catch (error) {
      alert('Error al guardar el producto. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar las etiquetas según el tipo de unidad
  const precioLabel = formData.tipo_unidad === 'kilogramo' ? 'Precio por kilo' : 'Precio';
  const stockLabel = formData.tipo_unidad === 'kilogramo' ? 'Stock (kilogramos)' : 'Stock';
  const stockPlaceholder = formData.tipo_unidad === 'kilogramo' ? 'Ej. 2.5' : 'Ej. 8';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed inset-0 top-[6.25%] bg-white rounded-t-2xl shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '93.75vh', 
          overflowY: 'auto',
          '--tw-ring-color': colors.primary 
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{isEditMode ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            </div>
            <button onClick={onClose} disabled={isSubmitting}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
            {/* Nombre en columna (obligatorio) */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                placeholder="Ej. Super Glu"
                disabled={isSubmitting}
              />
              {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
            </div>

            {/* Categoría en columna (obligatorio) */}
            <div>
              <label htmlFor="categoria_ref" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                id="categoria_ref"
                name="categoria_ref"
                value={formData.categoria_ref}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  errors.categoria_ref ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                disabled={isSubmitting}
              >
                {categorias.length === 0 ? (
                  <option value="">No hay categorías</option>
                ) : (
                  <>
                    <option value="">Seleccionar</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.categoria_ref && <p className="mt-1 text-xs text-red-500">{errors.categoria_ref}</p>}
            </div>

            {/* Tipo de unidad y Precio en fila (ambos obligatorios) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-1">
                <label htmlFor="tipo_unidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Unidad *
                </label>
                <select
                  id="tipo_unidad"
                  name="tipo_unidad"
                  value={formData.tipo_unidad}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="unidad">Unidad</option>
                  <option value="kilogramo">Kilogramo</option>
                </select>
              </div>
              <div className="col-span-1">
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                  {precioLabel} *
                </label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.precio ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder={formData.tipo_unidad === 'kilogramo' ? 'Ej. 15.99' : 'Ej. 0.6'}
                  step="0.01"
                  disabled={isSubmitting}
                />
                {errors.precio && <p className="mt-1 text-xs text-red-500">{errors.precio}</p>}
              </div>
            </div>

            {/* Stock con acciones rápidas (obligatorio) */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                {stockLabel} *
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      errors.stock ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    placeholder={stockPlaceholder}
                    step={formData.tipo_unidad === 'kilogramo' ? '0.1' : '1'}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-3 grid grid-cols-3 gap-1">
                  <button 
                    type="button" 
                    onClick={() => handleStockQuickAction(formData.tipo_unidad === 'kilogramo' ? 0.5 : 5)}
                    className="rounded px-2 py-1 bg-gray-100 text-xs border border-gray-300"
                    disabled={isSubmitting}
                  >
                    {formData.tipo_unidad === 'kilogramo' ? '+0.5' : '+5'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleStockQuickAction(formData.tipo_unidad === 'kilogramo' ? 1 : 10)}
                    className="rounded px-2 py-1 bg-gray-100 text-xs border border-gray-300"
                    disabled={isSubmitting}
                  >
                    {formData.tipo_unidad === 'kilogramo' ? '+1' : '+10'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleStockQuickAction(formData.tipo_unidad === 'kilogramo' ? 2 : 20)}
                    className="rounded px-2 py-1 bg-gray-100 text-xs border border-gray-300"
                    disabled={isSubmitting}
                  >
                    {formData.tipo_unidad === 'kilogramo' ? '+2' : '+20'}
                  </button>
                </div>
              </div>
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
            </div>

            {/* Código de barras con botón de escanear (opcional) */}
            <div>
              <label htmlFor="codigo_barras" className="block text-sm font-medium text-gray-700 mb-1">
                Código de Barras (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="codigo_barras"
                  name="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={handleChange}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  placeholder="Ej. 7501234567890"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleScanBarcode}
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <Barcode className="h-5 w-5" />
                  <span className="ml-1">Escanear</span>
                </button>
              </div>
            </div>
            
            {/* Imagen en columna */}
            <div>
              <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 mb-1">
                Imagen (opcional)
              </label>
              <input
                type="file"
                id="imagen"
                accept="image/*"
                onChange={handleImagenChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Vista previa de imagen si existe */}
            {formData.imagen && (
              <div className="mt-1 mb-3">
                <img src={formData.imagen} alt="Vista previa" className="h-16 w-16 object-cover rounded-lg" />
              </div>
            )}

            {/* Botón para mostrar/ocultar campos adicionales */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                className="flex items-center text-sm font-medium text-gray-700"
              >
                {showAdditionalFields ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ocultar campos adicionales
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Mostrar campos adicionales
                  </>
                )}
              </button>
            </div>

            {/* Campos adicionales (opcionales) */}
            {showAdditionalFields && (
              <>
                {/* Marca y Fecha vencimiento en fila */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-1">
                    <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
                      Marca (opcional)
                    </label>
                    <input
                      type="text"
                      id="marca"
                      name="marca"
                      value={formData.marca}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      placeholder="Ej. Faber-Castell"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Vencimiento (opcional)
                    </label>
                    <input
                      type="date"
                      id="fecha_vencimiento"
                      name="fecha_vencimiento"
                      value={formData.fecha_vencimiento}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botones */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="col-span-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="col-span-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: isSubmitting ? '#6b7280' : colors.primary }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white mx-auto"
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