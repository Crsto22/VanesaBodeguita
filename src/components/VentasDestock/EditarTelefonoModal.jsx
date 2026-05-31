import React, { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { useClientes } from '../../context/ClientesContext';

const EditarTelefonoModal = ({ isOpen, onClose, client }) => {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Editar Teléfono</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teléfono principal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              placeholder="Ingrese número de teléfono"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teléfono 2 <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={telefono2}
              onChange={(e) => setTelefono2(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              placeholder="Ingrese segundo número (opcional)"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-3 text-sm font-semibold text-white flex items-center justify-center transition-colors disabled:opacity-50"
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
  );
};

export default EditarTelefonoModal;
