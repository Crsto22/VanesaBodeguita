import React, { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { useClientes } from '../../context/ClientesContext';

const EditarTelefonoDrawer = ({ isOpen, onClose, client, colors }) => {
  const { actualizarCliente } = useClientes();
  const [telefono, setTelefono] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      setTelefono(client.telefono || '');
      setTelefono2(client.telefono2 || '');
      setLoading(false);
    }
  }, [isOpen, client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!telefono.trim()) return;
    
    setLoading(true);
    try {
      await actualizarCliente(client.id, {
        telefono: telefono.trim(),
        telefono2: telefono2.trim() || ''
      });
      onClose();
    } catch (error) {
      console.error('Error al actualizar teléfono:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 transform transition-transform duration-300 ease-in-out"
        style={{ height: '45vh' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h2 className="text-lg font-semibold">Editar Teléfono</h2>
            <button 
              onClick={onClose} 
              disabled={loading}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                Teléfono principal
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                placeholder="Ingrese número de teléfono"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                Teléfono 2 (opcional)
              </label>
              <input
                type="text"
                value={telefono2}
                onChange={(e) => setTelefono2(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                placeholder="Ingrese segundo número (opcional)"
                disabled={loading}
              />
            </div>

            {/* Icon */}
            <div className="flex justify-center py-4">
              <Phone className="h-16 w-16" style={{ color: colors.primary }} />
            </div>

            {/* Buttons */}
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
                disabled={loading || !telefono.trim()}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditarTelefonoDrawer;
