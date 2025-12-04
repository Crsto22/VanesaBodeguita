import React, { useState } from 'react';
import { Settings, Store, ShoppingBag, AlertCircle, X } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useConfig } from '../context/ConfigContext';
import { motion, AnimatePresence } from 'framer-motion';

const Configuracion = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { configuracion, saving, toggleConfig } = useConfig();
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  const colors = {
    primary: '#45923a',
    secondary: '#3d8033'
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  const closeToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  const handleToggle = async (campo) => {
    const result = await toggleConfig(campo);
    
    if (result.success) {
      showToast('Configuración guardada correctamente', 'success');
    } else {
      showToast('Error al guardar la configuración', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { y: -100, opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
              visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } }
            }}
            className="fixed top-0 left-0 right-0 w-full z-50 rounded-b-xl overflow-hidden"
          >
            <div
              className={`w-full shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
              role="alert"
              tabIndex="-1"
              aria-labelledby="header-notification"
            >
              <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      {toast.type === 'success' ? (
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                      ) : (
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                      )}
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p id="header-notification" className="text-sm text-white font-medium">
                      {toast.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeToast}
                  className="text-white hover:text-gray-200 focus:outline-none transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifications={0}
      />

      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
      />

      <main className="px-3 sm:px-6 pb-12 pt-4">
        {/* Header de la página */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#45923a] to-[#3d8033]">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-500">Ajustes generales del sistema</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de configuración */}
        <div className="space-y-4">
          {/* Tienda Abierta */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${configuracion.tienda_abierta ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Store className={`h-6 w-6 ${configuracion.tienda_abierta ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tienda Abierta</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {configuracion.tienda_abierta 
                      ? 'La tienda está abierta al público' 
                      : 'La tienda está cerrada'}
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle('tienda_abierta')}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  configuracion.tienda_abierta 
                    ? 'bg-green-500 focus:ring-green-500' 
                    : 'bg-gray-300 focus:ring-gray-400'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                    configuracion.tienda_abierta ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Hacer Pedidos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${configuracion.hacer_pedidos ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <ShoppingBag className={`h-6 w-6 ${configuracion.hacer_pedidos ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Hacer Pedidos</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {configuracion.hacer_pedidos 
                      ? 'Los clientes pueden hacer pedidos' 
                      : 'Los pedidos están deshabilitados'}
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle('hacer_pedidos')}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  configuracion.hacer_pedidos 
                    ? 'bg-blue-500 focus:ring-blue-500' 
                    : 'bg-gray-300 focus:ring-gray-400'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                    configuracion.hacer_pedidos ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información</p>
            <p>Los cambios se guardan automáticamente en tiempo real. La configuración se sincroniza instantáneamente con Firebase Realtime Database.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Configuracion;
