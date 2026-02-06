import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import IconoNewEditCliente from '../../assets/Clientes/IconoNewEditCliente.svg';

const DrawerEditarAñadir = ({ isOpen, onClose, isEditMode, initialData, onSubmit, colors }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    telefono: initialData?.telefono || '',
    telefono2: initialData?.telefono2 || '',
    nombre_yape: initialData?.nombre_yape || '',
    nombres_yape_alternativos: initialData?.nombres_yape_alternativos || [],
    correo: initialData?.correo || '',
    descripcion: initialData?.descripcion || '',
    enviar_whatsapp: initialData?.enviar_whatsapp !== undefined ? initialData.enviar_whatsapp : true
  });
  const [nuevoNombreYape, setNuevoNombreYape] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ nombre: '' });

  // Reset form data and errors when initialData changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: initialData?.nombre || '',
        telefono: initialData?.telefono || '',
        telefono2: initialData?.telefono2 || '',
        nombre_yape: initialData?.nombre_yape || '',
        nombres_yape_alternativos: initialData?.nombres_yape_alternativos || [],
        correo: initialData?.correo || '',
        descripcion: initialData?.descripcion || '',
        enviar_whatsapp: initialData?.enviar_whatsapp !== undefined ? initialData.enviar_whatsapp : true
      });
      setNuevoNombreYape('');
      setErrors({ nombre: '' });
      setLoading(false);
    }
  }, [isOpen, initialData]);

  // Handle form input changes and clear errors
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (name === 'nombre' ? value.toUpperCase() : value)
    }));
    if (name === 'nombre') {
      setErrors(prev => ({ ...prev, nombre: '' }));
    }
  };

  // Handle adding alternative Yape name
  const handleAddNombreYapeAlt = () => {
    const trimmed = nuevoNombreYape.trim();
    if (!trimmed) return;
    if (trimmed.length > 50) return;
    if (formData.nombres_yape_alternativos.length >= 5) return;
    setFormData(prev => ({
      ...prev,
      nombres_yape_alternativos: [...prev.nombres_yape_alternativos, trimmed]
    }));
    setNuevoNombreYape('');
  };

  // Handle removing alternative Yape name
  const handleRemoveNombreYapeAlt = (index) => {
    setFormData(prev => ({
      ...prev,
      nombres_yape_alternativos: prev.nombres_yape_alternativos.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNombre = formData.nombre.trim();
    if (!trimmedNombre) {
      setErrors({ nombre: 'Nombre es obligatorio' });
      return;
    }
    setErrors({ nombre: '' });
    setLoading(true);
    try {
      const nombreYape = formData.nombre_yape.trim() || null;
      const nombresYapeAlt = formData.nombres_yape_alternativos.length > 0
        ? formData.nombres_yape_alternativos
        : [];
      await onSubmit({
        ...formData,
        nombre: trimmedNombre,
        nombre_yape: nombreYape,
        nombres_yape_alternativos: nombresYapeAlt
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-50"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '85vh' }}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h2 className="text-lg font-semibold">
              {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button 
              onClick={onClose} 
              disabled={loading}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-gray-700 outline-none ${
                  errors.nombre ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={loading}
                aria-describedby={errors.nombre ? 'nombre-error' : undefined}
              />
              {errors.nombre && (
                <p id="nombre-error" className="mt-1 text-sm text-red-500">
                  {errors.nombre}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                Teléfono (opcional)
              </label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                Teléfono 2 (opcional)
              </label>
              <input
                type="text"
                name="telefono2"
                value={formData.telefono2}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                disabled={loading}
              />
            </div>
            {/* Separador Datos de Pago Yape */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Datos de Pago Yape</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Nombre en Yape */}
            <div>
              <div className="flex items-center gap-1.5">
                <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                  Nombre en Yape
                </label>
                <div className="group relative">
                  <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg z-10">
                    El nombre exacto como aparece en las notificaciones de Yape
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </div>
                </div>
              </div>
              <input
                type="text"
                name="nombre_yape"
                value={formData.nombre_yape}
                onChange={handleChange}
                maxLength={50}
                placeholder="Ej: Juan P***, Maria L***"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{formData.nombre_yape.length}/50</p>
            </div>

            {/* Nombres Yape Alternativos */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                Nombres Yape Alternativos (opcional)
              </label>
              {formData.nombres_yape_alternativos.length > 0 && (
                <div className="flex flex-col gap-2 mb-2">
                  {formData.nombres_yape_alternativos.map((nombre, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <span className="flex-1 text-sm text-gray-700 truncate">{nombre}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNombreYapeAlt(index)}
                        className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                        disabled={loading}
                        aria-label={`Eliminar ${nombre}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {formData.nombres_yape_alternativos.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoNombreYape}
                    onChange={(e) => setNuevoNombreYape(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNombreYapeAlt(); } }}
                    maxLength={50}
                    placeholder="Ej: Juan***, J. Perez***"
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleAddNombreYapeAlt}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white shrink-0"
                    style={{ backgroundColor: colors.primary }}
                    disabled={loading || !nuevoNombreYape.trim()}
                  >
                    + Agregar
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">{formData.nombres_yape_alternativos.length}/5 nombres agregados</p>
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                Correo (opcional)
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                Descripción (opcional)
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                disabled={loading}
                rows="4"
              />
            </div>
            {/* Toggle para enviar WhatsApp */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <svg 
                  className="h-6 w-6" 
                  style={{ color: colors.primary }}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.primary }}>
                    Enviar WhatsApp
                  </label>
                  <p className="text-xs text-gray-500">
                    Activar para enviar notificaciones por WhatsApp
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                name="enviar_whatsapp"
                checked={formData.enviar_whatsapp}
                onChange={handleChange}
                className="toggle toggle-success"
                disabled={loading}
              />
            </div>
            {/* Icon below inputs */}
            <div className="flex justify-center py-4">
              <img
                src={IconoNewEditCliente}
                alt="Nuevo o editar cliente"
                className="h-40 md:h-16"
                style={{ color: colors.primary }}
              />
            </div>
            <div className="flex gap-2 mt-auto shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
                disabled={loading}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                ) : (
                  isEditMode ? 'Actualizar' : 'Crear'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DrawerEditarAñadir;