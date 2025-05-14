import React from 'react';
import { X } from 'lucide-react';

const DeleteDrawer = ({ isOpen, onClose, onConfirm, clientName, colors, loading }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '25vh' }}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Confirmar Eliminación</h2>
            <button onClick={onClose}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-600 mb-4">
            ¿Estás seguro de eliminar a <span className="font-medium">{clientName}</span>? Esta acción no se puede deshacer.
          </p>

          {/* Buttons */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-500 flex items-center justify-center"
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
                'Eliminar'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteDrawer;