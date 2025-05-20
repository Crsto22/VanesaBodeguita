  import React, { useState, useEffect } from 'react';
  import { X } from 'lucide-react';
  import IconoNewEditCliente from "../../assets/Clientes/IconoNewEditCliente.svg";

  const DrawerEditarAñadir = ({ isOpen, onClose, isEditMode, initialData, onSubmit, colors }) => {
    const [formData, setFormData] = useState({
      nombre: initialData?.nombre || '',
      telefono: initialData?.telefono || '',
      correo: initialData?.correo || ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ nombre: '' });

    // Reset form data and errors when initialData changes or drawer opens
    useEffect(() => {
      if (isOpen) {
        setFormData({
          nombre: initialData?.nombre || '',
          telefono: initialData?.telefono || '',
          correo: initialData?.correo || ''
        });
        setErrors({ nombre: '' });
        setLoading(false); // Reset loading state when drawer opens
      }
    }, [isOpen, initialData]);

    // Handle form input changes and clear errors
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'nombre') {
        setErrors(prev => ({ ...prev, nombre: '' }));
      }
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
        await onSubmit({ ...formData, nombre: trimmedNombre });
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
          style={{ height: '75vh' }}
        >
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={onClose} disabled={loading}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
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
              {/* Icon below inputs */}
              <div className="flex justify-center">
                <img
                  src={IconoNewEditCliente}
                  alt="Nuevo o editar cliente"
                  className="h-40 md:h-16 md:mt-0 mt-8"
                  style={{ color: colors.primary }}
                />
              </div>
              <div className="flex gap-2 mt-auto">
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