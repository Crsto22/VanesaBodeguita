import React, { useState, useEffect } from 'react';
import { X, Search, User, Mail, Phone } from 'lucide-react';
import { useClientes } from '../../context/ClientesContext';
import { useVentas } from '../../context/VentasContext'; // Importar VentasContext
import DrawerEditarAñadir from '../Clientes/DrawerEditarAñadir';

const ClientesDrawer = ({ isOpen, onClose, onSelectCliente }) => {
  const { clientes, loading: clientesLoading, crearCliente } = useClientes();
  const { obtenerDeudaTotalPorCliente, loading: ventasLoading } = useVentas(); // Usar VentasContext
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [drawerCrearOpen, setDrawerCrearOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Colores personalizados
  const COLORS = {
    primary: '#45923a', // Verde
    secondary: '#ffa40c', // Naranja/Ámbar
  };

  // Filtrar clientes según el término de búsqueda
  useEffect(() => {
    if (!clientesLoading) {
      if (searchTerm === '') {
        setFilteredClientes(clientes);
      } else {
        const filtered = clientes.filter((cliente) =>
          cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cliente.telefono && cliente.telefono.includes(searchTerm)) ||
          (cliente.correo && cliente.correo?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredClientes(filtered);
      }
    }
  }, [searchTerm, clientes, clientesLoading]);

  // Resetear búsqueda cuando se abre/cierra el drawer
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilteredClientes(clientes);
    }
  }, [isOpen, clientes]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Función para abrir WhatsApp
  const openWhatsApp = (phone) => {
    const phoneNumber = phone.replace(/[+\s]/g, '');
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  // Función para abrir el cliente de correo
  const openEmail = (email) => {
    window.open(`mailto:${email}`, '_blank');
  };

  // SVG de WhatsApp
  const WhatsAppIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  const handleSelect = (cliente) => {
    if (!cliente || !cliente.id) {
      setToast({ message: 'Cliente inválido seleccionado', type: 'error', visible: true });
      return;
    }
    onSelectCliente(cliente);
    onClose();
  };

  const handleCrearSubmit = async (formData) => {
    try {
      // Validar datos mínimos
      if (!formData.nombre || formData.nombre.trim() === '') {
        setToast({ message: 'El nombre del cliente es obligatorio', type: 'error', visible: true });
        return;
      }
      await crearCliente({
        nombre: formData.nombre,
        telefono: formData.telefono || '',
        correo: formData.correo || '',
        // Otros campos según tu estructura de clientes
      });
      setToast({ message: 'Cliente creado con éxito', type: 'success', visible: true });
      setDrawerCrearOpen(false);
    } catch (error) {
      setToast({ message: `Error al crear cliente: ${error.message}`, type: 'error', visible: true });
      throw error;
    }
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      action();
    }
  };

  return (
    <>
      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-0 left-0 right-0 w-full z-80 rounded-b-xl overflow-hidden">
          <div
            className={`w-full shadow-lg transform transition-all duration-300 ease-in-out ${
              toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            } ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
            role="alert"
            tabIndex="-1"
            aria-labelledby="header-notification"
          >
            <div className="flex items-center justify-between p-5 max-w-3xl mx-auto">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
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
                className="text-white hover:text-gray-200 focus:outline-none"
                aria-label="Cerrar notificación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for ClientesDrawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* ClientesDrawer - Ocupa toda la pantalla */}
      <div
        className={`fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Seleccionar Cliente</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={17} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente por nombre, teléfono o correo"
                className="block w-full text-sm rounded-full pl-10 pr-3 py-2 border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={clientesLoading}
              />
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="flex-1 overflow-y-auto">
            {clientesLoading || ventasLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#45923a]"></div>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <User className="h-16 w-16 mb-4" />
                <p className="text-lg">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredClientes.map((cliente) => {
                  const deudaTotal = obtenerDeudaTotalPorCliente(cliente.id);
                  return (
                    <li key={cliente.id} className="hover:bg-gray-50">
                      <button
                        onClick={() => handleSelect(cliente)}
                        className="w-full text-left p-4 flex items-center"
                        disabled={clientesLoading || ventasLoading}
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#ffa40c] flex items-center justify-center text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="ml-3 flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
                            {cliente.telefono && (
                              <p className="text-xs text-gray-500">{cliente.telefono}</p>
                            )}
                            <p className={`text-xs ${deudaTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Deuda: S/ {deudaTotal.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {cliente.telefono && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsApp(cliente.telefono);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, () => openWhatsApp(cliente.telefono))}
                                role="button"
                                tabIndex={0}
                                className="flex items-center p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                                aria-label="Contactar por WhatsApp"
                              >
                                <WhatsAppIcon className="h-5 w-5 text-green-600" />
                              </span>
                            )}
                            {cliente.correo && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEmail(cliente.correo);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, () => openEmail(cliente.correo))}
                                role="button"
                                tabIndex={0}
                                className="flex items-center p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                                aria-label="Enviar correo"
                              >
                                <Mail className="h-5 w-5 text-gray-500" />
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer con botón para nuevo cliente */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setDrawerCrearOpen(true)}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
              style={{ backgroundColor: COLORS.primary }}
              disabled={clientesLoading}
            >
              Crear nuevo cliente
            </button>
          </div>
        </div>
      </div>

      {/* Drawer para crear nuevo cliente */}
      <DrawerEditarAñadir
        isOpen={drawerCrearOpen}
        onClose={() => setDrawerCrearOpen(false)}
        isEditMode={false}
        initialData={null}
        onSubmit={handleCrearSubmit}
        colors={COLORS}
      />
    </>
  );
};

export default ClientesDrawer;